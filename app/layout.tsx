import { GeistSans } from 'geist/font/sans'

import './globals.css'

import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'

import NewsletterSignup from '@/components/NewsletterSignup'
import Socials from '@/components/Socials'
import { HIDE_SIGNUP_SCRIPT } from '@/lib/newsletter'

import Navigation from './Navigation'

export const metadata: Metadata = {
  title: 'kyzo',
  description: 'kyzo.io',
  openGraph: {
    title: 'kyzo',
    description: 'kyzo.io',
    url: 'https://kyzo.io',
    siteName: 'kyzo.io',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kyzo',
    description: 'kyzo.io',
    creator: '@ky__zo',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script below may add data-subscribed to <html> before React hydrates.
    <html
      lang="en"
      suppressHydrationWarning>
      <body className={`bg-[#FEFEFE] font-light ${GeistSans.className}`}>
        <script dangerouslySetInnerHTML={{ __html: HIDE_SIGNUP_SCRIPT }} />
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-start gap-6 p-4 text-sm lowercase sm:p-10">
          <div className="flex w-full max-w-md flex-col gap-4">
            <div className="text-2xl">
              👋 Hi, I&apos;m <span className="font-bold">kyzo</span>{' '}
            </div>
            <h3>founder</h3>
            <Socials />
          </div>
          <NewsletterSignup />
          <Navigation />
          {children}
        </div>
      </body>
      <Analytics />
    </html>
  )
}
