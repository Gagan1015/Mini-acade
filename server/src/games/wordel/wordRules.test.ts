import test from 'node:test'
import assert from 'node:assert/strict'

import { WORDEL_ALLOWED_GUESSES, WORDEL_ANSWER_BANK } from './wordBank'
import { buildGuessResult, isAllowedWordelGuess, normalizeWordelGuess } from './wordRules'

test('normalizeWordelGuess trims and uppercases input', () => {
  assert.equal(normalizeWordelGuess('  apple '), 'APPLE')
})

test('isAllowedWordelGuess accepts words from the larger dictionary', () => {
  assert.equal(isAllowedWordelGuess('APPLE'), true)
  assert.equal(isAllowedWordelGuess('AAHED'), true)
  assert.equal(isAllowedWordelGuess('ZZZZZ'), false)
})

test('Wordel word banks ship with large answer and guess lists', () => {
  assert.ok(WORDEL_ANSWER_BANK.length >= 2000)
  assert.ok(WORDEL_ALLOWED_GUESSES.length >= 12000)
})

test('buildGuessResult handles repeated letters correctly', () => {
  const result = buildGuessResult('PAPER', 'APPLE', 1)

  assert.deepEqual(result.results, ['present', 'present', 'correct', 'present', 'absent'])
  assert.equal(result.isCorrect, false)
  assert.equal(result.attemptsUsed, 1)
})
