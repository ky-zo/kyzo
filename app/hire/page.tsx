'use client'

import Socials from '@/components/Socials'
import Link from 'next/link'
import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { PiArrowLeft } from 'react-icons/pi'
import { CgSpinnerAlt } from 'react-icons/cg'

const contactOptions = [
  {
    id: uuidv4(),
    name: 'async call',
    link: 'https://async.com/kamil.111',
    description: 'record a message',
    loading: false,
  },
  {
    id: uuidv4(),
    name: 'email',
    link: 'mailto:kamil@kyzo.io',
    description: 'opens email client',
    loading: false,
  },
]

const Page = () => {
  const [options, setOptions] = useState(contactOptions)

  const handleClick = (id: string) => {
    setOptions((prev) => {
      return prev.map((option) => {
        if (option.id === id) {
          return {
            ...option,
            loading: true,
          }
        } else {
          return option
        }
      })
    })
  }

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
            {options.map((option) => {
              return (
                <div
                  key={option.id}
                  className="w-full">
                  <a
                    onClick={() => handleClick(option.id)}
                    href={option.link}
                    className={`group peer relative flex h-8 w-full items-center justify-center overflow-hidden rounded-xl border-[1px] border-gray-500 bg-black font-medium text-white transition-all duration-300 ${
                      !option.loading && `hover:bg-white`
                    } sm:min-w-[120px]`}>
                    {option.loading ? (
                      <CgSpinnerAlt className="animate-spin" />
                    ) : (
                      <span className="relative tracking-wide transition-all duration-300 group-hover:tracking-tight  group-hover:text-black">
                        {option.name}
                      </span>
                    )}
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
