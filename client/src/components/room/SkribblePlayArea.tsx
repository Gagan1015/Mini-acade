'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent, TouchEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import type {
  ChatMessage,
  DrawCorrectGuessPayload,
  Player,
  SkribbleGuessResult,
  Stroke,
} from '@arcado/shared'

/* â”€â”€ Types â”€â”€ */

type SkribblePlayAreaProps = {
  currentUserId: string
  players: Player[]
  phase: 'waiting' | 'choosing' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  drawerId: string | null
  isDrawer: boolean
  word: string | null
  wordChoices: string[]
  wordHint: string | null
  wordLength: number
  strokes: Stroke[]
  correctGuessers: string[]
  roundEndsAt: string | null
  scores: Record<string, number>
  guessResult: SkribbleGuessResult | null
  messages: ChatMessage[]
  correctGuessNotification: DrawCorrectGuessPayload | null
  roundEndWord: string | null
  onSendStrokes: (strokes: Stroke[]) => void
  onClearCanvas: () => void
  onChooseWord: (word: string) => void
  onSubmitGuess: (guess: string) => void
}

/* â”€â”€ Constants â”€â”€ */

const COLORS_PALETTE = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#92400E', '#DC2626', '#1D4ED8', '#047857',
]

const BRUSH_SIZES = [3, 6, 10, 18]

/* â”€â”€ Drawing Canvas â”€â”€ */

function DrawingCanvas({
  strokes,
  isDrawer,
  onSendStrokes,
  brushColor,
  brushWidth,
  tool,
}: {
  strokes: Stroke[]
  isDrawer: boolean
  onSendStrokes: (strokes: Stroke[]) => void
  brushColor: string
  brushWidth: number
  tool: 'brush' | 'eraser'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([])
  const lastStrokeCountRef = useRef(0)

  // Render all strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue

      ctx.beginPath()
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#1a1a2e' : stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }

    ctx.globalCompositeOperation = 'source-over'
    lastStrokeCountRef.current = strokes.length
  }, [strokes])

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawer) return
      e.preventDefault()
      isDrawingRef.current = true
      const point = getCanvasPoint(e)
      if (point) {
        currentStrokeRef.current = [point]
      }
    },
    [isDrawer, getCanvasPoint]
  )

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawer || !isDrawingRef.current) return
      e.preventDefault()
      const point = getCanvasPoint(e)
      if (!point) return

      currentStrokeRef.current.push(point)

      // Draw the current stroke in real-time
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const points = currentStrokeRef.current
      if (points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = tool === 'eraser' ? '#1a1a2e' : brushColor
      ctx.lineWidth = brushWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      const prevPoint = points[points.length - 2]
      const currPoint = points[points.length - 1]
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(currPoint.x, currPoint.y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    },
    [isDrawer, getCanvasPoint, brushColor, brushWidth, tool]
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawer || !isDrawingRef.current) return
    isDrawingRef.current = false

    if (currentStrokeRef.current.length >= 2) {
      const newStroke: Stroke = {
        points: currentStrokeRef.current,
        color: brushColor,
        width: brushWidth,
        tool,
      }
      onSendStrokes([newStroke])
    }
    currentStrokeRef.current = []
  }, [isDrawer, brushColor, brushWidth, tool, onSendStrokes])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '4 / 3',
        background: '#1a1a2e',
        borderRadius: '16px',
        border: '2px solid rgba(255,255,255,0.08)',
        cursor: isDrawer ? 'crosshair' : 'default',
        touchAction: 'none',
      }}
    />
  )
}

/* â”€â”€ Timer â”€â”€ */

function RoundTimer({ roundEndsAt }: { roundEndsAt: string | null }) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!roundEndsAt) {
      setSecondsLeft(0)
      return
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(roundEndsAt).getTime() - Date.now()) / 1000)
      )
      setSecondsLeft(remaining)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [roundEndsAt])

  const isLow = secondsLeft <= 15
  const color = isLow ? '#EF4444' : '#22C55E'

  return (
    <motion.div
      animate={isLow ? { scale: [1, 1.05, 1] } : {}}
      transition={isLow ? { repeat: Infinity, duration: 1 } : {}}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '12px',
        border: `1px solid ${color}33`,
        background: `${color}10`,
      }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color,
          minWidth: '32px',
          textAlign: 'center',
        }}
      >
        {secondsLeft}s
      </span>
    </motion.div>
  )
}

/* â”€â”€ SVG Icons â”€â”€ */

function IconBrush({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  )
}

function IconEraser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  )
}

function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function IconSend({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

/* â”€â”€ Main Component â”€â”€ */

export function SkribblePlayArea({
  currentUserId,
  players,
  phase,
  currentRound,
  totalRounds,
  drawerId,
  isDrawer,
  word,
  wordChoices,
  wordHint,
  wordLength,
  strokes,
  correctGuessers,
  roundEndsAt,
  scores,
  guessResult,
  messages,
  correctGuessNotification,
  roundEndWord,
  onSendStrokes,
  onClearCanvas,
  onChooseWord,
  onSubmitGuess,
}: SkribblePlayAreaProps) {
  const [guessInput, setGuessInput] = useState('')
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushWidth, setBrushWidth] = useState(6)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [localMessages, setLocalMessages] = useState<
    Array<{ id: string; text: string; type: 'guess' | 'correct' | 'close' | 'system' }>
  >([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasGuessedCorrectly = correctGuessers.includes(currentUserId)

  const drawerPlayer = players.find((p) => p.id === drawerId)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  // Handle incoming guess results
  useEffect(() => {
    if (!guessResult) return

    if (guessResult.isCorrect) {
      setLocalMessages((prev) => [
        ...prev,
        { id: `correct-${Date.now()}`, text: 'You guessed correctly! ðŸŽ‰', type: 'correct' },
      ])
    } else if (guessResult.isClose) {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `close-${Date.now()}`,
          text: `"${guessResult.guess}" is close!`,
          type: 'close',
        },
      ])
    }
  }, [guessResult])

  // Handle correct guess notifications from other players
  useEffect(() => {
    if (!correctGuessNotification) return
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `notify-${Date.now()}`,
        text: `${correctGuessNotification.playerName} guessed correctly! (#${correctGuessNotification.position ?? '?'})`,
        type: 'system',
      },
    ])
  }, [correctGuessNotification])

  // Handle incoming chat messages
  useEffect(() => {
    if (messages.length === 0) return
    const latest = messages[messages.length - 1]
    setLocalMessages((prev) => {
      if (prev.some((m) => m.id === latest.id)) return prev
      return [
        ...prev,
        {
          id: latest.id,
          text: `${latest.playerName}: ${latest.message}`,
          type: 'guess' as const,
        },
      ]
    })
  }, [messages])

  // Reset chat on new round
  useEffect(() => {
    setLocalMessages([])
    setGuessInput('')
  }, [currentRound])

  function handleSubmitGuess(e: FormEvent) {
    e.preventDefault()
    const trimmed = guessInput.trim()
    if (!trimmed) return

    setLocalMessages((prev) => [
      ...prev,
      { id: `mine-${Date.now()}`, text: `You: ${trimmed}`, type: 'guess' },
    ])
    onSubmitGuess(trimmed)
    setGuessInput('')
  }

  /* â”€â”€ Word display â”€â”€ */
  const wordDisplay =
    phase === 'choosing'
      ? isDrawer
        ? 'Choose a word'
        : 'Waiting for word'
      : isDrawer && word
        ? word.toUpperCase()
        : wordHint
          ? wordHint
          : wordLength > 0
            ? Array(wordLength).fill('_').join(' ')
            : ''

  /* â”€â”€ Sorted players by score â”€â”€ */
  const sortedPlayers = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* â”€â”€ Header bar â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Round info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--text-tertiary)',
            }}
          >
            Round {currentRound} / {totalRounds}
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isDrawer ? 'rgba(236,72,153,0.12)' : 'rgba(59,130,246,0.12)',
              color: isDrawer ? '#EC4899' : '#3B82F6',
              border: `1px solid ${isDrawer ? 'rgba(236,72,153,0.2)' : 'rgba(59,130,246,0.2)'}`,
            }}
          >
            {phase === 'choosing'
              ? isDrawer
                ? 'Pick your word'
                : `${drawerPlayer?.name ?? 'Someone'} is choosing`
              : isDrawer
                ? 'ðŸŽ¨ You are drawing!'
                : `ðŸ–Œï¸ ${drawerPlayer?.name ?? 'Someone'} is drawing`}
          </span>
        </div>

        {/* Timer */}
        {phase === 'playing' && <RoundTimer roundEndsAt={roundEndsAt} />}
      </motion.div>

      {/* â”€â”€ Word choice â”€â”€ */}
      {phase === 'choosing' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '18px',
            borderRadius: '14px',
            background: isDrawer ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.03)',
            border: isDrawer ? '1px solid rgba(236,72,153,0.22)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {isDrawer ? (
            <>
              <p
                style={{
                  marginBottom: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#EC4899',
                }}
              >
                Choose a word to draw
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {wordChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => onChooseWord(choice)}
                    style={{
                      flex: '1 1 140px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(236,72,153,0.35)',
                      background: 'rgba(236,72,153,0.14)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
              }}
            >
              {drawerPlayer?.name ?? 'The drawer'} is choosing a word.
            </p>
          )}
        </motion.div>
      )}

      {/* â”€â”€ Word display â”€â”€ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '12px 24px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: phase === 'choosing' ? '0.08em' : '0.35em',
            color: isDrawer ? '#EC4899' : 'var(--text-primary)',
          }}
        >
          {wordDisplay}
        </span>
        {phase !== 'choosing' && wordLength > 0 && (
          <span
            style={{
              marginLeft: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            ({wordLength} letters)
          </span>
        )}
      </motion.div>

      {/* â”€â”€ Main game area â”€â”€ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '16px',
          minHeight: '500px',
        }}
        className="skribble-layout"
      >
        {/* â”€â”€ Left: Canvas + Drawing tools â”€â”€ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DrawingCanvas
            strokes={strokes}
            isDrawer={isDrawer && phase === 'playing'}
            onSendStrokes={onSendStrokes}
            brushColor={brushColor}
            brushWidth={brushWidth}
            tool={tool}
          />

          {/* Drawing toolbar â€” only for drawer */}
          {isDrawer && phase === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                flexWrap: 'wrap',
              }}
            >
              {/* Color palette */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {COLORS_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setBrushColor(color); setTool('brush') }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: brushColor === color && tool === 'brush'
                        ? '2px solid #EC4899'
                        : '2px solid rgba(255,255,255,0.15)',
                      background: color,
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                    }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>

              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

              {/* Brush sizes */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushWidth(size)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: brushWidth === size
                        ? '2px solid #EC4899'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: brushWidth === size
                        ? 'rgba(236,72,153,0.1)'
                        : 'transparent',
                      cursor: 'pointer',
                    }}
                    aria-label={`Brush size ${size}`}
                  >
                    <div
                      style={{
                        width: Math.min(size, 16),
                        height: Math.min(size, 16),
                        borderRadius: '50%',
                        background: 'var(--text-primary)',
                      }}
                    />
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

              {/* Tools */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setTool('brush')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: tool === 'brush'
                      ? '2px solid #EC4899'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: tool === 'brush'
                      ? 'rgba(236,72,153,0.1)'
                      : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <IconBrush size={14} /> Brush
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: tool === 'eraser'
                      ? '2px solid #EC4899'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: tool === 'eraser'
                      ? 'rgba(236,72,153,0.1)'
                      : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <IconEraser size={14} /> Eraser
                </button>
                <button
                  onClick={onClearCanvas}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <IconTrash size={14} /> Clear
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* â”€â”€ Right sidebar: Chat + Players â”€â”€ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Player scores */}
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--text-tertiary)',
                marginBottom: '8px',
              }}
            >
              Players
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sortedPlayers.map((player, idx) => {
                const isCurrentDrawer = player.id === drawerId
                const hasGuessed = correctGuessers.includes(player.id)
                return (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: isCurrentDrawer
                        ? 'rgba(236,72,153,0.08)'
                        : hasGuessed
                          ? 'rgba(34,197,94,0.08)'
                          : 'transparent',
                      border: isCurrentDrawer
                        ? '1px solid rgba(236,72,153,0.15)'
                        : hasGuessed
                          ? '1px solid rgba(34,197,94,0.15)'
                          : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                          minWidth: '16px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {player.name}
                        {player.id === currentUserId ? ' (You)' : ''}
                      </span>
                      {isCurrentDrawer && (
                        <span style={{ fontSize: '0.65rem' }}>{'\u{1F3A8}'}</span>
                      )}
                      {hasGuessed && (
                        <span style={{ fontSize: '0.65rem', color: '#22C55E' }}>{'\u2713'}</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: '#22C55E',
                      }}
                    >
                      {scores[player.id] ?? 0}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chat / Guess area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              minHeight: '300px',
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'var(--text-tertiary)',
                }}
              >
                {isDrawer ? 'Chat' : 'Guess the word'}
              </h3>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <AnimatePresence>
                {localMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      color:
                        msg.type === 'correct'
                          ? '#22C55E'
                          : msg.type === 'close'
                            ? '#EAB308'
                            : msg.type === 'system'
                              ? '#3B82F6'
                              : 'var(--text-secondary)',
                      background:
                        msg.type === 'correct'
                          ? 'rgba(34,197,94,0.08)'
                          : msg.type === 'close'
                            ? 'rgba(234,179,8,0.08)'
                            : msg.type === 'system'
                              ? 'rgba(59,130,246,0.08)'
                              : 'transparent',
                      fontWeight: msg.type === 'guess' ? 400 : 600,
                    }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Guess input â€” only for guessers who haven't guessed correctly */}
            {!isDrawer && phase === 'playing' && !hasGuessedCorrectly && (
              <form
                onSubmit={handleSubmitGuess}
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 12px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Type your guess..."
                  maxLength={100}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#EC4899',
                    color: '#fff',
                    cursor: guessInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: guessInput.trim() ? 1 : 0.5,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <IconSend size={16} />
                </button>
              </form>
            )}

            {/* Correct guess message */}
            {hasGuessedCorrectly && (
              <div
                style={{
                  padding: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#22C55E',
                }}
              >
                {'\u2713'} You guessed correctly! Waiting for others...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Round end overlay â”€â”€ */}
      <AnimatePresence>
        {phase === 'roundEnd' && roundEndWord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(236,72,153,0.2)',
              background: 'rgba(236,72,153,0.06)',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#EC4899',
                marginBottom: '8px',
              }}
            >
              Round Over
            </p>
            <p
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.15em',
                color: 'var(--text-primary)',
              }}
            >
              The word was: <span style={{ color: '#EC4899' }}>{roundEndWord.toUpperCase()}</span>
            </p>
            <p
              style={{
                marginTop: '8px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Next round starting soon...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'gameEnd' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(34,197,94,0.22)',
              background: 'rgba(34,197,94,0.06)',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#22C55E',
                marginBottom: '8px',
              }}
            >
              Game Over
            </p>
            <p
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Final scores are in. The host can start a new game.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive style for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .skribble-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
