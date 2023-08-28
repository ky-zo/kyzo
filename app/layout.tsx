import Socials from '@/components/Socials'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Link from 'next/link'
import { Suspense } from 'react'
import { PHProvider, PostHogPageview } from '@/lib/providers'

const inter = Inter({ subsets: ['latin'] })

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
        url: '/og/og.png',
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
    images: ['/og/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <PHProvider>
        <body className={inter.className}>
          <div className="flex min-h-[100dvh] w-full flex-col items-start justify-start gap-10 p-4 text-sm lowercase sm:p-10">
            <div className="flex flex-col gap-1">
              <Link href="/">
                <h1 className=" font-black">kyzo</h1>
              </Link>
              <Socials />
            </div>

            <div>
              <h3>build, automate, manage, scale</h3>
              <h3 className="lowercase">
                react | nextjs | zapier | supabase | operations | process automation | sheets
              </h3>
            </div>

            {children}
          </div>
        </body>
      </PHProvider>
      <Analytics />
    </html>
  )
}
