# Game Implementation: Wordel

## Overview
Implement a Wordle-style word guessing game where players guess a 5-letter word in 6 attempts. Can be played solo or in parallel multiplayer mode where players compete to solve faster.

**Status:** To Implement  
**Priority:** Medium  
**Estimated Time:** 4-5 hours  
**Dependencies:** Phase 4 (Game Runtime) completed

---

## Game Rules

### Core Mechanics
1. Secret 5-letter word selected by server
2. Players have 6 attempts to guess the word
3. After each guess, letters are color-coded:
   - **Green:** Letter is correct and in correct position
   - **Yellow:** Letter is in word but wrong position
   - **Gray:** Letter is not in the word
4. Only valid 5-letter words accepted

### Multiplayer Mode
- Each player gets the SAME secret word
- First to solve gets bonus points
- All players can see opponent progress (attempts used, solved status)
- Game ends when all solve or all fail

### Scoring
- **Solve in 1 guess:** 1000 points
- **Solve in 2 guesses:** 900 points
- **Solve in 3 guesses:** 800 points
- **Solve in 4 guesses:** 600 points
- **Solve in 5 guesses:** 400 points
- **Solve in 6 guesses:** 200 points
- **First to solve bonus:** +100 points
- **Failed to solve:** 0 points

### Round Flow
1. Server selects secret word
2. Players make guesses
3. Server validates and returns results
4. Continue until solved or 6 attempts used
5. Show results and next round

---

## Acceptance Criteria

### Word Validation
- [ ] Only 5-letter words accepted
- [ ] Only valid English words accepted
- [ ] Case insensitive input
- [ ] Server validates all guesses

### Game Board
- [ ] 6 rows x 5 columns grid
- [ ] Letters animate on submission
- [ ] Color coding works correctly
- [ ] Keyboard shows used letters

### Multiplayer
- [ ] All players get same word
- [ ] Can see opponent progress
- [ ] First solver bonus works
- [ ] Syncs on reconnect

---

## Implementation Steps

### Step 1: Word Lists

#### 1.1 Create `server/src/games/wordel/wordList.ts`
```typescript
// Valid 5-letter words for solutions (common words)
export const SOLUTION_WORDS = [
  'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult',
  'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert',
  'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'among', 'anger',
  'angle', 'angry', 'apart', 'apple', 'apply', 'arena', 'argue', 'arise',
  'array', 'aside', 'asset', 'avoid', 'award', 'aware', 'badly', 'baker',
  // ... Add more common 5-letter words (typically 2000-3000 words)
  'basic', 'basis', 'beach', 'began', 'begin', 'begun', 'being', 'belly',
  'below', 'bench', 'billy', 'birth', 'black', 'blame', 'blank', 'blast',
  'blaze', 'bleed', 'blend', 'bless', 'blind', 'block', 'blood', 'bloom',
  'blown', 'board', 'boost', 'booth', 'bound', 'brain', 'brand', 'brave',
  'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad',
  'broke', 'brown', 'brush', 'build', 'built', 'bunch', 'burst', 'buyer',
  'cable', 'calif', 'carry', 'catch', 'cause', 'chain', 'chair', 'chart',
  'chase', 'cheap', 'check', 'chest', 'chief', 'child', 'china', 'chose',
  'civil', 'claim', 'class', 'clean', 'clear', 'climb', 'clock', 'close',
  'cloud', 'coach', 'coast', 'could', 'count', 'court', 'cover', 'crack',
  'craft', 'crash', 'crazy', 'cream', 'crime', 'cross', 'crowd', 'crown',
  'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'delay', 'depth',
  'doing', 'doubt', 'dozen', 'draft', 'drain', 'drama', 'drank', 'drawn',
  'dream', 'dress', 'drill', 'drink', 'drive', 'drove', 'dying', 'eager',
  'early', 'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter',
  'entry', 'equal', 'error', 'event', 'every', 'exact', 'exist', 'extra',
  'faith', 'false', 'fancy', 'fault', 'favor', 'feast', 'field', 'fifth',
  'fifty', 'fight', 'final', 'first', 'fixed', 'flash', 'flesh', 'float',
  'flood', 'floor', 'flour', 'fluid', 'focus', 'force', 'forge', 'forth',
  'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front',
  'fruit', 'fully', 'giant', 'given', 'glass', 'globe', 'glory', 'going',
  'grace', 'grade', 'grain', 'grand', 'grant', 'grass', 'grave', 'great',
  'green', 'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide',
  'happy', 'harry', 'heart', 'heavy', 'hence', 'henry', 'horse', 'hotel',
  'house', 'human', 'ideal', 'image', 'index', 'inner', 'input', 'issue',
  'japan', 'jimmy', 'joint', 'jones', 'judge', 'juice', 'known', 'label',
  'labor', 'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease',
  'least', 'leave', 'legal', 'level', 'lewis', 'light', 'limit', 'links',
  'lives', 'local', 'logic', 'loose', 'lower', 'lucky', 'lunch', 'lying',
  'magic', 'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor',
  'meant', 'media', 'metal', 'might', 'minor', 'minus', 'mixed', 'model',
  'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'moved',
  'movie', 'music', 'needs', 'nerve', 'never', 'newly', 'night', 'noise',
  'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often',
  'order', 'other', 'ought', 'outer', 'owned', 'owner', 'paint', 'panel',
  'paper', 'party', 'peace', 'peter', 'phase', 'phone', 'photo', 'piece',
  'pilot', 'pitch', 'place', 'plain', 'plane', 'plant', 'plate', 'plaza',
  'point', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print',
  'prior', 'prize', 'proof', 'proud', 'prove', 'queen', 'quick', 'quiet',
  'quite', 'quote', 'radio', 'raise', 'range', 'rapid', 'ratio', 'reach',
  'ready', 'realm', 'rebel', 'refer', 'reign', 'relax', 'reply', 'right',
  'river', 'robin', 'rocky', 'roger', 'roman', 'rough', 'round', 'route',
  'royal', 'rural', 'scale', 'scene', 'scope', 'score', 'sense', 'serve',
  'seven', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell',
  'shift', 'shine', 'shirt', 'shock', 'shoot', 'shore', 'short', 'shown',
  'sight', 'simon', 'since', 'sixth', 'sixty', 'sized', 'skill', 'slave',
  'sleep', 'slide', 'small', 'smart', 'smile', 'smith', 'smoke', 'solid',
  'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'speak', 'speed',
  'spend', 'spent', 'split', 'spoke', 'sport', 'staff', 'stage', 'stake',
  'stand', 'start', 'state', 'steam', 'steel', 'steep', 'stick', 'still',
  'stock', 'stone', 'stood', 'store', 'storm', 'story', 'strip', 'stuck',
  'study', 'stuff', 'style', 'sugar', 'suite', 'super', 'sweet', 'swing',
  'table', 'taken', 'taste', 'taxes', 'teach', 'teeth', 'terry', 'texas',
  'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thing',
  'think', 'third', 'thirty', 'those', 'three', 'threw', 'throw', 'tight',
  'times', 'tired', 'title', 'today', 'token', 'topic', 'total', 'touch',
  'tough', 'tower', 'track', 'trade', 'trail', 'train', 'trash', 'treat',
  'trend', 'trial', 'tribe', 'trick', 'tried', 'truck', 'truly', 'trust',
  'truth', 'twice', 'uncle', 'under', 'union', 'unity', 'until', 'upper',
  'upset', 'urban', 'usage', 'usual', 'valid', 'value', 'video', 'virus',
  'visit', 'vital', 'voice', 'voter', 'waste', 'watch', 'water', 'wheel',
  'where', 'which', 'while', 'white', 'whole', 'whose', 'widow', 'width',
  'woman', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound',
  'write', 'wrong', 'wrote', 'yield', 'young', 'youth', 'zebra', 'zesty',
]

// All valid 5-letter words (including obscure ones for guessing)
export const VALID_GUESSES = new Set([
  ...SOLUTION_WORDS,
  // Add more valid 5-letter words that aren't common enough for solutions
  'aahed', 'aalii', 'aargh', 'abaca', 'abaci', 'aback', 'abaft', 'abamp',
  // ... thousands more words
])

export function getRandomWord(): string {
  return SOLUTION_WORDS[Math.floor(Math.random() * SOLUTION_WORDS.length)]
}

export function isValidWord(word: string): boolean {
  return VALID_GUESSES.has(word.toLowerCase())
}

export type LetterResult = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, solution: string): LetterResult[] {
  const guessLower = guess.toLowerCase()
  const solutionLower = solution.toLowerCase()
  const results: LetterResult[] = new Array(5).fill('absent')
  const solutionLetters = solutionLower.split('')
  const usedPositions = new Set<number>()
  
  // First pass: find exact matches (green)
  for (let i = 0; i < 5; i++) {
    if (guessLower[i] === solutionLower[i]) {
      results[i] = 'correct'
      usedPositions.add(i)
    }
  }
  
  // Second pass: find present letters (yellow)
  for (let i = 0; i < 5; i++) {
    if (results[i] === 'correct') continue
    
    for (let j = 0; j < 5; j++) {
      if (usedPositions.has(j)) continue
      
      if (guessLower[i] === solutionLetters[j]) {
        results[i] = 'present'
        usedPositions.add(j)
        break
      }
    }
  }
  
  return results
}
```

---

### Step 2: Wordel Runtime

#### 2.1 Create `server/src/games/wordel/WordelRuntime.ts`
```typescript
import { Server } from 'socket.io'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { getRandomWord, isValidWord, evaluateGuess, LetterResult } from './wordList'
import {
  GameConfig,
  GameEventResult,
  Player,
  UserId,
  WordelSubmitGuessPayload,
} from '@mini-arcade/shared'

interface PlayerGameState {
  guesses: Array<{
    word: string
    results: LetterResult[]
  }>
  solved: boolean
  solvedAt?: Date
}

interface WordelRoundState {
  word: string
  playerStates: Map<UserId, PlayerGameState>
  roundStartedAt: Date
  firstSolverId?: UserId
}

const MAX_ATTEMPTS = 6
const FIRST_SOLVE_BONUS = 100
const POINTS_BY_ATTEMPT = [1000, 900, 800, 600, 400, 200]

export class WordelRuntime extends BaseGameRuntime {
  private roundState: WordelRoundState | null = null
  
  constructor(io: Server, config: GameConfig) {
    super(io, config)
    this.totalRounds = config.settings?.rounds || 5
    this.roundTime = 300 // 5 minutes per word (optional limit)
  }
  
  async initialize(): Promise<void> {
    // Nothing special needed
  }
  
  // ==========================================================================
  // ROUND MANAGEMENT
  // ==========================================================================
  
  protected async prepareRound(): Promise<Record<string, unknown>> {
    const word = getRandomWord()
    
    // Initialize player states
    const playerStates = new Map<UserId, PlayerGameState>()
    for (const [playerId] of this.players) {
      playerStates.set(playerId, {
        guesses: [],
        solved: false,
      })
    }
    
    this.roundState = {
      word,
      playerStates,
      roundStartedAt: new Date(),
    }
    
    return {
      wordLength: 5,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  protected calculateRoundResults(): Record<string, unknown> {
    if (!this.roundState) return {}
    
    const playerResults: Array<{
      playerId: UserId
      solved: boolean
      attempts: number
      pointsEarned: number
    }> = []
    
    for (const [playerId, state] of this.roundState.playerStates) {
      let points = 0
      
      if (state.solved) {
        const attemptIndex = state.guesses.length - 1
        points = POINTS_BY_ATTEMPT[attemptIndex] || 0
        
        // First solve bonus
        if (this.roundState.firstSolverId === playerId) {
          points += FIRST_SOLVE_BONUS
        }
        
        this.addScore(playerId, points)
      }
      
      playerResults.push({
        playerId,
        solved: state.solved,
        attempts: state.guesses.length,
        pointsEarned: points,
      })
    }
    
    return {
      correctWord: this.roundState.word,
      playerResults,
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
      case 'submitGuess':
        return this.handleSubmitGuess(playerId, payload as WordelSubmitGuessPayload)
      
      default:
        return { success: false, error: `Unknown event: ${eventName}` }
    }
  }
  
  private handleSubmitGuess(
    playerId: UserId,
    payload: WordelSubmitGuessPayload
  ): GameEventResult {
    if (!this.roundState) {
      return { success: false, error: 'No active round' }
    }
    
    const playerState = this.roundState.playerStates.get(playerId)
    if (!playerState) {
      return { success: false, error: 'Player not found' }
    }
    
    // Check if already solved
    if (playerState.solved) {
      return { success: false, error: 'Already solved' }
    }
    
    // Check attempts
    if (playerState.guesses.length >= MAX_ATTEMPTS) {
      return { success: false, error: 'No attempts remaining' }
    }
    
    // Validate guess
    const guess = payload.guess.toLowerCase()
    
    if (guess.length !== 5) {
      return { success: false, error: 'Guess must be 5 letters' }
    }
    
    if (!/^[a-z]+$/.test(guess)) {
      return { success: false, error: 'Only letters allowed' }
    }
    
    if (!isValidWord(guess)) {
      return { success: false, error: 'Not a valid word' }
    }
    
    // Evaluate guess
    const results = evaluateGuess(guess, this.roundState.word)
    const isCorrect = results.every(r => r === 'correct')
    
    // Record guess
    playerState.guesses.push({ word: guess, results })
    
    if (isCorrect) {
      playerState.solved = true
      playerState.solvedAt = new Date()
      
      // Track first solver
      if (!this.roundState.firstSolverId) {
        this.roundState.firstSolverId = playerId
      }
    }
    
    // Check if round should end
    const allDone = this.checkAllPlayersDone()
    if (allDone) {
      setTimeout(() => this.endRound(), 2000)
    }
    
    return {
      success: true,
      broadcast: [
        // Send result to guessing player
        {
          event: 'wordel:guessResult',
          data: {
            guess,
            results,
            isCorrect,
            attemptsUsed: playerState.guesses.length,
          },
          to: 'player',
          playerId,
        },
        // Notify others of progress
        {
          event: 'wordel:opponentProgress',
          data: {
            playerId,
            attemptCount: playerState.guesses.length,
            solved: playerState.solved,
          },
          to: 'room',
        },
      ],
    }
  }
  
  private checkAllPlayersDone(): boolean {
    if (!this.roundState) return true
    
    for (const [playerId, state] of this.roundState.playerStates) {
      const player = this.players.get(playerId)
      if (!player?.isConnected) continue
      
      if (!state.solved && state.guesses.length < MAX_ATTEMPTS) {
        return false
      }
    }
    
    return true
  }
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getRoundState(): unknown {
    if (!this.roundState) return null
    
    const playerProgress: Record<UserId, { attempts: number; solved: boolean }> = {}
    
    for (const [playerId, state] of this.roundState.playerStates) {
      playerProgress[playerId] = {
        attempts: state.guesses.length,
        solved: state.solved,
      }
    }
    
    return {
      wordLength: 5,
      maxAttempts: MAX_ATTEMPTS,
      playerProgress,
    }
  }
  
  // For reconnection - get player's own guesses
  getPlayerState(playerId: UserId): unknown {
    if (!this.roundState) return null
    
    const state = this.roundState.playerStates.get(playerId)
    if (!state) return null
    
    return {
      guesses: state.guesses,
      solved: state.solved,
      attemptsRemaining: MAX_ATTEMPTS - state.guesses.length,
    }
  }
}
```

---

### Step 3: Client Components

#### 3.1 Create `client/src/components/games/wordel/WordelGame.tsx`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { GameBoard } from './GameBoard'
import { Keyboard } from './Keyboard'
import { OpponentProgress } from './OpponentProgress'
import type { Player, WordelLetterResult } from '@mini-arcade/shared'

interface WordelGameProps {
  roomCode: string
  players: Player[]
}

interface Guess {
  word: string
  results: WordelLetterResult[]
}

export function WordelGame({ roomCode, players }: WordelGameProps) {
  const { user } = useAuth()
  const { emit, on, off } = useSocket()
  
  // Game state
  const [phase, setPhase] = useState<'playing' | 'roundEnd' | 'gameEnd'>('playing')
  const [currentRound, setCurrentRound] = useState(0)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [solved, setSolved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opponentProgress, setOpponentProgress] = useState<Record<string, { attempts: number; solved: boolean }>>({})
  const [correctWord, setCorrectWord] = useState<string | null>(null)
  const [usedLetters, setUsedLetters] = useState<Record<string, WordelLetterResult>>({})
  
  const maxAttempts = 6
  
  // Socket handlers
  useEffect(() => {
    const handleRoundStarted = (data: any) => {
      setPhase('playing')
      setCurrentRound(data.roundNumber)
      setGuesses([])
      setCurrentGuess('')
      setSolved(false)
      setCorrectWord(null)
      setUsedLetters({})
      setOpponentProgress({})
    }
    
    const handleGuessResult = (data: { guess: string; results: WordelLetterResult[]; isCorrect: boolean }) => {
      setGuesses(prev => [...prev, { word: data.guess, results: data.results }])
      setSolved(data.isCorrect)
      setCurrentGuess('')
      setError(null)
      
      // Update used letters
      setUsedLetters(prev => {
        const updated = { ...prev }
        data.guess.split('').forEach((letter, i) => {
          const result = data.results[i]
          // Keep the best result for each letter
          if (!updated[letter] || 
              (result === 'correct') || 
              (result === 'present' && updated[letter] === 'absent')) {
            updated[letter] = result
          }
        })
        return updated
      })
    }
    
    const handleOpponentProgress = (data: { playerId: string; attemptCount: number; solved: boolean }) => {
      if (data.playerId !== user?.id) {
        setOpponentProgress(prev => ({
          ...prev,
          [data.playerId]: { attempts: data.attemptCount, solved: data.solved },
        }))
      }
    }
    
    const handleRoundEnded = (data: { correctWord: string }) => {
      setPhase('roundEnd')
      setCorrectWord(data.correctWord)
    }
    
    on('wordel:roundStarted', handleRoundStarted)
    on('wordel:guessResult', handleGuessResult)
    on('wordel:opponentProgress', handleOpponentProgress)
    on('wordel:roundEnded', handleRoundEnded)
    
    return () => {
      off('wordel:roundStarted')
      off('wordel:guessResult')
      off('wordel:opponentProgress')
      off('wordel:roundEnded')
    }
  }, [on, off, user?.id])
  
  const handleKeyPress = useCallback((key: string) => {
    if (solved || guesses.length >= maxAttempts) return
    
    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        emit('wordel:submitGuess', { roomCode, guess: currentGuess })
      } else {
        setError('Not enough letters')
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
      setError(null)
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key)
      setError(null)
    }
  }, [currentGuess, emit, roomCode, solved, guesses.length])
  
  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      
      const key = e.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        handleKeyPress(key)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])
  
  return (
    <div className="flex gap-6 h-full items-start justify-center">
      {/* Opponent progress (left) */}
      {players.length > 1 && (
        <OpponentProgress
          players={players.filter(p => p.id !== user?.id)}
          progress={opponentProgress}
        />
      )}
      
      {/* Main game */}
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Round {currentRound}
        </h2>
        
        {error && (
          <div className="bg-red-600/50 text-white px-4 py-2 rounded-lg mb-4 animate-shake">
            {error}
          </div>
        )}
        
        <GameBoard
          guesses={guesses}
          currentGuess={currentGuess}
          maxAttempts={maxAttempts}
        />
        
        {solved && (
          <div className="mt-4 text-green-400 text-xl font-bold">
            Solved!
          </div>
        )}
        
        {correctWord && (
          <div className="mt-4 text-center">
            <p className="text-gray-400">The word was:</p>
            <p className="text-2xl font-bold text-white uppercase">{correctWord}</p>
          </div>
        )}
        
        <Keyboard
          onKeyPress={handleKeyPress}
          usedLetters={usedLetters}
          disabled={solved || guesses.length >= maxAttempts}
        />
      </div>
    </div>
  )
}
```

#### 3.2 Create `client/src/components/games/wordel/GameBoard.tsx`
```typescript
'use client'

import type { WordelLetterResult } from '@mini-arcade/shared'

interface Guess {
  word: string
  results: WordelLetterResult[]
}

interface GameBoardProps {
  guesses: Guess[]
  currentGuess: string
  maxAttempts: number
}

export function GameBoard({ guesses, currentGuess, maxAttempts }: GameBoardProps) {
  const emptyRows = maxAttempts - guesses.length - (currentGuess.length > 0 ? 1 : 0)
  
  return (
    <div className="flex flex-col gap-2">
      {/* Completed guesses */}
      {guesses.map((guess, i) => (
        <Row key={i} word={guess.word} results={guess.results} />
      ))}
      
      {/* Current guess */}
      {guesses.length < maxAttempts && (
        <Row word={currentGuess.padEnd(5, ' ')} isActive />
      )}
      
      {/* Empty rows */}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <Row key={`empty-${i}`} word="     " />
      ))}
    </div>
  )
}

interface RowProps {
  word: string
  results?: WordelLetterResult[]
  isActive?: boolean
}

function Row({ word, results, isActive }: RowProps) {
  return (
    <div className="flex gap-2">
      {word.split('').map((letter, i) => (
        <Tile
          key={i}
          letter={letter}
          result={results?.[i]}
          isActive={isActive}
          delay={i * 100}
        />
      ))}
    </div>
  )
}

interface TileProps {
  letter: string
  result?: WordelLetterResult
  isActive?: boolean
  delay?: number
}

function Tile({ letter, result, isActive, delay = 0 }: TileProps) {
  const bgColor = result
    ? result === 'correct'
      ? 'bg-green-600'
      : result === 'present'
      ? 'bg-yellow-600'
      : 'bg-gray-700'
    : isActive
    ? 'bg-gray-600 border-gray-400'
    : 'bg-gray-800 border-gray-700'
  
  return (
    <div
      className={`w-14 h-14 flex items-center justify-center text-2xl font-bold text-white border-2 rounded transition-all ${bgColor}`}
      style={{
        animationDelay: result ? `${delay}ms` : undefined,
      }}
    >
      {letter !== ' ' ? letter.toUpperCase() : ''}
    </div>
  )
}
```

#### 3.3 Create `client/src/components/games/wordel/Keyboard.tsx`
```typescript
'use client'

import type { WordelLetterResult } from '@mini-arcade/shared'

interface KeyboardProps {
  onKeyPress: (key: string) => void
  usedLetters: Record<string, WordelLetterResult>
  disabled?: boolean
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

export function Keyboard({ onKeyPress, usedLetters, disabled }: KeyboardProps) {
  const getKeyColor = (key: string): string => {
    const result = usedLetters[key.toLowerCase()]
    if (!result) return 'bg-gray-600 hover:bg-gray-500'
    if (result === 'correct') return 'bg-green-600'
    if (result === 'present') return 'bg-yellow-600'
    return 'bg-gray-800'
  }
  
  return (
    <div className="mt-6 flex flex-col gap-2">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 justify-center">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              disabled={disabled}
              className={`${getKeyColor(key)} text-white font-bold rounded transition-colors ${
                key.length > 1 ? 'px-4 py-4 text-xs' : 'w-10 h-12'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {key === 'BACKSPACE' ? '←' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
```

---

## Files Created

```
server/src/games/wordel/
├── WordelRuntime.ts
├── wordList.ts
└── index.ts

client/src/components/games/wordel/
├── WordelGame.tsx
├── GameBoard.tsx
├── Keyboard.tsx
├── OpponentProgress.tsx
└── RoundResults.tsx
```

---

## Testing Checklist

### Manual Tests
- [ ] Valid words accepted
- [ ] Invalid words rejected
- [ ] Letter colors correct
- [ ] Keyboard updates with used letters
- [ ] Can't guess after 6 attempts
- [ ] Multiplayer progress sync
- [ ] Points calculate correctly

### Edge Cases
- [ ] Same letter appears twice in word
- [ ] Same letter appears twice in guess
- [ ] Player disconnects mid-game
- [ ] All players finish simultaneously

---

## Next Game
Once Wordel is complete and tested, proceed to **Game: Flagel**.
