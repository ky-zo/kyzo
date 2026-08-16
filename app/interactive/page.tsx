import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'interactive | kyzo',
  description: 'small things and experiments by kyzo',
  alternates: {
    canonical: 'https://kyzo.io/interactive',
  },
}

type FunLinkProps = {
  href: string
  emoji: string
  external?: boolean
  children: ReactNode
}

function FunLink({ href, emoji, external, children }: FunLinkProps) {
  const className =
    'group relative inline-block underline decoration-black/30 underline-offset-2 transition-all duration-200 hover:-rotate-2 hover:text-black hover:decoration-black hover:decoration-wavy'
  const pop = (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rotate-12 scale-0 text-lg opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:scale-125 group-hover:opacity-100">
      {emoji}
    </span>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
        {pop}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
      {pop}
    </Link>
  )
}

export default function InteractivePage() {
  return (
    <main className="w-full max-w-md text-base leading-relaxed text-black/70">
      <p>random collection of stuff i made.</p>
      <ul className="mt-3 list-disc space-y-2 pl-4">
        <li className="transition-transform duration-200 hover:translate-x-1">
          play{' '}
          <FunLink href="https://quackparty.com/" emoji="🪿" external>
            quackparty
          </FunLink>{' '}
          or the original{' '}
          <FunLink href="https://quack.kyzo.io" emoji="🦆" external>
            goose game
          </FunLink>
        </li>
        <li className="transition-transform duration-200 hover:translate-x-1">
          my{' '}
          <FunLink href="/interactive/x-followers" emoji="🚢">
            yap to ship ratio
          </FunLink>
        </li>
        <li className="transition-transform duration-200 hover:translate-x-1">
          <FunLink href="/interactive/weight-converter" emoji="🏋️">
            kg to lbs converter
          </FunLink>{' '}
          to help survive in 🇺🇸
        </li>
        <li className="transition-transform duration-200 hover:translate-x-1">
          <FunLink href="https://sounds-kyzobuilds.vercel.app" emoji="🎶" external>
            webcam as video instrument
          </FunLink>
        </li>
        <li className="transition-transform duration-200 hover:translate-x-1">
          <FunLink href="https://dreamrr.vercel.app" emoji="💭" external>
            dreamrr
          </FunLink>{' '}
          — a hackathon,{' '}
          <FunLink href="https://x.com/mmmi_ya" emoji="✨" external>
            mmmi_ya
          </FunLink>{' '}
          came up with the idea and we built it together
        </li>
      </ul>
    </main>
  )
}
