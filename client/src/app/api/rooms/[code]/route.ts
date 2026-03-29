import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getRoomByCode } from '@/lib/rooms'

export async function GET(
  _request: Request,
  context: {
    params: {
      code: string
    }
  }
) {
  try {
    const room = await getRoomByCode(context.params.code)

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found.',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: room,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROOM_CODE',
            message: 'Room code must be 6 uppercase letters or digits.',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ROOM_LOOKUP_FAILED',
          message: error instanceof Error ? error.message : 'Unable to load room.',
        },
      },
      { status: 500 }
    )
  }
}
