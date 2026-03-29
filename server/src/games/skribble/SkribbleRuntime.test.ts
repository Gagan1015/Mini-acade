import test from 'node:test'
import assert from 'node:assert/strict'

import { SKRIBBLE_EVENTS, type GameConfig, type GameEventResult } from '@mini-arcade/shared'

import { SkribbleRuntime } from './SkribbleRuntime'

class TestSkribbleRuntime extends SkribbleRuntime {
  async end(): Promise<GameEventResult> {
    const mutableThis = this as unknown as { phase: 'gameEnd' }
    mutableThis.phase = 'gameEnd'
    return {
      success: true,
    }
  }

  setRoundWordForTest(word: string) {
    const mutableThis = this as unknown as {
      roundState: {
        word: string
        wordHint: string
      }
    }

    mutableThis.roundState.word = word
    mutableThis.roundState.wordHint = `${word.charAt(0).toUpperCase()} _`
  }
}

function createRuntime() {
  const config: GameConfig = {
    gameId: 'skribble',
    roomCode: 'ABC123',
    players: [
      {
        id: 'user-1',
        name: 'Alpha',
        isHost: true,
        isConnected: true,
        score: 0,
      },
      {
        id: 'user-2',
        name: 'Bravo',
        isHost: false,
        isConnected: true,
        score: 0,
      },
      {
        id: 'user-3',
        name: 'Charlie',
        isHost: false,
        isConnected: true,
        score: 0,
      },
    ],
    settings: {
      rounds: 1,
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

  return new TestSkribbleRuntime(io, config, roomService)
}

test('SkribbleRuntime only allows the active drawer to submit strokes', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  const startResult = await runtime.start()

  const roomBroadcast = startResult.broadcast?.find((entry) => entry.event === SKRIBBLE_EVENTS.ROUND_STARTED)
  assert.ok(roomBroadcast)
  const drawerId = (roomBroadcast.data as { drawerId: string }).drawerId
  const nonDrawerId = ['user-1', 'user-2', 'user-3'].find((playerId) => playerId !== drawerId) ?? 'user-2'

  const denied = await runtime.onClientEvent(nonDrawerId, SKRIBBLE_EVENTS.STROKE_BATCH, {
    roomCode: 'ABC123',
    strokes: [
      {
        points: [{ x: 10, y: 10 }],
        color: '#ffffff',
        width: 4,
        tool: 'brush',
      },
    ],
    timestamp: Date.now(),
  })

  assert.equal(denied.success, false)
  assert.match(denied.error ?? '', /drawer/i)
})

test('SkribbleRuntime scores the first correct guess and marks the player as correct', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  const startResult = await runtime.start()

  const roomBroadcast = startResult.broadcast?.find((entry) => entry.event === SKRIBBLE_EVENTS.ROUND_STARTED)
  assert.ok(roomBroadcast)
  const drawerId = (roomBroadcast.data as { drawerId: string }).drawerId
  const guesserId = ['user-1', 'user-2', 'user-3'].find((playerId) => playerId !== drawerId) ?? 'user-2'

  runtime.setRoundWordForTest('rocket')

  const result = await runtime.onClientEvent(guesserId, SKRIBBLE_EVENTS.GUESS, {
    roomCode: 'ABC123',
    guess: 'rocket',
  })

  assert.equal(result.success, true)

  const guessResult = result.broadcast?.find(
    (entry) => entry.event === SKRIBBLE_EVENTS.GUESS_RESULT && entry.playerId === guesserId
  )

  assert.ok(guessResult)
  assert.deepEqual(guessResult.data, {
    playerId: guesserId,
    isCorrect: true,
    pointsEarned: 100,
  })

  const syncPayload = runtime.getPlayerSyncData(guesserId) as {
    correctGuessers: string[]
  }

  assert.deepEqual(syncPayload.correctGuessers, [guesserId])
})

test('SkribbleRuntime ends the game once every guesser has guessed correctly', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  const startResult = await runtime.start()

  const roomBroadcast = startResult.broadcast?.find((entry) => entry.event === SKRIBBLE_EVENTS.ROUND_STARTED)
  assert.ok(roomBroadcast)
  const drawerId = (roomBroadcast.data as { drawerId: string }).drawerId
  const guessers = ['user-1', 'user-2', 'user-3'].filter((playerId) => playerId !== drawerId)

  runtime.setRoundWordForTest('rocket')

  const first = await runtime.onClientEvent(guessers[0], SKRIBBLE_EVENTS.GUESS, {
    roomCode: 'ABC123',
    guess: 'rocket',
  })
  const second = await runtime.onClientEvent(guessers[1], SKRIBBLE_EVENTS.GUESS, {
    roomCode: 'ABC123',
    guess: 'rocket',
  })

  assert.equal(first.success, true)
  assert.equal(second.success, true)
  assert.equal(runtime.getSnapshot().phase, 'gameEnd')

  const roundEnded = second.broadcast?.find((entry) => entry.event === SKRIBBLE_EVENTS.ROUND_ENDED)
  assert.ok(roundEnded)
})
