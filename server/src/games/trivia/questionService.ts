import { createHash } from 'node:crypto'

import { prisma, type Prisma } from '@mini-arcade/db'
import {
  triviaCategories,
  triviaQuestionSchema,
  type TriviaCategory,
  type TriviaDifficulty,
  type TriviaQuestion,
} from '@mini-arcade/shared'
import { z } from 'zod'

export type TriviaQuestionData = TriviaQuestion & {
  correctId: 'a' | 'b' | 'c' | 'd'
  source?: 'database' | 'ai' | 'fallback'
  hash?: string
}

export type TriviaQuestionRequest = {
  category?: TriviaCategory
  difficulty?: TriviaDifficulty
}

export type GeneratedTriviaQuestion = Omit<TriviaQuestionData, 'id' | 'source' | 'hash'> & {
  id?: string
}

export interface TriviaQuestionProvider {
  generateQuestion(options: TriviaQuestionRequest & { excludeHashes: string[]; recentQuestions: string[] }): Promise<GeneratedTriviaQuestion>
}

type StoredTriviaQuestion = {
  id: string
  hash: string
  question: string
  answers: Prisma.JsonValue
  correctId: string
  explanation: string | null
  category: string
  difficulty: string
  tags: string[]
  source: string
}

export interface TriviaQuestionRepository {
  findReusableQuestion(options: {
    category: TriviaCategory
    difficulty: TriviaDifficulty
    excludeHashes: string[]
  }): Promise<StoredTriviaQuestion | null>
  saveGeneratedQuestion(question: TriviaQuestionData): Promise<StoredTriviaQuestion | null>
  markQuestionUsed(id: string): Promise<void>
}

const DEFAULT_CATEGORY: TriviaCategory = 'Mixed'
const DEFAULT_DIFFICULTY: TriviaDifficulty = 'medium'
const APPROVED_STATUS = 'approved'
const ANSWER_IDS = ['a', 'b', 'c', 'd'] as const
const DEFAULT_AI_RETRIES = 1

const generatedTriviaQuestionSchema = triviaQuestionSchema.extend({
  id: z.string().min(1).optional(),
  correctId: z.enum(['a', 'b', 'c', 'd']),
})

const FALLBACK_QUESTIONS: TriviaQuestionData[] = [
  {
    id: 'trivia-q1',
    question: 'What is the capital city of France?',
    answers: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Paris' },
      { id: 'c', text: 'Berlin' },
      { id: 'd', text: 'Madrid' },
    ],
    correctId: 'b',
    category: 'Geography & Travel',
    difficulty: 'easy',
    explanation: 'Paris is the capital and largest city of France.',
    tags: ['world-capitals', 'europe'],
    source: 'fallback',
  },
  {
    id: 'trivia-q2',
    question: 'Which planet is known as the Red Planet?',
    answers: [
      { id: 'a', text: 'Venus' },
      { id: 'b', text: 'Mars' },
      { id: 'c', text: 'Jupiter' },
      { id: 'd', text: 'Saturn' },
    ],
    correctId: 'b',
    category: 'Science & Nature',
    difficulty: 'easy',
    explanation: 'Mars appears reddish because of iron oxide on its surface.',
    tags: ['space', 'planets'],
    source: 'fallback',
  },
  {
    id: 'trivia-q3',
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
    explanation: 'Leonardo da Vinci painted the Mona Lisa during the Italian Renaissance.',
    tags: ['art-history', 'renaissance'],
    source: 'fallback',
  },
  {
    id: 'trivia-q4',
    question: 'In which year did World War II end?',
    answers: [
      { id: 'a', text: '1944' },
      { id: 'b', text: '1945' },
      { id: 'c', text: '1946' },
      { id: 'd', text: '1947' },
    ],
    correctId: 'b',
    category: 'History & Culture',
    difficulty: 'medium',
    explanation: 'World War II ended in 1945 after Germany and Japan surrendered.',
    tags: ['world-war-ii', 'modern-history'],
    source: 'fallback',
  },
  {
    id: 'trivia-q5',
    question: 'What is the largest mammal in the world?',
    answers: [
      { id: 'a', text: 'Blue whale' },
      { id: 'b', text: 'African elephant' },
      { id: 'c', text: 'Polar bear' },
      { id: 'd', text: 'Giraffe' },
    ],
    correctId: 'a',
    category: 'Science & Nature',
    difficulty: 'easy',
    explanation: 'The blue whale is the largest animal known to have ever lived.',
    tags: ['animals', 'ocean'],
    source: 'fallback',
  },
  {
    id: 'trivia-q6',
    question: 'Which video game series features Master Chief?',
    answers: [
      { id: 'a', text: 'Halo' },
      { id: 'b', text: 'Mass Effect' },
      { id: 'c', text: 'Doom' },
      { id: 'd', text: 'Gears of War' },
    ],
    correctId: 'a',
    category: 'Gaming',
    difficulty: 'easy',
    explanation: 'Master Chief is the armored protagonist of the Halo series.',
    tags: ['xbox', 'halo'],
    source: 'fallback',
  },
  {
    id: 'trivia-q7',
    question: 'Which sport uses the term hat-trick for three goals by one player?',
    answers: [
      { id: 'a', text: 'Football' },
      { id: 'b', text: 'Tennis' },
      { id: 'c', text: 'Formula 1' },
      { id: 'd', text: 'Golf' },
    ],
    correctId: 'a',
    category: 'Sports',
    difficulty: 'easy',
    explanation: 'In football, a hat-trick means one player scores three goals in a match.',
    tags: ['football', 'soccer'],
    source: 'fallback',
  },
  {
    id: 'trivia-q8',
    question: 'Which company created the iPhone?',
    answers: [
      { id: 'a', text: 'Google' },
      { id: 'b', text: 'Apple' },
      { id: 'c', text: 'Microsoft' },
      { id: 'd', text: 'Samsung' },
    ],
    correctId: 'b',
    category: 'Internet & Tech',
    difficulty: 'easy',
    explanation: 'Apple introduced the first iPhone in 2007.',
    tags: ['gadgets', 'apple'],
    source: 'fallback',
  },
]

export class PrismaTriviaQuestionRepository implements TriviaQuestionRepository {
  async findReusableQuestion(options: {
    category: TriviaCategory
    difficulty: TriviaDifficulty
    excludeHashes: string[]
  }) {
    const categoryFilter =
      options.category === 'Mixed'
        ? { in: triviaCategories.filter((category) => category !== 'Mixed') }
        : options.category

    const question = await prisma.triviaQuestion.findFirst({
      where: {
        status: APPROVED_STATUS,
        difficulty: options.difficulty,
        category: categoryFilter,
        hash: { notIn: options.excludeHashes },
        reportCount: { lt: 2 },
      },
      orderBy: [{ usageCount: 'asc' }, { lastUsedAt: 'asc' }, { createdAt: 'desc' }],
    })

    return question
  }

  async saveGeneratedQuestion(question: TriviaQuestionData) {
    if (!question.hash) {
      return null
    }

    return prisma.triviaQuestion.upsert({
      where: { hash: question.hash },
      update: {},
      create: {
        hash: question.hash,
        question: question.question,
        answers: question.answers,
        correctId: question.correctId,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
        tags: question.tags ?? [],
        source: question.source ?? 'ai',
        status: APPROVED_STATUS,
      },
    })
  }

  async markQuestionUsed(id: string) {
    await prisma.triviaQuestion.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })
  }
}

export class QuestionService {
  private readonly usedQuestionHashes = new Set<string>()
  private readonly usedQuestionFingerprints = new Set<string>()
  private readonly recentQuestions: string[] = []

  constructor(
    private readonly repository: TriviaQuestionRepository = new PrismaTriviaQuestionRepository(),
    private readonly provider?: TriviaQuestionProvider
  ) {}

  reset() {
    this.usedQuestionHashes.clear()
    this.usedQuestionFingerprints.clear()
    this.recentQuestions.length = 0
  }

  async getQuestion(options: TriviaQuestionRequest = {}): Promise<TriviaQuestionData> {
    const category = options.category ?? DEFAULT_CATEGORY
    const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY
    const excludeHashes = Array.from(this.usedQuestionHashes)
    const recentQuestions = this.recentQuestions.slice(-8)

    const databaseQuestion = await this.getDatabaseQuestion({ category, difficulty, excludeHashes })
    if (databaseQuestion) {
      return databaseQuestion
    }

    const generatedQuestion = await this.getGeneratedQuestion({ category, difficulty, excludeHashes, recentQuestions })
    if (generatedQuestion) {
      return generatedQuestion
    }

    return this.getFallbackQuestion({ category, difficulty })
  }

  private async getDatabaseQuestion(options: {
    category: TriviaCategory
    difficulty: TriviaDifficulty
    excludeHashes: string[]
  }) {
    try {
      const storedQuestion = await this.repository.findReusableQuestion(options)
      if (!storedQuestion) {
        return null
      }

      const question = normalizeStoredQuestion(storedQuestion)
      if (this.isQuestionUsed(question)) {
        return null
      }

      this.markUsed(question)
      await this.repository.markQuestionUsed(storedQuestion.id)
      return question
    } catch (error) {
      console.warn('[trivia] database question lookup failed', getErrorMessage(error))
      return null
    }
  }

  private async getGeneratedQuestion(options: {
    category: TriviaCategory
    difficulty: TriviaDifficulty
    excludeHashes: string[]
    recentQuestions: string[]
  }) {
    if (!this.provider) {
      return null
    }

    let lastErrorMessage = ''
    const maxRetries = getAiRetryCount()

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const generated = await this.provider.generateQuestion(options)
        const question = normalizeGeneratedQuestion(generated)
        if (this.isQuestionUsed(question)) {
          lastErrorMessage = 'Generated duplicate trivia question.'
          continue
        }

        const saved = await this.repository.saveGeneratedQuestion(question)
        const finalQuestion = saved ? normalizeStoredQuestion(saved) : question
        if (this.isQuestionUsed(finalQuestion)) {
          lastErrorMessage = 'Saved duplicate trivia question.'
          continue
        }

        this.markUsed(finalQuestion)
        return finalQuestion
      } catch (error) {
        lastErrorMessage = getErrorMessage(error)
      }
    }

    if (lastErrorMessage) {
      console.warn('[trivia] generated question rejected', lastErrorMessage)
    }

    return null
  }

  private getFallbackQuestion(options: TriviaQuestionRequest): TriviaQuestionData {
    const preferred = FALLBACK_QUESTIONS.filter((question) => {
      const categoryMatch = options.category === 'Mixed' || !options.category || question.category === options.category
      const difficultyMatch = !options.difficulty || question.difficulty === options.difficulty
      return categoryMatch && difficultyMatch && !this.isQuestionUsed(question)
    })

    const available = preferred.length > 0
      ? preferred
      : FALLBACK_QUESTIONS.filter((question) => !this.isQuestionUsed(question))

    if (available.length === 0) {
      this.reset()
      return this.getFallbackQuestion(options)
    }

    const question = {
      ...available[Math.floor(Math.random() * available.length)],
    }
    question.hash = question.hash ?? hashQuestion(question)
    this.markUsed(question)
    return question
  }

  private markUsed(question: TriviaQuestionData) {
    this.usedQuestionHashes.add(question.hash ?? hashQuestion(question))
    const fingerprint = getQuestionFingerprint(question.question)
    this.usedQuestionFingerprints.add(fingerprint)
    if (!this.recentQuestions.includes(question.question)) {
      this.recentQuestions.push(question.question)
    }
    if (this.recentQuestions.length > 20) {
      this.recentQuestions.splice(0, this.recentQuestions.length - 20)
    }
  }

  private isQuestionUsed(question: TriviaQuestionData) {
    const hash = question.hash ?? hashQuestion(question)
    if (this.usedQuestionHashes.has(hash)) {
      return true
    }

    return this.usedQuestionFingerprints.has(getQuestionFingerprint(question.question))
  }
}

function normalizeStoredQuestion(storedQuestion: StoredTriviaQuestion): TriviaQuestionData {
  const parsed = normalizeQuestionPayload({
    id: storedQuestion.id,
    question: storedQuestion.question,
    answers: storedQuestion.answers,
    correctId: storedQuestion.correctId,
    category: storedQuestion.category,
    difficulty: storedQuestion.difficulty,
    explanation: storedQuestion.explanation ?? undefined,
    tags: storedQuestion.tags,
  })

  return {
    ...parsed,
    id: parsed.id ?? storedQuestion.id,
    hash: storedQuestion.hash,
    source: storedQuestion.source === 'ai' ? 'ai' : 'database',
  }
}

function normalizeGeneratedQuestion(question: GeneratedTriviaQuestion): TriviaQuestionData {
  const parsed = normalizeQuestionPayload({
    ...question,
    id: question.id ?? `generated-${Date.now()}`,
  })

  return {
    ...parsed,
    id: parsed.id ?? `generated-${Date.now()}`,
    hash: hashQuestion(parsed),
    source: 'ai',
  }
}

function hashQuestion(question: Pick<TriviaQuestionData, 'question' | 'answers' | 'correctId'>) {
  const correctAnswer = question.answers.find((answer) => answer.id === question.correctId)
  const normalized = JSON.stringify({
    question: getQuestionFingerprint(question.question),
    answers: question.answers.map((answer) => answer.text.trim().toLowerCase()).sort(),
    correctAnswer: correctAnswer?.text.trim().toLowerCase() ?? '',
  })

  return createHash('sha256').update(normalized).digest('hex')
}

function normalizeQuestionPayload(payload: unknown) {
  const parsed = generatedTriviaQuestionSchema.parse(payload)
  const answerTexts = new Set(parsed.answers.map((answer) => answer.text.trim().toLowerCase()))
  if (answerTexts.size !== parsed.answers.length) {
    throw new Error('Trivia question has duplicate answer text.')
  }

  const answerIds = new Set(parsed.answers.map((answer) => answer.id))
  if (answerIds.size !== parsed.answers.length) {
    throw new Error('Trivia question has duplicate answer ids.')
  }

  const correctIndex = parsed.answers.findIndex((answer) => answer.id === parsed.correctId)
  if (correctIndex === -1) {
    throw new Error('Trivia question correct answer does not match any answer id.')
  }

  return {
    ...parsed,
    answers: parsed.answers.map((answer, index) => ({
      id: ANSWER_IDS[index],
      text: answer.text.trim(),
    })),
    correctId: ANSWER_IDS[correctIndex],
  }
}

function getAiRetryCount() {
  const parsed = Number(process.env.TRIVIA_AI_MAX_RETRIES ?? DEFAULT_AI_RETRIES)
  if (!Number.isFinite(parsed)) {
    return DEFAULT_AI_RETRIES
  }

  return Math.max(DEFAULT_AI_RETRIES, Math.floor(parsed))
}

function getQuestionFingerprint(question: string) {
  return question.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}
