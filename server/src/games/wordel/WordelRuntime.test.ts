import test from 'node:test'
import assert from 'node:assert/strict'

import { WORDEL_EVENTS, type GameConfig, type GameEventResult } from '@arcado/shared'

import { WordelRuntime } from './WordelRuntime'

class TestWordelRuntime extends WordelRuntime {
  async end(): Promise<GameEventResult> {
    const mutableThis = this as unknown as { phase: 'gameEnd' }
    mutableThis.phase = 'gameEnd'
    return {
      success: true,
      broadcast: [
        {
          event: WORDEL_EVENTS.GAME_ENDED,
          to: 'room',
          data: {
            finalScores: this.getResults().map((result) => ({
              playerId: result.playerId,
              score: result.score,
              rank: result.rank,
            })),
          },
        },
      ],
    }
  }

  setSecretWordForTest(secretWord: string) {
    const mutableThis = this as unknown as { secretWord: string }
    mutableThis.secretWord = secretWord
  }
}

function createRuntime(settings: GameConfig['settings'] = { rounds: 1 }) {
  const config: GameConfig = {
    gameId: 'wordel',
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
    ],
    settings,
  }

  const io = {
    to: () => ({
      emit: () => undefined,
    }),
  } as never

  const roomService = {
    applyGameResults: async () => undefined,
  } as never

  return new TestWordelRuntime(io, config, roomService)
}

test('WordelRuntime rejects guesses outside the bundled dictionary', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretWordForTest('APPLE')

  const result = await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'QWERT',
  })

  assert.equal(result.success, false)
  assert.match(result.error ?? '', /dictionary/i)
})

test('WordelRuntime accepts valid five-letter words from the expanded dictionary', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretWordForTest('APPLE')

  const result = await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'AAHED',
  })

  assert.equal(result.success, true)
})

test('WordelRuntime rejects duplicate guesses from the same player', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretWordForTest('APPLE')

  const first = await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'MANGO',
  })
  const second = await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'MANGO',
  })

  assert.equal(first.success, true)
  assert.equal(second.success, false)
  assert.match(second.error ?? '', /already tried/i)
})

test('WordelRuntime ends the match once every player is finished', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretWordForTest('APPLE')

  const solvedByUserOne = await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'APPLE',
  })

  const solvedByUserTwo = await runtime.onClientEvent('user-2', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'APPLE',
  })

  assert.equal(solvedByUserOne.success, true)
  assert.equal(solvedByUserTwo.success, true)
  assert.equal(runtime.getSnapshot().phase, 'gameEnd')

  const finalBroadcast = solvedByUserTwo.broadcast?.find(
    (entry) => entry.event === WORDEL_EVENTS.GAME_ENDED
  )

  assert.ok(finalBroadcast)
})

test('WordelRuntime starts another round when configured for multiple rounds', async () => {
  const runtime = createRuntime({ rounds: 2 })
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretWordForTest('APPLE')

  await runtime.onClientEvent('user-1', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'APPLE',
  })

  const roundOneComplete = await runtime.onClientEvent('user-2', WORDEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'APPLE',
  })

  assert.equal(roundOneComplete.success, true)
  assert.equal(runtime.getSnapshot().phase, 'playing')
  assert.equal(runtime.getSnapshot().currentRound, 2)

  const nextRoundBroadcast = roundOneComplete.broadcast?.find(
    (entry) =>
      entry.event === WORDEL_EVENTS.ROUND_STARTED &&
      (entry.data as { roundNumber: number }).roundNumber === 2
  )
  const finalBroadcast = roundOneComplete.broadcast?.find(
    (entry) => entry.event === WORDEL_EVENTS.GAME_ENDED
  )

  assert.ok(nextRoundBroadcast)
  assert.equal(finalBroadcast, undefined)
})
