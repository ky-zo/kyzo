'use client'

import { useState } from 'react'
import { PiArrowRight } from 'react-icons/pi'
import { CgSpinnerAlt } from 'react-icons/cg'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const HireMeButton = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleButtonClick = () => {
    setLoading(true)
    router.push('https://cal.com/kamil-kyzo/discovery')
  }
  return (
    <div className="relative flex items-center gap-4">
      <Link
        href={'/hire'}
        onClick={handleButtonClick}
        className={`group peer relative flex h-8 min-w-[120px] items-center justify-center overflow-hidden rounded-xl border-[1px] border-gray-500 bg-black font-medium text-white transition-all duration-300 hover:bg-white`}>
        <span className="relative tracking-wide transition-all duration-300 group-hover:tracking-tight  group-hover:text-black">
          hire me
        </span>
        <div className="absolute right-4 flex translate-x-8 transform items-center justify-start text-black duration-300  group-hover:translate-x-0">
          {' '}
          <PiArrowRight />{' '}
        </div>
      </Link>

      <p className="invisible right-0 translate-x-full text-xs text-gray-400 opacity-0 transition-all duration-300 peer-hover:visible peer-hover:translate-x-0 peer-hover:opacity-100">
        {`let's you pick preffered way of contact`}
      </p>
    </div>
  )
}

export default HireMeButton
