import type { GameId, GameSettings } from '@arcado/shared'

export function buildSoloPlayUrl(gameId: GameId, options?: { session?: string; settings?: GameSettings }) {
  const params = new URLSearchParams()

  params.set('session', options?.session ?? String(Date.now()))

  if (gameId === 'trivia' && options?.settings) {
    if (typeof options.settings.rounds === 'number') {
      params.set('rounds', String(options.settings.rounds))
    }

    if (options.settings.triviaDifficulty) {
      params.set('difficulty', options.settings.triviaDifficulty)
    }

    const categories =
      options.settings.triviaCategories?.length
        ? options.settings.triviaCategories
        : options.settings.triviaCategory
          ? [options.settings.triviaCategory]
          : []

    if (categories.length > 0) {
      params.set('categories', categories.join(','))
    }
  }

  return `/play/${gameId}?${params.toString()}`
}
