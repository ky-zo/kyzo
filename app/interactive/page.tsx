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

const POP_VARIANTS = [
  'right-0 top-0 translate-x-4 rotate-45 duration-200 group-hover:translate-x-0 group-hover:-rotate-12 group-hover:scale-150 group-hover:animate-bounce',
  '-left-8 top-0 -translate-x-3 -rotate-45 duration-500 group-hover:translate-x-0 group-hover:rotate-12 group-hover:scale-125',
  'right-0 bottom-0 translate-x-4 duration-300 group-hover:translate-x-0 group-hover:rotate-[360deg] group-hover:scale-[1.7]',
  'right-10 top-0 translate-y-3 rotate-12 duration-700 group-hover:translate-y-0 group-hover:-rotate-[25deg] group-hover:scale-125 group-hover:animate-pulse',
  '-left-8 bottom-0 rotate-90 duration-300 group-hover:rotate-0 group-hover:scale-150 group-hover:animate-bounce',
  'right-2 top-0 -translate-y-1 rotate-180 duration-500 group-hover:translate-y-0 group-hover:rotate-[15deg] group-hover:scale-[1.6]',
]

const LABEL_TILTS = [
  'group-hover:-rotate-2',
  'group-hover:rotate-2',
  'group-hover:-rotate-3',
  'group-hover:rotate-1 group-hover:-translate-y-0.5',
]

function seedFrom(text: string) {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function FunLink({ href, emoji, external, children }: FunLinkProps) {
  const seed = seedFrom(href + emoji)
  const className =
    'group underline decoration-black/30 underline-offset-2 transition-colors duration-200 hover:text-black hover:decoration-black hover:decoration-wavy'
  const label = (
    <span
      className={`inline-block transition-transform duration-200 ${LABEL_TILTS[seed % LABEL_TILTS.length]}`}>
      {children}
    </span>
  )
  const pop = (
    <span
      aria-hidden
      className={`pointer-events-none absolute scale-0 text-lg opacity-0 transition-all group-hover:opacity-100 ${POP_VARIANTS[seed % POP_VARIANTS.length]}`}>
      {emoji}
    </span>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
        {pop}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {label}
      {pop}
    </Link>
  )
}

export default function InteractivePage() {
  return (
    <main className="w-full max-w-md text-base leading-relaxed text-black/70">
      <p>random collection of stuff i made.</p>
      <ul className="mt-3 list-disc space-y-2 pl-4">
        <li className="relative transition-transform duration-200 hover:translate-x-1">
          play{' '}
          <FunLink href="https://quackparty.com/" emoji="🪿" external>
            quackparty
          </FunLink>{' '}
          or the original{' '}
          <FunLink href="https://quack.kyzo.io" emoji="🦆" external>
            goose game
          </FunLink>
        </li>
        <li className="relative transition-transform duration-200 hover:translate-x-1">
          my{' '}
          <FunLink href="/interactive/x-followers" emoji="🚢">
            yap to ship ratio
          </FunLink>
        </li>
        <li className="relative transition-transform duration-200 hover:translate-x-1">
          <FunLink href="/interactive/weight-converter" emoji="🏋️">
            kg to lbs converter
          </FunLink>{' '}
          to help survive in 🇺🇸
        </li>
        <li className="relative transition-transform duration-200 hover:translate-x-1">
          <FunLink href="https://sounds-kyzobuilds.vercel.app" emoji="🎶" external>
            webcam as video instrument
          </FunLink>
        </li>
        <li className="relative transition-transform duration-200 hover:translate-x-1">
          <FunLink href="https://dreamrr.vercel.app" emoji="💭" external>
            dreamrr
          </FunLink>{' '}
          — met{' '}
          <FunLink href="https://x.com/mmmi_ya" emoji="✨" external>
            mmmi_ya
          </FunLink>{' '}
          on a random design hackathon, we hacked this together for fun
        </li>
      </ul>
    </main>
  )
}
