# Game Implementation: Skribble (Drawing Game)

## Overview
Implement a Skribble-style drawing game where one player draws and others guess the word. Features real-time canvas synchronization, turn rotation, and scoring based on guess speed.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 8-10 hours  
**Dependencies:** Phase 4 (Game Runtime) completed

---

## Game Rules

### Core Mechanics
1. One player is the "drawer" each round
2. Drawer sees a word and must draw it
3. Other players try to guess the word
4. Points awarded based on guess speed
5. Drawer gets points for each correct guess
6. Turns rotate through all players

### Scoring
- **Guesser (1st correct):** 100 points
- **Guesser (2nd correct):** 90 points
- **Guesser (3rd correct):** 80 points
- **Guesser (later):** 70 points minimum
- **Drawer:** 10 points per correct guess

### Round Flow
1. Select drawer (rotate)
2. Show word to drawer (3 word choices)
3. Start drawing timer (60-90 seconds)
4. Broadcast strokes to guessers
5. Process guesses
6. Award points
7. Reveal word
8. Next round

---

## Acceptance Criteria

### Drawing
- [ ] Canvas renders on all clients
- [ ] Strokes sync in real-time (<100ms latency feel)
- [ ] Brush size and color work
- [ ] Eraser tool works
- [ ] Clear canvas button (drawer only)
- [ ] DPR-aware (crisp on retina displays)

### Guessing
- [ ] Guesses validate server-side
- [ ] Correct guess notification
- [ ] Close guess hint (e.g., "Almost!")
- [ ] Guesses show in chat (masked if correct)
- [ ] Can't guess own word when drawing

### Game Flow
- [ ] Turn rotation works
- [ ] Word selection works (3 choices)
- [ ] Timer counts down
- [ ] Round ends on timer or all guessed
- [ ] Points calculate correctly
- [ ] Game ends after all rounds

### Sync
- [ ] New joiners get canvas state
- [ ] Reconnectors get canvas state
- [ ] No stroke loss on reconnect

---

## Implementation Steps

### Step 1: Word List

#### 1.1 Create `server/src/games/skribble/wordList.ts`
```typescript
// Categories of words with difficulty levels
export const WORD_LIST = {
  easy: [
    'sun', 'tree', 'house', 'car', 'dog', 'cat', 'fish', 'bird',
    'apple', 'banana', 'pizza', 'ice cream', 'ball', 'star', 'moon',
    'flower', 'cloud', 'rain', 'snow', 'fire', 'water', 'book',
    'chair', 'table', 'bed', 'door', 'window', 'clock', 'phone',
    'heart', 'smile', 'eye', 'hand', 'foot', 'hat', 'shoe', 'shirt',
  ],
  medium: [
    'rainbow', 'umbrella', 'butterfly', 'elephant', 'giraffe',
    'dinosaur', 'astronaut', 'superhero', 'pirate', 'robot',
    'volcano', 'island', 'castle', 'bridge', 'fountain',
    'bicycle', 'airplane', 'helicopter', 'submarine', 'rocket',
    'birthday', 'christmas', 'halloween', 'fireworks', 'carnival',
    'guitar', 'piano', 'drums', 'microphone', 'headphones',
    'camping', 'fishing', 'surfing', 'skiing', 'skateboard',
  ],
  hard: [
    'imagination', 'celebration', 'construction', 'electricity',
    'photography', 'architecture', 'geography', 'mathematics',
    'revolution', 'evolution', 'meditation', 'constellation',
    'rollercoaster', 'thunderstorm', 'earthquake', 'avalanche',
    'chameleon', 'porcupine', 'flamingo', 'scorpion',
    'telescope', 'microscope', 'stethoscope', 'periscope',
    'skyscraper', 'lighthouse', 'windmill', 'pyramid',
  ],
}

export type Difficulty = keyof typeof WORD_LIST

export function getRandomWords(count: number = 3, difficulty: Difficulty = 'medium'): string[] {
  const words = [...WORD_LIST[difficulty]]
  const selected: string[] = []
  
  for (let i = 0; i < count && words.length > 0; i++) {
    const index = Math.floor(Math.random() * words.length)
    selected.push(words[index])
    words.splice(index, 1)
  }
  
  return selected
}

export function generateWordHint(word: string): string {
  // Show first letter and underscores for rest
  const chars = word.split('')
  return chars.map((char, i) => {
    if (char === ' ') return ' '
    if (i === 0) return char.toUpperCase()
    return '_'
  }).join(' ')
}

export function isCloseGuess(guess: string, word: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim()
  const normalizedWord = word.toLowerCase().trim()
  
  if (normalizedGuess === normalizedWord) return false
  
  // Check if guess is a substring of word or vice versa
  if (normalizedWord.includes(normalizedGuess) || normalizedGuess.includes(normalizedWord)) {
    return true
  }
  
  // Check Levenshtein distance
  const distance = levenshteinDistance(normalizedGuess, normalizedWord)
  return distance <= 2 && distance > 0
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}
```

---

### Step 2: Skribble Runtime

#### 2.1 Create `server/src/games/skribble/SkribbleRuntime.ts`
```typescript
import { Server } from 'socket.io'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { getRandomWords, generateWordHint, isCloseGuess } from './wordList'
import {
  GameConfig,
  GameEventResult,
  Player,
  UserId,
  Stroke,
  StrokeBatchPayload,
  GuessPayload,
} from '@mini-arcade/shared'

interface SkribbleRoundState {
  drawerId: UserId
  word: string
  wordHint: string
  wordChoices: string[]
  wordSelected: boolean
  strokes: Stroke[]
  correctGuessers: Set<UserId>
  guessOrder: UserId[]
  roundStartedAt: Date | null
}

const WORD_SELECTION_TIME = 15000 // 15 seconds to choose word
const ROUND_TIME = 90 // 90 seconds to draw
const POINTS_FIRST = 100
const POINTS_DECREASE = 10
const POINTS_MIN = 70
const DRAWER_POINTS_PER_GUESS = 10

export class SkribbleRuntime extends BaseGameRuntime {
  private roundState: SkribbleRoundState = {
    drawerId: '',
    word: '',
    wordHint: '',
    wordChoices: [],
    wordSelected: false,
    strokes: [],
    correctGuessers: new Set(),
    guessOrder: [],
    roundStartedAt: null,
  }
  
  private drawerOrder: UserId[] = []
  private currentDrawerIndex: number = 0
  private wordSelectionTimer: NodeJS.Timeout | null = null
  
  constructor(io: Server, config: GameConfig) {
    super(io, config)
    this.totalRounds = config.players.length * 2 // Each player draws twice
    this.roundTime = ROUND_TIME
  }
  
  async initialize(): Promise<void> {
    // Set drawer order (shuffle players)
    this.drawerOrder = Array.from(this.players.keys())
      .sort(() => Math.random() - 0.5)
  }
  
  // ==========================================================================
  // ROUND MANAGEMENT
  // ==========================================================================
  
  protected async prepareRound(): Promise<Record<string, unknown>> {
    // Select drawer
    const drawerIndex = (this.currentRound - 1) % this.drawerOrder.length
    const drawerId = this.drawerOrder[drawerIndex]
    
    // Generate word choices
    const wordChoices = getRandomWords(3, 'medium')
    
    // Reset round state
    this.roundState = {
      drawerId,
      word: '',
      wordHint: '',
      wordChoices,
      wordSelected: false,
      strokes: [],
      correctGuessers: new Set(),
      guessOrder: [],
      roundStartedAt: null,
    }
    
    // Start word selection timer
    this.wordSelectionTimer = setTimeout(() => {
      if (!this.roundState.wordSelected) {
        // Auto-select first word
        this.selectWord(drawerId, wordChoices[0])
      }
    }, WORD_SELECTION_TIME)
    
    // Return data for all players
    return {
      drawerId,
      wordChoices: undefined, // Don't send choices to everyone
    }
  }
  
  private selectWord(playerId: UserId, word: string): GameEventResult {
    if (playerId !== this.roundState.drawerId) {
      return { success: false, error: 'Not your turn to draw' }
    }
    
    if (this.roundState.wordSelected) {
      return { success: false, error: 'Word already selected' }
    }
    
    if (!this.roundState.wordChoices.includes(word)) {
      return { success: false, error: 'Invalid word choice' }
    }
    
    // Clear selection timer
    if (this.wordSelectionTimer) {
      clearTimeout(this.wordSelectionTimer)
      this.wordSelectionTimer = null
    }
    
    this.roundState.word = word
    this.roundState.wordHint = generateWordHint(word)
    this.roundState.wordSelected = true
    this.roundState.roundStartedAt = new Date()
    
    // Notify all players that drawing has started
    return {
      success: true,
      broadcast: [
        // Send word to drawer
        {
          event: 'draw:turnStarted',
          data: {
            drawerId: this.roundState.drawerId,
            word: this.roundState.word,
          },
          to: 'player',
          playerId: this.roundState.drawerId,
        },
        // Send hint to guessers
        {
          event: 'draw:turnStarted',
          data: {
            drawerId: this.roundState.drawerId,
            wordLength: this.roundState.word.length,
            wordHint: this.roundState.wordHint,
          },
          to: 'room',
        },
      ],
    }
  }
  
  protected calculateRoundResults(): Record<string, unknown> {
    const results: Record<UserId, { guessed: boolean; points: number; position?: number }> = {}
    
    // Calculate guesser points
    this.roundState.guessOrder.forEach((playerId, index) => {
      const points = Math.max(POINTS_FIRST - (index * POINTS_DECREASE), POINTS_MIN)
      results[playerId] = { guessed: true, points, position: index + 1 }
      this.addScore(playerId, points)
    })
    
    // Calculate drawer points
    const drawerPoints = this.roundState.correctGuessers.size * DRAWER_POINTS_PER_GUESS
    if (drawerPoints > 0) {
      results[this.roundState.drawerId] = { guessed: false, points: drawerPoints }
      this.addScore(this.roundState.drawerId, drawerPoints)
    }
    
    // Mark non-guessers
    for (const [playerId] of this.players) {
      if (!results[playerId] && playerId !== this.roundState.drawerId) {
        results[playerId] = { guessed: false, points: 0 }
      }
    }
    
    return {
      word: this.roundState.word,
      results,
      correctGuessers: Array.from(this.roundState.correctGuessers),
    }
  }
  
  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================
  
  async onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult> {
    switch (eventName) {
      case 'selectWord':
        return this.selectWord(playerId, (payload as { word: string }).word)
      
      case 'strokeBatch':
        return this.handleStrokeBatch(playerId, payload as StrokeBatchPayload)
      
      case 'clearCanvas':
        return this.handleClearCanvas(playerId)
      
      case 'guess':
        return this.handleGuess(playerId, payload as GuessPayload)
      
      case 'requestSync':
        return this.handleSyncRequest(playerId)
      
      default:
        return { success: false, error: `Unknown event: ${eventName}` }
    }
  }
  
  private handleStrokeBatch(playerId: UserId, payload: StrokeBatchPayload): GameEventResult {
    // Only drawer can draw
    if (playerId !== this.roundState.drawerId) {
      return { success: false, error: 'Not your turn to draw' }
    }
    
    if (!this.roundState.wordSelected) {
      return { success: false, error: 'Select a word first' }
    }
    
    // Store strokes
    this.roundState.strokes.push(...payload.strokes)
    
    // Limit stored strokes to prevent memory issues
    if (this.roundState.strokes.length > 10000) {
      // Flatten old strokes (simplified - in production, merge paths)
      this.roundState.strokes = this.roundState.strokes.slice(-5000)
    }
    
    // Broadcast to other players
    return {
      success: true,
      broadcast: [{
        event: 'draw:strokeBroadcast',
        data: {
          strokes: payload.strokes,
          playerId,
        },
        to: 'room',
      }],
    }
  }
  
  private handleClearCanvas(playerId: UserId): GameEventResult {
    if (playerId !== this.roundState.drawerId) {
      return { success: false, error: 'Not your turn to draw' }
    }
    
    // Clear strokes
    this.roundState.strokes = []
    
    return {
      success: true,
      broadcast: [{
        event: 'draw:canvasCleared',
        data: { playerId },
        to: 'room',
      }],
    }
  }
  
  private handleGuess(playerId: UserId, payload: GuessPayload): GameEventResult {
    // Drawer can't guess
    if (playerId === this.roundState.drawerId) {
      return { success: false, error: "You can't guess your own word" }
    }
    
    // Already guessed correctly
    if (this.roundState.correctGuessers.has(playerId)) {
      return { success: false, error: 'You already guessed correctly' }
    }
    
    const guess = payload.guess.toLowerCase().trim()
    const word = this.roundState.word.toLowerCase()
    
    // Check if correct
    if (guess === word) {
      this.roundState.correctGuessers.add(playerId)
      this.roundState.guessOrder.push(playerId)
      
      const player = this.players.get(playerId)
      const position = this.roundState.guessOrder.length
      const points = Math.max(POINTS_FIRST - ((position - 1) * POINTS_DECREASE), POINTS_MIN)
      
      // Check if all guessed
      const totalGuessers = Array.from(this.players.keys())
        .filter(id => id !== this.roundState.drawerId)
      
      if (this.roundState.correctGuessers.size === totalGuessers.length) {
        // End round early
        setTimeout(() => this.endRound(), 1000)
      }
      
      return {
        success: true,
        broadcast: [
          // Notify the guesser
          {
            event: 'draw:guessResult',
            data: {
              playerId,
              isCorrect: true,
              pointsEarned: points,
            },
            to: 'player',
            playerId,
          },
          // Notify everyone
          {
            event: 'draw:correctGuess',
            data: {
              playerId,
              playerName: player?.name || 'Player',
              position,
            },
            to: 'room',
          },
        ],
      }
    }
    
    // Check if close guess
    const isClose = isCloseGuess(guess, word)
    
    return {
      success: true,
      broadcast: [
        // Send result to guesser
        {
          event: 'draw:guessResult',
          data: {
            playerId,
            isCorrect: false,
            isClose,
            guess: payload.guess,
          },
          to: 'player',
          playerId,
        },
        // Show guess in chat (unless it's too close to word)
        {
          event: 'chat:message',
          data: {
            id: `${Date.now()}-${playerId}`,
            playerId,
            playerName: this.players.get(playerId)?.name || 'Player',
            message: isClose ? '***' : payload.guess,
            timestamp: new Date().toISOString(),
            type: 'guess',
          },
          to: 'room',
        },
      ],
    }
  }
  
  private handleSyncRequest(playerId: UserId): GameEventResult {
    return {
      success: true,
      broadcast: [{
        event: 'draw:sync',
        data: {
          strokes: this.roundState.strokes,
          drawerId: this.roundState.drawerId,
          wordHint: this.roundState.wordHint,
          wordLength: this.roundState.word.length,
          correctGuessers: Array.from(this.roundState.correctGuessers),
          timeRemaining: this.roundEndsAt 
            ? Math.max(0, Math.floor((this.roundEndsAt.getTime() - Date.now()) / 1000))
            : 0,
        },
        to: 'player',
        playerId,
      }],
    }
  }
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getRoundState(): unknown {
    return {
      drawerId: this.roundState.drawerId,
      wordHint: this.roundState.wordHint,
      wordLength: this.roundState.word.length,
      strokeCount: this.roundState.strokes.length,
      correctGuessers: Array.from(this.roundState.correctGuessers),
    }
  }
  
  // ==========================================================================
  // PLAYER MANAGEMENT OVERRIDES
  // ==========================================================================
  
  onPlayerLeave(playerId: UserId): GameEventResult {
    const result = super.onPlayerLeave(playerId)
    
    // If drawer leaves, end round early
    if (playerId === this.roundState.drawerId) {
      setTimeout(() => this.endRound(), 1000)
    }
    
    return result
  }
}
```

---

### Step 3: Client Canvas Component

#### 3.1 Create `client/src/components/games/skribble/Canvas.tsx`
```typescript
'use client'

import { useRef, useEffect, useState, useCallback, MouseEvent, TouchEvent } from 'react'
import { Stroke } from '@mini-arcade/shared'

interface CanvasProps {
  width?: number
  height?: number
  isDrawer: boolean
  color: string
  brushSize: number
  tool: 'brush' | 'eraser'
  onStrokeBatch: (strokes: Stroke[]) => void
  remoteStrokes: Stroke[]
}

export function Canvas({
  width = 800,
  height = 600,
  isDrawer,
  color,
  brushSize,
  tool,
  onStrokeBatch,
  remoteStrokes,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const strokeBuffer = useRef<Stroke[]>([])
  const lastFlushTime = useRef(Date.now())
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Handle DPR for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    
    contextRef.current = ctx
  }, [width, height])
  
  // Draw remote strokes
  useEffect(() => {
    if (!contextRef.current || remoteStrokes.length === 0) return
    
    const ctx = contextRef.current
    
    for (const stroke of remoteStrokes) {
      drawStroke(ctx, stroke)
    }
  }, [remoteStrokes])
  
  // Flush stroke buffer periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (strokeBuffer.current.length > 0) {
        onStrokeBatch([...strokeBuffer.current])
        strokeBuffer.current = []
        lastFlushTime.current = Date.now()
      }
    }, 50) // 50ms = 20 updates per second
    
    return () => clearInterval(interval)
  }, [onStrokeBatch])
  
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return
    
    ctx.beginPath()
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color
    ctx.lineWidth = stroke.width
    
    const [first, ...rest] = stroke.points
    ctx.moveTo(first.x, first.y)
    
    for (const point of rest) {
      ctx.lineTo(point.x, point.y)
    }
    
    ctx.stroke()
  }
  
  const getCoordinates = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }
  
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawer) return
    
    const coords = getCoordinates(e)
    if (!coords) return
    
    setIsDrawing(true)
    
    const stroke: Stroke = {
      points: [coords],
      color,
      width: brushSize,
      tool,
    }
    
    setCurrentStroke(stroke)
    
    // Draw starting point
    const ctx = contextRef.current
    if (ctx) {
      ctx.beginPath()
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color
      ctx.lineWidth = brushSize
      ctx.moveTo(coords.x, coords.y)
    }
  }, [isDrawer, color, brushSize, tool])
  
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !currentStroke || !isDrawer) return
    
    e.preventDefault()
    
    const coords = getCoordinates(e)
    if (!coords) return
    
    // Add point to current stroke
    currentStroke.points.push(coords)
    
    // Draw locally
    const ctx = contextRef.current
    if (ctx) {
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(coords.x, coords.y)
    }
  }, [isDrawing, currentStroke, isDrawer])
  
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return
    
    setIsDrawing(false)
    
    // Add completed stroke to buffer
    if (currentStroke.points.length > 0) {
      strokeBuffer.current.push(currentStroke)
    }
    
    setCurrentStroke(null)
    
    // Immediately flush if buffer is large
    if (strokeBuffer.current.length >= 10) {
      onStrokeBatch([...strokeBuffer.current])
      strokeBuffer.current = []
    }
  }, [isDrawing, currentStroke, onStrokeBatch])
  
  return (
    <canvas
      ref={canvasRef}
      className={`border-2 border-gray-700 rounded-lg bg-white ${
        isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'
      }`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  )
}
```

#### 3.2 Create `client/src/components/games/skribble/DrawingTools.tsx`
```typescript
'use client'

interface DrawingToolsProps {
  color: string
  brushSize: number
  tool: 'brush' | 'eraser'
  onColorChange: (color: string) => void
  onBrushSizeChange: (size: number) => void
  onToolChange: (tool: 'brush' | 'eraser') => void
  onClear: () => void
  disabled?: boolean
}

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF',
  '#808080', '#800000', '#008000', '#000080', '#808000',
]

const BRUSH_SIZES = [2, 5, 10, 20, 35]

export function DrawingTools({
  color,
  brushSize,
  tool,
  onColorChange,
  onBrushSizeChange,
  onToolChange,
  onClear,
  disabled = false,
}: DrawingToolsProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${disabled ? 'opacity-50' : ''}`}>
      {/* Colors */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              disabled={disabled}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      
      {/* Brush Size */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-2 block">Size</label>
        <div className="flex gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onBrushSizeChange(size)}
              disabled={disabled}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                brushSize === size
                  ? 'bg-purple-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: size, height: size }}
              />
            </button>
          ))}
        </div>
      </div>
      
      {/* Tools */}
      <div className="flex gap-2">
        <button
          onClick={() => onToolChange('brush')}
          disabled={disabled}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            tool === 'brush'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Brush
        </button>
        <button
          onClick={() => onToolChange('eraser')}
          disabled={disabled}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            tool === 'eraser'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Eraser
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
```

#### 3.3 Create `client/src/components/games/skribble/SkribbleGame.tsx`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { Canvas } from './Canvas'
import { DrawingTools } from './DrawingTools'
import { WordSelector } from './WordSelector'
import { GuessingPanel } from './GuessingPanel'
import { GameHeader } from './GameHeader'
import { PlayerList } from './PlayerList'
import type { Stroke, Player, SkribbleRoundStarted } from '@mini-arcade/shared'

interface SkribbleGameProps {
  roomCode: string
  players: Player[]
}

export function SkribbleGame({ roomCode, players }: SkribbleGameProps) {
  const { user } = useAuth()
  const { emit, on, off } = useSocket()
  
  // Game state
  const [phase, setPhase] = useState<'waiting' | 'selecting' | 'drawing' | 'roundEnd'>('waiting')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [word, setWord] = useState<string>('')
  const [wordHint, setWordHint] = useState<string>('')
  const [wordChoices, setWordChoices] = useState<string[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [correctGuessers, setCorrectGuessers] = useState<string[]>([])
  
  // Drawing state
  const [remoteStrokes, setRemoteStrokes] = useState<Stroke[]>([])
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  
  const isDrawer = drawerId === user?.id
  
  // Socket event handlers
  useEffect(() => {
    const handleRoundStarted = (data: SkribbleRoundStarted) => {
      setCurrentRound(data.roundNumber)
      setTotalRounds(data.totalRounds)
      setDrawerId(data.drawerId)
      setWordHint(data.wordHint || '')
      setTimeRemaining(Math.floor((new Date(data.roundEndsAt).getTime() - Date.now()) / 1000))
      setRemoteStrokes([])
      setCorrectGuessers([])
      setPhase('drawing')
    }
    
    const handleTurnStarted = (data: { drawerId: string; word?: string; wordHint?: string }) => {
      setDrawerId(data.drawerId)
      if (data.word) {
        setWord(data.word)
      }
      if (data.wordHint) {
        setWordHint(data.wordHint)
      }
    }
    
    const handleWordChoices = (data: { choices: string[] }) => {
      setWordChoices(data.choices)
      setPhase('selecting')
    }
    
    const handleStrokeBroadcast = (data: { strokes: Stroke[]; playerId: string }) => {
      if (data.playerId !== user?.id) {
        setRemoteStrokes(prev => [...prev, ...data.strokes])
      }
    }
    
    const handleCanvasCleared = () => {
      setRemoteStrokes([])
      // Clear local canvas
      const canvas = document.querySelector('canvas')
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    const handleCorrectGuess = (data: { playerId: string }) => {
      setCorrectGuessers(prev => [...prev, data.playerId])
    }
    
    const handleRoundEnded = (data: { word: string; results: Record<string, any> }) => {
      setWord(data.word)
      setPhase('roundEnd')
    }
    
    const handleSync = (data: { strokes: Stroke[]; drawerId: string; wordHint: string }) => {
      setRemoteStrokes(data.strokes)
      setDrawerId(data.drawerId)
      setWordHint(data.wordHint)
    }
    
    on('draw:roundStarted', handleRoundStarted)
    on('draw:turnStarted', handleTurnStarted)
    on('draw:wordChoices', handleWordChoices)
    on('draw:strokeBroadcast', handleStrokeBroadcast)
    on('draw:canvasCleared', handleCanvasCleared)
    on('draw:correctGuess', handleCorrectGuess)
    on('draw:roundEnded', handleRoundEnded)
    on('draw:sync', handleSync)
    
    return () => {
      off('draw:roundStarted')
      off('draw:turnStarted')
      off('draw:wordChoices')
      off('draw:strokeBroadcast')
      off('draw:canvasCleared')
      off('draw:correctGuess')
      off('draw:roundEnded')
      off('draw:sync')
    }
  }, [on, off, user?.id])
  
  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeRemaining])
  
  // Event emitters
  const handleStrokeBatch = useCallback((strokes: Stroke[]) => {
    emit('draw:strokeBatch', { roomCode, strokes, timestamp: Date.now() })
  }, [emit, roomCode])
  
  const handleClearCanvas = useCallback(() => {
    emit('draw:clearCanvas', { roomCode })
  }, [emit, roomCode])
  
  const handleGuess = useCallback((guess: string) => {
    emit('draw:guess', { roomCode, guess })
  }, [emit, roomCode])
  
  const handleWordSelect = useCallback((selectedWord: string) => {
    emit('draw:selectWord', { roomCode, word: selectedWord })
    setWord(selectedWord)
    setPhase('drawing')
  }, [emit, roomCode])
  
  return (
    <div className="flex gap-4 h-full">
      {/* Left sidebar - Players */}
      <div className="w-64">
        <PlayerList
          players={players}
          scores={scores}
          drawerId={drawerId}
          correctGuessers={correctGuessers}
        />
      </div>
      
      {/* Main game area */}
      <div className="flex-1 flex flex-col">
        <GameHeader
          round={currentRound}
          totalRounds={totalRounds}
          timeRemaining={timeRemaining}
          word={isDrawer ? word : ''}
          wordHint={!isDrawer ? wordHint : ''}
        />
        
        {phase === 'selecting' && isDrawer ? (
          <WordSelector
            words={wordChoices}
            onSelect={handleWordSelect}
          />
        ) : (
          <Canvas
            isDrawer={isDrawer}
            color={color}
            brushSize={brushSize}
            tool={tool}
            onStrokeBatch={handleStrokeBatch}
            remoteStrokes={remoteStrokes}
          />
        )}
        
        {isDrawer && phase === 'drawing' && (
          <DrawingTools
            color={color}
            brushSize={brushSize}
            tool={tool}
            onColorChange={setColor}
            onBrushSizeChange={setBrushSize}
            onToolChange={setTool}
            onClear={handleClearCanvas}
          />
        )}
      </div>
      
      {/* Right sidebar - Chat/Guessing */}
      <div className="w-80">
        <GuessingPanel
          onGuess={handleGuess}
          disabled={isDrawer || correctGuessers.includes(user?.id || '')}
          hasGuessedCorrectly={correctGuessers.includes(user?.id || '')}
        />
      </div>
    </div>
  )
}
```

---

## Files Created

```
server/src/games/skribble/
├── SkribbleRuntime.ts
├── wordList.ts
└── index.ts

client/src/components/games/skribble/
├── Canvas.tsx
├── DrawingTools.tsx
├── SkribbleGame.tsx
├── WordSelector.tsx
├── GuessingPanel.tsx
├── GameHeader.tsx
└── PlayerList.tsx
```

---

## Testing Checklist

### Manual Tests
- [ ] Create room and start game
- [ ] Drawing appears on other clients
- [ ] Word selection works
- [ ] Guessing works with correct validation
- [ ] Close guesses show hint
- [ ] Scores calculate correctly
- [ ] Turn rotation works
- [ ] Timer works
- [ ] Reconnection syncs canvas
- [ ] Game ends properly

### Edge Cases
- [ ] Drawer disconnects mid-round
- [ ] All players guess correctly early
- [ ] Player joins mid-game
- [ ] Very fast drawing doesn't lag
- [ ] Large canvas history handled

---

## Next Game
Once Skribble is complete and tested, proceed to **Game: Trivia**.
