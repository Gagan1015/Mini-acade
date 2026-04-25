import { NextResponse } from 'next/server'
import { z } from 'zod'

import { gameIdSchema, triviaCategoryListSchema, triviaCategorySchema, triviaDifficultySchema } from '@mini-arcade/shared'

import { requireSession } from '@/lib/admin'
import { createRoomForUser } from '@/lib/rooms'

const createRoomSchema = z.object({
  gameId: gameIdSchema,
  maxPlayers: z.number().int().min(1).max(10).optional(),
  settings: z
    .object({
      rounds: z.number().int().min(1).max(20).optional(),
      triviaCategory: triviaCategorySchema.optional(),
      triviaCategories: triviaCategoryListSchema.optional(),
      triviaDifficulty: triviaDifficultySchema.optional(),
    })
    .optional(),
})

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const json = await request.json()
    const input = createRoomSchema.parse(json)

    const result = await createRoomForUser({
      creatorId: session.user.id,
      gameId: input.gameId,
      maxPlayers: input.maxPlayers,
      settings: input.gameId === 'trivia' ? input.settings : undefined,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROOM_PAYLOAD',
            message: error.issues.map((issue) => issue.message).join(', '),
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ROOM_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Unable to create room.',
        },
      },
      { status: 500 }
    )
  }
}
