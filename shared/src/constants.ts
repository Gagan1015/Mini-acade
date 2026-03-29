import type { GameId } from './types'

export const GAMES: Record<
  GameId,
  {
    id: GameId
    name: string
    description: string
    minPlayers: number
    maxPlayers: number
    icon: string
  }
> = {
  skribble: {
    id: 'skribble',
    name: 'Skribble',
    description: 'Draw and guess with friends',
    minPlayers: 2,
    maxPlayers: 8,
    icon: 'pencil',
  },
  trivia: {
    id: 'trivia',
    name: 'Trivia',
    description: 'Race to answer before time runs out',
    minPlayers: 1,
    maxPlayers: 10,
    icon: 'brain',
  },
  wordel: {
    id: 'wordel',
    name: 'Wordel',
    description: 'Guess the hidden word in six tries',
    minPlayers: 1,
    maxPlayers: 4,
    icon: 'letter',
  },
  flagel: {
    id: 'flagel',
    name: 'Flagel',
    description: 'Identify the country from the flag',
    minPlayers: 1,
    maxPlayers: 4,
    icon: 'flag',
  },
}

export const ROOM_CONFIG = {
  codeLength: 6,
  maxPlayersDefault: 8,
  disconnectGracePeriod: 10_000,
} as const
