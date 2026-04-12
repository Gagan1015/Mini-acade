'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CONNECTION_EVENTS,
  FLAGEL_EVENTS,
  ROOM_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
  type FlagelGameEnded,
  type FlagelGuessResult,
  type FlagelOpponentProgressPayload,
  type FlagelRoundEnded,
  type FlagelRoundStarted,
  type FlagelSyncPayload,
  type Room,
  type RoomError,
  type RoomGameStartedPayload,
  type RoomHostChangedPayload,
  type RoomPlayerKickedPayload,
  type RoomPresence,
  type TriviaAnswerResultPayload,
  type TriviaGameEnded,
  type TriviaPlayerAnsweredPayload,
  type TriviaRoundEnded,
  type TriviaRoundStarted,
  type TriviaSyncPayload,
  type TriviaTimerTickPayload,
  type WordelGameEnded,
  type WordelGuessResult,
  type WordelOpponentProgressPayload,
  type WordelRoundEnded,
  type WordelRoundStarted,
  type WordelSyncPayload,
} from '@mini-arcade/shared'

import { createSocket, type AppSocket } from '@/lib/socket'

type UseRoomOptions = {
  roomCode: string
  currentUserId: string
  initialRoom: Room
}

type RoomNotification = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

type WordelUiState = {
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  wordLength: number
  maxAttempts: number
  guesses: WordelGuessResult[]
  playerStatuses: Record<
    string,
    {
      attemptCount: number
      solved: boolean
      finished: boolean
      score: number
    }
  >
  scores: Record<string, number>
  finalScores: WordelGameEnded['finalScores']
  correctWord?: string
}

type TriviaUiState = {
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  timeRemaining: number
  question: TriviaRoundStarted['question'] | null
  answeredPlayers: string[]
  selectedAnswerId: string | null
  answerFeedback: TriviaAnswerResultPayload | null
  roundResults: TriviaRoundEnded | null
  scores: Record<string, number>
  finalScores: TriviaGameEnded['finalScores']
}

type FlagelUiState = {
  phase: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'
  currentRound: number
  totalRounds: number
  flagEmoji?: string
  flagImageUrl?: string
  maxAttempts: number
  hintsAvailable: number
  guesses: FlagelGuessResult[]
  playerStatuses: Record<
    string,
    {
      attemptCount: number
      solved: boolean
      finished: boolean
      score: number
    }
  >
  scores: Record<string, number>
  finalScores: FlagelGameEnded['finalScores']
  correctCountry?: string
  countryCode?: string
}

export function useRoom({ roomCode, currentUserId, initialRoom }: UseRoomOptions) {
  const socketRef = useRef<AppSocket | null>(null)
  const notificationIdRef = useRef(0)

  const [room, setRoom] = useState<Room | null>(initialRoom)
  const [isConnected, setIsConnected] = useState(false)
  const [isJoining, setIsJoining] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<RoomNotification | null>(null)
  const [hasLeft, setHasLeft] = useState(false)
  const [wasKicked, setWasKicked] = useState(false)
  const [wordel, setWordel] = useState<WordelUiState>({
    phase: initialRoom.status === 'playing' ? 'playing' : 'waiting',
    currentRound: 0,
    totalRounds: 1,
    wordLength: 5,
    maxAttempts: 6,
    guesses: [],
    playerStatuses: Object.fromEntries(
      initialRoom.players.map((player) => [
        player.id,
        {
          attemptCount: 0,
          solved: false,
          finished: false,
          score: player.score,
        },
      ])
    ),
    scores: Object.fromEntries(initialRoom.players.map((player) => [player.id, player.score])),
    finalScores: [],
  })
  const [trivia, setTrivia] = useState<TriviaUiState>({
    phase: initialRoom.status === 'playing' ? 'playing' : 'waiting',
    currentRound: 0,
    totalRounds: 5,
    timeRemaining: 0,
    question: null,
    answeredPlayers: [],
    selectedAnswerId: null,
    answerFeedback: null,
    roundResults: null,
    scores: Object.fromEntries(initialRoom.players.map((player) => [player.id, player.score])),
    finalScores: [],
  })
  const [flagel, setFlagel] = useState<FlagelUiState>({
    phase: initialRoom.status === 'playing' ? 'playing' : 'waiting',
    currentRound: 0,
    totalRounds: 1,
    flagEmoji: undefined,
    flagImageUrl: undefined,
    maxAttempts: 6,
    hintsAvailable: 5,
    guesses: [],
    playerStatuses: Object.fromEntries(
      initialRoom.players.map((player) => [
        player.id,
        {
          attemptCount: 0,
          solved: false,
          finished: false,
          score: player.score,
        },
      ])
    ),
    scores: Object.fromEntries(initialRoom.players.map((player) => [player.id, player.score])),
    finalScores: [],
  })

  const showNotification = useCallback(
    (message: string, type: RoomNotification['type'] = 'error') => {
      notificationIdRef.current += 1
      setNotification({
        id: notificationIdRef.current,
        message,
        type,
      })
    },
    []
  )

  const dismissNotification = useCallback(() => {
    setNotification(null)
  }, [])

  const createEmptyPlayerStatuses = useCallback(
    (playerIds: string[]) =>
      Object.fromEntries(
        playerIds.map((playerId) => [
          playerId,
          {
            attemptCount: 0,
            solved: false,
            finished: false,
            score: 0,
          },
        ])
      ),
    []
  )

  const createEmptyScores = useCallback(
    (playerIds: string[]) => Object.fromEntries(playerIds.map((playerId) => [playerId, 0])),
    []
  )

  useEffect(() => {
    const socket = createSocket()
    socketRef.current = socket

    const handleConnect = () => {
      setIsConnected(true)
      setIsJoining(true)
      setError(null)
      socket.emit(ROOM_EVENTS.JOIN, { roomCode })
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleJoined = ({ room: joinedRoom }: { room: Room; playerId: string }) => {
      setRoom(joinedRoom)
      setIsJoining(false)
      setError(null)
      setHasLeft(false)
      setWasKicked(false)
    }

    const handlePresence = (presence: RoomPresence) => {
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              hostId: presence.hostId,
              status: presence.status,
              players: presence.players,
            }
          : null
      )
    }

    const handleLeft = () => {
      setHasLeft(true)
      setRoom(null)
      setIsJoining(false)
    }

    const handleError = (payload: RoomError) => {
      console.debug('[mini-arcade][room:error]', {
        roomCode,
        userId: currentUserId,
        payload,
      })
      setError(payload.message)
      showNotification(payload.message, 'error')
      setIsJoining(false)
    }

    const handleGameStarted = (payload: RoomGameStartedPayload) => {
      console.debug('[mini-arcade][room:gameStarted]', {
        roomCode,
        userId: currentUserId,
        payload,
      })
      setError(null)
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              gameId: payload.gameId,
              status: 'playing',
            }
          : null
      )

      if (payload.gameId === 'wordel') {
        setWordel((previousState) => ({
          ...previousState,
          phase: 'playing',
          guesses: [],
          finalScores: [],
          correctWord: undefined,
          playerStatuses: createEmptyPlayerStatuses(Object.keys(previousState.playerStatuses)),
          scores: createEmptyScores(Object.keys(previousState.playerStatuses)),
        }))
      } else if (payload.gameId === 'trivia') {
        setTrivia((previousState) => ({
          ...previousState,
          phase: 'playing',
        }))
      } else if (payload.gameId === 'flagel') {
        setFlagel((previousState) => ({
          ...previousState,
          phase: 'playing',
        }))
      }
    }

    const handleHostChanged = (payload: RoomHostChangedPayload) => {
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              hostId: payload.newHostId,
              players: previousRoom.players.map((player) => ({
                ...player,
                isHost: player.id === payload.newHostId,
              })),
            }
          : null
      )
    }

    const handleKicked = (payload: RoomPlayerKickedPayload) => {
      if (payload.playerId !== currentUserId) {
        setRoom((previousRoom) =>
          previousRoom
            ? {
                ...previousRoom,
                players: previousRoom.players.filter((player) => player.id !== payload.playerId),
              }
            : null
        )
        return
      }

      setWasKicked(true)
      setHasLeft(true)
      setRoom(null)
      setError('You were removed from the room.')
      showNotification('You were removed from the room.', 'error')
    }

    const handleWordelRoundStarted = (payload: WordelRoundStarted) => {
      console.debug('[mini-arcade][wordel:roundStarted]', {
        roomCode,
        userId: currentUserId,
        payload,
      })
      setError(null)
      setWordel((previousState) => ({
        ...previousState,
        phase: 'playing',
        currentRound: payload.roundNumber,
        totalRounds: payload.totalRounds,
        wordLength: payload.wordLength ?? 5,
        maxAttempts: payload.maxAttempts ?? 6,
        guesses: [],
        playerStatuses: createEmptyPlayerStatuses(Object.keys(previousState.playerStatuses)),
        scores: createEmptyScores(Object.keys(previousState.playerStatuses)),
        correctWord: payload.correctWord,
        finalScores: [],
      }))
    }

    const handleWordelGuessResult = (payload: WordelGuessResult) => {
      setWordel((previousState) => {
        const nextStatuses = {
          ...previousState.playerStatuses,
          [currentUserId]: {
            attemptCount: payload.attemptsUsed,
            solved: payload.isCorrect,
            finished: payload.isCorrect || payload.attemptsUsed >= previousState.maxAttempts,
            score:
              payload.isCorrect
                ? Math.max(1, previousState.maxAttempts - payload.attemptsUsed + 1)
                : previousState.playerStatuses[currentUserId]?.score ?? 0,
          },
        }

        const nextScores = {
          ...previousState.scores,
          [currentUserId]: nextStatuses[currentUserId].score,
        }

        return {
          ...previousState,
          guesses: [...previousState.guesses, payload],
          playerStatuses: nextStatuses,
          scores: nextScores,
        }
      })
    }

    const handleWordelOpponentProgress = (payload: WordelOpponentProgressPayload) => {
      setWordel((previousState) => ({
        ...previousState,
        playerStatuses: {
          ...previousState.playerStatuses,
          [payload.playerId]: {
            attemptCount: payload.attemptCount,
            solved: payload.solved,
            finished:
              payload.solved || payload.attemptCount >= previousState.maxAttempts,
            score: previousState.scores[payload.playerId] ?? 0,
          },
        },
      }))
    }

    const handleWordelRoundEnded = (payload: WordelRoundEnded) => {
      setWordel((previousState) => {
        const nextStatuses = { ...previousState.playerStatuses }
        const nextScores = { ...previousState.scores }

        for (const result of payload.playerResults) {
          nextStatuses[result.playerId] = {
            attemptCount: result.attempts,
            solved: result.solved,
            finished: true,
            score: result.pointsEarned,
          }
          nextScores[result.playerId] = result.pointsEarned
        }

        return {
          ...previousState,
          phase: 'roundEnd',
          correctWord: payload.correctWord,
          playerStatuses: nextStatuses,
          scores: nextScores,
        }
      })
    }

    const handleWordelGameEnded = (payload: WordelGameEnded) => {
      setWordel((previousState) => ({
        ...previousState,
        phase: 'gameEnd',
        finalScores: payload.finalScores,
      }))
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              status: 'finished',
            }
          : null
      )
    }

    const handleWordelSync = (payload: WordelSyncPayload) => {
      console.debug('[mini-arcade][wordel:sync]', {
        roomCode,
        userId: currentUserId,
        payload,
      })
      setError(null)
      setWordel({
        phase: payload.phase,
        currentRound: payload.currentRound,
        totalRounds: payload.totalRounds,
        wordLength: payload.wordLength,
        maxAttempts: payload.maxAttempts,
        guesses: payload.guesses,
        playerStatuses: Object.fromEntries(
          payload.playerStatuses.map((status) => [
            status.playerId,
            {
              attemptCount: status.attemptCount,
              solved: status.solved,
              finished: status.finished,
              score: status.score,
            },
          ])
        ),
        scores: payload.scores,
        finalScores: payload.finalScores ?? [],
        correctWord: payload.correctWord,
      })
    }

    const handleTriviaRoundStarted = (payload: TriviaRoundStarted) => {
      setTrivia((previousState) => ({
        ...previousState,
        phase: 'playing',
        currentRound: payload.roundNumber,
        totalRounds: payload.totalRounds,
        timeRemaining: payload.timeLimit,
        question: payload.question,
        answeredPlayers: [],
        selectedAnswerId: null,
        answerFeedback: null,
        roundResults: null,
      }))
    }

    const handleTriviaTimerTick = (payload: TriviaTimerTickPayload) => {
      setTrivia((previousState) => ({
        ...previousState,
        timeRemaining: payload.remainingSeconds,
      }))
    }

    const handleTriviaAnswerResult = (payload: TriviaAnswerResultPayload) => {
      setTrivia((previousState) => ({
        ...previousState,
        answerFeedback: payload,
      }))
    }

    const handleTriviaPlayerAnswered = (payload: TriviaPlayerAnsweredPayload) => {
      setTrivia((previousState) => ({
        ...previousState,
        answeredPlayers: previousState.answeredPlayers.includes(payload.playerId)
          ? previousState.answeredPlayers
          : [...previousState.answeredPlayers, payload.playerId],
      }))
    }

    const handleTriviaRoundEnded = (payload: TriviaRoundEnded) => {
      setTrivia((previousState) => ({
        ...previousState,
        phase: 'roundEnd',
        roundResults: payload,
        scores: Object.fromEntries(
          payload.playerResults.map((result) => [result.playerId, result.totalScore])
        ),
      }))
    }

    const handleTriviaGameEnded = (payload: TriviaGameEnded) => {
      setTrivia((previousState) => ({
        ...previousState,
        phase: 'gameEnd',
        finalScores: payload.finalScores,
      }))
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              status: 'finished',
            }
          : null
      )
    }

    const handleTriviaSync = (payload: TriviaSyncPayload) => {
      setTrivia({
        phase: payload.phase,
        currentRound: payload.currentRound,
        totalRounds: payload.totalRounds,
        timeRemaining: payload.timeRemaining,
        question: payload.question
          ? {
              id: payload.question.id,
              question: payload.question.question,
              answers: payload.question.answers,
              category: payload.question.category,
              difficulty: payload.question.difficulty,
            }
          : null,
        answeredPlayers: payload.playerProgress
          .filter((entry) => entry.hasAnswered)
          .map((entry) => entry.playerId),
        selectedAnswerId: null,
        answerFeedback: null,
        roundResults: null,
        scores: payload.scores,
        finalScores: payload.finalScores ?? [],
      })
    }

    const handleFlagelRoundStarted = (payload: FlagelRoundStarted) => {
      setFlagel((previousState) => ({
        ...previousState,
        phase: 'playing',
        currentRound: payload.roundNumber,
        totalRounds: payload.totalRounds,
        flagEmoji: payload.flagEmoji,
        flagImageUrl: payload.flagImageUrl,
        maxAttempts: payload.maxAttempts ?? 6,
        hintsAvailable: payload.hintsAvailable,
        guesses: [],
        finalScores: [],
        correctCountry: undefined,
        countryCode: undefined,
      }))
    }

    const handleFlagelGuessResult = (payload: FlagelGuessResult) => {
      setFlagel((previousState) => ({
        ...previousState,
        guesses: [...previousState.guesses, payload],
        playerStatuses: {
          ...previousState.playerStatuses,
          [currentUserId]: {
            attemptCount: payload.attemptsUsed,
            solved: payload.isCorrect,
            finished: payload.isCorrect || payload.attemptsUsed >= previousState.maxAttempts,
            score: previousState.scores[currentUserId] ?? 0,
          },
        },
      }))
    }

    const handleFlagelOpponentProgress = (payload: FlagelOpponentProgressPayload) => {
      setFlagel((previousState) => ({
        ...previousState,
        playerStatuses: {
          ...previousState.playerStatuses,
          [payload.playerId]: {
            attemptCount: payload.attemptCount,
            solved: payload.solved,
            finished: payload.finished,
            score: previousState.scores[payload.playerId] ?? 0,
          },
        },
      }))
    }

    const handleFlagelRoundEnded = (payload: FlagelRoundEnded) => {
      setFlagel((previousState) => {
        const nextStatuses = { ...previousState.playerStatuses }
        const nextScores = { ...previousState.scores }

        for (const result of payload.playerResults) {
          nextStatuses[result.playerId] = {
            attemptCount: result.attempts,
            solved: result.solved,
            finished: true,
            score: result.pointsEarned,
          }
          nextScores[result.playerId] = result.pointsEarned
        }

        return {
          ...previousState,
          phase: 'roundEnd',
          correctCountry: payload.correctCountry,
          countryCode: payload.countryCode,
          playerStatuses: nextStatuses,
          scores: nextScores,
        }
      })
    }

    const handleFlagelGameEnded = (payload: FlagelGameEnded) => {
      setFlagel((previousState) => ({
        ...previousState,
        phase: 'gameEnd',
        finalScores: payload.finalScores,
      }))
      setRoom((previousRoom) =>
        previousRoom
          ? {
              ...previousRoom,
              status: 'finished',
            }
          : null
      )
    }

    const handleFlagelSync = (payload: FlagelSyncPayload) => {
      setFlagel({
        phase: payload.phase,
        currentRound: payload.currentRound,
        totalRounds: payload.totalRounds,
        flagEmoji: payload.flagEmoji,
        flagImageUrl: payload.flagImageUrl,
        maxAttempts: payload.maxAttempts,
        hintsAvailable: payload.hintsAvailable,
        guesses: payload.guesses,
        playerStatuses: Object.fromEntries(
          payload.playerStatuses.map((status) => [
            status.playerId,
            {
              attemptCount: status.attemptCount,
              solved: status.solved,
              finished: status.finished,
              score: status.score,
            },
          ])
        ),
        scores: payload.scores,
        finalScores: payload.finalScores ?? [],
        correctCountry: payload.correctCountry,
        countryCode: payload.countryCode,
      })
    }

    socket.on(CONNECTION_EVENTS.CONNECT, handleConnect)
    socket.on(CONNECTION_EVENTS.DISCONNECT, handleDisconnect)
    socket.on(ROOM_EVENTS.JOINED, handleJoined)
    socket.on(ROOM_EVENTS.PRESENCE, handlePresence)
    socket.on(ROOM_EVENTS.LEFT, handleLeft)
    socket.on(ROOM_EVENTS.ERROR, handleError)
    socket.on(ROOM_EVENTS.GAME_STARTED, handleGameStarted)
    socket.on(ROOM_EVENTS.HOST_CHANGED, handleHostChanged)
    socket.on(ROOM_EVENTS.PLAYER_KICKED, handleKicked)
    socket.on(TRIVIA_EVENTS.ROUND_STARTED, handleTriviaRoundStarted)
    socket.on(TRIVIA_EVENTS.TIMER_TICK, handleTriviaTimerTick)
    socket.on(TRIVIA_EVENTS.ANSWER_RESULT, handleTriviaAnswerResult)
    socket.on(TRIVIA_EVENTS.PLAYER_ANSWERED, handleTriviaPlayerAnswered)
    socket.on(TRIVIA_EVENTS.ROUND_ENDED, handleTriviaRoundEnded)
    socket.on(TRIVIA_EVENTS.GAME_ENDED, handleTriviaGameEnded)
    socket.on(TRIVIA_EVENTS.SYNC, handleTriviaSync)
    socket.on(FLAGEL_EVENTS.ROUND_STARTED, handleFlagelRoundStarted)
    socket.on(FLAGEL_EVENTS.GUESS_RESULT, handleFlagelGuessResult)
    socket.on(FLAGEL_EVENTS.OPPONENT_PROGRESS, handleFlagelOpponentProgress)
    socket.on(FLAGEL_EVENTS.ROUND_ENDED, handleFlagelRoundEnded)
    socket.on(FLAGEL_EVENTS.GAME_ENDED, handleFlagelGameEnded)
    socket.on(FLAGEL_EVENTS.SYNC, handleFlagelSync)
    socket.on(WORDEL_EVENTS.ROUND_STARTED, handleWordelRoundStarted)
    socket.on(WORDEL_EVENTS.GUESS_RESULT, handleWordelGuessResult)
    socket.on(WORDEL_EVENTS.OPPONENT_PROGRESS, handleWordelOpponentProgress)
    socket.on(WORDEL_EVENTS.ROUND_ENDED, handleWordelRoundEnded)
    socket.on(WORDEL_EVENTS.GAME_ENDED, handleWordelGameEnded)
    socket.on(WORDEL_EVENTS.SYNC, handleWordelSync)

    socket.connect()

    return () => {
      socket.off(CONNECTION_EVENTS.CONNECT, handleConnect)
      socket.off(CONNECTION_EVENTS.DISCONNECT, handleDisconnect)
      socket.off(ROOM_EVENTS.JOINED, handleJoined)
      socket.off(ROOM_EVENTS.PRESENCE, handlePresence)
      socket.off(ROOM_EVENTS.LEFT, handleLeft)
      socket.off(ROOM_EVENTS.ERROR, handleError)
      socket.off(ROOM_EVENTS.GAME_STARTED, handleGameStarted)
      socket.off(ROOM_EVENTS.HOST_CHANGED, handleHostChanged)
      socket.off(ROOM_EVENTS.PLAYER_KICKED, handleKicked)
      socket.off(TRIVIA_EVENTS.ROUND_STARTED, handleTriviaRoundStarted)
      socket.off(TRIVIA_EVENTS.TIMER_TICK, handleTriviaTimerTick)
      socket.off(TRIVIA_EVENTS.ANSWER_RESULT, handleTriviaAnswerResult)
      socket.off(TRIVIA_EVENTS.PLAYER_ANSWERED, handleTriviaPlayerAnswered)
      socket.off(TRIVIA_EVENTS.ROUND_ENDED, handleTriviaRoundEnded)
      socket.off(TRIVIA_EVENTS.GAME_ENDED, handleTriviaGameEnded)
      socket.off(TRIVIA_EVENTS.SYNC, handleTriviaSync)
      socket.off(FLAGEL_EVENTS.ROUND_STARTED, handleFlagelRoundStarted)
      socket.off(FLAGEL_EVENTS.GUESS_RESULT, handleFlagelGuessResult)
      socket.off(FLAGEL_EVENTS.OPPONENT_PROGRESS, handleFlagelOpponentProgress)
      socket.off(FLAGEL_EVENTS.ROUND_ENDED, handleFlagelRoundEnded)
      socket.off(FLAGEL_EVENTS.GAME_ENDED, handleFlagelGameEnded)
      socket.off(FLAGEL_EVENTS.SYNC, handleFlagelSync)
      socket.off(WORDEL_EVENTS.ROUND_STARTED, handleWordelRoundStarted)
      socket.off(WORDEL_EVENTS.GUESS_RESULT, handleWordelGuessResult)
      socket.off(WORDEL_EVENTS.OPPONENT_PROGRESS, handleWordelOpponentProgress)
      socket.off(WORDEL_EVENTS.ROUND_ENDED, handleWordelRoundEnded)
      socket.off(WORDEL_EVENTS.GAME_ENDED, handleWordelGameEnded)
      socket.off(WORDEL_EVENTS.SYNC, handleWordelSync)
      socket.disconnect()
      socketRef.current = null
    }
  }, [createEmptyPlayerStatuses, createEmptyScores, currentUserId, roomCode, showNotification])

  const leave = useCallback(() => {
    const socket = socketRef.current
    if (!socket) {
      return
    }

    socket.emit(ROOM_EVENTS.LEAVE, { roomCode })
  }, [roomCode])

  const startGame = useCallback(() => {
    const socket = socketRef.current
    if (!socket) {
      return
    }

    socket.emit(ROOM_EVENTS.START_GAME, { roomCode })
  }, [roomCode])

  const kickPlayer = useCallback(
    (playerId: string) => {
      const socket = socketRef.current
      if (!socket) {
        return
      }

      socket.emit(ROOM_EVENTS.KICK_PLAYER, {
        roomCode,
        playerId,
      })
    },
    [roomCode]
  )

  const submitWordelGuess = useCallback(
    (guess: string) => {
      const socket = socketRef.current
      if (!socket) {
        return
      }

      socket.emit(WORDEL_EVENTS.SUBMIT_GUESS, {
        roomCode,
        guess,
      })
    },
    [roomCode]
  )

  const submitTriviaAnswer = useCallback(
    (questionId: string, answerId: string) => {
      const socket = socketRef.current
      if (!socket) {
        return
      }

      setTrivia((previousState) => ({
        ...previousState,
        selectedAnswerId: answerId,
      }))

      socket.emit(TRIVIA_EVENTS.SUBMIT_ANSWER, {
        roomCode,
        questionId,
        answerId,
      })
    },
    [roomCode]
  )

  const submitFlagelGuess = useCallback(
    (guess: string) => {
      const socket = socketRef.current
      if (!socket) {
        return
      }

      socket.emit(FLAGEL_EVENTS.SUBMIT_GUESS, {
        roomCode,
        guess,
      })
    },
    [roomCode]
  )

  const skipFlagelRound = useCallback(() => {
    const socket = socketRef.current
    if (!socket) {
      return
    }

    socket.emit(FLAGEL_EVENTS.SKIP, {
      roomCode,
    })
  }, [roomCode])

  return {
    room,
    players: room?.players ?? [],
    isConnected,
    isJoining,
    isHost: room?.hostId === currentUserId,
    error,
    notification,
    hasLeft,
    wasKicked,
    flagel,
    trivia,
    wordel,
    dismissNotification,
    leave,
    startGame,
    kickPlayer,
    submitFlagelGuess,
    skipFlagelRound,
    submitTriviaAnswer,
    submitWordelGuess,
  }
}
