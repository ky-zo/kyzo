'use client'

import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { PiArrowRight, PiEnvelopeSimple, PiPencilSimpleLine, PiPlayCircle } from 'react-icons/pi'

type Status = 'idle' | 'sending' | 'done' | 'error'

// Before the page is interactive the form posts natively and the route redirects back with ?newsletter=<result>.
const redirectMessages: Record<string, string> = {
  invalid: 'that email doesn’t look right',
  error: 'couldn’t save that, try again',
}

const expectations = [
  { icon: PiPlayCircle, label: 'videos', detail: 'updates on when new things ship' },
  { icon: PiPencilSimpleLine, label: 'updates', detail: 'wins, fails, numbers' },
  { icon: PiEnvelopeSimple, label: 'no spam', detail: 'one-click unsubscribe' },
]

// Position in the entrance stagger, read by .rise-in in globals.css.
const step = (i: number) => ({ '--i': i }) as CSSProperties

const NewsletterSignup = () => {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get('newsletter')
    if (!result) return
    if (result === 'subscribed') setStatus('done')
    else {
      setStatus('error')
      setMessage(redirectMessages[result] ?? redirectMessages.error)
    }
    url.searchParams.delete('newsletter')
    window.history.replaceState(null, '', url)
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setStatus('sending')
    setMessage('')
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), website: data.get('website') }),
      })
      if (response.ok) {
        setStatus('done')
        posthog.capture('newsletter_subscribed')
        return
      }
      const body = await response.json().catch(() => null)
      setMessage(body?.error ?? 'couldn’t save that, try again')
    } catch {
      setMessage('couldn’t reach the server, try again')
    }
    setStatus('error')
  }

  const signup =
    status === 'done' ? (
      <p
        role="status"
        className="rise-in mt-3 flex h-7 items-center text-xs text-black/50"
        style={{ animationDelay: '0ms' }}>
        you’re in. talk soon ✌️
      </p>
    ) : (
      <form
        method="post"
        action="/api/subscribe"
        onSubmit={onSubmit}
        className="rise-in relative mt-3 flex items-center gap-2"
        style={step(expectations.length + 1)}>
        <label
          htmlFor="newsletter-email"
          className="sr-only">
          email for videos and updates on what i’m building
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="your@email.com"
          aria-describedby="newsletter-message"
          onChange={() => status === 'error' && setStatus('idle')}
          className="h-7 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-3 text-xs font-light outline-none transition-colors placeholder:text-black/30 focus:border-black/50"
        />
        {/* Hidden from people. Bots that fill every field land here. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="group flex h-7 shrink-0 items-center gap-1.5 rounded-xl border border-gray-500 bg-black px-3 text-xs font-medium text-white transition-colors duration-300 hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-60">
          {status === 'sending' ? 'subscribing…' : 'subscribe'}
          <PiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
        {/* Errors sit in the card's bottom padding so nothing jumps. */}
        <p
          id="newsletter-message"
          role="status"
          className="absolute left-0 top-full mt-px text-[11px] leading-[14px] text-red-400">
          {status === 'error' ? message : ''}
        </p>
      </form>
    )

  // One card: what you get, then the form to get it. A grey fill lets the white input stand out.
  return (
    <section
      aria-labelledby="newsletter-heading"
      className="flex w-full max-w-md flex-col rounded-2xl border border-black/[0.06] bg-gradient-to-b from-[#fafaf9] to-[#f3f3f1] px-4 pb-4 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,0,0,0.18)]">
      <h2
        id="newsletter-heading"
        className="rise-in pb-1.5 text-xs font-medium text-black/70"
        style={step(0)}>
        newsletter
      </h2>
      <ul>
        {expectations.map(({ icon: Icon, label, detail }, i) => (
          <li
            key={label}
            className="rise-in flex items-center gap-2 py-0.5 text-xs"
            style={step(i + 1)}>
            <Icon
              aria-hidden
              className="shrink-0 text-black/40"
            />
            <span className="shrink-0 text-black/70">{label}</span>
            <span className="draw-in min-w-0 flex-1 border-b border-dotted border-black/10" />
            <span className="shrink-0 text-[11px] text-black/25">{detail}</span>
          </li>
        ))}
      </ul>
      {signup}
    </section>
  )
}

export default NewsletterSignup
