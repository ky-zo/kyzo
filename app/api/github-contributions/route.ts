import { NextResponse } from 'next/server'

import { fetchPublicGitHubContributions } from '@/lib/github/contributions'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const contributions = await fetchPublicGitHubContributions()
    return NextResponse.json(contributions, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Public GitHub contribution calendar fetch failed', error)
    return NextResponse.json(
      { error: 'GitHub activity is temporarily unavailable' },
      {
        status: 502,
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
      },
    )
  }
}
