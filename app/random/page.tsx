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
    <main className="w-full max-w-[752px]">
      <iframe
        className="block h-[650px] w-full border-0 sm:h-[680px]"
        src="/follower-counter/index.html"
        title="kyzo follower growth"
      />
    </main>
  )
}
