'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GAMES, type Room } from '@mini-arcade/shared'
import { FlagelPlayArea } from '@/components/room/FlagelPlayArea'
import { TriviaPlayArea } from '@/components/room/TriviaPlayArea'
import { WordelPlayArea } from './WordelPlayArea'
import { useRoom } from '@/hooks/useRoom'
import { getGameInfo } from '@/lib/games'
import { LiveIndicator } from '@/components/ui/Animated'
import { AppLayout } from '@/components/layout/AppLayout'
import { GameIcon } from '@/components/ui/GameIcons'
import { Toast } from '@/components/ui/Toast'

/* ── SVG Icons ── */

function IconCopy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconCrown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.5 18.5l2-10 5 4 2.5-6 2.5 6 5-4 2 10z" />
    </svg>
  )
}

function IconHome({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconLogOut({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconPlay({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function IconUserX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <line x1="17" y1="8" x2="23" y2="14" />
      <line x1="23" y1="8" x2="17" y2="14" />
    </svg>
  )
}

function IconWifiOff({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

function IconUsers({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconUser({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}

function IconZap({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

type RoomLobbyProps = {
  roomCode: string
  currentUserId: string
  initialRoom: Room
  autoStartOnJoin?: boolean
}

export function RoomLobby({
  roomCode,
  currentUserId,
  initialRoom,
  autoStartOnJoin = false,
}: RoomLobbyProps) {
  const router = useRouter()
  const [copyLabel, setCopyLabel] = useState<'copy' | 'copied'>('copy')
  const [didAutoStart, setDidAutoStart] = useState(false)
  const {
    room,
    players,
    isJoining,
    isConnected,
    isHost,
    notification,
    hasLeft,
    leave,
    startGame,
    kickPlayer,
    flagel,
    trivia,
    wordel,
    submitFlagelGuess,
    skipFlagelRound,
    submitTriviaAnswer,
    submitWordelGuess,
    dismissNotification,
  } = useRoom({
    roomCode,
    currentUserId,
    initialRoom,
  })

  const activeRoom = room ?? initialRoom

  useEffect(() => {
    if (hasLeft) router.push('/')
  }, [hasLeft, router])

  useEffect(() => {
    if (!notification) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dismissNotification()
    }, 3200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dismissNotification, notification])

  useEffect(() => {
    if (!autoStartOnJoin || didAutoStart) {
      return
    }

    if (!isConnected || !isHost || activeRoom.status !== 'waiting') {
      return
    }

    startGame()
    setDidAutoStart(true)
  }, [activeRoom.status, autoStartOnJoin, didAutoStart, isConnected, isHost, startGame])
  const game = getGameInfo(activeRoom.gameId)
  const sharedGame = GAMES[activeRoom.gameId]
  const connectedPlayers = players.filter((p) => p.isConnected).length
  const isSolo = activeRoom.maxPlayers === 1

  async function handleCopyInvite() {
    const inviteUrl = `${window.location.origin}/rooms/${roomCode}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopyLabel('copied')
    setTimeout(() => setCopyLabel('copy'), 1500)
  }

  /* ── Game play areas ── */
  const GamePlayArea = () => (
    <>
      {activeRoom.gameId === 'wordel' && activeRoom.status !== 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <WordelPlayArea
            currentUserId={currentUserId}
            players={players}
            isHost={isHost}
            phase={wordel.phase}
            wordLength={wordel.wordLength}
            maxAttempts={wordel.maxAttempts}
            guesses={wordel.guesses}
            correctWord={wordel.correctWord}
            finalScores={wordel.finalScores}
            playerStatuses={wordel.playerStatuses}
            onSubmitGuess={submitWordelGuess}
            onPlayAgain={startGame}
          />
        </motion.div>
      )}

      {activeRoom.gameId === 'flagel' && activeRoom.status !== 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <FlagelPlayArea
            currentUserId={currentUserId}
            players={players}
            phase={flagel.phase}
            currentRound={flagel.currentRound}
            totalRounds={flagel.totalRounds}
            flagEmoji={flagel.flagEmoji}
            maxAttempts={flagel.maxAttempts}
            guesses={flagel.guesses}
            playerStatuses={flagel.playerStatuses}
            scores={flagel.scores}
            finalScores={flagel.finalScores}
            correctCountry={flagel.correctCountry}
            countryCode={flagel.countryCode}
            onSubmitGuess={submitFlagelGuess}
            onSkip={skipFlagelRound}
          />
        </motion.div>
      )}

      {activeRoom.gameId === 'trivia' && activeRoom.status !== 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <TriviaPlayArea
            currentUserId={currentUserId}
            players={players}
            phase={trivia.phase}
            currentRound={trivia.currentRound}
            totalRounds={trivia.totalRounds}
            timeRemaining={trivia.timeRemaining}
            question={trivia.question}
            answeredPlayers={trivia.answeredPlayers}
            selectedAnswerId={trivia.selectedAnswerId}
            answerFeedback={trivia.answerFeedback}
            roundResults={trivia.roundResults}
            scores={trivia.scores}
            finalScores={trivia.finalScores}
            onSubmitAnswer={submitTriviaAnswer}
          />
        </motion.div>
      )}
    </>
  )

  /* ═══════════════════════════════════════════════
   *  SOLO MODE UI
   * ═══════════════════════════════════════════════ */
  if (isSolo) {
    return (
      <AppLayout showFooter={false}>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Top accent line */}
            {game && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                className="mx-auto h-px w-24"
                style={{
                  background: `linear-gradient(to right, transparent, ${game.color}, transparent)`,
                }}
              />
            )}

            {/* Solo mode badge + connection */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-500)]/8 px-3 py-1.5 text-xs font-semibold text-[var(--primary-400)]">
                <IconUser size={13} />
                Solo Mode
              </span>
              <span className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}>
                {isConnected ? (
                  <>
                    <LiveIndicator />
                    <span className="ml-2">Live</span>
                  </>
                ) : (
                  <>
                    <IconWifiOff />
                    <span className="ml-1.5">Reconnecting</span>
                  </>
                )}
              </span>
            </div>

            {/* Game info */}
            <div className="flex items-center gap-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: game ? `${game.colorHex}10` : 'var(--surface-hover)' }}
              >
                <GameIcon gameId={activeRoom.gameId} size={36} animated />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {sharedGame.name}
                </h1>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {sharedGame.description}
                </p>
              </div>
            </div>

            {/* Feature tags */}
            {game && (
              <div className="flex flex-wrap gap-2">
                {game.features.map((feat) => (
                  <span
                    key={feat}
                    className="rounded-md bg-[var(--background)]/80 px-2.5 py-1 text-[11px] font-medium text-[var(--text-tertiary)]"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            )}

            {/* Solo info banner */}
            {activeRoom.status === 'waiting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 rounded-xl border border-[var(--primary-500)]/12 bg-[var(--primary-500)]/4 px-4 py-3"
              >
                <IconZap size={18} />
                <p className="text-sm text-[var(--text-secondary)]">
                  Ready to play! Hit the button below to jump right into the game.
                </p>
              </motion.div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)]/50 to-transparent" />

            {/* Actions */}
            <div className="space-y-3">
              {isHost && activeRoom.status !== 'playing' && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGame}
                  className="btn btn-primary w-full py-3.5 text-base"
                >
                  <IconPlay size={18} />
                  {activeRoom.status === 'finished' ? 'Play Again' : 'Start Playing'}
                </motion.button>
              )}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={leave}
                  className="btn btn-secondary flex-1 py-3"
                >
                  <IconArrowLeft size={15} />
                  Back to Lobby
                </motion.button>
                <Link href="/" className="btn btn-secondary flex-1 py-3 justify-center">
                  <IconHome size={15} />
                  Home
                </Link>
              </div>
            </div>
          </motion.div>

          <GamePlayArea />

          <AnimatePresence>
            {notification && (
              <Toast
                message={notification.message}
                type={notification.type}
                onClose={dismissNotification}
              />
            )}
          </AnimatePresence>
        </div>
      </AppLayout>
    )
  }

  /* ═══════════════════════════════════════════════
   *  MULTIPLAYER UI
   * ═══════════════════════════════════════════════ */
  return (
    <AppLayout showFooter={false}>
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {/* Room Header — open layout, no card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Top accent line */}
          {game && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="mb-8 h-px w-20"
              style={{
                background: `linear-gradient(to right, ${game.color}, transparent)`,
              }}
            />
          )}

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: game ? `${game.colorHex}10` : 'var(--surface-hover)' }}
                >
                  <GameIcon gameId={activeRoom.gameId} size={32} animated />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Private Room
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    {sharedGame.name}
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm text-[var(--text-secondary)] leading-relaxed">
                {sharedGame.description}
              </p>

              {/* Status badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                {/* Room code */}
                <span className="room-code inline-flex items-center gap-2 text-base">
                  {roomCode}
                  <button
                    onClick={() => void handleCopyInvite()}
                    className="rounded-md p-1 transition-colors hover:bg-[var(--surface-hover)]"
                    aria-label="Copy invite link"
                  >
                    {copyLabel === 'copied' ? (
                      <IconCheck size={14} />
                    ) : (
                      <IconCopy size={14} />
                    )}
                  </button>
                </span>

                {/* Status */}
                <span className={`badge ${activeRoom.status === 'playing' ? 'badge-success' : 'badge-primary'}`}>
                  {activeRoom.status === 'waiting' ? 'Waiting' : activeRoom.status === 'playing' ? 'In Game' : 'Finished'}
                </span>

                {/* Players */}
                <span className="badge badge-primary">
                  <IconUsers size={12} />
                  <span className="ml-1.5">{connectedPlayers}/{activeRoom.maxPlayers}</span>
                </span>

                {/* Connection */}
                <span className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}>
                  {isConnected ? (
                    <>
                      <LiveIndicator />
                      <span className="ml-2">Live</span>
                    </>
                  ) : (
                    <>
                      <IconWifiOff />
                      <span className="ml-1.5">Reconnecting</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void handleCopyInvite()}
                className="btn btn-primary btn-sm"
              >
                {copyLabel === 'copied' ? (
                  <><IconCheck size={14} /> Copied!</>
                ) : (
                  <><IconCopy size={14} /> Copy invite</>
                )}
              </motion.button>
              <Link href="/" className="btn btn-secondary btn-sm">
                <IconHome size={14} /> Home
              </Link>
            </div>
          </div>
        </motion.div>

        <GamePlayArea />

        {/* Divider */}
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-[var(--border)]/50 to-transparent" />

        {/* Player list + Room controls */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Players section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Players</h2>
              <span className="text-sm text-[var(--text-tertiary)]">
                {isJoining ? 'Joining room…' : `${connectedPlayers} connected`}
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)]/40 bg-[var(--surface)]/30 p-4 transition-colors hover:bg-[var(--surface)]/50"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-500)]/10 text-sm font-bold text-[var(--primary-400)]">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {player.name}
                          </span>
                          {player.id === currentUserId && (
                            <span className="badge badge-primary">You</span>
                          )}
                          {player.isHost && (
                            <span className="badge badge-warning">
                              <IconCrown size={10} />
                              <span className="ml-1">Host</span>
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                          <span>Score: {player.score}</span>
                          {!player.isConnected && (
                            <span className="flex items-center gap-1 text-[var(--warning-500)]">
                              <IconWifiOff />
                              Reconnecting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && player.id !== currentUserId && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => kickPlayer(player.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <IconUserX size={14} />
                        Kick
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.section>

          {/* Room controls */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="h-fit"
          >
            <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
              Room Controls
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[var(--text-secondary)]">
              {isHost
                ? 'You are the host. Start the game when everyone is ready.'
                : 'The host controls when the game starts. Hang tight!'}
            </p>

            <div className="space-y-3">
              {isHost && activeRoom.status !== 'playing' && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGame}
                  className="btn btn-primary w-full py-3"
                >
                  <IconPlay size={18} />
                  {activeRoom.status === 'finished' ? 'Play Again' : 'Start Game'}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={leave}
                className="btn btn-secondary w-full py-3"
              >
                <IconLogOut size={18} />
                Leave Room
              </motion.button>
            </div>
          </motion.aside>
        </div>

        <AnimatePresence>
          {notification && (
            <Toast
              message={notification.message}
              type={notification.type}
              onClose={dismissNotification}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
