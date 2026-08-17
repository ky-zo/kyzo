import type { Metadata } from 'next'

import { followerSeed } from '@/lib/followers/seed'
import { readFollowerHistory } from '@/lib/followers/store'

import Graphs from './graphs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'graphs | kyzo',
  description: 'kyzo follower growth over time',
  alternates: {
    canonical: 'https://kyzo.io/interactive/graphs',
  },
}

export default async function GraphsPage() {
  let history = followerSeed
  try {
    history = await readFollowerHistory()
  } catch {
    history = followerSeed
  }

  return (
    <main className="w-full max-w-md">
      <Graphs history={history} />
    </main>
  )
}
