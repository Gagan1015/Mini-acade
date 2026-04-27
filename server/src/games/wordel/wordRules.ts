import type { WordelGuessResult } from '@arcado/shared'

import { WORDEL_ALLOWED_GUESSES, WORDEL_ANSWER_BANK } from './wordBank'

const ALLOWED_GUESS_SET = new Set(WORDEL_ALLOWED_GUESSES)

export function pickWord() {
  const index = Math.floor(Math.random() * WORDEL_ANSWER_BANK.length)
  return WORDEL_ANSWER_BANK[index]
}

export function normalizeWordelGuess(guess: string) {
  return guess.trim().toUpperCase()
}

export function isAllowedWordelGuess(guess: string) {
  return ALLOWED_GUESS_SET.has(guess)
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
