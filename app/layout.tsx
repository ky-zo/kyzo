import Socials from '@/components/Socials'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'kyzo.io',
  description: 'kyzo.io',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-[100dvh] w-full flex-col items-start justify-start gap-10 p-4 text-sm lowercase sm:p-10">
          <div className="flex flex-col gap-1">
            <h1 className=" font-black">kyzo</h1>
            <Socials />
          </div>

          <div>
            <h3>build, automate, manage, scale</h3>
            <h3 className="lowercase">nextjs | zapier | supabase | operations | process automation | sheets </h3>
          </div>

          {children}
        </div>
      </body>
      <Analytics />
    </html>
  )
}
