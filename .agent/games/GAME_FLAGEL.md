# Game Implementation: Flagel

## Overview
Implement a flag guessing game where players identify countries by their flags. Features emoji flags for MVP, with optional image support, and geographic hints for incorrect guesses.

**Status:** To Implement  
**Priority:** Medium  
**Estimated Time:** 4-5 hours  
**Dependencies:** Phase 4 (Game Runtime) completed

---

## Game Rules

### Core Mechanics
1. Server shows a country's flag (emoji or image)
2. Players type the country name to guess
3. Incorrect guesses show geographic hints
4. Limited attempts per flag (6 max)
5. Points based on attempt number

### Hints System
- **After 1 wrong guess:** Show continent
- **After 2 wrong guesses:** Show first letter
- **After 3 wrong guesses:** Show population range
- **After 4 wrong guesses:** Show neighboring country
- **After 5 wrong guesses:** Show partial name

### Scoring
- **Solve in 1 guess:** 1000 points
- **Solve in 2 guesses:** 800 points
- **Solve in 3 guesses:** 600 points
- **Solve in 4 guesses:** 400 points
- **Solve in 5 guesses:** 200 points
- **Solve in 6 guesses:** 100 points
- **Skip/Failed:** 0 points

### Round Flow
1. Server selects country
2. Display flag to all players
3. Players submit guesses
4. Validate and provide feedback
5. End when solved or max attempts
6. Show correct answer
7. Next round

---

## Acceptance Criteria

### Flags
- [ ] Unicode emoji flags display correctly
- [ ] Alternative spellings accepted (USA/United States)
- [ ] Common misspellings handled
- [ ] Case insensitive

### Gameplay
- [ ] Hints reveal progressively
- [ ] Can skip (forfeit points)
- [ ] Answer validation server-side
- [ ] Multiplayer progress visible

### Results
- [ ] Correct country revealed
- [ ] Flag and country info shown
- [ ] Points calculated correctly
- [ ] Stats tracked

---

## Implementation Steps

### Step 1: Country Database

#### 1.1 Create `server/src/games/flagel/countryData.ts`
```typescript
export interface Country {
  code: string          // ISO 3166-1 alpha-2
  name: string          // Official name
  aliases: string[]     // Alternative names/spellings
  flagEmoji: string     // Unicode flag emoji
  continent: string
  population: number    // Approximate
  neighbors: string[]   // Neighboring country codes
  capital: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const COUNTRIES: Country[] = [
  // Easy - Well-known countries
  {
    code: 'US',
    name: 'United States',
    aliases: ['USA', 'America', 'United States of America', 'US', 'U.S.', 'U.S.A.'],
    flagEmoji: '🇺🇸',
    continent: 'North America',
    population: 331000000,
    neighbors: ['CA', 'MX'],
    capital: 'Washington D.C.',
    difficulty: 'easy',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    aliases: ['UK', 'Britain', 'Great Britain', 'England'],
    flagEmoji: '🇬🇧',
    continent: 'Europe',
    population: 67000000,
    neighbors: ['IE'],
    capital: 'London',
    difficulty: 'easy',
  },
  {
    code: 'FR',
    name: 'France',
    aliases: ['French Republic'],
    flagEmoji: '🇫🇷',
    continent: 'Europe',
    population: 67000000,
    neighbors: ['DE', 'ES', 'IT', 'BE', 'CH'],
    capital: 'Paris',
    difficulty: 'easy',
  },
  {
    code: 'DE',
    name: 'Germany',
    aliases: ['Deutschland', 'Federal Republic of Germany'],
    flagEmoji: '🇩🇪',
    continent: 'Europe',
    population: 83000000,
    neighbors: ['FR', 'PL', 'AT', 'CH', 'NL', 'BE', 'DK', 'CZ'],
    capital: 'Berlin',
    difficulty: 'easy',
  },
  {
    code: 'JP',
    name: 'Japan',
    aliases: ['Nippon', 'Nihon'],
    flagEmoji: '🇯🇵',
    continent: 'Asia',
    population: 126000000,
    neighbors: [],
    capital: 'Tokyo',
    difficulty: 'easy',
  },
  {
    code: 'CN',
    name: 'China',
    aliases: ["People's Republic of China", 'PRC'],
    flagEmoji: '🇨🇳',
    continent: 'Asia',
    population: 1400000000,
    neighbors: ['RU', 'IN', 'KP', 'MN', 'KZ'],
    capital: 'Beijing',
    difficulty: 'easy',
  },
  {
    code: 'BR',
    name: 'Brazil',
    aliases: ['Brasil', 'Federative Republic of Brazil'],
    flagEmoji: '🇧🇷',
    continent: 'South America',
    population: 213000000,
    neighbors: ['AR', 'UY', 'PY', 'BO', 'PE', 'CO', 'VE', 'GY', 'SR', 'GF'],
    capital: 'Brasília',
    difficulty: 'easy',
  },
  {
    code: 'CA',
    name: 'Canada',
    aliases: [],
    flagEmoji: '🇨🇦',
    continent: 'North America',
    population: 38000000,
    neighbors: ['US'],
    capital: 'Ottawa',
    difficulty: 'easy',
  },
  {
    code: 'AU',
    name: 'Australia',
    aliases: ['Commonwealth of Australia', 'Aussie'],
    flagEmoji: '🇦🇺',
    continent: 'Oceania',
    population: 26000000,
    neighbors: [],
    capital: 'Canberra',
    difficulty: 'easy',
  },
  {
    code: 'IN',
    name: 'India',
    aliases: ['Republic of India', 'Bharat'],
    flagEmoji: '🇮🇳',
    continent: 'Asia',
    population: 1400000000,
    neighbors: ['CN', 'PK', 'BD', 'NP', 'BT', 'MM'],
    capital: 'New Delhi',
    difficulty: 'easy',
  },
  
  // Medium - Less commonly known
  {
    code: 'MX',
    name: 'Mexico',
    aliases: ['United Mexican States'],
    flagEmoji: '🇲🇽',
    continent: 'North America',
    population: 130000000,
    neighbors: ['US', 'GT', 'BZ'],
    capital: 'Mexico City',
    difficulty: 'medium',
  },
  {
    code: 'KR',
    name: 'South Korea',
    aliases: ['Korea', 'Republic of Korea'],
    flagEmoji: '🇰🇷',
    continent: 'Asia',
    population: 52000000,
    neighbors: ['KP'],
    capital: 'Seoul',
    difficulty: 'medium',
  },
  {
    code: 'IT',
    name: 'Italy',
    aliases: ['Italian Republic', 'Italia'],
    flagEmoji: '🇮🇹',
    continent: 'Europe',
    population: 60000000,
    neighbors: ['FR', 'CH', 'AT', 'SI'],
    capital: 'Rome',
    difficulty: 'medium',
  },
  {
    code: 'ES',
    name: 'Spain',
    aliases: ['Kingdom of Spain', 'España'],
    flagEmoji: '🇪🇸',
    continent: 'Europe',
    population: 47000000,
    neighbors: ['FR', 'PT', 'AD'],
    capital: 'Madrid',
    difficulty: 'medium',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    aliases: ['Holland', 'The Netherlands'],
    flagEmoji: '🇳🇱',
    continent: 'Europe',
    population: 17000000,
    neighbors: ['DE', 'BE'],
    capital: 'Amsterdam',
    difficulty: 'medium',
  },
  {
    code: 'SE',
    name: 'Sweden',
    aliases: ['Kingdom of Sweden', 'Sverige'],
    flagEmoji: '🇸🇪',
    continent: 'Europe',
    population: 10000000,
    neighbors: ['NO', 'FI'],
    capital: 'Stockholm',
    difficulty: 'medium',
  },
  {
    code: 'NO',
    name: 'Norway',
    aliases: ['Kingdom of Norway', 'Norge'],
    flagEmoji: '🇳🇴',
    continent: 'Europe',
    population: 5000000,
    neighbors: ['SE', 'FI', 'RU'],
    capital: 'Oslo',
    difficulty: 'medium',
  },
  {
    code: 'PL',
    name: 'Poland',
    aliases: ['Republic of Poland', 'Polska'],
    flagEmoji: '🇵🇱',
    continent: 'Europe',
    population: 38000000,
    neighbors: ['DE', 'CZ', 'SK', 'UA', 'BY', 'LT', 'RU'],
    capital: 'Warsaw',
    difficulty: 'medium',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    aliases: ['Swiss Confederation', 'Schweiz', 'Suisse'],
    flagEmoji: '🇨🇭',
    continent: 'Europe',
    population: 9000000,
    neighbors: ['DE', 'FR', 'IT', 'AT', 'LI'],
    capital: 'Bern',
    difficulty: 'medium',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    aliases: ['RSA', 'Republic of South Africa'],
    flagEmoji: '🇿🇦',
    continent: 'Africa',
    population: 60000000,
    neighbors: ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS'],
    capital: 'Pretoria',
    difficulty: 'medium',
  },
  {
    code: 'EG',
    name: 'Egypt',
    aliases: ['Arab Republic of Egypt', 'Misr'],
    flagEmoji: '🇪🇬',
    continent: 'Africa',
    population: 102000000,
    neighbors: ['LY', 'SD', 'IL', 'PS'],
    capital: 'Cairo',
    difficulty: 'medium',
  },
  
  // Hard - Lesser known countries
  {
    code: 'LV',
    name: 'Latvia',
    aliases: ['Republic of Latvia', 'Latvija'],
    flagEmoji: '🇱🇻',
    continent: 'Europe',
    population: 2000000,
    neighbors: ['EE', 'LT', 'BY', 'RU'],
    capital: 'Riga',
    difficulty: 'hard',
  },
  {
    code: 'LT',
    name: 'Lithuania',
    aliases: ['Republic of Lithuania', 'Lietuva'],
    flagEmoji: '🇱🇹',
    continent: 'Europe',
    population: 3000000,
    neighbors: ['LV', 'BY', 'PL', 'RU'],
    capital: 'Vilnius',
    difficulty: 'hard',
  },
  {
    code: 'EE',
    name: 'Estonia',
    aliases: ['Republic of Estonia', 'Eesti'],
    flagEmoji: '🇪🇪',
    continent: 'Europe',
    population: 1300000,
    neighbors: ['LV', 'RU'],
    capital: 'Tallinn',
    difficulty: 'hard',
  },
  {
    code: 'SI',
    name: 'Slovenia',
    aliases: ['Republic of Slovenia', 'Slovenija'],
    flagEmoji: '🇸🇮',
    continent: 'Europe',
    population: 2000000,
    neighbors: ['IT', 'AT', 'HU', 'HR'],
    capital: 'Ljubljana',
    difficulty: 'hard',
  },
  {
    code: 'SK',
    name: 'Slovakia',
    aliases: ['Slovak Republic', 'Slovensko'],
    flagEmoji: '🇸🇰',
    continent: 'Europe',
    population: 5000000,
    neighbors: ['CZ', 'PL', 'UA', 'HU', 'AT'],
    capital: 'Bratislava',
    difficulty: 'hard',
  },
  {
    code: 'BT',
    name: 'Bhutan',
    aliases: ['Kingdom of Bhutan', 'Druk Yul'],
    flagEmoji: '🇧🇹',
    continent: 'Asia',
    population: 800000,
    neighbors: ['CN', 'IN'],
    capital: 'Thimphu',
    difficulty: 'hard',
  },
  {
    code: 'NP',
    name: 'Nepal',
    aliases: ['Federal Democratic Republic of Nepal'],
    flagEmoji: '🇳🇵',
    continent: 'Asia',
    population: 30000000,
    neighbors: ['CN', 'IN'],
    capital: 'Kathmandu',
    difficulty: 'hard',
  },
  {
    code: 'LI',
    name: 'Liechtenstein',
    aliases: ['Principality of Liechtenstein'],
    flagEmoji: '🇱🇮',
    continent: 'Europe',
    population: 40000,
    neighbors: ['CH', 'AT'],
    capital: 'Vaduz',
    difficulty: 'hard',
  },
  {
    code: 'MC',
    name: 'Monaco',
    aliases: ['Principality of Monaco'],
    flagEmoji: '🇲🇨',
    continent: 'Europe',
    population: 40000,
    neighbors: ['FR'],
    capital: 'Monaco',
    difficulty: 'hard',
  },
  {
    code: 'MT',
    name: 'Malta',
    aliases: ['Republic of Malta'],
    flagEmoji: '🇲🇹',
    continent: 'Europe',
    population: 500000,
    neighbors: [],
    capital: 'Valletta',
    difficulty: 'hard',
  },
]

// Create lookup maps for fast access
export const COUNTRY_BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]))
export const COUNTRY_BY_NAME = new Map(COUNTRIES.map(c => [c.name.toLowerCase(), c]))

// Build alias map
export const COUNTRY_BY_ALIAS = new Map<string, Country>()
for (const country of COUNTRIES) {
  COUNTRY_BY_ALIAS.set(country.name.toLowerCase(), country)
  for (const alias of country.aliases) {
    COUNTRY_BY_ALIAS.set(alias.toLowerCase(), country)
  }
}

export function getRandomCountry(difficulty?: 'easy' | 'medium' | 'hard'): Country {
  const filtered = difficulty 
    ? COUNTRIES.filter(c => c.difficulty === difficulty)
    : COUNTRIES
  return filtered[Math.floor(Math.random() * filtered.length)]
}

export function findCountryByGuess(guess: string): Country | null {
  const normalized = guess.toLowerCase().trim()
  return COUNTRY_BY_ALIAS.get(normalized) || null
}

export function getPopulationRange(population: number): string {
  if (population > 100000000) return 'Over 100 million'
  if (population > 50000000) return '50-100 million'
  if (population > 10000000) return '10-50 million'
  if (population > 1000000) return '1-10 million'
  return 'Under 1 million'
}

export function getHint(country: Country, attemptNumber: number): string {
  switch (attemptNumber) {
    case 1:
      return `Continent: ${country.continent}`
    case 2:
      return `Starts with: ${country.name[0].toUpperCase()}`
    case 3:
      return `Population: ${getPopulationRange(country.population)}`
    case 4:
      if (country.neighbors.length > 0) {
        const neighbor = COUNTRY_BY_CODE.get(country.neighbors[0])
        return `Borders: ${neighbor?.name || 'a neighboring country'}`
      }
      return `Capital: ${country.capital}`
    case 5:
      // Show partial name with underscores
      const name = country.name
      const shown = Math.ceil(name.length / 2)
      return `Name: ${name.slice(0, shown)}${'_'.repeat(name.length - shown)}`
    default:
      return ''
  }
}
```

---

### Step 2: Flagel Runtime

#### 2.1 Create `server/src/games/flagel/FlagelRuntime.ts`
```typescript
import { Server } from 'socket.io'
import { BaseGameRuntime } from '../BaseGameRuntime'
import { 
  getRandomCountry, 
  findCountryByGuess, 
  getHint, 
  Country,
  COUNTRY_BY_CODE 
} from './countryData'
import {
  GameConfig,
  GameEventResult,
  Player,
  UserId,
  FlagelSubmitGuessPayload,
} from '@mini-arcade/shared'

interface PlayerGameState {
  attempts: number
  hints: string[]
  solved: boolean
  skipped: boolean
}

interface FlagelRoundState {
  country: Country
  playerStates: Map<UserId, PlayerGameState>
  roundStartedAt: Date
  firstSolverId?: UserId
}

const MAX_ATTEMPTS = 6
const POINTS_BY_ATTEMPT = [1000, 800, 600, 400, 200, 100]

export class FlagelRuntime extends BaseGameRuntime {
  private roundState: FlagelRoundState | null = null
  private usedCountryCodes: Set<string> = new Set()
  
  constructor(io: Server, config: GameConfig) {
    super(io, config)
    this.totalRounds = config.settings?.rounds || 10
    this.roundTime = 120 // 2 minutes per flag (optional limit)
  }
  
  async initialize(): Promise<void> {
    this.usedCountryCodes.clear()
  }
  
  // ==========================================================================
  // ROUND MANAGEMENT
  // ==========================================================================
  
  protected async prepareRound(): Promise<Record<string, unknown>> {
    // Get random country (avoid repeats)
    let country: Country
    let attempts = 0
    do {
      // Mix difficulties
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'easy', 'medium', 'medium', 'hard']
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
      country = getRandomCountry(difficulty)
      attempts++
    } while (this.usedCountryCodes.has(country.code) && attempts < 50)
    
    this.usedCountryCodes.add(country.code)
    
    // Initialize player states
    const playerStates = new Map<UserId, PlayerGameState>()
    for (const [playerId] of this.players) {
      playerStates.set(playerId, {
        attempts: 0,
        hints: [],
        solved: false,
        skipped: false,
      })
    }
    
    this.roundState = {
      country,
      playerStates,
      roundStartedAt: new Date(),
    }
    
    return {
      flagEmoji: country.flagEmoji,
      hintsAvailable: MAX_ATTEMPTS - 1,
    }
  }
  
  protected calculateRoundResults(): Record<string, unknown> {
    if (!this.roundState) return {}
    
    const playerResults: Array<{
      playerId: UserId
      solved: boolean
      attempts: number
      pointsEarned: number
    }> = []
    
    for (const [playerId, state] of this.roundState.playerStates) {
      let points = 0
      
      if (state.solved && state.attempts <= MAX_ATTEMPTS) {
        points = POINTS_BY_ATTEMPT[state.attempts - 1] || 0
        this.addScore(playerId, points)
      }
      
      playerResults.push({
        playerId,
        solved: state.solved,
        attempts: state.attempts,
        pointsEarned: points,
      })
    }
    
    return {
      correctCountry: this.roundState.country.name,
      countryCode: this.roundState.country.code,
      flagEmoji: this.roundState.country.flagEmoji,
      capital: this.roundState.country.capital,
      continent: this.roundState.country.continent,
      playerResults,
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
      case 'submitGuess':
        return this.handleSubmitGuess(playerId, payload as FlagelSubmitGuessPayload)
      
      case 'skip':
        return this.handleSkip(playerId)
      
      default:
        return { success: false, error: `Unknown event: ${eventName}` }
    }
  }
  
  private handleSubmitGuess(
    playerId: UserId,
    payload: FlagelSubmitGuessPayload
  ): GameEventResult {
    if (!this.roundState) {
      return { success: false, error: 'No active round' }
    }
    
    const playerState = this.roundState.playerStates.get(playerId)
    if (!playerState) {
      return { success: false, error: 'Player not found' }
    }
    
    if (playerState.solved || playerState.skipped) {
      return { success: false, error: 'Already finished this round' }
    }
    
    if (playerState.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'No attempts remaining' }
    }
    
    // Increment attempts
    playerState.attempts++
    
    // Check guess
    const guessedCountry = findCountryByGuess(payload.guess)
    const isCorrect = guessedCountry?.code === this.roundState.country.code
    
    if (isCorrect) {
      playerState.solved = true
      
      if (!this.roundState.firstSolverId) {
        this.roundState.firstSolverId = playerId
      }
    } else {
      // Generate hint for next attempt
      const hint = getHint(this.roundState.country, playerState.attempts)
      if (hint) {
        playerState.hints.push(hint)
      }
    }
    
    // Check if round should end
    const allDone = this.checkAllPlayersDone()
    if (allDone) {
      setTimeout(() => this.endRound(), 2000)
    }
    
    return {
      success: true,
      broadcast: [
        // Send result to guessing player
        {
          event: 'flagel:guessResult',
          data: {
            isCorrect,
            attemptsUsed: playerState.attempts,
            maxAttempts: MAX_ATTEMPTS,
            hint: playerState.hints[playerState.hints.length - 1],
            guessedCountry: guessedCountry?.name,
          },
          to: 'player',
          playerId,
        },
        // Notify others of progress
        {
          event: 'flagel:opponentProgress',
          data: {
            playerId,
            attemptCount: playerState.attempts,
            solved: playerState.solved,
          },
          to: 'room',
        },
      ],
    }
  }
  
  private handleSkip(playerId: UserId): GameEventResult {
    if (!this.roundState) {
      return { success: false, error: 'No active round' }
    }
    
    const playerState = this.roundState.playerStates.get(playerId)
    if (!playerState) {
      return { success: false, error: 'Player not found' }
    }
    
    if (playerState.solved || playerState.skipped) {
      return { success: false, error: 'Already finished this round' }
    }
    
    playerState.skipped = true
    
    // Check if round should end
    const allDone = this.checkAllPlayersDone()
    if (allDone) {
      setTimeout(() => this.endRound(), 2000)
    }
    
    return {
      success: true,
      broadcast: [{
        event: 'flagel:opponentProgress',
        data: {
          playerId,
          skipped: true,
        },
        to: 'room',
      }],
    }
  }
  
  private checkAllPlayersDone(): boolean {
    if (!this.roundState) return true
    
    for (const [playerId, state] of this.roundState.playerStates) {
      const player = this.players.get(playerId)
      if (!player?.isConnected) continue
      
      if (!state.solved && !state.skipped && state.attempts < MAX_ATTEMPTS) {
        return false
      }
    }
    
    return true
  }
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getRoundState(): unknown {
    if (!this.roundState) return null
    
    return {
      flagEmoji: this.roundState.country.flagEmoji,
      maxAttempts: MAX_ATTEMPTS,
    }
  }
  
  getPlayerState(playerId: UserId): unknown {
    if (!this.roundState) return null
    
    const state = this.roundState.playerStates.get(playerId)
    if (!state) return null
    
    return {
      attempts: state.attempts,
      hints: state.hints,
      solved: state.solved,
      skipped: state.skipped,
      attemptsRemaining: MAX_ATTEMPTS - state.attempts,
    }
  }
}
```

---

### Step 3: Client Components

#### 3.1 Create `client/src/components/games/flagel/FlagelGame.tsx`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { FlagDisplay } from './FlagDisplay'
import { GuessInput } from './GuessInput'
import { HintsList } from './HintsList'
import { ResultCard } from './ResultCard'
import type { Player, FlagelRoundStarted, FlagelGuessResult, FlagelRoundEnded } from '@mini-arcade/shared'

interface FlagelGameProps {
  roomCode: string
  players: Player[]
}

export function FlagelGame({ roomCode, players }: FlagelGameProps) {
  const { user } = useAuth()
  const { emit, on, off } = useSocket()
  
  // Game state
  const [phase, setPhase] = useState<'playing' | 'roundEnd' | 'gameEnd'>('playing')
  const [currentRound, setCurrentRound] = useState(0)
  const [flagEmoji, setFlagEmoji] = useState<string>('')
  const [attempts, setAttempts] = useState(0)
  const [maxAttempts, setMaxAttempts] = useState(6)
  const [hints, setHints] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [lastGuessResult, setLastGuessResult] = useState<FlagelGuessResult | null>(null)
  const [roundResult, setRoundResult] = useState<FlagelRoundEnded | null>(null)
  
  // Socket handlers
  useEffect(() => {
    const handleRoundStarted = (data: FlagelRoundStarted) => {
      setPhase('playing')
      setCurrentRound(data.roundNumber)
      setFlagEmoji(data.flagEmoji || '')
      setAttempts(0)
      setMaxAttempts(6)
      setHints([])
      setSolved(false)
      setSkipped(false)
      setLastGuessResult(null)
      setRoundResult(null)
    }
    
    const handleGuessResult = (data: FlagelGuessResult) => {
      setLastGuessResult(data)
      setAttempts(data.attemptsUsed)
      
      if (data.isCorrect) {
        setSolved(true)
      } else if (data.hint) {
        setHints(prev => [...prev, data.hint!])
      }
    }
    
    const handleRoundEnded = (data: FlagelRoundEnded) => {
      setPhase('roundEnd')
      setRoundResult(data)
    }
    
    on('flagel:roundStarted', handleRoundStarted)
    on('flagel:guessResult', handleGuessResult)
    on('flagel:roundEnded', handleRoundEnded)
    
    return () => {
      off('flagel:roundStarted')
      off('flagel:guessResult')
      off('flagel:roundEnded')
    }
  }, [on, off])
  
  const handleGuess = useCallback((guess: string) => {
    if (solved || skipped || attempts >= maxAttempts) return
    
    emit('flagel:submitGuess', { roomCode, guess })
  }, [emit, roomCode, solved, skipped, attempts, maxAttempts])
  
  const handleSkip = useCallback(() => {
    if (solved || skipped) return
    
    setSkipped(true)
    emit('flagel:skip', { roomCode })
  }, [emit, roomCode, solved, skipped])
  
  const isDisabled = solved || skipped || attempts >= maxAttempts
  
  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">
        Round {currentRound}
      </h2>
      
      {/* Flag Display */}
      <FlagDisplay emoji={flagEmoji} size="large" />
      
      {/* Attempts indicator */}
      <div className="mt-4 text-gray-400">
        Attempts: {attempts} / {maxAttempts}
      </div>
      
      {/* Hints */}
      {hints.length > 0 && (
        <HintsList hints={hints} />
      )}
      
      {/* Last guess feedback */}
      {lastGuessResult && !lastGuessResult.isCorrect && (
        <div className="mt-4 text-yellow-400">
          {lastGuessResult.guessedCountry 
            ? `"${lastGuessResult.guessedCountry}" is not correct`
            : 'Try again!'}
        </div>
      )}
      
      {/* Success message */}
      {solved && (
        <div className="mt-4 text-green-400 text-xl font-bold">
          Correct!
        </div>
      )}
      
      {/* Input */}
      {phase === 'playing' && !isDisabled && (
        <GuessInput
          onGuess={handleGuess}
          onSkip={handleSkip}
          disabled={isDisabled}
        />
      )}
      
      {/* Out of attempts */}
      {attempts >= maxAttempts && !solved && (
        <div className="mt-4 text-red-400">
          Out of attempts!
        </div>
      )}
      
      {/* Round result */}
      {phase === 'roundEnd' && roundResult && (
        <ResultCard result={roundResult} />
      )}
    </div>
  )
}
```

#### 3.2 Create `client/src/components/games/flagel/FlagDisplay.tsx`
```typescript
'use client'

interface FlagDisplayProps {
  emoji: string
  size?: 'small' | 'medium' | 'large'
}

const SIZE_CLASSES = {
  small: 'text-4xl',
  medium: 'text-6xl',
  large: 'text-9xl',
}

export function FlagDisplay({ emoji, size = 'medium' }: FlagDisplayProps) {
  return (
    <div className={`${SIZE_CLASSES[size]} select-none`}>
      {emoji || '🏳️'}
    </div>
  )
}
```

#### 3.3 Create `client/src/components/games/flagel/GuessInput.tsx`
```typescript
'use client'

import { useState, FormEvent } from 'react'

interface GuessInputProps {
  onGuess: (guess: string) => void
  onSkip: () => void
  disabled?: boolean
}

export function GuessInput({ onGuess, onSkip, disabled }: GuessInputProps) {
  const [value, setValue] = useState('')
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onGuess(value.trim())
      setValue('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="mt-6 w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter country name..."
          disabled={disabled}
          className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Guess
        </button>
      </div>
      
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="mt-3 w-full py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        Skip (0 points)
      </button>
    </form>
  )
}
```

#### 3.4 Create `client/src/components/games/flagel/HintsList.tsx`
```typescript
'use client'

interface HintsListProps {
  hints: string[]
}

export function HintsList({ hints }: HintsListProps) {
  return (
    <div className="mt-6 w-full max-w-md">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Hints:</h3>
      <ul className="space-y-2">
        {hints.map((hint, i) => (
          <li
            key={i}
            className="px-4 py-2 bg-gray-700/50 rounded-lg text-white text-sm"
          >
            {hint}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Files Created

```
server/src/games/flagel/
├── FlagelRuntime.ts
├── countryData.ts
└── index.ts

client/src/components/games/flagel/
├── FlagelGame.tsx
├── FlagDisplay.tsx
├── GuessInput.tsx
├── HintsList.tsx
├── ResultCard.tsx
└── OpponentProgress.tsx
```

---

## Testing Checklist

### Manual Tests
- [ ] Flag emojis display correctly
- [ ] Country name validation works
- [ ] Alternative spellings accepted
- [ ] Hints reveal progressively
- [ ] Skip function works
- [ ] Points calculate correctly
- [ ] Multiplayer progress sync

### Edge Cases
- [ ] Very obscure country names
- [ ] Countries with similar flags
- [ ] Player disconnects mid-game
- [ ] No more unique countries available

---

## Future Enhancements

### Image-Based Flags
```typescript
// Option to use flag images instead of emoji
interface FlagConfig {
  useImages: boolean
  imageBaseUrl: string // e.g., 'https://flagcdn.com/w320/'
}

// Image URL format: `${imageBaseUrl}${countryCode.toLowerCase()}.png`
```

### Additional Game Modes
- **Speed Mode:** Race to identify flags fastest
- **Regions:** Focus on specific continents
- **Hard Mode:** No hints, fewer attempts
- **Capital Cities:** Guess capital from flag

---

## Next Phase
Once all games are complete, proceed to **Phase 8: UI Shell**.
