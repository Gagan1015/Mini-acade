import type { WordelGuessResult } from '@mini-arcade/shared'

import { WORDEL_WORD_BANK } from './wordBank'

const WORD_BANK_SET = new Set(WORDEL_WORD_BANK)

export function pickWord() {
  const index = Math.floor(Math.random() * WORDEL_WORD_BANK.length)
  return WORDEL_WORD_BANK[index]
}

export function normalizeWordelGuess(guess: string) {
  return guess.trim().toUpperCase()
}

export function isAllowedWordelGuess(guess: string) {
  return WORD_BANK_SET.has(guess as (typeof WORDEL_WORD_BANK)[number])
}

export function buildGuessResult(
  guess: string,
  secretWord: string,
  attemptsUsed: number
): WordelGuessResult {
  const secretChars = secretWord.split('')
  const guessChars = guess.split('')
  const results: Array<'correct' | 'present' | 'absent'> = Array.from(
    { length: guess.length },
    () => 'absent'
  )
  const remaining = new Map<string, number>()

  guessChars.forEach((char, index) => {
    if (char === secretChars[index]) {
      results[index] = 'correct'
      return
    }

    remaining.set(secretChars[index], (remaining.get(secretChars[index]) ?? 0) + 1)
  })

  guessChars.forEach((char, index) => {
    if (results[index] === 'correct') {
      return
    }

    const available = remaining.get(char) ?? 0
    if (available > 0) {
      results[index] = 'present'
      remaining.set(char, available - 1)
    }
  })

  return {
    guess,
    results,
    isCorrect: guess === secretWord,
    attemptsUsed,
  }
}
