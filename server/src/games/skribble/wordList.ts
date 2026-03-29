export const WORD_LIST = {
  easy: [
    'sun',
    'tree',
    'house',
    'car',
    'dog',
    'cat',
    'fish',
    'bird',
    'apple',
    'banana',
    'pizza',
    'ball',
    'star',
    'moon',
    'flower',
    'cloud',
  ],
  medium: [
    'rainbow',
    'umbrella',
    'butterfly',
    'elephant',
    'giraffe',
    'dinosaur',
    'astronaut',
    'superhero',
    'pirate',
    'robot',
    'castle',
    'bridge',
    'bicycle',
    'airplane',
    'rocket',
    'guitar',
  ],
  hard: [
    'imagination',
    'celebration',
    'construction',
    'electricity',
    'photography',
    'architecture',
    'geography',
    'mathematics',
    'rollercoaster',
    'thunderstorm',
    'earthquake',
    'telescope',
  ],
} as const

export type Difficulty = keyof typeof WORD_LIST

export function getRandomWords(count = 3, difficulty: Difficulty = 'medium') {
  const words = [...WORD_LIST[difficulty]]
  const selected: string[] = []

  for (let index = 0; index < count && words.length > 0; index += 1) {
    const wordIndex = Math.floor(Math.random() * words.length)
    selected.push(words[wordIndex])
    words.splice(wordIndex, 1)
  }

  return selected
}

export function generateWordHint(word: string) {
  return word
    .split('')
    .map((character, index) => {
      if (character === ' ') {
        return ' '
      }

      return index === 0 ? character.toUpperCase() : '_'
    })
    .join(' ')
}

export function isCloseGuess(guess: string, word: string) {
  const normalizedGuess = normalizeWord(guess)
  const normalizedWord = normalizeWord(word)

  if (!normalizedGuess || normalizedGuess === normalizedWord) {
    return false
  }

  if (normalizedWord.includes(normalizedGuess) || normalizedGuess.includes(normalizedWord)) {
    return true
  }

  const distance = levenshteinDistance(normalizedGuess, normalizedWord)
  return distance > 0 && distance <= 2
}

function normalizeWord(value: string) {
  return value.toLowerCase().trim()
}

function levenshteinDistance(left: string, right: string) {
  const matrix: number[][] = []

  for (let row = 0; row <= right.length; row += 1) {
    matrix[row] = [row]
  }

  for (let column = 0; column <= left.length; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 1; row <= right.length; row += 1) {
    for (let column = 1; column <= left.length; column += 1) {
      if (right.charAt(row - 1) === left.charAt(column - 1)) {
        matrix[row][column] = matrix[row - 1][column - 1]
      } else {
        matrix[row][column] = Math.min(
          matrix[row - 1][column - 1] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column] + 1
        )
      }
    }
  }

  return matrix[right.length][left.length]
}
