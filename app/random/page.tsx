import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'random — kyzo',
  description: 'kyzo follower growth',
  alternates: {
    canonical: 'https://kyzo.io/random',
  },
}

export default function RandomPage() {
  return (
    <main className="w-full max-w-md">
      <iframe
        className="block h-[590px] w-full border-0"
        src="/follower-counter/index.html?v=compact-2026-08-15"
        title="kyzo follower growth"
      />
    </main>
  )
}
