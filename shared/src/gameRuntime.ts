import type { GameId, Player, UserId } from './types'

export type GamePhase = 'waiting' | 'playing' | 'roundEnd' | 'gameEnd'

export interface GameSettings {
  rounds?: number
  roundTime?: number
  maxPlayers?: number
  customSettings?: Record<string, unknown>
}

export interface GameConfig {
  gameId: GameId
  roomCode: string
  players: Player[]
  settings?: GameSettings
}

export interface GameSnapshot {
  phase: GamePhase
  currentRound: number
  totalRounds: number
  scores: Record<UserId, number>
  roundData?: unknown
  timeRemaining?: number
}

export interface GameBroadcast {
  event: string
  data: unknown
  to: 'room' | 'player'
  playerId?: UserId
}

export interface GameEventResult {
  success: boolean
  broadcast?: GameBroadcast[]
  error?: string
}

export interface GameResultData {
  playerId: UserId
  score: number
  rank: number
  isWinner: boolean
  metadata?: Record<string, unknown>
}

export interface IGameRuntime {
  initialize(): Promise<void>
  start(): Promise<GameEventResult>
  end(): Promise<GameEventResult>
  onPlayerJoin(player: Player): GameEventResult
  onPlayerLeave(playerId: UserId): GameEventResult
  onPlayerReconnect(playerId: UserId): GameEventResult
  onClientEvent(playerId: UserId, eventName: string, payload: unknown): Promise<GameEventResult>
  getSnapshot(): GameSnapshot
  getPlayerSyncData(playerId: UserId): unknown
  getResults(): GameResultData[]
}
