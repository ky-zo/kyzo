import { NextResponse } from 'next/server'

import { followerSeed } from '@/lib/followers/seed'
import { readFollowerHistory } from '@/lib/followers/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let history = followerSeed
  let source: 'stored' | 'seed' = 'seed'
  try {
    history = await readFollowerHistory()
    source = history.lastSync ? 'stored' : 'seed'
  } catch (error) {
    console.error('Follower history storage read failed; serving the committed seed', error)
  }

  return NextResponse.json({ ...history, source }, { headers: { 'Cache-Control': 'no-store' } })
}
