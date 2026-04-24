import test from 'node:test'
import assert from 'node:assert/strict'

import type { TriviaCategory, TriviaDifficulty } from '@mini-arcade/shared'

import {
  QuestionService,
  type GeneratedTriviaQuestion,
  type TriviaQuestionData,
  type TriviaQuestionProvider,
  type TriviaQuestionRepository,
} from './questionService'

class MemoryRepository implements TriviaQuestionRepository {
  public saved: TriviaQuestionData[] = []
  public usedIds: string[] = []

  constructor(private readonly questions: TriviaQuestionData[] = []) {}

  async findReusableQuestion(options: {
    category: TriviaCategory
    difficulty: TriviaDifficulty
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
      source: question.source ?? 'database',
    }
  }

  async saveGeneratedQuestion(question: TriviaQuestionData) {
    this.saved.push(question)

    if (!question.hash) {
      return null
    }

    return {
      id: `saved-${this.saved.length}`,
      hash: question.hash,
      question: question.question,
      answers: question.answers,
      correctId: question.correctId,
      explanation: question.explanation ?? null,
      category: question.category,
      difficulty: question.difficulty,
      tags: question.tags ?? [],
      source: question.source ?? 'ai',
    }
  }

  async markQuestionUsed(id: string) {
    this.usedIds.push(id)
  }
}

class StaticProvider implements TriviaQuestionProvider {
  constructor(private readonly question: GeneratedTriviaQuestion) {}

  async generateQuestion() {
    return this.question
  }
}

class SequenceProvider implements TriviaQuestionProvider {
  private index = 0

  constructor(private readonly questions: GeneratedTriviaQuestion[]) {}

  async generateQuestion() {
    const question = this.questions[Math.min(this.index, this.questions.length - 1)]
    this.index += 1
    return question
  }
}

const databaseQuestion: TriviaQuestionData = {
  id: 'db-1',
  hash: 'db-hash-1',
  question: 'Which company created the PlayStation console brand?',
  answers: [
    { id: 'a', text: 'Sony' },
    { id: 'b', text: 'Nintendo' },
    { id: 'c', text: 'Sega' },
    { id: 'd', text: 'Atari' },
  ],
  correctId: 'a',
  category: 'Gaming',
  difficulty: 'easy',
  explanation: 'Sony launched the original PlayStation in the 1990s.',
  tags: ['playstation'],
  source: 'database',
}

test('QuestionService prefers approved database questions that match category and difficulty', async () => {
  const repository = new MemoryRepository([databaseQuestion])
  const service = new QuestionService(repository)

  const question = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })

  assert.equal(question.id, 'db-1')
  assert.equal(question.category, 'Gaming')
  assert.deepEqual(repository.usedIds, ['db-1'])
})

test('QuestionService saves and returns a valid generated question when the database has no match', async () => {
  const repository = new MemoryRepository()
  const provider = new StaticProvider({
    question: 'Which planet has the Great Red Spot?',
    answers: [
      { id: 'a', text: 'Mars' },
      { id: 'b', text: 'Jupiter' },
      { id: 'c', text: 'Venus' },
      { id: 'd', text: 'Neptune' },
    ],
    correctId: 'b',
    category: 'Science & Nature',
    difficulty: 'medium',
    explanation: 'The Great Red Spot is a giant storm on Jupiter.',
    tags: ['space'],
  })
  const service = new QuestionService(repository, provider)

  const question = await service.getQuestion({ category: 'Science & Nature', difficulty: 'medium' })

  assert.equal(question.source, 'ai')
  assert.equal(question.correctId, 'b')
  assert.equal(repository.saved.length, 1)
  assert.ok(question.hash)
})

test('QuestionService falls back when generated questions are malformed', async () => {
  const repository = new MemoryRepository()
  const provider = new StaticProvider({
    question: 'Bad duplicate answers?',
    answers: [
      { id: 'a', text: 'Same' },
      { id: 'b', text: 'Same' },
      { id: 'c', text: 'Different' },
      { id: 'd', text: 'Other' },
    ],
    correctId: 'a',
    category: 'Gaming',
    difficulty: 'easy',
    explanation: 'Duplicate answers should be rejected.',
  })
  const service = new QuestionService(repository, provider)

  const question = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })

  assert.equal(question.source, 'fallback')
  assert.notEqual(question.question, 'Bad duplicate answers?')
})

test('QuestionService reindexes answer ids so the correct answer stays aligned with its text', async () => {
  const repository = new MemoryRepository()
  const provider = new StaticProvider({
    question: 'Which planet has the Great Red Spot?',
    answers: [
      { id: 'd', text: 'Mars' },
      { id: 'b', text: 'Venus' },
      { id: 'a', text: 'Jupiter' },
      { id: 'c', text: 'Neptune' },
    ],
    correctId: 'a',
    category: 'Science & Nature',
    difficulty: 'medium',
    explanation: 'The Great Red Spot is a giant storm on Jupiter.',
    tags: ['space'],
  })
  const service = new QuestionService(repository, provider)

  const question = await service.getQuestion({ category: 'Science & Nature', difficulty: 'medium' })

  assert.deepEqual(
    question.answers.map((answer) => answer.id),
    ['a', 'b', 'c', 'd']
  )
  assert.equal(question.answers[2]?.text, 'Jupiter')
  assert.equal(question.correctId, 'c')
})

test('QuestionService retries generated questions when the model repeats the same prompt', async () => {
  const repository = new MemoryRepository()
  const provider = new SequenceProvider([
    {
      question: 'Which planet has the Great Red Spot?',
      answers: [
        { id: 'a', text: 'Mars' },
        { id: 'b', text: 'Jupiter' },
        { id: 'c', text: 'Venus' },
        { id: 'd', text: 'Neptune' },
      ],
      correctId: 'b',
      category: 'Science & Nature',
      difficulty: 'medium',
      explanation: 'The Great Red Spot is a giant storm on Jupiter.',
      tags: ['space'],
    },
    {
      question: 'Which gas do plants absorb from the atmosphere?',
      answers: [
        { id: 'a', text: 'Oxygen' },
        { id: 'b', text: 'Nitrogen' },
        { id: 'c', text: 'Carbon dioxide' },
        { id: 'd', text: 'Hydrogen' },
      ],
      correctId: 'c',
      category: 'Science & Nature',
      difficulty: 'medium',
      explanation: 'Plants use carbon dioxide during photosynthesis.',
      tags: ['biology'],
    },
  ])
  const previousRetryCount = process.env.TRIVIA_AI_MAX_RETRIES
  process.env.TRIVIA_AI_MAX_RETRIES = '2'

  try {
    const service = new QuestionService(repository, provider)

    const first = await service.getQuestion({ category: 'Science & Nature', difficulty: 'medium' })
    const second = await service.getQuestion({ category: 'Science & Nature', difficulty: 'medium' })

    assert.equal(first.question, 'Which planet has the Great Red Spot?')
    assert.equal(second.question, 'Which gas do plants absorb from the atmosphere?')
  } finally {
    if (previousRetryCount === undefined) {
      delete process.env.TRIVIA_AI_MAX_RETRIES
    } else {
      process.env.TRIVIA_AI_MAX_RETRIES = previousRetryCount
    }
  }
})
