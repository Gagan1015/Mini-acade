import test from 'node:test'
import assert from 'node:assert/strict'

import { TRIVIA_EVENTS, type GameConfig, type GameEventResult } from '@mini-arcade/shared'

import { TriviaRuntime } from './TriviaRuntime'

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
      triviaCategory: 'Mixed',
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

  return new TestTriviaRuntime(io, config, roomService)
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
