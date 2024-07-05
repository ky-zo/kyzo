'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { PiArrowLeft, PiArrowRight } from 'react-icons/pi'

const Navigation = () => {
  const pathname = usePathname()

  return (
    <div className="grid w-full max-w-md grid-cols-[1fr_5fr_1fr] items-center gap-2 text-xs">
      <div
        // href={'/'}
        className={`flex min-w-[100px] items-center gap-2 whitespace-nowrap transition-all duration-75 sm:max-w-[80px] ${
          pathname === '/' ? 'font-medium text-black' : '  hover:underline'
        }`}>
        my collection
        {/* {pathname === '/' && <PiArrowLeft className="min-w-[10px]" />} */}
      </div>

      {/* <Link
        href={'/'}
        className={`flex min-w-[100px] items-center gap-2 whitespace-nowrap transition-all duration-75 sm:max-w-[80px] ${
          pathname === '/' ? 'font-medium text-black' : '  hover:underline'
        }`}>
        my collection
        {pathname === '/' && <PiArrowLeft className="min-w-[10px]" />}
      </Link> */}
      <div className="border-grey-500 w-full border-b sm:max-w-[500px]" />

      {/* <Link
        href={'/blog'}
        className={`flex min-w-[100px] items-center justify-end gap-2 whitespace-nowrap text-end transition-all duration-75 sm:max-w-[80px] ${
          pathname === '/blog' ? 'font-medium text-black ' : '  hover:underline'
        }`}>
        {pathname === '/blog' && <PiArrowRight className="min-w-[10px]" />}
        read my blog
      </Link> */}
    </div>
  )
}

export default Navigation
