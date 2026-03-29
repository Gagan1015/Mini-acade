import {
  CHAT_EVENTS,
  SKRIBBLE_EVENTS,
  type GameConfig,
  type GameEventResult,
  type GuessPayload,
  type Stroke,
  type StrokeBatchPayload,
  type UserId,
} from '@mini-arcade/shared'
import type { Server } from 'socket.io'

import { RoomService } from '../../services/roomService'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { generateWordHint, getRandomWords, isCloseGuess } from './wordList'

type SkribbleRoundState = {
  drawerId: UserId
  word: string
  wordHint: string
  strokes: Stroke[]
  correctGuessers: Set<UserId>
  guessOrder: UserId[]
  roundStartedAt: Date | null
}

const ROUND_TIME_SECONDS = 90
const POINTS_FIRST = 100
const POINTS_DECREASE = 10
const POINTS_MIN = 70
const DRAWER_POINTS_PER_GUESS = 10

export class SkribbleRuntime extends BaseGameRuntime {
  private roundState: SkribbleRoundState = {
    drawerId: '',
    word: '',
    wordHint: '',
    strokes: [],
    correctGuessers: new Set<UserId>(),
    guessOrder: [],
    roundStartedAt: null,
  }

  private drawerOrder: UserId[] = []
  private roundTimer: ReturnType<typeof setTimeout> | null = null
  private roundEndsAt: Date | null = null

  constructor(io: Server, config: GameConfig, roomService: RoomService) {
    super(io, config, roomService)
    this.totalRounds = config.settings?.rounds ?? config.players.length
  }

  async initialize() {
    this.drawerOrder = shuffle(Array.from(this.players.keys()))
  }

  async start(): Promise<GameEventResult> {
    return this.startNextRound()
  }

  async end(): Promise<GameEventResult> {
    this.clearTimers()
    return super.end()
  }

  async onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult> {
    if (eventName === SKRIBBLE_EVENTS.STROKE_BATCH) {
      return this.handleStrokeBatch(playerId, payload as StrokeBatchPayload)
    }

    if (eventName === SKRIBBLE_EVENTS.CLEAR_CANVAS) {
      return this.handleClearCanvas(playerId)
    }

    if (eventName === SKRIBBLE_EVENTS.GUESS) {
      return this.handleGuess(playerId, payload as GuessPayload)
    }

    if (eventName === SKRIBBLE_EVENTS.REQUEST_SYNC) {
      return {
        success: true,
        broadcast: [
          {
            event: SKRIBBLE_EVENTS.SYNC,
            to: 'player',
            playerId,
            data: this.getPlayerSyncData(playerId),
          },
        ],
      }
    }

    return {
      success: false,
      error: `Unsupported event ${eventName} for Skribble.`,
    }
  }

  override onPlayerLeave(playerId: UserId): GameEventResult {
    const baseResult = super.onPlayerLeave(playerId)

    if (playerId === this.roundState.drawerId && this.phase === 'playing') {
      void this.finishRound()
    }

    return baseResult
  }

  override onPlayerReconnect(playerId: UserId): GameEventResult {
    const player = this.players.get(playerId)
    if (player) {
      this.players.set(playerId, {
        ...player,
        isConnected: true,
      })
    }

    return {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.SYNC,
          data: this.getPlayerSyncData(playerId),
          to: 'player',
          playerId,
        },
      ],
    }
  }

  getPlayerSyncData(playerId: UserId) {
    return {
      strokes: this.roundState.strokes,
      drawerId: this.roundState.drawerId,
      wordHint: this.roundState.wordHint || undefined,
      wordLength: this.roundState.word.length || undefined,
      correctGuessers: Array.from(this.roundState.correctGuessers),
      roundEndsAt: this.roundEndsAt?.toISOString(),
      word: playerId === this.roundState.drawerId ? this.roundState.word : undefined,
    }
  }

  private async startNextRound(): Promise<GameEventResult> {
    this.currentRound += 1

    if (this.currentRound > this.totalRounds) {
      return this.end()
    }

    const drawerId = this.drawerOrder[(this.currentRound - 1) % this.drawerOrder.length]
    const word = getRandomWords(1, 'medium')[0]

    this.phase = 'playing'
    this.roundState = {
      drawerId,
      word,
      wordHint: generateWordHint(word),
      strokes: [],
      correctGuessers: new Set<UserId>(),
      guessOrder: [],
      roundStartedAt: new Date(),
    }

    this.clearTimers()
    this.roundEndsAt = new Date(Date.now() + ROUND_TIME_SECONDS * 1000)
    this.roundTimer = setTimeout(() => {
      void this.finishRound()
    }, ROUND_TIME_SECONDS * 1000)

    await this.updateRoomPresenceStatus('playing')

    return {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.ROUND_STARTED,
          to: 'room',
          data: {
            roundNumber: this.currentRound,
            totalRounds: this.totalRounds,
            drawerId,
            wordLength: word.length,
            wordHint: this.roundState.wordHint,
            roundEndsAt: this.roundEndsAt.toISOString(),
          },
        },
        {
          event: SKRIBBLE_EVENTS.TURN_STARTED,
          to: 'player',
          playerId: drawerId,
          data: {
            drawerId,
            word,
          },
        },
      ],
    }
  }

  private handleStrokeBatch(playerId: UserId, payload: StrokeBatchPayload): GameEventResult {
    if (this.phase !== 'playing') {
      return {
        success: false,
        error: 'Skribble is not accepting drawing input right now.',
      }
    }

    if (playerId !== this.roundState.drawerId) {
      return {
        success: false,
        error: 'Only the current drawer can draw.',
      }
    }

    this.roundState.strokes.push(...payload.strokes)
    if (this.roundState.strokes.length > 10000) {
      this.roundState.strokes = this.roundState.strokes.slice(-5000)
    }

    return {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.STROKE_BROADCAST,
          to: 'room',
          data: {
            strokes: payload.strokes,
            playerId,
          },
        },
      ],
    }
  }

  private handleClearCanvas(playerId: UserId): GameEventResult {
    if (playerId !== this.roundState.drawerId) {
      return {
        success: false,
        error: 'Only the current drawer can clear the canvas.',
      }
    }

    this.roundState.strokes = []

    return {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.CANVAS_CLEARED,
          to: 'room',
          data: {
            playerId,
          },
        },
      ],
    }
  }

  private async handleGuess(playerId: UserId, payload: GuessPayload): Promise<GameEventResult> {
    if (this.phase !== 'playing') {
      return {
        success: false,
        error: 'Skribble is not accepting guesses right now.',
      }
    }

    if (playerId === this.roundState.drawerId) {
      return {
        success: false,
        error: "You can't guess your own word.",
      }
    }

    if (this.roundState.correctGuessers.has(playerId)) {
      return {
        success: false,
        error: 'You already guessed correctly.',
      }
    }

    const guess = payload.guess.toLowerCase().trim()
    const word = this.roundState.word.toLowerCase().trim()

    if (guess === word) {
      this.roundState.correctGuessers.add(playerId)
      this.roundState.guessOrder.push(playerId)

      const player = this.players.get(playerId)
      const position = this.roundState.guessOrder.length
      const points = Math.max(POINTS_FIRST - (position - 1) * POINTS_DECREASE, POINTS_MIN)

      this.setPlayerScore(playerId, (this.scores.get(playerId) ?? 0) + points)

      const result: GameEventResult = {
        success: true,
        broadcast: [
          {
            event: SKRIBBLE_EVENTS.GUESS_RESULT,
            to: 'player',
            playerId,
            data: {
              playerId,
              isCorrect: true,
              pointsEarned: points,
            },
          },
          {
            event: SKRIBBLE_EVENTS.CORRECT_GUESS,
            to: 'room',
            data: {
              playerId,
              playerName: player?.name ?? 'Player',
              position,
            },
          },
        ],
      }

      if (this.allGuessersFinished()) {
        const roundEndResult = await this.finishRound()
        result.broadcast?.push(...(roundEndResult.broadcast ?? []))
      }

      return result
    }

    const closeGuess = isCloseGuess(guess, word)

    return {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.GUESS_RESULT,
          to: 'player',
          playerId,
          data: {
            playerId,
            isCorrect: false,
            isClose: closeGuess,
            pointsEarned: 0,
            guess: payload.guess,
          },
        },
        {
          event: CHAT_EVENTS.MESSAGE,
          to: 'room',
          data: {
            id: `${Date.now()}-${playerId}`,
            playerId,
            playerName: this.players.get(playerId)?.name ?? 'Player',
            message: closeGuess ? '***' : payload.guess,
            timestamp: new Date().toISOString(),
            type: 'guess',
          },
        },
      ],
    }
  }

  private async finishRound(): Promise<GameEventResult> {
    if (this.phase === 'roundEnd' || this.phase === 'gameEnd') {
      return { success: true }
    }

    this.phase = 'roundEnd'
    this.clearTimers()

    const drawerPoints = this.roundState.correctGuessers.size * DRAWER_POINTS_PER_GUESS
    if (this.roundState.drawerId) {
      this.setPlayerScore(
        this.roundState.drawerId,
        (this.scores.get(this.roundState.drawerId) ?? 0) + drawerPoints
      )
    }

    const result: GameEventResult = {
      success: true,
      broadcast: [
        {
          event: SKRIBBLE_EVENTS.ROUND_ENDED,
          to: 'room',
          data: {
            word: this.roundState.word,
            scores: Object.fromEntries(this.scores),
          },
        },
      ],
    }

    if (this.currentRound >= this.totalRounds) {
      const endResult = await this.end()
      result.broadcast?.push(...(endResult.broadcast ?? []))
    } else {
      const nextRoundResult = await this.startNextRound()
      result.broadcast?.push(...(nextRoundResult.broadcast ?? []))
    }

    return result
  }

  private allGuessersFinished() {
    return Array.from(this.players.keys())
      .filter((playerId) => playerId !== this.roundState.drawerId)
      .every((playerId) => this.roundState.correctGuessers.has(playerId))
  }

  private clearTimers() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }
    this.roundEndsAt = null
  }
}

function shuffle<TValue>(values: TValue[]) {
  const nextValues = [...values]

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextValues[index], nextValues[swapIndex]] = [nextValues[swapIndex], nextValues[index]]
  }

  return nextValues
}
