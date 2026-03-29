import test from 'node:test'
import assert from 'node:assert/strict'

import { FLAGEL_EVENTS, type GameConfig, type GameEventResult } from '@mini-arcade/shared'

import { FlagelRuntime } from './FlagelRuntime'
import type { Country } from './countryData'

class TestFlagelRuntime extends FlagelRuntime {
  async end(): Promise<GameEventResult> {
    const mutableThis = this as unknown as { phase: 'gameEnd' }
    mutableThis.phase = 'gameEnd'
    return {
      success: true,
      broadcast: [
        {
          event: FLAGEL_EVENTS.GAME_ENDED,
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

  setSecretCountryForTest(secretCountry: Country) {
    const mutableThis = this as unknown as { secretCountry: Country }
    mutableThis.secretCountry = secretCountry
  }
}

function createRuntime() {
  const config: GameConfig = {
    gameId: 'flagel',
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

  return new TestFlagelRuntime(io, config, roomService)
}

const GERMANY: Country = {
  code: 'DE',
  name: 'Germany',
  flagEmoji: '🇩🇪',
  capital: 'Berlin',
  continent: 'Europe',
  latitude: 51.1657,
  longitude: 10.4515,
}

test('FlagelRuntime rejects duplicate country guesses from the same player', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretCountryForTest(GERMANY)

  const first = await runtime.onClientEvent('user-1', FLAGEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'France',
  })
  const second = await runtime.onClientEvent('user-1', FLAGEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'France',
  })

  assert.equal(first.success, true)
  assert.equal(second.success, false)
  assert.match(second.error ?? '', /already tried/i)
})

test('FlagelRuntime awards first-attempt points for a correct answer', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretCountryForTest(GERMANY)

  const result = await runtime.onClientEvent('user-1', FLAGEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'Germany',
  })

  assert.equal(result.success, true)

  const personalResult = result.broadcast?.find(
    (entry) => entry.event === FLAGEL_EVENTS.GUESS_RESULT && entry.playerId === 'user-1'
  )

  assert.ok(personalResult)
  assert.deepEqual(personalResult.data, {
    guess: 'Germany',
    isCorrect: true,
    distance: 0,
    direction: undefined,
    attemptsUsed: 1,
    maxAttempts: 6,
  })

  const syncPayload = runtime.getPlayerSyncData('user-1') as {
    scores: Record<string, number>
    playerStatuses: Array<{
      playerId: string
      solved: boolean
      finished: boolean
      attemptCount: number
    }>
  }

  assert.equal(syncPayload.scores['user-1'], 1000)
  const playerStatus = syncPayload.playerStatuses.find((entry) => entry.playerId === 'user-1')
  assert.ok(playerStatus)
  assert.equal(playerStatus.solved, true)
  assert.equal(playerStatus.finished, true)
  assert.equal(playerStatus.attemptCount, 1)
})

test('FlagelRuntime ends the match once the last player finishes by skipping', async () => {
  const runtime = createRuntime()
  await runtime.initialize()
  await runtime.start()
  runtime.setSecretCountryForTest(GERMANY)

  const solvedByUserOne = await runtime.onClientEvent('user-1', FLAGEL_EVENTS.SUBMIT_GUESS, {
    roomCode: 'ABC123',
    guess: 'Germany',
  })
  const skippedByUserTwo = await runtime.onClientEvent('user-2', FLAGEL_EVENTS.SKIP, {
    roomCode: 'ABC123',
  })

  assert.equal(solvedByUserOne.success, true)
  assert.equal(skippedByUserTwo.success, true)
  assert.equal(runtime.getSnapshot().phase, 'gameEnd')

  const roundEndedBroadcast = skippedByUserTwo.broadcast?.find(
    (entry) => entry.event === FLAGEL_EVENTS.ROUND_ENDED
  )
  const gameEndedBroadcast = skippedByUserTwo.broadcast?.find(
    (entry) => entry.event === FLAGEL_EVENTS.GAME_ENDED
  )

  assert.ok(roundEndedBroadcast)
  assert.ok(gameEndedBroadcast)
})
