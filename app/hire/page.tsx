'use client'

import Socials from '@/components/Socials'
import Link from 'next/link'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { PiArrowLeft } from 'react-icons/pi'

const contactOptions = [
  {
    id: uuidv4(),
    name: 'async call',
    link: 'https://async.com/kamil.111',
    description: 'forwards to async website to record a call',
  },
  {
    id: uuidv4(),
    name: 'record loom',
    link: 'https://www.loom.com/',
    description: 'allows you to record screen & video',
  },
  {
    id: uuidv4(),
    name: 'email',
    link: 'mailto:kamil@kyzo.io',
    description: 'opens email client',
  },
]

const Page = () => {
  return (
    <>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-1 pr-10 transition-all duration-300 hover:underline">
          <PiArrowLeft />
          back
        </Link>
        <div className="flex flex-col">
          <div className="peer relative flex gap-2">
            {contactOptions.map((option) => {
              return (
                <div key={option.id}>
                  <a
                    href={option.link}
                    className={`group peer relative flex h-8 w-full items-center justify-center overflow-hidden rounded-xl border-[1px] border-gray-500 bg-black font-medium text-white transition-all duration-300 hover:bg-white sm:min-w-[120px]`}>
                    <span className="relative tracking-wide transition-all duration-300 group-hover:tracking-tight  group-hover:text-black">
                      {option.name}
                    </span>
                  </a>
                  <p className="invisible absolute -bottom-6 translate-x-full text-gray-500 opacity-0 transition-all duration-300 peer-hover:visible peer-hover:translate-x-0 peer-hover:opacity-100">
                    {option.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
