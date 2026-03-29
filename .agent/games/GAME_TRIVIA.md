# Game Implementation: Trivia

## Overview
Implement a real-time trivia quiz game where all players answer the same questions simultaneously. Features server-controlled timing, multiple choice questions, and scoring based on speed and accuracy.

**Status:** To Implement  
**Priority:** High  
**Estimated Time:** 5-6 hours  
**Dependencies:** Phase 4 (Game Runtime) completed

---

## Game Rules

### Core Mechanics
1. All players see the same question simultaneously
2. 4 multiple choice answers per question
3. 15-30 seconds to answer each question
4. Faster correct answers = more points
5. One answer per player per question
6. Server reveals correct answer after timer

### Scoring
- **Correct + Fast (0-5s):** 1000 points
- **Correct + Medium (5-10s):** 750 points
- **Correct + Slow (10-20s):** 500 points
- **Correct + Very Slow (20s+):** 250 points
- **Incorrect/No answer:** 0 points

### Round Flow
1. Server selects question
2. Broadcast question + answers to all
3. Start countdown timer
4. Players submit answers
5. Timer ends or all answered
6. Reveal correct answer + scores
7. Brief intermission
8. Next question

---

## Acceptance Criteria

### Questions
- [ ] Questions load from database/API
- [ ] Questions don't repeat in a game
- [ ] Category filtering works
- [ ] Difficulty levels work

### Gameplay
- [ ] All players see same question
- [ ] Timer syncs across clients
- [ ] Can only answer once
- [ ] Answer locks after submission
- [ ] Shows who has answered (not what)

### Results
- [ ] Correct answer revealed
- [ ] Points calculated correctly
- [ ] Leaderboard updates
- [ ] Shows answer distribution

### End Game
- [ ] Final leaderboard shown
- [ ] Stats saved to database
- [ ] Winner highlighted

---

## Implementation Steps

### Step 1: Question Database

#### 1.1 Update Prisma Schema
```prisma
model TriviaQuestion {
  id         String   @id @default(cuid())
  question   String
  answers    Json     // [{id: string, text: string}]
  correctId  String
  category   String
  difficulty String   @default("medium") // easy, medium, hard
  createdAt  DateTime @default(now())
  usedCount  Int      @default(0)
  
  @@index([category])
  @@index([difficulty])
}
```

#### 1.2 Create `server/src/games/trivia/questionService.ts`
```typescript
import { prisma } from '../../lib/prisma'

export interface TriviaQuestionData {
  id: string
  question: string
  answers: { id: string; text: string }[]
  correctId: string
  category: string
  difficulty: string
}

// Fallback questions if database is empty
const FALLBACK_QUESTIONS: TriviaQuestionData[] = [
  {
    id: 'q1',
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
    id: 'q2',
    question: 'Which planet is known as the Red Planet?',
    answers: [
      { id: 'a', text: 'Venus' },
      { id: 'b', text: 'Jupiter' },
      { id: 'c', text: 'Mars' },
      { id: 'd', text: 'Saturn' },
    ],
    correctId: 'c',
    category: 'Science',
    difficulty: 'easy',
  },
  {
    id: 'q3',
    question: 'Who painted the Mona Lisa?',
    answers: [
      { id: 'a', text: 'Vincent van Gogh' },
      { id: 'b', text: 'Pablo Picasso' },
      { id: 'c', text: 'Leonardo da Vinci' },
      { id: 'd', text: 'Michelangelo' },
    ],
    correctId: 'c',
    category: 'Art',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    question: 'What is the largest mammal in the world?',
    answers: [
      { id: 'a', text: 'African Elephant' },
      { id: 'b', text: 'Blue Whale' },
      { id: 'c', text: 'Giraffe' },
      { id: 'd', text: 'Polar Bear' },
    ],
    correctId: 'b',
    category: 'Nature',
    difficulty: 'easy',
  },
  {
    id: 'q5',
    question: 'In which year did World War II end?',
    answers: [
      { id: 'a', text: '1943' },
      { id: 'b', text: '1944' },
      { id: 'c', text: '1945' },
      { id: 'd', text: '1946' },
    ],
    correctId: 'c',
    category: 'History',
    difficulty: 'medium',
  },
]

export class QuestionService {
  private usedQuestionIds: Set<string> = new Set()
  
  async getRandomQuestions(
    count: number,
    options?: {
      category?: string
      difficulty?: string
      excludeIds?: string[]
    }
  ): Promise<TriviaQuestionData[]> {
    const { category, difficulty, excludeIds = [] } = options || {}
    
    // Build where clause
    const where: any = {
      id: { notIn: [...excludeIds, ...Array.from(this.usedQuestionIds)] },
    }
    
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty
    
    // Try to get from database
    const dbQuestions = await prisma.triviaQuestion.findMany({
      where,
      take: count,
      orderBy: { usedCount: 'asc' }, // Prefer less-used questions
    })
    
    if (dbQuestions.length >= count) {
      return dbQuestions.map(q => ({
        id: q.id,
        question: q.question,
        answers: q.answers as { id: string; text: string }[],
        correctId: q.correctId,
        category: q.category,
        difficulty: q.difficulty,
      }))
    }
    
    // Use fallback questions
    const available = FALLBACK_QUESTIONS.filter(
      q => !this.usedQuestionIds.has(q.id) && !excludeIds.includes(q.id)
    )
    
    // Shuffle and return
    return this.shuffle(available).slice(0, count)
  }
  
  async getQuestion(): Promise<TriviaQuestionData | null> {
    const questions = await this.getRandomQuestions(1)
    if (questions.length === 0) return null
    
    const question = questions[0]
    this.usedQuestionIds.add(question.id)
    
    // Update usage count in database
    await prisma.triviaQuestion.update({
      where: { id: question.id },
      data: { usedCount: { increment: 1 } },
    }).catch(() => {}) // Ignore if not in DB
    
    return question
  }
  
  reset(): void {
    this.usedQuestionIds.clear()
  }
  
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
```

---

### Step 2: Trivia Runtime

#### 2.1 Create `server/src/games/trivia/TriviaRuntime.ts`
```typescript
import { Server } from 'socket.io'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { QuestionService, TriviaQuestionData } from './questionService'
import {
  GameConfig,
  GameEventResult,
  Player,
  UserId,
  TriviaSubmitAnswerPayload,
} from '@mini-arcade/shared'

interface TriviaRoundState {
  question: TriviaQuestionData | null
  playerAnswers: Map<UserId, {
    answerId: string
    answeredAt: Date
  }>
  roundStartedAt: Date | null
}

const ROUND_TIME = 20 // 20 seconds per question
const INTERMISSION_TIME = 5000 // 5 seconds between rounds

// Points based on answer time
const POINTS_TIERS = [
  { maxTime: 5, points: 1000 },
  { maxTime: 10, points: 750 },
  { maxTime: 20, points: 500 },
  { maxTime: Infinity, points: 250 },
]

export class TriviaRuntime extends BaseGameRuntime {
  private questionService: QuestionService
  private roundState: TriviaRoundState = {
    question: null,
    playerAnswers: new Map(),
    roundStartedAt: null,
  }
  
  constructor(io: Server, config: GameConfig) {
    super(io, config)
    this.questionService = new QuestionService()
    this.totalRounds = config.settings?.rounds || 10
    this.roundTime = ROUND_TIME
  }
  
  async initialize(): Promise<void> {
    this.questionService.reset()
  }
  
  // ==========================================================================
  // ROUND MANAGEMENT
  // ==========================================================================
  
  protected async prepareRound(): Promise<Record<string, unknown>> {
    // Get new question
    const question = await this.questionService.getQuestion()
    
    if (!question) {
      // No more questions available
      await this.end()
      return {}
    }
    
    // Reset round state
    this.roundState = {
      question,
      playerAnswers: new Map(),
      roundStartedAt: new Date(),
    }
    
    // Return question data (without correct answer)
    return {
      question: {
        id: question.id,
        question: question.question,
        answers: question.answers,
        category: question.category,
        difficulty: question.difficulty,
      },
      timeLimit: this.roundTime,
    }
  }
  
  protected calculateRoundResults(): Record<string, unknown> {
    const question = this.roundState.question
    if (!question) return {}
    
    const results: Record<UserId, {
      answerId: string | null
      isCorrect: boolean
      pointsEarned: number
      answerTime: number | null
    }> = {}
    
    // Calculate each player's result
    for (const [playerId] of this.players) {
      const answer = this.roundState.playerAnswers.get(playerId)
      
      if (!answer) {
        results[playerId] = {
          answerId: null,
          isCorrect: false,
          pointsEarned: 0,
          answerTime: null,
        }
        continue
      }
      
      const isCorrect = answer.answerId === question.correctId
      const answerTime = this.roundState.roundStartedAt
        ? (answer.answeredAt.getTime() - this.roundState.roundStartedAt.getTime()) / 1000
        : 0
      
      let points = 0
      if (isCorrect) {
        for (const tier of POINTS_TIERS) {
          if (answerTime <= tier.maxTime) {
            points = tier.points
            break
          }
        }
        this.addScore(playerId, points)
      }
      
      results[playerId] = {
        answerId: answer.answerId,
        isCorrect,
        pointsEarned: points,
        answerTime,
      }
    }
    
    return {
      correctAnswerId: question.correctId,
      playerResults: Object.entries(results).map(([playerId, data]) => ({
        playerId,
        ...data,
        totalScore: this.scores.get(playerId) || 0,
      })),
    }
  }
  
  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================
  
  async onClientEvent(
    playerId: UserId,
    eventName: string,
    payload: unknown
  ): Promise<GameEventResult> {
    switch (eventName) {
      case 'submitAnswer':
        return this.handleSubmitAnswer(playerId, payload as TriviaSubmitAnswerPayload)
      
      default:
        return { success: false, error: `Unknown event: ${eventName}` }
    }
  }
  
  private handleSubmitAnswer(
    playerId: UserId,
    payload: TriviaSubmitAnswerPayload
  ): GameEventResult {
    const question = this.roundState.question
    
    if (!question) {
      return { success: false, error: 'No active question' }
    }
    
    if (payload.questionId !== question.id) {
      return { success: false, error: 'Wrong question' }
    }
    
    // Check if already answered
    if (this.roundState.playerAnswers.has(playerId)) {
      return { success: false, error: 'Already answered' }
    }
    
    // Validate answer ID
    const validAnswerIds = question.answers.map(a => a.id)
    if (!validAnswerIds.includes(payload.answerId)) {
      return { success: false, error: 'Invalid answer' }
    }
    
    // Record answer
    this.roundState.playerAnswers.set(playerId, {
      answerId: payload.answerId,
      answeredAt: new Date(),
    })
    
    // Check if all players have answered
    const connectedPlayers = this.getConnectedPlayers()
    if (this.roundState.playerAnswers.size >= connectedPlayers.length) {
      // End round early
      setTimeout(() => this.endRound(), 500)
    }
    
    // Calculate immediate feedback
    const isCorrect = payload.answerId === question.correctId
    const answerTime = this.roundState.roundStartedAt
      ? (Date.now() - this.roundState.roundStartedAt.getTime()) / 1000
      : 0
    
    let points = 0
    if (isCorrect) {
      for (const tier of POINTS_TIERS) {
        if (answerTime <= tier.maxTime) {
          points = tier.points
          break
        }
      }
    }
    
    return {
      success: true,
      broadcast: [
        // Send result to answering player
        {
          event: 'trivia:answerResult',
          data: {
            isCorrect,
            pointsEarned: points,
            answerTime,
          },
          to: 'player',
          playerId,
        },
        // Notify others that player has answered
        {
          event: 'trivia:playerAnswered',
          data: { playerId },
          to: 'room',
        },
      ],
    }
  }
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getRoundState(): unknown {
    return {
      questionId: this.roundState.question?.id,
      answeredPlayers: Array.from(this.roundState.playerAnswers.keys()),
      totalPlayers: this.getConnectedPlayers().length,
    }
  }
  
  // ==========================================================================
  // TIMER
  // ==========================================================================
  
  protected async startNextRound(): Promise<GameEventResult> {
    const result = await super.startNextRound()
    
    // Start periodic timer updates
    const timerInterval = setInterval(() => {
      if (this.phase !== 'playing') {
        clearInterval(timerInterval)
        return
      }
      
      const remaining = this.roundEndsAt
        ? Math.max(0, Math.floor((this.roundEndsAt.getTime() - Date.now()) / 1000))
        : 0
      
      this.io.to(this.roomCode).emit('trivia:timerTick', {
        remainingSeconds: remaining,
      })
      
      if (remaining <= 0) {
        clearInterval(timerInterval)
      }
    }, 1000)
    
    return result
  }
}
```

---

### Step 3: Client Components

#### 3.1 Create `client/src/components/games/trivia/TriviaGame.tsx`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { QuestionCard } from './QuestionCard'
import { Timer } from './Timer'
import { Leaderboard } from './Leaderboard'
import { RoundResults } from './RoundResults'
import type { Player, TriviaRoundStarted, TriviaRoundEnded } from '@mini-arcade/shared'

interface TriviaGameProps {
  roomCode: string
  players: Player[]
}

export function TriviaGame({ roomCode, players }: TriviaGameProps) {
  const { user } = useAuth()
  const { emit, on, off } = useSocket()
  
  // Game state
  const [phase, setPhase] = useState<'waiting' | 'question' | 'results' | 'gameEnd'>('waiting')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  
  // Question state
  const [question, setQuestion] = useState<{
    id: string
    question: string
    answers: { id: string; text: string }[]
    category?: string
    difficulty?: string
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answeredPlayers, setAnsweredPlayers] = useState<string[]>([])
  
  // Results state
  const [roundResults, setRoundResults] = useState<TriviaRoundEnded | null>(null)
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean
    pointsEarned: number
  } | null>(null)
  
  // Socket handlers
  useEffect(() => {
    const handleRoundStarted = (data: TriviaRoundStarted) => {
      setPhase('question')
      setCurrentRound(data.roundNumber)
      setTotalRounds(data.totalRounds)
      setTimeRemaining(data.timeLimit)
      setQuestion(data.question)
      setSelectedAnswer(null)
      setHasAnswered(false)
      setAnsweredPlayers([])
      setAnswerFeedback(null)
    }
    
    const handleTimerTick = (data: { remainingSeconds: number }) => {
      setTimeRemaining(data.remainingSeconds)
    }
    
    const handleAnswerResult = (data: { isCorrect: boolean; pointsEarned: number }) => {
      setAnswerFeedback(data)
    }
    
    const handlePlayerAnswered = (data: { playerId: string }) => {
      setAnsweredPlayers(prev => [...prev, data.playerId])
    }
    
    const handleRoundEnded = (data: TriviaRoundEnded) => {
      setPhase('results')
      setRoundResults(data)
      
      // Update scores
      const newScores: Record<string, number> = {}
      for (const result of data.playerResults) {
        newScores[result.playerId] = result.totalScore
      }
      setScores(newScores)
    }
    
    const handleGameEnded = (data: any) => {
      setPhase('gameEnd')
    }
    
    on('trivia:roundStarted', handleRoundStarted)
    on('trivia:timerTick', handleTimerTick)
    on('trivia:answerResult', handleAnswerResult)
    on('trivia:playerAnswered', handlePlayerAnswered)
    on('trivia:roundEnded', handleRoundEnded)
    on('trivia:gameEnded', handleGameEnded)
    
    return () => {
      off('trivia:roundStarted')
      off('trivia:timerTick')
      off('trivia:answerResult')
      off('trivia:playerAnswered')
      off('trivia:roundEnded')
      off('trivia:gameEnded')
    }
  }, [on, off])
  
  const handleSelectAnswer = useCallback((answerId: string) => {
    if (hasAnswered || !question) return
    
    setSelectedAnswer(answerId)
    setHasAnswered(true)
    
    emit('trivia:submitAnswer', {
      roomCode,
      questionId: question.id,
      answerId,
    })
  }, [emit, roomCode, question, hasAnswered])
  
  return (
    <div className="flex gap-6 h-full">
      {/* Main game area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <span className="text-gray-400">Round</span>{' '}
            <span className="text-xl font-bold">{currentRound}</span>
            <span className="text-gray-400"> / {totalRounds}</span>
          </div>
          <Timer seconds={timeRemaining} />
        </div>
        
        {/* Question */}
        {phase === 'question' && question && (
          <QuestionCard
            question={question}
            selectedAnswer={selectedAnswer}
            hasAnswered={hasAnswered}
            answerFeedback={answerFeedback}
            onSelectAnswer={handleSelectAnswer}
          />
        )}
        
        {/* Results */}
        {phase === 'results' && roundResults && (
          <RoundResults
            results={roundResults}
            players={players}
            currentUserId={user?.id || ''}
          />
        )}
        
        {/* Waiting indicator */}
        {hasAnswered && !answerFeedback && (
          <div className="mt-4 text-center text-gray-400">
            Waiting for other players...
            <div className="mt-2">
              {answeredPlayers.length} / {players.length} answered
            </div>
          </div>
        )}
      </div>
      
      {/* Leaderboard */}
      <div className="w-64">
        <Leaderboard
          players={players}
          scores={scores}
          currentUserId={user?.id || ''}
        />
      </div>
    </div>
  )
}
```

#### 3.2 Create `client/src/components/games/trivia/QuestionCard.tsx`
```typescript
'use client'

interface QuestionCardProps {
  question: {
    id: string
    question: string
    answers: { id: string; text: string }[]
    category?: string
    difficulty?: string
  }
  selectedAnswer: string | null
  hasAnswered: boolean
  answerFeedback: { isCorrect: boolean; pointsEarned: number } | null
  onSelectAnswer: (answerId: string) => void
}

const ANSWER_COLORS = [
  'bg-red-600 hover:bg-red-500',
  'bg-blue-600 hover:bg-blue-500',
  'bg-yellow-600 hover:bg-yellow-500',
  'bg-green-600 hover:bg-green-500',
]

export function QuestionCard({
  question,
  selectedAnswer,
  hasAnswered,
  answerFeedback,
  onSelectAnswer,
}: QuestionCardProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Category and difficulty */}
      <div className="flex gap-2 mb-4">
        {question.category && (
          <span className="px-3 py-1 bg-purple-600/50 rounded-full text-sm text-white">
            {question.category}
          </span>
        )}
        {question.difficulty && (
          <span className={`px-3 py-1 rounded-full text-sm text-white ${
            question.difficulty === 'easy' ? 'bg-green-600/50' :
            question.difficulty === 'hard' ? 'bg-red-600/50' :
            'bg-yellow-600/50'
          }`}>
            {question.difficulty}
          </span>
        )}
      </div>
      
      {/* Question */}
      <div className="bg-gray-800 rounded-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-white text-center">
          {question.question}
        </h2>
      </div>
      
      {/* Answer feedback */}
      {answerFeedback && (
        <div className={`text-center mb-4 p-4 rounded-lg ${
          answerFeedback.isCorrect ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
        }`}>
          {answerFeedback.isCorrect ? (
            <>Correct! +{answerFeedback.pointsEarned} points</>
          ) : (
            <>Incorrect!</>
          )}
        </div>
      )}
      
      {/* Answers */}
      <div className="grid grid-cols-2 gap-4">
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswer === answer.id
          const baseColor = ANSWER_COLORS[index % ANSWER_COLORS.length]
          
          return (
            <button
              key={answer.id}
              onClick={() => onSelectAnswer(answer.id)}
              disabled={hasAnswered}
              className={`p-6 rounded-xl text-white font-medium text-lg transition-all ${
                hasAnswered
                  ? isSelected
                    ? `${baseColor.split(' ')[0]} ring-4 ring-white`
                    : 'bg-gray-700 opacity-50'
                  : baseColor
              }`}
            >
              {answer.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

#### 3.3 Create `client/src/components/games/trivia/Timer.tsx`
```typescript
'use client'

interface TimerProps {
  seconds: number
}

export function Timer({ seconds }: TimerProps) {
  const isLow = seconds <= 5
  
  return (
    <div className={`text-4xl font-bold ${
      isLow ? 'text-red-500 animate-pulse' : 'text-white'
    }`}>
      {seconds}
    </div>
  )
}
```

#### 3.4 Create `client/src/components/games/trivia/Leaderboard.tsx`
```typescript
'use client'

import type { Player } from '@mini-arcade/shared'

interface LeaderboardProps {
  players: Player[]
  scores: Record<string, number>
  currentUserId: string
}

export function Leaderboard({ players, scores, currentUserId }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    return (scores[b.id] || 0) - (scores[a.id] || 0)
  })
  
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">Leaderboard</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const score = scores[player.id] || 0
          const isCurrentUser = player.id === currentUserId
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCurrentUser ? 'bg-purple-600/30' : 'bg-gray-700/50'
              }`}
            >
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                index === 0 ? 'bg-yellow-500 text-yellow-900' :
                index === 1 ? 'bg-gray-400 text-gray-900' :
                index === 2 ? 'bg-amber-600 text-amber-900' :
                'bg-gray-600 text-white'
              }`}>
                {index + 1}
              </span>
              <span className="flex-1 text-white truncate">{player.name}</span>
              <span className="text-purple-400 font-bold">{score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## Files Created

```
server/src/games/trivia/
├── TriviaRuntime.ts
├── questionService.ts
└── index.ts

client/src/components/games/trivia/
├── TriviaGame.tsx
├── QuestionCard.tsx
├── Timer.tsx
├── Leaderboard.tsx
├── RoundResults.tsx
└── GameEnd.tsx
```

---

## Admin Features

### Question Management
- Add/edit/delete questions
- Bulk import from CSV/JSON
- Category management
- Difficulty rating
- Usage statistics

### API Integration (Optional)
```typescript
// Option to fetch from Open Trivia DB
async function fetchExternalQuestions(count: number): Promise<TriviaQuestionData[]> {
  const response = await fetch(
    `https://opentdb.com/api.php?amount=${count}&type=multiple`
  )
  const data = await response.json()
  
  return data.results.map((q: any, i: number) => ({
    id: `ext-${Date.now()}-${i}`,
    question: decodeHTML(q.question),
    answers: shuffleAnswers([
      { id: 'correct', text: decodeHTML(q.correct_answer) },
      ...q.incorrect_answers.map((a: string, j: number) => ({
        id: `wrong-${j}`,
        text: decodeHTML(a),
      })),
    ]),
    correctId: 'correct',
    category: q.category,
    difficulty: q.difficulty,
  }))
}
```

---

## Testing Checklist

### Manual Tests
- [ ] Questions display correctly
- [ ] Timer syncs across clients
- [ ] Answers lock after selection
- [ ] Points calculate correctly based on speed
- [ ] Results show after round
- [ ] Leaderboard updates
- [ ] Game ends properly

### Edge Cases
- [ ] Player disconnects mid-question
- [ ] All players answer before timer
- [ ] Single player game
- [ ] No more questions available

---

## Next Game
Once Trivia is complete and tested, proceed to **Game: Wordel**.
