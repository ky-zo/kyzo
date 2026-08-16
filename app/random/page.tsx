import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'interactive | kyzo',
  description: 'small things and experiments by kyzo',
  alternates: {
    canonical: 'https://kyzo.io/random',
  },
}

export default function RandomPage() {
  return (
    <main className="w-full max-w-md">
      <ul className="list-disc pl-4">
        <li>
          <Link
            href="/random/x-followers"
            className="normal-case text-black/70 hover:underline">
            graphs
          </Link>
        </li>
        <li>
          <Link
            href="/random/weight-converter"
            className="normal-case text-black/70 hover:underline">
            weight converter
          </Link>
        </li>
        <li>
          <a
            href="https://quack.kyzo.io"
            target="_blank"
            rel="noreferrer"
            className="normal-case text-black/70 hover:underline">
            goose game
          </a>
        </li>
      </ul>
    </main>
  )
}
