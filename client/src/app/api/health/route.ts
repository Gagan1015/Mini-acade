import { NextResponse } from 'next/server'

// ALB health check target. Stays simple: no DB, no auth.
// Returns 200 + tiny JSON whenever the Next.js process is alive.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({ status: 'ok' })
}
