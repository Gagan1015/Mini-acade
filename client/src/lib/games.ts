import type { GameId } from '@mini-arcade/shared'

export interface GameInfo {
  id: GameId
  name: string
  description: string
  emoji: string // kept for fallback
  color: string
  colorHex: string // raw hex for dynamic glow effects
  gradient: string
  minPlayers: number
  maxPlayers: number
  features: string[]
}

export const GAME_LIST: GameInfo[] = [
  {
    id: 'skribble',
    name: 'Skribble',
    description:
      'Draw and guess words with friends. Take turns drawing while others try to guess the word!',
    emoji: '🎨',
    color: 'var(--game-skribble)',
    colorHex: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
    minPlayers: 2,
    maxPlayers: 8,
    features: ['Real-time drawing', 'Word hints', 'Score tracking'],
  },
  {
    id: 'trivia',
    name: 'Trivia',
    description:
      'Test your knowledge against friends! Answer questions faster than everyone else to score big.',
    emoji: '🧠',
    color: 'var(--game-trivia)',
    colorHex: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    minPlayers: 1,
    maxPlayers: 10,
    features: ['Multiple categories', 'Speed scoring', 'Leaderboards'],
  },
  {
    id: 'wordel',
    name: 'Wordel',
    description:
      'Guess the 5-letter word in 6 tries. Color-coded hints guide your guesses!',
    emoji: '📝',
    color: 'var(--game-wordel)',
    colorHex: '#10B981',
    gradient: 'from-emerald-500 to-green-600',
    minPlayers: 1,
    maxPlayers: 4,
    features: ['Daily words', 'Multiplayer race', 'Streak tracking'],
  },
  {
    id: 'flagel',
    name: 'Flagel',
    description:
      'Identify countries by their flags. Progressive hints help you learn world geography!',
    emoji: '🏳️',
    color: 'var(--game-flagel)',
    colorHex: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    minPlayers: 1,
    maxPlayers: 4,
    features: ['195+ countries', 'Hint system', 'Geography facts'],
  },
]

export function getGameInfo(id: GameId): GameInfo | undefined {
  return GAME_LIST.find((g) => g.id === id)
}
