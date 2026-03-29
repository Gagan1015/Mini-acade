import {
  TRIVIA_EVENTS,
  type GameConfig,
  type GameEventResult,
  type TriviaQuestion,
  type TriviaSubmitAnswerPayload,
  type UserId,
} from '@mini-arcade/shared'
import type { Server } from 'socket.io'

import { RoomService } from '../../services/roomService'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { QuestionService, type TriviaQuestionData } from './questionService'

type PlayerAnswer = {
  answerId: string
  answeredAt: Date
}

const ROUND_TIME_SECONDS = 20
const DEFAULT_ROUNDS = 5
const POINTS_TIERS = [
  { maxSeconds: 5, points: 1000 },
  { maxSeconds: 10, points: 750 },
  { maxSeconds: 20, points: 500 },
  { maxSeconds: Infinity, points: 250 },
] as const

export class TriviaRuntime extends BaseGameRuntime {
  private readonly questionService = new QuestionService()
  private readonly answers = new Map<UserId, PlayerAnswer>()
  private currentQuestion: TriviaQuestionData | null = null
  private roundStartedAt: Date | null = null
  private roundEndsAt: Date | null = null
  private roundTimer: ReturnType<typeof setTimeout> | null = null
  private timerTick: ReturnType<typeof setInterval> | null = null

  constructor(io: Server, config: GameConfig, roomService: RoomService) {
    super(io, config, roomService)
    this.totalRounds = config.settings?.rounds ?? DEFAULT_ROUNDS
  }

  async initialize() {
    this.questionService.reset()
  }

  async start(): Promise<GameEventResult> {
    this.phase = 'playing'
    this.currentRound = 0
    await this.updateRoomPresenceStatus('playing')
    return this.startNextRound()
  }

  async onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult> {
    if (eventName !== TRIVIA_EVENTS.SUBMIT_ANSWER) {
      return {
        success: false,
        error: `Unsupported event ${eventName} for Trivia.`,
      }
    }

    if (this.phase !== 'playing' || !this.currentQuestion || !this.roundStartedAt) {
      return {
        success: false,
        error: 'There is no active trivia question right now.',
      }
    }

    const answerPayload = payload as TriviaSubmitAnswerPayload
    if (answerPayload.questionId !== this.currentQuestion.id) {
      return {
        success: false,
        error: 'That answer is for the wrong question.',
      }
    }

    if (this.answers.has(playerId)) {
      return {
        success: false,
        error: 'You already answered this question.',
      }
    }

    const validAnswer = this.currentQuestion.answers.some((answer) => answer.id === answerPayload.answerId)
    if (!validAnswer) {
      return {
        success: false,
        error: 'That answer does not exist for the current question.',
      }
    }

    const answeredAt = new Date()
    this.answers.set(playerId, {
      answerId: answerPayload.answerId,
      answeredAt,
    })

    const elapsedSeconds = (answeredAt.getTime() - this.roundStartedAt.getTime()) / 1000
    const isCorrect = answerPayload.answerId === this.currentQuestion.correctId
    const pointsEarned = isCorrect ? calculateTriviaPoints(elapsedSeconds) : 0

    if (isCorrect) {
      this.setPlayerScore(playerId, (this.scores.get(playerId) ?? 0) + pointsEarned)
    }

    const result: GameEventResult = {
      success: true,
      broadcast: [
        {
          event: TRIVIA_EVENTS.ANSWER_RESULT,
          to: 'player',
          playerId,
          data: {
            isCorrect,
            pointsEarned,
          },
        },
        {
          event: TRIVIA_EVENTS.PLAYER_ANSWERED,
          to: 'room',
          data: {
            playerId,
          },
        },
      ],
    }

    if (this.answers.size >= this.getConnectedPlayers().length) {
      const roundEndResult = await this.finishCurrentRound()
      result.broadcast?.push(...(roundEndResult.broadcast ?? []))
    } else {
      await this.updateRoomPresenceStatus('playing')
    }

    return result
  }

  async end(): Promise<GameEventResult> {
    this.clearTimers()
    const baseResult = await super.end()

    return {
      success: true,
      broadcast: [
        ...(baseResult.broadcast ?? []),
        {
          event: TRIVIA_EVENTS.GAME_ENDED,
          to: 'room',
          data: {
            finalScores: this.getResults().map((result) => ({
              playerId: result.playerId,
              playerName: this.players.get(result.playerId)?.name ?? 'Unknown',
              score: result.score,
              correctAnswers: 0,
              rank: result.rank,
            })),
          },
        },
      ],
    }
  }

  getPlayerSyncData(_playerId: UserId) {
    return {
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      timeRemaining: getRemainingSeconds(this.roundEndsAt),
      question: this.currentQuestion
        ? {
            id: this.currentQuestion.id,
            question: this.currentQuestion.question,
            answers: this.currentQuestion.answers,
            category: this.currentQuestion.category,
            difficulty: this.currentQuestion.difficulty,
            ...(this.phase === 'roundEnd' || this.phase === 'gameEnd'
              ? { correctAnswerId: this.currentQuestion.correctId }
              : {}),
          }
        : null,
      playerProgress: Array.from(this.players.keys()).map((activePlayerId) => ({
        playerId: activePlayerId,
        hasAnswered: this.answers.has(activePlayerId),
        score: this.scores.get(activePlayerId) ?? 0,
      })),
      scores: Object.fromEntries(this.scores),
      finalScores:
        this.phase === 'gameEnd'
          ? this.getResults().map((result) => ({
              playerId: result.playerId,
              playerName: this.players.get(result.playerId)?.name ?? 'Unknown',
              score: result.score,
              correctAnswers: 0,
              rank: result.rank,
            }))
          : undefined,
    }
  }

  private async startNextRound(): Promise<GameEventResult> {
    this.currentRound += 1

    if (this.currentRound > this.totalRounds) {
      return this.end()
    }

    this.phase = 'playing'
    this.answers.clear()
    this.currentQuestion = await this.questionService.getQuestion()
    const currentQuestion = this.currentQuestion
    this.roundStartedAt = new Date()
    this.roundEndsAt = new Date(this.roundStartedAt.getTime() + ROUND_TIME_SECONDS * 1000)

    this.clearTimers()
    this.roundTimer = setTimeout(() => {
      void this.finishCurrentRound()
    }, ROUND_TIME_SECONDS * 1000)
    this.timerTick = setInterval(() => {
      if (!this.roundEndsAt || this.phase !== 'playing') {
        return
      }

      this.io.to(this.roomCode).emit(TRIVIA_EVENTS.TIMER_TICK, {
        remainingSeconds: getRemainingSeconds(this.roundEndsAt),
      })
    }, 1000)

    await this.updateRoomPresenceStatus('playing')

    return {
      success: true,
      broadcast: [
        {
          event: TRIVIA_EVENTS.ROUND_STARTED,
          to: 'room',
          data: {
            roundNumber: this.currentRound,
            totalRounds: this.totalRounds,
            question: toClientQuestion(currentQuestion),
            roundEndsAt: this.roundEndsAt.toISOString(),
            timeLimit: ROUND_TIME_SECONDS,
          },
        },
      ],
    }
  }

  private async finishCurrentRound(): Promise<GameEventResult> {
    if (!this.currentQuestion || this.phase === 'roundEnd' || this.phase === 'gameEnd') {
      return { success: true }
    }

    this.phase = 'roundEnd'
    this.clearTimers()

    const playerResults = Array.from(this.players.keys()).map((playerId) => {
      const answer = this.answers.get(playerId)
      const isCorrect = answer?.answerId === this.currentQuestion?.correctId
      const elapsedSeconds =
        answer && this.roundStartedAt
          ? (answer.answeredAt.getTime() - this.roundStartedAt.getTime()) / 1000
          : undefined
      const pointsEarned = isCorrect ? calculateTriviaPoints(elapsedSeconds ?? ROUND_TIME_SECONDS) : 0

      return {
        playerId,
        answerId: answer?.answerId ?? null,
        isCorrect,
        pointsEarned,
        totalScore: this.scores.get(playerId) ?? 0,
        answerTime: elapsedSeconds,
      }
    })

    await this.updateRoomPresenceStatus('playing')

    const broadcasts: NonNullable<GameEventResult['broadcast']> = [
      {
        event: TRIVIA_EVENTS.ROUND_ENDED,
        to: 'room',
        data: {
          correctAnswerId: this.currentQuestion.correctId,
          playerResults,
        },
      },
    ]

    if (this.currentRound >= this.totalRounds) {
      const endResult = await this.end()
      broadcasts.push(...(endResult.broadcast ?? []))
    } else {
      const nextRoundResult = await this.startNextRound()
      broadcasts.push(...(nextRoundResult.broadcast ?? []))
    }

    return {
      success: true,
      broadcast: broadcasts,
    }
  }

  private clearTimers() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }

    if (this.timerTick) {
      clearInterval(this.timerTick)
      this.timerTick = null
    }
  }
}

function calculateTriviaPoints(answerSeconds: number) {
  for (const tier of POINTS_TIERS) {
    if (answerSeconds <= tier.maxSeconds) {
      return tier.points
    }
  }

  return 0
}

function toClientQuestion(question: TriviaQuestionData): TriviaQuestion {
  return {
    id: question.id,
    question: question.question,
    answers: question.answers,
    category: question.category,
    difficulty: question.difficulty,
  }
}

function getRemainingSeconds(roundEndsAt: Date | null) {
  if (!roundEndsAt) {
    return 0
  }

  return Math.max(0, Math.ceil((roundEndsAt.getTime() - Date.now()) / 1000))
}
