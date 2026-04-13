import {
  FLAGEL_EVENTS,
  type FlagelGuessResult,
  type FlagelSkipPayload,
  type FlagelSubmitGuessPayload,
  type GameConfig,
  type GameEventResult,
  type UserId,
} from '@mini-arcade/shared'
import type { Server } from 'socket.io'

import { RoomService } from '../../services/roomService'
import { BaseGameRuntime } from '../BaseGameRuntime'
import {
  calculateDistanceKm,
  findCountryByGuess,
  getDirectionHint,
  pickRandomCountry,
  type Country,
} from './countryData'

type PlayerFlagelState = {
  guesses: FlagelGuessResult[]
  guessedCountryCodes: Set<string>
  solved: boolean
  finished: boolean
  skipped: boolean
}

const MAX_ATTEMPTS = 6
const POINTS_BY_ATTEMPT = [1000, 800, 600, 400, 200, 100] as const

export class FlagelRuntime extends BaseGameRuntime {
  private readonly playerState = new Map<UserId, PlayerFlagelState>()
  private readonly usedCountryCodes = new Set<string>()
  private secretCountry: Country | null = null

  constructor(io: Server, config: GameConfig, roomService: RoomService) {
    super(io, config, roomService)
  }

  async initialize() {
    for (const player of this.players.values()) {
      this.playerState.set(player.id, createPlayerFlagelState())
    }
  }

  async start(): Promise<GameEventResult> {
    this.phase = 'playing'
    this.currentRound = 1
    this.secretCountry = pickRandomCountry(this.usedCountryCodes)
    console.info('[flagel] round started', {
      roomCode: this.roomCode,
      countryCode: this.secretCountry.code,
      countryName: this.secretCountry.name,
      flagImageUrl: this.secretCountry.flagImageUrl,
      flagEmoji: this.secretCountry.flagEmoji,
    })
    await this.updateRoomPresenceStatus('playing')

    return {
      success: true,
      broadcast: [
        {
          event: FLAGEL_EVENTS.ROUND_STARTED,
          to: 'room',
          data: {
            roundNumber: this.currentRound,
            totalRounds: this.totalRounds,
            flagEmoji: this.secretCountry.flagEmoji,
            flagImageUrl: this.secretCountry.flagImageUrl,
            maxAttempts: MAX_ATTEMPTS,
            hintsAvailable: MAX_ATTEMPTS - 1,
          },
        },
      ],
    }
  }

  async onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult> {
    if (eventName === FLAGEL_EVENTS.SUBMIT_GUESS) {
      return this.handleSubmitGuess(playerId, payload as FlagelSubmitGuessPayload)
    }

    if (eventName === FLAGEL_EVENTS.SKIP) {
      return this.handleSkip(playerId, payload as FlagelSkipPayload)
    }

    return {
      success: false,
      error: `Unsupported event ${eventName} for Flagel.`,
    }
  }

  async end(): Promise<GameEventResult> {
    const baseResult = await super.end()

    return {
      success: true,
      broadcast: [
        ...(baseResult.broadcast ?? []),
        {
          event: FLAGEL_EVENTS.GAME_ENDED,
          to: 'room',
          data: {
            finalScores: this.getFinalScores(),
          },
        },
      ],
    }
  }

  getPlayerSyncData(playerId: UserId) {
    const state = this.playerState.get(playerId)

    return {
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      flagEmoji: this.secretCountry?.flagEmoji,
      flagImageUrl: this.secretCountry?.flagImageUrl,
      maxAttempts: MAX_ATTEMPTS,
      hintsAvailable: Math.max(0, MAX_ATTEMPTS - (state?.guesses.length ?? 0) - 1),
      guesses: state?.guesses ?? [],
      playerStatuses: Array.from(this.playerState.entries()).map(([activePlayerId, playerState]) => ({
        playerId: activePlayerId,
        attemptCount: playerState.guesses.length,
        solved: playerState.solved,
        finished: playerState.finished,
        score: this.scores.get(activePlayerId) ?? 0,
      })),
      scores: Object.fromEntries(this.scores),
      finalScores: this.phase === 'gameEnd' ? this.getFinalScores() : undefined,
      correctCountry:
        this.phase === 'roundEnd' || this.phase === 'gameEnd' ? this.secretCountry?.name : undefined,
      countryCode:
        this.phase === 'roundEnd' || this.phase === 'gameEnd' ? this.secretCountry?.code : undefined,
    }
  }

  private async handleSubmitGuess(
    playerId: UserId,
    payload: FlagelSubmitGuessPayload
  ): Promise<GameEventResult> {
    if (this.phase !== 'playing' || !this.secretCountry) {
      return {
        success: false,
        error: 'Flagel is not accepting guesses right now.',
      }
    }

    const playerState = this.playerState.get(playerId)
    if (!playerState) {
      return {
        success: false,
        error: 'Player is not part of this game.',
      }
    }

    if (playerState.finished) {
      return {
        success: false,
        error: 'You already finished this Flagel round.',
      }
    }

    const guessedCountry = findCountryByGuess(payload.guess)
    if (!guessedCountry) {
      return {
        success: false,
        error: 'That country is not in the current Flagel list.',
      }
    }

    if (playerState.guessedCountryCodes.has(guessedCountry.code)) {
      return {
        success: false,
        error: 'You already tried that country.',
      }
    }

    const attemptsUsed = playerState.guesses.length + 1
    const isCorrect = guessedCountry.code === this.secretCountry.code
    const guessResult: FlagelGuessResult = {
      guess: guessedCountry.name,
      isCorrect,
      distance: isCorrect ? 0 : calculateDistanceKm(guessedCountry, this.secretCountry),
      direction: isCorrect ? undefined : getDirectionHint(guessedCountry, this.secretCountry),
      attemptsUsed,
      maxAttempts: MAX_ATTEMPTS,
    }

    playerState.guessedCountryCodes.add(guessedCountry.code)
    playerState.guesses.push(guessResult)

    if (isCorrect) {
      playerState.solved = true
      playerState.finished = true
      this.setPlayerScore(playerId, POINTS_BY_ATTEMPT[attemptsUsed - 1] ?? 0)
    } else if (attemptsUsed >= MAX_ATTEMPTS) {
      playerState.finished = true
      this.setPlayerScore(playerId, 0)
    }

    const result: GameEventResult = {
      success: true,
      broadcast: [
        {
          event: FLAGEL_EVENTS.GUESS_RESULT,
          to: 'player',
          playerId,
          data: guessResult,
        },
        {
          event: FLAGEL_EVENTS.OPPONENT_PROGRESS,
          to: 'room',
          data: {
            playerId,
            attemptCount: playerState.guesses.length,
            solved: playerState.solved,
            finished: playerState.finished,
          },
        },
      ],
    }

    if (this.allPlayersFinished()) {
      const roundEndResult = await this.finishRound()
      result.broadcast?.push(...(roundEndResult.broadcast ?? []))
    }

    await this.updateRoomPresenceStatus(this.phase)
    return result
  }

  private async handleSkip(playerId: UserId, _payload: FlagelSkipPayload): Promise<GameEventResult> {
    if (this.phase !== 'playing' || !this.secretCountry) {
      return {
        success: false,
        error: 'Flagel is not accepting skips right now.',
      }
    }

    const playerState = this.playerState.get(playerId)
    if (!playerState) {
      return {
        success: false,
        error: 'Player is not part of this game.',
      }
    }

    if (playerState.finished) {
      return {
        success: false,
        error: 'You already finished this Flagel round.',
      }
    }

    playerState.skipped = true
    playerState.finished = true
    this.setPlayerScore(playerId, 0)

    const result: GameEventResult = {
      success: true,
      broadcast: [
        {
          event: FLAGEL_EVENTS.OPPONENT_PROGRESS,
          to: 'room',
          data: {
            playerId,
            attemptCount: playerState.guesses.length,
            solved: false,
            finished: true,
          },
        },
      ],
    }

    if (this.allPlayersFinished()) {
      const roundEndResult = await this.finishRound()
      result.broadcast?.push(...(roundEndResult.broadcast ?? []))
    }

    await this.updateRoomPresenceStatus(this.phase)
    return result
  }

  private async finishRound(): Promise<GameEventResult> {
    if (!this.secretCountry) {
      return { success: true }
    }

    this.phase = 'roundEnd'

    const roundEndResult: GameEventResult = {
      success: true,
      broadcast: [
        {
          event: FLAGEL_EVENTS.ROUND_ENDED,
          to: 'room',
          data: {
            correctCountry: this.secretCountry.name,
            countryCode: this.secretCountry.code,
            playerResults: Array.from(this.playerState.entries()).map(([activePlayerId, state]) => ({
              playerId: activePlayerId,
              solved: state.solved,
              attempts: state.guesses.length,
              pointsEarned: this.scores.get(activePlayerId) ?? 0,
            })),
          },
        },
      ],
    }

    const endResult = await this.end()
    roundEndResult.broadcast?.push(...(endResult.broadcast ?? []))
    return roundEndResult
  }

  private allPlayersFinished() {
    return Array.from(this.playerState.values()).every((state) => state.finished)
  }
}

function createPlayerFlagelState(): PlayerFlagelState {
  return {
    guesses: [],
    guessedCountryCodes: new Set<string>(),
    solved: false,
    finished: false,
    skipped: false,
  }
}
