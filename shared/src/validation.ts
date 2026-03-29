import { type ZodSchema, ZodError, type ZodIssue, type ZodTypeAny } from 'zod'

import type { ClientToServerEvents } from './types'
import {
  CHAT_EVENTS,
  FLAGEL_EVENTS,
  ROOM_EVENTS,
  SKRIBBLE_EVENTS,
  TRIVIA_EVENTS,
  WORDEL_EVENTS,
} from './socketEvents'
import {
  chatMessagePayloadSchema,
  clearCanvasPayloadSchema,
  flagelSkipPayloadSchema,
  flagelSubmitGuessPayloadSchema,
  guessPayloadSchema,
  requestSyncPayloadSchema,
  roomJoinPayloadSchema,
  roomKickPlayerPayloadSchema,
  roomLeavePayloadSchema,
  roomStartGamePayloadSchema,
  strokeBatchPayloadSchema,
  triviaSubmitAnswerPayloadSchema,
  wordelSubmitGuessPayloadSchema,
} from './schemas'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details: ZodIssue[] }

export type ClientEventName = keyof ClientToServerEvents
export type ClientEventPayload<TEventName extends ClientEventName> = Parameters<
  ClientToServerEvents[TEventName]
>[0]

export const eventSchemas: Record<ClientEventName, ZodTypeAny> = {
  [ROOM_EVENTS.JOIN]: roomJoinPayloadSchema,
  [ROOM_EVENTS.LEAVE]: roomLeavePayloadSchema,
  [ROOM_EVENTS.START_GAME]: roomStartGamePayloadSchema,
  [ROOM_EVENTS.KICK_PLAYER]: roomKickPlayerPayloadSchema,
  [SKRIBBLE_EVENTS.STROKE_BATCH]: strokeBatchPayloadSchema,
  [SKRIBBLE_EVENTS.CLEAR_CANVAS]: clearCanvasPayloadSchema,
  [SKRIBBLE_EVENTS.GUESS]: guessPayloadSchema,
  [SKRIBBLE_EVENTS.REQUEST_SYNC]: requestSyncPayloadSchema,
  [TRIVIA_EVENTS.SUBMIT_ANSWER]: triviaSubmitAnswerPayloadSchema,
  [WORDEL_EVENTS.SUBMIT_GUESS]: wordelSubmitGuessPayloadSchema,
  [FLAGEL_EVENTS.SUBMIT_GUESS]: flagelSubmitGuessPayloadSchema,
  [FLAGEL_EVENTS.SKIP]: flagelSkipPayloadSchema,
  [CHAT_EVENTS.SEND_MESSAGE]: chatMessagePayloadSchema,
}

export function validatePayload<T>(schema: ZodSchema<T>, payload: unknown): ValidationResult<T> {
  try {
    const data = schema.parse(payload)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues.map(formatIssue).join(', '),
        details: error.issues,
      }
    }

    return {
      success: false,
      error: 'Unknown validation error',
      details: [],
    }
  }
}

export function parseSocketPayload<TEventName extends ClientEventName>(
  eventName: TEventName,
  payload: unknown
): ClientEventPayload<TEventName> {
  const result = safeParseSocketPayload(eventName, payload)

  if (!result.success) {
    throw new Error(`Validation failed for ${eventName}: ${result.error}`)
  }

  return result.data
}

export function safeParseSocketPayload<TEventName extends ClientEventName>(
  eventName: TEventName,
  payload: unknown
): ValidationResult<ClientEventPayload<TEventName>> {
  const schema = eventSchemas[eventName] as ZodSchema<ClientEventPayload<TEventName>>
  return validatePayload(schema, payload)
}

function formatIssue(issue: ZodIssue) {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'payload'
  return `${path}: ${issue.message}`
}
