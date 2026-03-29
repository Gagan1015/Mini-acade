import type { TriviaQuestion } from '@mini-arcade/shared'

export type TriviaQuestionData = TriviaQuestion & {
  correctId: string
}

const FALLBACK_QUESTIONS: TriviaQuestionData[] = [
  {
    id: 'trivia-q1',
    question: 'What is the capital of France?',
    answers: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Paris' },
      { id: 'c', text: 'Berlin' },
      { id: 'd', text: 'Madrid' },
    ],
    correctId: 'b',
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    id: 'trivia-q2',
    question: 'Which planet is known as the Red Planet?',
    answers: [
      { id: 'a', text: 'Venus' },
      { id: 'b', text: 'Mars' },
      { id: 'c', text: 'Jupiter' },
      { id: 'd', text: 'Saturn' },
    ],
    correctId: 'b',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: 'trivia-q3',
    question: 'Who painted the Mona Lisa?',
    answers: [
      { id: 'a', text: 'Pablo Picasso' },
      { id: 'b', text: 'Vincent van Gogh' },
      { id: 'c', text: 'Leonardo da Vinci' },
      { id: 'd', text: 'Claude Monet' },
    ],
    correctId: 'c',
    category: 'Art',
    difficulty: 'medium',
  },
  {
    id: 'trivia-q4',
    question: 'In which year did World War II end?',
    answers: [
      { id: 'a', text: '1944' },
      { id: 'b', text: '1945' },
      { id: 'c', text: '1946' },
      { id: 'd', text: '1947' },
    ],
    correctId: 'b',
    category: 'History',
    difficulty: 'medium',
  },
  {
    id: 'trivia-q5',
    question: 'What is the largest mammal in the world?',
    answers: [
      { id: 'a', text: 'Blue Whale' },
      { id: 'b', text: 'African Elephant' },
      { id: 'c', text: 'Polar Bear' },
      { id: 'd', text: 'Giraffe' },
    ],
    correctId: 'a',
    category: 'Nature',
    difficulty: 'easy',
  },
]

export class QuestionService {
  private readonly usedQuestionIds = new Set<string>()

  reset() {
    this.usedQuestionIds.clear()
  }

  async getQuestion(): Promise<TriviaQuestionData> {
    const available = FALLBACK_QUESTIONS.filter((question) => !this.usedQuestionIds.has(question.id))

    if (available.length === 0) {
      this.reset()
      return this.getQuestion()
    }

    const index = Math.floor(Math.random() * available.length)
    const question = available[index]
    this.usedQuestionIds.add(question.id)
    return question
  }
}
