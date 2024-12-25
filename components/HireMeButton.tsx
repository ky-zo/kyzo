'use client'

import Link from 'next/link'
import { PiArrowRight } from 'react-icons/pi'

const HireMeButton = () => {
  return (
    <div className="relative flex items-center gap-4">
      <Link
        href="/hire"
        className="group peer relative flex h-8 min-w-[120px] items-center justify-center overflow-hidden rounded-xl border-[1px] border-gray-500 bg-black font-medium text-white transition-all duration-300 hover:bg-white">
        <span className="relative tracking-wide transition-all duration-300 group-hover:tracking-tight group-hover:text-black">{'hire me'}</span>
        <div className="absolute right-4 flex translate-x-8 transform items-center justify-start text-black duration-300 group-hover:translate-x-0">
          <PiArrowRight />
        </div>
      </Link>

      <p className="invisible right-0 translate-x-full text-xs text-gray-400 opacity-0 transition-all duration-300 peer-hover:visible peer-hover:translate-x-0 peer-hover:opacity-100">
        {'lets you pick the preferred way of contact'}
      </p>
    </div>
  )
}

export default HireMeButton
