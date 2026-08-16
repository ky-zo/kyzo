import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'interactive | kyzo',
  description: 'small things and experiments by kyzo',
  alternates: {
    canonical: 'https://kyzo.io/interactive',
  },
}

export default function RandomPage() {
  return (
    <main className="w-full max-w-md">
      <p className="text-base leading-relaxed text-black/70">
        hi, this page is a random collection of interactive stuff. play the
        newest 🪿{' '}
        <a
          href="https://quackparty.com/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-black">
          quackparty
        </a>{' '}
        or original{' '}
        <a
          href="https://quack.kyzo.io"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-black">
          goose game
        </a>
        . here i track my{' '}
        <Link
          href="/interactive/x-followers"
          className="underline underline-offset-2 hover:text-black">
          yap to ship ratio
        </Link>{' '}
        and this{' '}
        <Link
          href="/interactive/weight-converter"
          className="underline underline-offset-2 hover:text-black">
          kg to lbs converter
        </Link>{' '}
        helps me to survive in american&apos;s gyms
      </p>
    </main>
  )
}
