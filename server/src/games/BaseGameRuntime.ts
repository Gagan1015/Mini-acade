import { prisma, type Prisma } from '@mini-arcade/db'
import type {
  GameConfig,
  GameEventResult,
  GamePhase,
  GameResultData,
  GameSnapshot,
  IGameRuntime,
  Player,
  GameId,
  UserId,
} from '@mini-arcade/shared'
import type { Server } from 'socket.io'

import { RoomService } from '../services/roomService'

export abstract class BaseGameRuntime implements IGameRuntime {
  protected readonly roomCode: string
  protected readonly gameId: GameId
  protected readonly players = new Map<UserId, Player>()
  protected readonly scores = new Map<UserId, number>()
  protected currentRound = 0
  protected totalRounds: number
  protected phase: GamePhase = 'waiting'

  constructor(
    protected readonly io: Server,
    protected readonly config: GameConfig,
    protected readonly roomService: RoomService
  ) {
    this.roomCode = config.roomCode
    this.gameId = config.gameId
    this.totalRounds = config.settings?.rounds ?? 1

    for (const player of config.players) {
      this.players.set(player.id, player)
      this.scores.set(player.id, player.score ?? 0)
    }
  }

  async initialize() {}

  abstract start(): Promise<GameEventResult>
  abstract onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult>
  abstract getPlayerSyncData(playerId: UserId): unknown

  async end(): Promise<GameEventResult> {
    this.phase = 'gameEnd'
    await this.persistResults()

    return {
      success: true,
    }
  }

  onPlayerJoin(player: Player): GameEventResult {
    this.players.set(player.id, player)
    if (!this.scores.has(player.id)) {
      this.scores.set(player.id, 0)
    }

    return { success: true }
  }

  onPlayerLeave(playerId: UserId): GameEventResult {
    const player = this.players.get(playerId)
    if (player) {
      this.players.set(playerId, {
        ...player,
        isConnected: false,
      })
    }

    return { success: true }
  }

  onPlayerReconnect(playerId: UserId): GameEventResult {
    const player = this.players.get(playerId)
    if (player) {
      this.players.set(playerId, {
        ...player,
        isConnected: true,
      })
    }

    return {
      success: true,
      broadcast: [
        {
          event: `${this.gameId}:sync`,
          data: this.getPlayerSyncData(playerId),
          to: 'player',
          playerId,
        },
      ],
    }
  }

  getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      scores: Object.fromEntries(this.scores),
    }
  }

  getResults(): GameResultData[] {
    const sortedScores = Array.from(this.scores.entries()).sort((left, right) => right[1] - left[1])
    const highestScore = sortedScores[0]?.[1] ?? 0

    return sortedScores.map(([playerId, score], index) => ({
      playerId,
      score,
      rank: index + 1,
      isWinner: score === highestScore,
    }))
  }

  protected getConnectedPlayers() {
    return Array.from(this.players.values()).filter((player) => player.isConnected)
  }

  protected setPlayerScore(playerId: UserId, score: number) {
    this.scores.set(playerId, score)
  }

  protected async updateRoomPresenceStatus(status: GamePhase | 'finished') {
    await this.roomService.applyGameResults({
      roomCode: this.roomCode,
      status: status === 'finished' || status === 'gameEnd' ? 'finished' : 'playing',
      scores: Object.fromEntries(this.scores),
    })
  }

  /**
   * Self-dispatch broadcasts using the io instance directly.
   * Used for timer-triggered events where there is no triggering client socket.
   */
  protected async broadcastToRoom(result: GameEventResult) {
    if (!result.broadcast) return

    for (const broadcast of result.broadcast) {
      if (broadcast.to === 'room') {
        this.io.to(this.roomCode).emit(broadcast.event as string, broadcast.data)
        continue
      }

      if (broadcast.to === 'player' && broadcast.playerId) {
        try {
          const roomSockets = await this.io.in(this.roomCode).fetchSockets()
          const target = roomSockets.find((s) => s.data.userId === broadcast.playerId)
          if (target) {
            target.emit(broadcast.event as string, broadcast.data as never)
          }
        } catch {
          // Socket lookup failed — player may have disconnected
        }
      }
    }
  }

  protected getFinalScores() {
    return this.getResults().map((result) => ({
      playerId: result.playerId,
      score: result.score,
      rank: result.rank,
    }))
  }

  private async persistResults() {
    const room = await prisma.room.findUnique({
      where: { code: this.roomCode },
      select: { id: true },
    })

    if (!room) {
      return
    }

    const results = this.getResults()

    for (const result of results) {
      await prisma.gameResult.create({
        data: {
          roomId: room.id,
          userId: result.playerId,
          gameId: this.gameId,
          score: result.score,
          rank: result.rank,
          isWinner: result.isWinner,
          metadata: result.metadata as Prisma.InputJsonValue | undefined,
        },
      })

      const existingStat = await prisma.gameStat.findUnique({
        where: {
          userId_gameId: {
            userId: result.playerId,
            gameId: this.gameId,
          },
        },
      })

      if (!existingStat) {
        await prisma.gameStat.create({
          data: {
            userId: result.playerId,
            gameId: this.gameId,
            gamesPlayed: 1,
            gamesWon: result.isWinner ? 1 : 0,
            totalScore: result.score,
            highScore: result.score,
          },
        })
      } else {
        await prisma.gameStat.update({
          where: {
            userId_gameId: {
              userId: result.playerId,
              gameId: this.gameId,
            },
          },
          data: {
            gamesPlayed: existingStat.gamesPlayed + 1,
            gamesWon: existingStat.gamesWon + (result.isWinner ? 1 : 0),
            totalScore: existingStat.totalScore + result.score,
            highScore: Math.max(existingStat.highScore, result.score),
          },
        })
      }
    }

    await prisma.room.update({
      where: { code: this.roomCode },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
      },
    })

    await this.updateRoomPresenceStatus('finished')
  }
}
