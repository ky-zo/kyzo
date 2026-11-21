import type { CSSProperties, ReactNode } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import styles from './side-quests.module.css'

export const metadata: Metadata = {
  title: 'side quests | kyzo',
  description: 'side quests and experiments by kyzo',
  alternates: {
    canonical: 'https://kyzo.io/interactive',
  },
}

// tall: a portrait pair at the top. wide: a full-width landscape. strip: a slim full-width row.
type Size = 'tall' | 'regular' | 'wide' | 'strip'

// photo: a picture fills a dark card. paper: a light screenshot floats as a window on a light card.
// void: no picture, the card draws its own.
type Tone = 'photo' | 'paper' | 'void'

type Quest = {
  title: string
  kicker: string
  caption: ReactNode
  emoji: string
  size: Size
  tone: Tone
  href?: string
  image?: string
}

const quests: Quest[] = [
  {
    title: 'wrist ct',
    kicker: 'ct scan · both wrists',
    caption: 'turn it, peel it, compare. step one of a 7-year quest to save my hand.',
    emoji: '🦴',
    size: 'tall',
    tone: 'photo',
    href: 'https://wrist.kyzo.io/',
    image: '/side-quests/wrist.webp',
  },
  {
    title: 'hidden layers',
    kicker: '1.32b tokens · $905',
    caption: 'six worlds fable 5.2 built in pure three.js. no models, no textures.',
    emoji: '🦋',
    size: 'tall',
    tone: 'photo',
    href: 'https://butterfly.kyzo.io/#conservatory',
    image: '/side-quests/butterfly.webp',
  },
  {
    title: 'quackparty',
    kicker: 'multiplayer game',
    caption: (
      <>
        geese causing chaos in sf and bali. or play the <InlineLink href="https://quack.kyzo.io">original goose game</InlineLink>
      </>
    ),
    emoji: '🪿',
    size: 'wide',
    tone: 'photo',
    href: 'https://quackparty.com/',
    image: '/side-quests/quackparty-day.webp',
  },
  {
    title: 'yap to ship ratio',
    kicker: 'live data',
    caption: 'my x followers against my github contributions',
    emoji: '🚢',
    size: 'regular',
    tone: 'paper',
    href: '/interactive/graphs',
    image: '/side-quests/graphs.webp',
  },
  {
    title: 'dreamrr',
    kicker: 'hackathon',
    caption: (
      <>
        buy and sell dreams. hacked together with <InlineLink href="https://x.com/mmmi_ya">mmmi_ya</InlineLink>
      </>
    ),
    emoji: '💭',
    size: 'regular',
    tone: 'photo',
    href: 'https://dreamrr.vercel.app',
    image: '/side-quests/dreamrr.webp',
  },
  {
    title: 'values finder',
    kicker: 'therapy homework',
    caption: 'my therapist told me to find my values, so i made a tool for it',
    emoji: '🧭',
    size: 'regular',
    tone: 'paper',
    href: 'https://cbt.kyzo.io',
    image: '/side-quests/values.webp',
  },
  {
    title: 'kg to lbs',
    kicker: 'tool',
    caption: 'a converter to help me survive in 🇺🇸',
    emoji: '🏋️',
    size: 'regular',
    tone: 'paper',
    href: '/interactive/weight-converter',
    image: '/side-quests/weight-converter.webp',
  },
  {
    title: 'webcam instrument',
    kicker: 'hand tracking · synth',
    caption: 'turns your webcam into a video instrument',
    emoji: '🎶',
    size: 'strip',
    tone: 'void',
    href: 'https://sounds-indol.vercel.app',
  },
]

const isExternal = (href: string) => href.startsWith('http')

const SIZE: Record<Size, string> = {
  tall: 'aspect-[4/5]',
  regular: 'aspect-[4/3]',
  wide: 'aspect-[2/1]',
  strip: 'aspect-[7/2]',
}

const SIZES_ATTR: Record<Size, string> = {
  tall: '(max-width: 480px) 45vw, 220px',
  regular: '(max-width: 480px) 45vw, 220px',
  wide: '(max-width: 480px) 92vw, 448px',
  strip: '(max-width: 480px) 92vw, 448px',
}

// Colours per tone: card surface, the fade that keeps text readable, and the text itself.
const TONE: Record<Tone, { card: string; fade: string; panel: string; kicker: string; title: string; caption: string; chip: string }> = {
  photo: {
    card: 'bg-neutral-900 ring-black/[0.06]',
    fade: 'bg-gradient-to-t from-black/85 via-black/25 via-40% to-transparent to-75%',
    panel: '',
    kicker: 'text-white/50',
    title: 'text-white',
    caption: 'text-white/65',
    chip: 'bg-black/30 text-white',
  },
  paper: {
    card: 'bg-gradient-to-b from-[#fafaf9] to-[#efefed] ring-black/[0.07]',
    // The window tucks into a frosted pocket instead of fading, so the text never lands on the screenshot.
    fade: '',
    // A minimum height keeps the pockets level across a row.
    panel: 'flex min-h-[56%] flex-col justify-end border-t border-black/[0.05] bg-[#efefed]/90 backdrop-blur-md',
    kicker: 'text-black/35',
    title: 'text-black/85',
    caption: 'text-black/45',
    chip: 'bg-white/80 text-black/70',
  },
  void: {
    card: 'bg-neutral-900 ring-black/[0.06]',
    fade: 'bg-gradient-to-t from-black/70 to-transparent to-70%',
    panel: '',
    kicker: 'text-white/45',
    title: 'text-white',
    caption: 'text-white/60',
    chip: 'bg-white/10 text-white/60',
  },
}

// Links inside a caption sit above the card's own link so both stay clickable. Only photo cards have them, so they're white.
function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="pointer-events-auto relative z-10 text-white/90 underline decoration-white/40 underline-offset-2 transition-colors hover:text-white hover:decoration-white">
      {children}
    </a>
  )
}

// One link covers the whole card. The text on top lets clicks pass through to it.
function CardLink({ quest }: { quest: Quest }) {
  const { href, title } = quest
  if (!href) return null
  const className = 'absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={title}
        className={className}
      />
    )
  }
  return (
    <Link
      href={href}
      aria-label={title}
      className={className}
    />
  )
}

// Bar heights for the offline card, fixed so it draws the same every time.
const BARS = [30, 55, 80, 45, 95, 60, 35, 70, 100, 50, 25, 65, 85, 40, 75, 55, 30, 60, 90, 45, 70, 35, 80, 50, 65, 40, 85, 55]

function Picture({ quest }: { quest: Quest }) {
  if (quest.tone === 'void' || !quest.image) {
    return (
      <div className="absolute inset-y-0 right-6 flex w-1/2 items-center justify-end">
        <div
          aria-hidden
          className={`${styles.bars} h-1/2`}>
          {BARS.map((height, i) => (
            <span
              key={i}
              style={{ height: `${height}%`, animationDelay: `${(i % 6) * -150}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }
  if (quest.tone === 'paper') {
    return (
      <div className="absolute inset-x-3 top-3 aspect-[16/10] overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_24px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.06] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-1 motion-reduce:transition-none">
        <Image
          src={quest.image}
          alt=""
          fill
          sizes="(max-width: 480px) 40vw, 200px"
          className="object-cover object-top"
        />
      </div>
    )
  }
  return (
    <Image
      src={quest.image}
      alt=""
      fill
      sizes={SIZES_ATTR[quest.size]}
      // The tall pair sits at the top of the page, so it shouldn't wait to load.
      loading={quest.size === 'tall' ? 'eager' : 'lazy'}
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
    />
  )
}

function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const { href, size } = quest
  const tone = TONE[quest.tone]
  // Position in the entrance stagger, read by .rise-in in globals.css.
  const step = { '--i': index } as CSSProperties
  return (
    <li
      className={`rise-in group relative ${styles.card} ${size === 'wide' || size === 'strip' ? 'col-span-2' : ''}`}
      style={step}>
      <div
        className={`relative overflow-hidden rounded-2xl ring-1 transition duration-300 ${SIZE[size]} ${tone.card} ${
          href ? 'group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.4)]' : ''
        }`}>
        <Picture quest={quest} />
        {tone.fade && <div className={`absolute inset-0 ${tone.fade}`} />}
        {href ? (
          <span
            aria-hidden
            className={`absolute right-2.5 top-2.5 grid size-6 -translate-y-1 place-items-center rounded-full text-xs opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${tone.chip}`}>
            {isExternal(href) ? '↗' : '→'}
          </span>
        ) : (
          <span className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] backdrop-blur-md ${tone.chip}`}>offline</span>
        )}
        <CardLink quest={quest} />
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 p-3 ${tone.panel}`}>
          <p className={`text-[10px] tracking-wide ${tone.kicker}`}>{quest.kicker}</p>
          <h2 className={`mt-0.5 text-[13px] font-medium leading-tight ${tone.title}`}>{quest.title}</h2>
          <p className={`mt-1 text-[11px] leading-snug ${tone.caption} ${size === 'wide' || size === 'strip' ? 'max-w-[70%]' : ''}`}>{quest.caption}</p>
        </div>
      </div>
      <span
        aria-hidden
        className={`${styles.sticker} pointer-events-none absolute -right-1.5 -top-2.5 z-10 rotate-[-30deg] scale-0 text-lg opacity-0 transition-all duration-300 group-hover:rotate-[10deg] group-hover:scale-100 group-hover:opacity-100`}>
        {quest.emoji}
      </span>
    </li>
  )
}

export default function SideQuestsPage() {
  return (
    <main className="w-full max-w-md text-sm leading-relaxed text-black/70">
      <div className="flex items-baseline justify-between gap-4">
        <p>random collection of stuff i made.</p>
        <span className="shrink-0 text-[11px] tabular-nums text-black/25">{quests.length} quests</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {quests.map((quest, index) => (
          <QuestCard
            key={quest.title}
            quest={quest}
            index={index}
          />
        ))}
      </ul>
    </main>
  )
}
