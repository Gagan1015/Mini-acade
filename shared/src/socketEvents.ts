/**
 * Socket.IO event names grouped by feature so both client and server
 * can share the exact same contract surface.
 */

export const CONNECTION_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
} as const

export const ROOM_EVENTS = {
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  START_GAME: 'room:startGame',
  KICK_PLAYER: 'room:kickPlayer',
  JOINED: 'room:joined',
  LEFT: 'room:left',
  PRESENCE: 'room:presence',
  GAME_STARTED: 'room:gameStarted',
  PLAYER_KICKED: 'room:playerKicked',
  ERROR: 'room:error',
  HOST_CHANGED: 'room:hostChanged',
} as const

export const SKRIBBLE_EVENTS = {
  STROKE_BATCH: 'draw:strokeBatch',
  CLEAR_CANVAS: 'draw:clearCanvas',
  GUESS: 'draw:guess',
  CHOOSE_WORD: 'draw:chooseWord',
  REQUEST_SYNC: 'draw:requestSync',
  STROKE_BROADCAST: 'draw:strokeBroadcast',
  CANVAS_CLEARED: 'draw:canvasCleared',
  GUESS_RESULT: 'draw:guessResult',
  CORRECT_GUESS: 'draw:correctGuess',
  SYNC: 'draw:sync',
  WORD_CHOOSING_STARTED: 'draw:wordChoosingStarted',
  WORD_CHOICES: 'draw:wordChoices',
  ROUND_STARTED: 'draw:roundStarted',
  ROUND_ENDED: 'draw:roundEnded',
  GAME_ENDED: 'draw:gameEnded',
  TURN_STARTED: 'draw:turnStarted',
  WORD_HINT: 'draw:wordHint',
} as const

export const TRIVIA_EVENTS = {
  SUBMIT_ANSWER: 'trivia:submitAnswer',
  REQUEST_NEXT: 'trivia:requestNext',
  ROUND_STARTED: 'trivia:roundStarted',
  ROUND_ENDED: 'trivia:roundEnded',
  ANSWER_RESULT: 'trivia:answerResult',
  PLAYER_ANSWERED: 'trivia:playerAnswered',
  GAME_ENDED: 'trivia:gameEnded',
  TIMER_TICK: 'trivia:timerTick',
  SYNC: 'trivia:sync',
} as const

export const WORDEL_EVENTS = {
  SUBMIT_GUESS: 'wordel:submitGuess',
  ROUND_STARTED: 'wordel:roundStarted',
  GUESS_RESULT: 'wordel:guessResult',
  ROUND_ENDED: 'wordel:roundEnded',
  GAME_ENDED: 'wordel:gameEnded',
  OPPONENT_PROGRESS: 'wordel:opponentProgress',
  SYNC: 'wordel:sync',
} as const

export const FLAGEL_EVENTS = {
  SUBMIT_GUESS: 'flagel:submitGuess',
  SKIP: 'flagel:skip',
  ROUND_STARTED: 'flagel:roundStarted',
  GUESS_RESULT: 'flagel:guessResult',
  ROUND_ENDED: 'flagel:roundEnded',
  GAME_ENDED: 'flagel:gameEnded',
  OPPONENT_PROGRESS: 'flagel:opponentProgress',
  SYNC: 'flagel:sync',
} as const

export const CHAT_EVENTS = {
  SEND_MESSAGE: 'chat:sendMessage',
  MESSAGE: 'chat:message',
  SYSTEM_MESSAGE: 'chat:systemMessage',
} as const

export const ADMIN_EVENTS = {
  STATS_UPDATE: 'admin:statsUpdate',
  USER_ACTIVITY: 'admin:userActivity',
  ROOM_UPDATE: 'admin:roomUpdate',
  ERROR_LOG: 'admin:errorLog',
} as const

export const SOCKET_EVENTS = {
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
  ...SKRIBBLE_EVENTS,
  ...TRIVIA_EVENTS,
  ...WORDEL_EVENTS,
  ...FLAGEL_EVENTS,
  ...CHAT_EVENTS,
  ...ADMIN_EVENTS,
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
