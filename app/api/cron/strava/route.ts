import { NextResponse } from 'next/server'

import { readStravaToken, writeStravaEffort, writeStravaToken } from '@/lib/strava/store'
import { fetchStravaEffort } from '@/lib/strava/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const stored = await readStravaToken().catch(() => null)
    const history = await fetchStravaEffort({
      refreshToken: stored ?? undefined,
      onTokenRotated: writeStravaToken,
    })
    await writeStravaEffort(history)
    return NextResponse.json({
      ok: true,
      totalEffort: history.totalEffort,
      points: history.points.length,
      updatedAt: history.updatedAt,
      window: history.lastSync,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
