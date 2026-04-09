'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { PiArrowLeft, PiArrowRight } from 'react-icons/pi'

const Navigation = () => {
  const pathname = usePathname()

  return (
    <div className="flex w-full max-w-md items-center gap-2 text-xs">
      <Link
        href={'/'}
        className={`whitespace-nowrap transition-all duration-75 ${
          pathname === '/' ? 'font-medium text-black' : 'hover:underline'
        }`}>
        collection
      </Link>
      <div className="border-grey-500 flex-1 border-b" />
      <Link
        href={'/writing'}
        className={`whitespace-nowrap transition-all duration-75 ${
          pathname === '/writing' ? 'font-medium text-black' : 'hover:underline'
        }`}>
        writing
      </Link>
      <div className="border-grey-500 flex-1 border-b" />
      <Link
        href={'/biomarkers'}
        className={`whitespace-nowrap transition-all duration-75 ${
          pathname === '/biomarkers' ? 'font-medium text-black' : 'hover:underline'
        }`}>
        biomarkers
      </Link>
    </div>
  )
}

export default Navigation
