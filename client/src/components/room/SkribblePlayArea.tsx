'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
        borderRadius: '18px',
        border: '2px solid rgba(236,72,153,0.12)',
        boxShadow: '0 0 40px -12px rgba(236,72,153,0.08), 0 8px 32px -8px rgba(0,0,0,0.4)',
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

function IconPalette({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill={color} />
      <circle cx="17.5" cy="10.5" r=".5" fill={color} />
      <circle cx="8.5" cy="7.5" r=".5" fill={color} />
      <circle cx="6.5" cy="12.5" r=".5" fill={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function IconCheckCircle({ size = 16, color = '#22C55E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconSparkles({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  )
}

function IconTrophy({ size = 16, color = '#22C55E' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function IconMedal({ size = 16, rank }: { size?: number; rank: number }) {
  const color = rank === 1 ? '#EAB308' : rank === 2 ? '#94A3B8' : rank === 3 ? '#CD7F32' : '#64748B'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" fill={`${color}22`} />
      <path d="M12 18v-2h-.5" />
    </svg>
  )
}


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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const hasGuessedCorrectly = correctGuessers.includes(currentUserId)

  const drawerPlayer = players.find((p) => p.id === drawerId)

  // Track whether the user has scrolled near the bottom of chat
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current
    if (!container) return
    const threshold = 80
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  // Smart scroll: only auto-scroll when user is near the bottom
  useLayoutEffect(() => {
    if (!isNearBottomRef.current) return
    const el = chatEndRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [localMessages])

  // Handle incoming guess results
  useEffect(() => {
    if (!guessResult) return

    if (guessResult.isCorrect) {
      setLocalMessages((prev) => [
        ...prev,
        { id: `correct-${Date.now()}`, text: 'You guessed correctly!', type: 'correct' },
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

  // Reset chat on new round — snap scroll to top (no smooth animation)
  useEffect(() => {
    setLocalMessages([])
    setGuessInput('')
    // Reset scroll position instantly on round change to avoid leftover scroll
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0
    }
    isNearBottomRef.current = true
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
      {/* ── Header bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Round info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '10px',
              background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)',
            }}>
              <IconPalette size={14} color="var(--game-skribble)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--game-skribble)' }}>
                {currentRound}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>/</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {totalRounds}
              </span>
            </div>
            <span
              style={{
                padding: '5px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                background: isDrawer ? 'rgba(236,72,153,0.1)' : 'rgba(59,130,246,0.1)',
                color: isDrawer ? 'var(--game-skribble)' : 'var(--primary-500)',
                border: `1px solid ${isDrawer ? 'rgba(236,72,153,0.18)' : 'rgba(59,130,246,0.18)'}`,
              }}
            >
              {phase === 'choosing'
                ? isDrawer ? 'Pick your word' : `${drawerPlayer?.name ?? 'Someone'} is choosing`
                : isDrawer ? 'You are drawing!' : `${drawerPlayer?.name ?? 'Someone'} is drawing`}
            </span>
          </div>
          {/* Timer */}
          {phase === 'playing' && <RoundTimer roundEndsAt={roundEndsAt} />}
        </div>
        {/* Progress bar */}
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, var(--game-skribble), #a855f7)' }}
          />
        </div>
      </motion.div>

      {/* ── Word choice ── */}
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
                  color: 'var(--game-skribble)',
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

      {/* ── Word display ── */}
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
            color: isDrawer ? 'var(--game-skribble)' : 'var(--text-primary)',
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

      {/* ── Main game area ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '16px',
          minHeight: '500px',
        }}
        className="skribble-layout"
      >
        {/* ── Left: Canvas + Drawing tools ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DrawingCanvas
            strokes={strokes}
            isDrawer={isDrawer && phase === 'playing'}
            onSendStrokes={onSendStrokes}
            brushColor={brushColor}
            brushWidth={brushWidth}
            tool={tool}
          />

          {/* Drawing toolbar — only for drawer */}
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
                        ? '2px solid var(--game-skribble)'
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
                        ? '2px solid var(--game-skribble)'
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
                      ? '2px solid var(--game-skribble)'
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
                      ? '2px solid var(--game-skribble)'
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
                    color: 'var(--error-500)',
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

        {/* ── Right sidebar: Chat + Players ── */}
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
                        <IconPalette size={12} color="var(--game-skribble)" />
                      )}
                      {hasGuessed && (
                        <IconCheckCircle size={12} />
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
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowAnchor: 'none',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                scrollBehavior: 'auto',
              }}
            >
              <AnimatePresence>
                {localMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontSize: '0.8rem',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color:
                        msg.type === 'correct'
                          ? '#22C55E'
                          : msg.type === 'close'
                            ? '#EAB308'
                            : msg.type === 'system'
                              ? 'var(--primary-500)'
                              : 'var(--text-secondary)',
                      background:
                        msg.type === 'correct'
                          ? 'rgba(34,197,94,0.08)'
                          : msg.type === 'close'
                            ? 'rgba(234,179,8,0.08)'
                            : msg.type === 'system'
                              ? 'rgba(59,130,246,0.08)'
                              : 'transparent',
                      border:
                        msg.type === 'correct'
                          ? '1px solid rgba(34,197,94,0.15)'
                          : msg.type === 'close'
                            ? '1px solid rgba(234,179,8,0.12)'
                            : msg.type === 'system'
                              ? '1px solid rgba(59,130,246,0.12)'
                              : '1px solid transparent',
                      fontWeight: msg.type === 'guess' ? 400 : 600,
                    }}
                  >
                    {msg.type === 'correct' && <IconCheckCircle size={13} />}
                    {msg.type === 'close' && (
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                    )}
                    {msg.type === 'system' && <IconSparkles size={13} color="var(--primary-500)" />}
                    <span>{msg.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Guess input — only for guessers who haven't guessed correctly */}
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
                    background: 'var(--game-skribble)',
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconCheckCircle size={15} /> You guessed correctly! Waiting for others...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Round end overlay ── */}
      <AnimatePresence>
        {phase === 'roundEnd' && roundEndWord && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              padding: '28px 24px',
              borderRadius: '20px',
              border: '1px solid rgba(236,72,153,0.2)',
              background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.04))',
              textAlign: 'center',
              marginTop: '8px',
              boxShadow: '0 8px 32px -8px rgba(236,72,153,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
              <IconSparkles size={14} color="var(--game-skribble)" />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--game-skribble)' }}>Round Over</span>
            </div>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', color: 'var(--text-primary)' }}>
              The word was: <span style={{ color: 'var(--game-skribble)' }}>{roundEndWord.toUpperCase()}</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
              {sortedPlayers.slice(0, 3).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <IconMedal size={14} rank={i + 1} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#22C55E' }}>{scores[p.id] ?? 0}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Round {currentRound}/{totalRounds} {'\u00B7'} Next round starting soon{'\u2026'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'gameEnd' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              padding: '32px 24px',
              borderRadius: '20px',
              border: '1px solid rgba(34,197,94,0.22)',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(59,130,246,0.04))',
              textAlign: 'center',
              marginTop: '8px',
              boxShadow: '0 8px 32px -8px rgba(34,197,94,0.12)',
            }}
          >
            <div style={{ marginBottom: '4px' }}><IconTrophy size={28} /></div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#22C55E', marginBottom: '14px' }}>
              Game Over
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {sortedPlayers.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: '10px', background: i === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {i < 3 ? <IconMedal size={16} rank={i + 1} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: '16px', textAlign: 'center' }}>#{i + 1}</span>}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}{p.id === currentUserId ? ' (You)' : ''}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: i === 0 ? '#22C55E' : 'var(--text-secondary)' }}>{scores[p.id] ?? 0} pts</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>The host can start a new game.</p>
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
