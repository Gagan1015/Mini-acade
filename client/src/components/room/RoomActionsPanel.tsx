'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  GAMES,
  ROOM_CONFIG,
  triviaCategories,
  type GameId,
  type TriviaCategory,
  type TriviaDifficulty,
} from '@mini-arcade/shared'
import { GAME_LIST, getGameInfo } from '@/lib/games'
import { GameIcon } from '@/components/ui/GameIcons'

/* ── SVG Icons ── */

function IconLoader({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconSparkle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  )
}

function IconLogIn({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

function IconCheck({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const defaultGameId: GameId = 'wordel'
const triviaDifficultyOptions: Array<{ value: TriviaDifficulty; label: string }> = [
  { value: 'easy', label: 'Chill' },
  { value: 'medium', label: 'Classic' },
  { value: 'hard', label: 'Expert' },
]

export function RoomActionsPanel() {
  const router = useRouter()
  const [gameId, setGameId] = useState<GameId>(defaultGameId)
  const [maxPlayers, setMaxPlayers] = useState(String(GAMES[defaultGameId].maxPlayers))
  const [triviaRounds, setTriviaRounds] = useState('10')
  const [triviaCategory, setTriviaCategory] = useState<TriviaCategory>('Mixed')
  const [triviaDifficulty, setTriviaDifficulty] = useState<TriviaDifficulty>('medium')
  const [joinCode, setJoinCode] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const selectedGame = useMemo(() => GAMES[gameId], [gameId])
  const selectedGameInfo = useMemo(() => getGameInfo(gameId), [gameId])

  async function handleCreateRoom() {
    try {
      if (GAMES[gameId].minPlayers <= 1 && Number(maxPlayers) === 1) {
        router.push(`/play/${gameId}?session=${Date.now()}`)
        return
      }

      setIsCreating(true)
      setCreateError(null)
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          maxPlayers: Number(maxPlayers),
          settings:
            gameId === 'trivia'
              ? {
                  rounds: Number(triviaRounds),
                  triviaCategory,
                  triviaDifficulty,
                }
              : undefined,
        }),
      })
      const payload = await response.json() as {
        success: boolean
        data?: { roomCode: string }
        error?: { message: string }
      }
      if (!response.ok || !payload.success || !payload.data) {
        setCreateError(payload.error?.message ?? 'Unable to create room right now.')
        return
      }
      router.push(`/rooms/${payload.data.roomCode}`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create room.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setIsJoining(true)
      setJoinError(null)
      const normalizedCode = joinCode.trim().toUpperCase()
      if (normalizedCode.length !== ROOM_CONFIG.codeLength) {
        setJoinError('Enter a valid 6-character room code.')
        return
      }
      const response = await fetch(`/api/rooms/${normalizedCode}/validate`)
      const payload = await response.json() as { valid: boolean; reason?: string }
      if (!payload.valid) {
        setJoinError(payload.reason ?? 'That room cannot be joined right now.')
        return
      }
      router.push(`/rooms/${normalizedCode}`)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Unable to validate that room code.')
    } finally {
      setIsJoining(false)
    }
  }

  // suppress unused var warning
  void selectedGameInfo

  return (
    <div className="mb-10 grid gap-8 lg:grid-cols-2">
      {/* Create Room */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--primary-400)]">
          Create Room
        </p>
        <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Start a private lobby
        </h2>
        <p className="mb-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          Pick a game, set a player cap, and get a shareable room code.
        </p>

        {/* Game select */}
        <label className="mb-5 block">
          <span className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">Game</span>
          <div className="grid grid-cols-2 gap-2">
            {GAME_LIST.map((game) => {
              const isSelected = gameId === game.id
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setGameId(game.id)
                    setMaxPlayers(String(GAMES[game.id].maxPlayers))
                  }}
                  className={`relative flex items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--primary-500)]/60 bg-[var(--primary-500)]/5'
                      : 'border-[var(--border)]/50 bg-[var(--surface)]/30 hover:border-[var(--border-strong)]/60'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary-500)]"
                    >
                      <IconCheck />
                    </motion.span>
                  )}
                  <GameIcon gameId={game.id} size={22} />
                  <span className="font-medium text-[var(--text-primary)]">{game.name}</span>
                </button>
              )
            })}
          </div>
        </label>

        {gameId === 'trivia' && (
          <div className="mb-5 space-y-4 rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/30 p-4">
            <div>
              <span className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">Category</span>
              <div className="flex flex-wrap gap-2">
                {triviaCategories.map((category) => {
                  const isSelected = triviaCategory === category
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setTriviaCategory(category)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-[var(--game-trivia)]/50 bg-[var(--game-trivia)]/10 text-[var(--game-trivia)]'
                          : 'border-[var(--border)] bg-[var(--surface)]/40 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">Difficulty</span>
              <div className="grid grid-cols-3 gap-2">
                {triviaDifficultyOptions.map((option) => {
                  const isSelected = triviaDifficulty === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTriviaDifficulty(option.value)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'border-[var(--game-trivia)]/50 bg-[var(--game-trivia)]/10 text-[var(--game-trivia)]'
                          : 'border-[var(--border)] bg-[var(--surface)]/40 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Questions</span>
              <input
                type="number"
                min={3}
                max={20}
                value={triviaRounds}
                onChange={(event) => setTriviaRounds(event.target.value)}
                className="input"
              />
              <span className="mt-1.5 block text-xs text-[var(--text-tertiary)]">
                Scores are out of {Math.max(1, Number(triviaRounds) || 10) * 1000} points.
              </span>
            </label>
          </div>
        )}

        {/* Max players */}
        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Max players</span>
          <input
            type="number"
            min={selectedGame.minPlayers}
            max={selectedGame.maxPlayers}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            className="input"
          />
        </label>

        {createError && (
          <p className="mb-4 text-sm text-[var(--error-500)]">{createError}</p>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void handleCreateRoom()}
          disabled={isCreating}
          className="btn btn-primary w-full py-3"
        >
          {isCreating ? (
            <><IconLoader /> Creating room…</>
          ) : (
            <><IconSparkle /> Create {selectedGame.name} room</>
          )}
        </motion.button>
      </motion.section>

      {/* Join Room */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--primary-400)]">
          Join Room
        </p>
        <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Reconnect with the group
        </h2>
        <p className="mb-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          Paste the room code a friend sent you and hop straight into the game.
        </p>

        <form onSubmit={handleJoinRoom}>
          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Room code</span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={ROOM_CONFIG.codeLength}
              placeholder="ABC123"
              className="input text-center font-mono text-xl tracking-[0.3em] uppercase placeholder:text-sm placeholder:tracking-normal"
            />
          </label>

          {joinError && (
            <p className="mb-4 text-sm text-[var(--error-500)]">{joinError}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isJoining}
            className="btn btn-secondary w-full py-3"
          >
            {isJoining ? (
              <><IconLoader /> Checking room…</>
            ) : (
              <><IconLogIn /> Join by code</>
            )}
          </motion.button>
        </form>
      </motion.section>
    </div>
  )
}
