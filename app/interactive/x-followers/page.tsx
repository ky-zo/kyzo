import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'graphs | kyzo',
  description: 'kyzo follower growth over time',
  alternates: {
    canonical: 'https://kyzo.io/interactive/x-followers',
  },
}

export default function XFollowersPage() {
  return (
    <main className="w-full max-w-md">
      <iframe
        className="block h-[590px] w-full border-0"
        src="/follower-counter/index.html?v=github-off-2026-08-15"
        title="kyzo follower and github activity"
      />
    </main>
  )
}
