import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'graphs | kyzo',
  description: 'kyzo follower growth over time',
  alternates: {
    canonical: 'https://kyzo.io/interactive/graphs',
  },
}

export default function GraphsPage() {
  return (
    <main className="w-full max-w-md">
      <iframe
        className="block h-[590px] w-full border-0"
        src="/follower-counter/index.html?v=graphs-2026-08-17"
        title="kyzo follower and github activity"
      />
    </main>
  )
}
