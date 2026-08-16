import { NextResponse } from 'next/server'

import { stravaEffortSeed } from '@/lib/strava/seed'
import { readStravaEffort } from '@/lib/strava/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let history = stravaEffortSeed
  let source: 'stored' | 'seed' = 'seed'
  try {
    history = await readStravaEffort()
    source = history.lastSync ? 'stored' : 'seed'
  } catch (error) {
    console.error('Strava effort storage read failed; serving the committed seed', error)
  }

  const { lastSync, ...publicHistory } = history
  return NextResponse.json(
    { ...publicHistory, source },
    { headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600' } },
  )
}
