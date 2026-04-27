import test from 'node:test'
import assert from 'node:assert/strict'

import type { TriviaCategory, TriviaDifficulty } from '@arcado/shared'

import {
  QuestionService,
  type TriviaQuestionData,
  type TriviaQuestionRepository,
} from './questionService'

class MemoryRepository implements TriviaQuestionRepository {
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
      source: question.source ?? 'seed',
    }
  }

  async markQuestionUsed(id: string) {
    this.usedIds.push(id)
  }
}

const gamingQuestionA: TriviaQuestionData = {
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

const gamingQuestionB: TriviaQuestionData = {
  id: 'db-2',
  hash: 'db-hash-2',
  question: 'Which hero wears green and explores Hyrule?',
  answers: [
    { id: 'a', text: 'Mario' },
    { id: 'b', text: 'Link' },
    { id: 'c', text: 'Samus' },
    { id: 'd', text: 'Kirby' },
  ],
  correctId: 'b',
  category: 'Gaming',
  difficulty: 'easy',
  explanation: 'Link is the recurring hero of The Legend of Zelda.',
  tags: ['zelda'],
  source: 'database',
}

test('QuestionService prefers approved database questions that match category and difficulty', async () => {
  const repository = new MemoryRepository([gamingQuestionA])
  const service = new QuestionService(repository)

  const question = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })

  assert.equal(question.id, 'db-1')
  assert.equal(question.category, 'Gaming')
  assert.deepEqual(repository.usedIds, ['db-1'])
})

test('QuestionService rotates to another database question before reusing one in the same session', async () => {
  const repository = new MemoryRepository([gamingQuestionA, gamingQuestionB])
  const service = new QuestionService(repository)

  const first = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })
  const second = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })

  assert.equal(first.id, 'db-1')
  assert.equal(second.id, 'db-2')
  assert.deepEqual(repository.usedIds, ['db-1', 'db-2'])
})

test('QuestionService recycles approved questions only after exhausting the available pool', async () => {
  const repository = new MemoryRepository([gamingQuestionA])
  const service = new QuestionService(repository)

  const first = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })
  const second = await service.getQuestion({ category: 'Gaming', difficulty: 'easy' })

  assert.equal(first.id, 'db-1')
  assert.equal(second.id, 'db-1')
  assert.deepEqual(repository.usedIds, ['db-1', 'db-1'])
})

test('QuestionService throws when no approved database questions exist for the requested bucket', async () => {
  const repository = new MemoryRepository([])
  const service = new QuestionService(repository)

  await assert.rejects(
    () => service.getQuestion({ category: 'Movies & TV', difficulty: 'hard' }),
    /No approved trivia questions found/
  )
})
