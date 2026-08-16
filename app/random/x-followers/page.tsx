import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'X followers graph — kyzo',
  description: 'kyzo follower growth over time',
  alternates: {
    canonical: 'https://kyzo.io/random/x-followers',
  },
}

export default function XFollowersPage() {
  return (
    <main className="w-full max-w-md">
      <iframe
        className="block h-[590px] w-full border-0"
        src="/follower-counter/index.html?v=typography-2026-08-15"
        title="kyzo follower growth"
      />
    </main>
  )
}
