import test from 'node:test'
import assert from 'node:assert/strict'

import { buildGuessResult, isAllowedWordelGuess, normalizeWordelGuess } from './wordRules'

test('normalizeWordelGuess trims and uppercases input', () => {
  assert.equal(normalizeWordelGuess('  apple '), 'APPLE')
})

test('isAllowedWordelGuess only accepts words from the bundled bank', () => {
  assert.equal(isAllowedWordelGuess('APPLE'), true)
  assert.equal(isAllowedWordelGuess('ZZZZZ'), false)
})

test('buildGuessResult handles repeated letters correctly', () => {
  const result = buildGuessResult('PAPER', 'APPLE', 1)

  assert.deepEqual(result.results, ['present', 'present', 'correct', 'present', 'absent'])
  assert.equal(result.isCorrect, false)
  assert.equal(result.attemptsUsed, 1)
})
