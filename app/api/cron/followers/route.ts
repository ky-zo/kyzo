import { NextResponse } from 'next/server'

import { mergeXSnapshot } from '@/lib/followers/history'
import { readFollowerHistory, writeFollowerHistory } from '@/lib/followers/store'
import { fetchXFollowers } from '@/lib/followers/x-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const requested = Number(new URL(request.url).searchParams.get('days'))
  const days = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 90) : 45

  try {
    const [history, snapshot] = await Promise.all([readFollowerHistory(), fetchXFollowers(days)])
    const merged = mergeXSnapshot(history, snapshot)
    await writeFollowerHistory(merged)
    return NextResponse.json({
      ok: true,
      followers: merged.currentFollowers,
      updatedAt: merged.updatedAt,
      points: merged.points.length,
      window: merged.lastSync,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
