import type { TriviaCategory, TriviaDifficulty } from '@mini-arcade/shared'

import { GeminiClient } from '../../../lib/gemini'
import type { GeneratedTriviaQuestion, TriviaQuestionProvider } from '../questionService'

const TAGS_BY_CATEGORY: Record<TriviaCategory, string[]> = {
  Mixed: ['movies', 'music', 'sports', 'gaming', 'science', 'history', 'geography', 'internet-culture'],
  'Movies & TV': ['marvel', 'bollywood', 'animation', 'streaming', 'classic-cinema'],
  Music: ['pop', 'k-pop', 'hip-hop', 'rock', 'albums', 'artists'],
  Sports: ['cricket', 'football', 'nba', 'tennis', 'olympics', 'esports'],
  Gaming: ['minecraft', 'nintendo', 'playstation', 'xbox', 'esports', 'gaming-history'],
  'Science & Nature': ['space', 'animals', 'physics', 'biology', 'environment'],
  'History & Culture': ['ancient-history', 'modern-history', 'mythology', 'festivals', 'inventions'],
  'Geography & Travel': ['world-capitals', 'landmarks', 'flags', 'languages', 'food'],
  'Internet & Tech': ['apps', 'gadgets', 'startups', 'ai', 'web-culture'],
  'Food & Lifestyle': ['cuisine', 'brands', 'health-basics', 'everyday-culture'],
}

export class GeminiTriviaProvider implements TriviaQuestionProvider {
  constructor(private readonly client = new GeminiClient()) {}

  async generateQuestion(options: {
    category?: TriviaCategory
    difficulty?: TriviaDifficulty
    excludeHashes: string[]
    recentQuestions: string[]
  }): Promise<GeneratedTriviaQuestion> {
    const category = options.category ?? 'Mixed'
    const difficulty = options.difficulty ?? 'medium'

    const payload = await this.client.generateJson(buildPrompt({
      category,
      difficulty,
      allowedTags: TAGS_BY_CATEGORY[category],
      recentQuestions: options.recentQuestions,
    }))

    return payload as GeneratedTriviaQuestion
  }
}

function buildPrompt(options: {
  category: TriviaCategory
  difficulty: TriviaDifficulty
  allowedTags: string[]
  recentQuestions: string[]
}) {
  const recentQuestionBlock =
    options.recentQuestions.length > 0
      ? [
          'Do not repeat or closely paraphrase any of these recent questions:',
          ...options.recentQuestions.map((question) => `- ${question}`),
        ]
      : []

  return [
    'Return only JSON for exactly one multiplayer trivia question.',
    'Use this TypeScript shape:',
    '{"question":string,"answers":[{"id":"a","text":string},{"id":"b","text":string},{"id":"c","text":string},{"id":"d","text":string}],"correctId":"a"|"b"|"c"|"d","category":string,"difficulty":"easy"|"medium"|"hard","explanation":string,"tags":string[]}',
    `Category must be "${options.category}". Difficulty must be "${options.difficulty}".`,
    `Use tags only from this list when possible: ${options.allowedTags.join(', ')}.`,
    'Question must be factual, concise, safe for all ages, and not depend on today\'s breaking news.',
    'Explanation must be one helpful sentence under 180 characters.',
    'Answers must be plausible, unique, and under 120 characters each.',
    ...recentQuestionBlock,
  ].join('\n')
}
