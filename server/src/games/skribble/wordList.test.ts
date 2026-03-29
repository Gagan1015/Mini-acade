import test from 'node:test'
import assert from 'node:assert/strict'

import { generateWordHint, getRandomWords, isCloseGuess } from './wordList'

test('getRandomWords returns unique entries for a single request', () => {
  const words = getRandomWords(3, 'easy')

  assert.equal(words.length, 3)
  assert.equal(new Set(words).size, 3)
})

test('generateWordHint reveals the first character and masks the rest', () => {
  assert.equal(generateWordHint('rocket'), 'R _ _ _ _ _')
})

test('isCloseGuess detects near misses but not exact matches', () => {
  assert.equal(isCloseGuess('rocet', 'rocket'), true)
  assert.equal(isCloseGuess('rocket', 'rocket'), false)
})
