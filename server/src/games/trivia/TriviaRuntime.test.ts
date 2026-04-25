import test from 'node:test'
import assert from 'node:assert/strict'

import { TRIVIA_EVENTS, type GameConfig, type GameEventResult } from '@mini-arcade/shared'

import { TriviaRuntime } from './TriviaRuntime'
import {
  QuestionService,
  type TriviaQuestionData,
  type TriviaQuestionRepository,
} from './questionService'

class MemoryTriviaRepository implements TriviaQuestionRepository {
  constructor(private readonly questions: TriviaQuestionData[]) {}

  async findReusableQuestion(options: {
    category: TriviaQuestionData['category']
    difficulty: TriviaQuestionData['difficulty']
    excludeHashes: string[]
  }) {
    const question = this.questions.find((candidate) => {
      const categoryMatches = options.category === 'Mixed' || candidate.category === options.category

      return (
        categoryMatches &&
        candidate.difficulty === options.difficulty &&
        candidate.hash &&
        !options.excludeHashes.includes(candidate.hash)
      )
    })

    if (!question?.hash) {
      return null
    }

    return {
      id: question.id,
      hash: question.hash,
      question: question.question,
      answers: question.answers,
      correctId: question.correctId,
      explanation: question.explanation ?? null,
      category: question.category,
      difficulty: question.difficulty,
      tags: question.tags ?? [],
      source: question.source ?? 'seed',
    }
  }

  async markQuestionUsed() {}
}

class TestTriviaRuntime extends TriviaRuntime {
  public dispatched: GameEventResult[] = []

  async end(): Promise<GameEventResult> {
    const mutableThis = this as unknown as { phase: 'gameEnd' }
    mutableThis.phase = 'gameEnd'
    return {
      success: true,
      broadcast: [
        {
          event: TRIVIA_EVENTS.GAME_ENDED,
          to: 'room',
          data: {
            finalScores: this.getResults().map((result) => ({
              playerId: result.playerId,
              playerName: result.playerId,
              score: result.score,
              correctAnswers: 0,
              rank: result.rank,
            })),
          },
        },
      ],
    }
  }

  protected async broadcastToRoom(result: GameEventResult) {
    this.dispatched.push(result)
  }
}

const seededQuestions: TriviaQuestionData[] = [
  {
    id: 'seed-trivia-medium-history',
    hash: 'seed-trivia-medium-history',
    question: 'Who painted the Mona Lisa?',
    answers: [
      { id: 'a', text: 'Pablo Picasso' },
      { id: 'b', text: 'Vincent van Gogh' },
      { id: 'c', text: 'Leonardo da Vinci' },
      { id: 'd', text: 'Claude Monet' },
    ],
    correctId: 'c',
    category: 'History & Culture',
    difficulty: 'medium',
    explanation: 'Leonardo da Vinci painted the Mona Lisa.',
    tags: ['art-history'],
    source: 'database',
  },
  {
    id: 'seed-trivia-easy-gaming',
    hash: 'seed-trivia-easy-gaming',
    question: 'Which series features Master Chief?',
    answers: [
      { id: 'a', text: 'Halo' },
      { id: 'b', text: 'Mass Effect' },
      { id: 'c', text: 'Doom' },
      { id: 'd', text: 'Gears of War' },
    ],
    correctId: 'a',
    category: 'Gaming',
    difficulty: 'easy',
    explanation: 'Master Chief is the iconic hero of Halo.',
    tags: ['halo'],
    source: 'database',
  },
]

function attachQuestionService(runtime: TriviaRuntime) {
  const mutableRuntime = runtime as unknown as { questionService: QuestionService }
  mutableRuntime.questionService = new QuestionService(new MemoryTriviaRepository(seededQuestions))
}

function createRuntime() {
  const config: GameConfig = {
    gameId: 'trivia',
    roomCode: 'ABC123',
    players: [
      {
        id: 'user-1',
        name: 'Alpha',
        isHost: true,
        isConnected: true,
        score: 0,
      },
    ],
    settings: {
      rounds: 2,
      triviaCategories: ['Mixed'],
      triviaDifficulty: 'medium',
    },
  }

  const io = {
    to: () => ({
      emit: () => undefined,
    }),
  } as never

  const roomService = {
    applyGameResults: async () => undefined,
  } as never

  const runtime = new TestTriviaRuntime(io, config, roomService)
  attachQuestionService(runtime)
  return runtime
}

function createRuntimeWithSettings(settings: GameConfig['settings']) {
  const config: GameConfig = {
    gameId: 'trivia',
    roomCode: 'ABC123',
    players: [
      {
        id: 'user-1',
        name: 'Alpha',
        isHost: true,
        isConnected: true,
        score: 0,
      },
    ],
    settings,
  }

  const io = {
    to: () => ({
      emit: () => undefined,
    }),
  } as never

  const roomService = {
    applyGameResults: async () => undefined,
  } as never

  const runtime = new TestTriviaRuntime(io, config, roomService)
  attachQuestionService(runtime)
  return runtime
}

test('TriviaRuntime keeps the reveal phase before starting the next round', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  const startResult = await runtime.start()
  const roundStarted = startResult.broadcast?.find((entry) => entry.event === TRIVIA_EVENTS.ROUND_STARTED)
  assert.ok(roundStarted)

  const question = (roundStarted.data as { question: { id: string; answers: Array<{ id: string }> } }).question
  const answerResult = await runtime.onClientEvent('user-1', TRIVIA_EVENTS.SUBMIT_ANSWER, {
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  })

  assert.equal(runtime.getSnapshot().phase, 'roundEnd')
  assert.ok(answerResult.broadcast?.some((entry) => entry.event === TRIVIA_EVENTS.ROUND_ENDED))
  assert.equal(
    answerResult.broadcast?.some((entry) => entry.event === TRIVIA_EVENTS.ROUND_STARTED),
    false
  )

  const cleanup = runtime as unknown as { clearTimers: () => void }
  cleanup.clearTimers()
})

test('TriviaRuntime uses the selected trivia categories list when starting rounds', async () => {
  const runtime = createRuntimeWithSettings({
    rounds: 1,
    triviaCategories: ['Gaming'],
    triviaDifficulty: 'easy',
  })

  await runtime.initialize()
  const startResult = await runtime.start()
  const roundStarted = startResult.broadcast?.find((entry) => entry.event === TRIVIA_EVENTS.ROUND_STARTED)
  assert.ok(roundStarted)

  const question = roundStarted.data as { question: { category: string } }
  assert.equal(question.question.category, 'Gaming')

  const cleanup = runtime as unknown as { clearTimers: () => void }
  cleanup.clearTimers()
})
