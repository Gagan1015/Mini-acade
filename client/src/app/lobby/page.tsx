'use client'

import { Suspense, useState, useEffect, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'motion/react'
import { GAMES, ROOM_CONFIG, type GameId } from '@mini-arcade/shared'
import { AppLayout } from '@/components/layout/AppLayout'
import { GAME_LIST, getGameInfo } from '@/lib/games'
import { Spinner } from '@/components/ui/Animated'
import { GameIcon } from '@/components/ui/GameIcons'

/* ── SVG Icons ── */

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconLogIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

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

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconAlertCircle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}

function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

type TabType = 'create' | 'join'
type PlayMode = 'solo' | 'multiplayer'

function LobbyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [activeTab, setActiveTab] = useState<TabType>('create')
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null)
  const [playMode, setPlayMode] = useState<PlayMode>('multiplayer')
  const [maxPlayers, setMaxPlayers] = useState('8')
  const [joinCode, setJoinCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-select game from URL
  useEffect(() => {
    const gameParam = searchParams.get('game') as GameId | null
    if (gameParam && GAME_LIST.some((g) => g.id === gameParam)) {
      setSelectedGame(gameParam)
      const game = GAMES[gameParam]
      if (game) {
        setMaxPlayers(String(game.maxPlayers))
        setPlayMode(game.minPlayers <= 1 ? 'multiplayer' : 'multiplayer')
      }
    }
  }, [searchParams])

  const selectedGameData = selectedGame ? getGameInfo(selectedGame) : null
  const supportsSolo = selectedGameData ? selectedGameData.minPlayers <= 1 : false

  const handleCreateRoom = async () => {
    if (!selectedGame) {
      setError('Please select a game')
      return
    }

    if (playMode === 'solo') {
      router.push(`/play/${selectedGame}?session=${Date.now()}`)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: selectedGame, maxPlayers: Number(maxPlayers) }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success || !payload.data) {
        setError(payload.error?.message ?? 'Unable to create room right now.')
        return
      }
      router.push(`/rooms/${payload.data.roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault()
    const normalizedCode = joinCode.trim().toUpperCase()
    if (normalizedCode.length !== ROOM_CONFIG.codeLength) {
      setError('Enter a valid 6-character room code.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rooms/${normalizedCode}/validate`)
      const payload = await res.json()
      if (!payload.valid) {
        setError(payload.reason ?? 'That room cannot be joined right now.')
        return
      }
      router.push(`/rooms/${normalizedCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to validate room code.')
    } finally {
      setIsLoading(false)
    }
  }

  function getPlayerLabel(game: { minPlayers: number; maxPlayers: number }) {
    if (game.minPlayers <= 1 && game.maxPlayers === 1) return 'Solo only'
    if (game.minPlayers <= 1) return `Solo or 2–${game.maxPlayers} players`
    return `${game.minPlayers}–${game.maxPlayers} players`
  }

  /* ── Loading state ── */
  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size={32} color="var(--primary-500)" />
        </div>
      </AppLayout>
    )
  }

  /* ── Unauthenticated state ── */
  if (status === 'unauthenticated') {
    return (
      <AppLayout>
        <div className="mx-auto max-w-md px-6 py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-500)]/10">
              <IconLogIn size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Sign In Required</h1>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              You need to sign in to create or join game rooms.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => signIn()}
              className="btn btn-primary btn-lg mt-10"
            >
              <IconLogIn size={18} />
              Sign In
            </motion.button>
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  /* ── Main lobby ── */
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Game Lobby
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Create a new room or join an existing one with a code
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-10 flex rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/40 p-1">
            {([
              { key: 'create' as TabType, label: 'Create Room', icon: <IconPlus size={15} /> },
              { key: 'join' as TabType, label: 'Join Room', icon: <IconLogIn size={15} /> },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setError(null) }}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="lobbyTab"
                    className="absolute inset-0 rounded-lg bg-[var(--primary-500)]/8 border border-[var(--primary-500)]/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-8 flex items-center gap-3 rounded-xl border border-[var(--error-500)]/20 bg-[var(--error-500)]/5 px-4 py-3"
              >
                <IconAlertCircle size={18} />
                <p className="text-sm text-[var(--error-500)]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Game selector */}
                <div>
                  <label className="mb-4 block text-sm font-medium text-[var(--text-secondary)]">
                    Select a Game
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {GAME_LIST.map((game) => {
                      const isSelected = selectedGame === game.id
                      return (
                        <motion.button
                          key={game.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedGame(game.id)
                            const gd = GAMES[game.id]
                            setMaxPlayers(String(gd.maxPlayers))
                            if (gd.minPlayers <= 1) {
                              setPlayMode('multiplayer')
                            } else {
                              setPlayMode('multiplayer')
                            }
                            setError(null)
                          }}
                          className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--primary-500)]/60 bg-[var(--primary-500)]/5'
                              : 'border-[var(--border)]/50 bg-[var(--surface)]/30 hover:border-[var(--border-strong)]/60 hover:bg-[var(--surface)]/50'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-500)]"
                            >
                              <IconCheck size={11} />
                            </motion.div>
                          )}
                          <div className="mb-3">
                            <GameIcon gameId={game.id} size={28} animated />
                          </div>
                          <div className="font-semibold text-[var(--text-primary)]">{game.name}</div>
                          <div className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                            {getPlayerLabel(game)}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Room configuration */}
                <AnimatePresence>
                  {selectedGame && selectedGameData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)]/60 to-transparent" />

                      {/* Game info header */}
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${selectedGameData.colorHex}10` }}
                        >
                          <GameIcon gameId={selectedGameData.id} size={32} animated />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {selectedGameData.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                            {selectedGameData.description}
                          </p>
                        </div>
                      </div>

                      {/* Feature tags */}
                      <div className="flex flex-wrap gap-2">
                        {selectedGameData.features.map((feat) => (
                          <span
                            key={feat}
                            className="rounded-md bg-[var(--primary-500)]/8 px-2.5 py-1 text-[11px] font-medium text-[var(--primary-400)]"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>

                      {/* Play mode toggle (only for singleplayer-capable games) */}
                      {supportsSolo && (
                        <div>
                          <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">
                            Play Mode
                          </label>
                          <div className="flex rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/30 p-1">
                            {([
                              { key: 'solo' as PlayMode, label: 'Singleplayer', icon: <IconUser size={15} /> },
                              { key: 'multiplayer' as PlayMode, label: 'Multiplayer', icon: <IconUsers size={15} /> },
                            ]).map((mode) => (
                              <button
                                key={mode.key}
                                onClick={() => {
                                  setPlayMode(mode.key)
                                  if (mode.key === 'solo') {
                                    setMaxPlayers('1')
                                  } else {
                                    setMaxPlayers(String(selectedGameData.maxPlayers))
                                  }
                                }}
                                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                  playMode === mode.key
                                    ? 'text-[var(--text-primary)]'
                                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                              >
                                {playMode === mode.key && (
                                  <motion.div
                                    layoutId="playModeTab"
                                    className="absolute inset-0 rounded-lg bg-[var(--primary-500)]/8 border border-[var(--primary-500)]/15"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                  />
                                )}
                                <span className="relative flex items-center gap-2">
                                  {mode.icon}
                                  {mode.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Max players input (only in multiplayer mode) */}
                      {playMode === 'multiplayer' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <label className="block">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              Max players
                            </span>
                            <input
                              type="number"
                              min={Math.max(2, selectedGameData.minPlayers)}
                              max={selectedGameData.maxPlayers}
                              value={maxPlayers}
                              onChange={(e) => setMaxPlayers(e.target.value)}
                              className="input mt-2"
                            />
                            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                              Between {Math.max(2, selectedGameData.minPlayers)} and {selectedGameData.maxPlayers} players
                            </p>
                          </label>
                        </motion.div>
                      )}

                      {/* Solo mode info */}
                      {playMode === 'solo' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 rounded-xl border border-[var(--primary-500)]/12 bg-[var(--primary-500)]/4 px-4 py-3"
                        >
                          <IconUser size={18} />
                          <p className="text-sm text-[var(--text-secondary)]">
                            You&apos;ll play solo — practice your skills or go for a high score!
                          </p>
                        </motion.div>
                      )}

                      {/* Create button */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => void handleCreateRoom()}
                        disabled={isLoading}
                        className="btn btn-primary w-full py-3.5"
                      >
                        {isLoading ? (
                          <>
                            <IconLoader size={18} />
                            Creating…
                          </>
                        ) : (
                          <>
                            <IconSparkle size={18} />
                            {playMode === 'solo'
                              ? `Play ${selectedGameData.name} Solo`
                              : `Create ${selectedGameData.name} Room`}
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Join with Room Code
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                      Enter the 6-character room code shared by your friend.
                    </p>
                  </div>

                  <form onSubmit={(e) => void handleJoinRoom(e)} className="space-y-5">
                    <div>
                      <label htmlFor="join-code" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                        Room Code
                      </label>
                      <input
                        id="join-code"
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={6}
                        className="input text-center font-mono text-2xl tracking-[0.5em] placeholder:text-base placeholder:tracking-normal"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || joinCode.length < 6}
                      className="btn btn-primary w-full py-3.5"
                    >
                      {isLoading ? (
                        <>
                          <IconLoader size={18} />
                          Joining…
                        </>
                      ) : (
                        <>
                          <IconLogIn size={18} />
                          Join Room
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  )
}

function LobbyPageFallback() {
  return (
    <AppLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} color="var(--primary-500)" />
      </div>
    </AppLayout>
  )
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyPageFallback />}>
      <LobbyPageContent />
    </Suspense>
  )
}
