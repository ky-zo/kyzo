import Socials from '@/components/Socials'
import { Badge } from '@/components/ui/badge'
import { exp } from '@/content/exp'
import { PiArrowDownLight } from 'react-icons/pi'

export default function Home() {
  return (
    <ul className="w-full max-w-md space-y-5">
      {exp.map((e) => {
        return (
          <li
            key={e.id}
            className={`shadow-neumorphic flex min-h-[50px] w-full flex-col gap-2  rounded-2xl border-[0.5px] p-4 ${
              (e.status === 'failed' || e.status === 'quit') && 'bg-gray-50'
            } `}>
            <div className="flex flex-col items-start ">
              <div className="flex w-full items-center justify-between">
                <div>
                  {e.title && e.title + '@'}
                  <a
                    href={e.company.href}
                    className="font-bold  hover:underline"
                    target="_blank">
                    {e.company.name}
                  </a>
                </div>
                <Badge
                  variant={'outline'}
                  className={` font-normal 
                    ${e.status === 'failed' && 'border-red-300 bg-red-50 text-red-500'}
                    ${e.status === 'quit' && 'border-green-300 bg-green-50 text-green-500'}
                    ${e.status === 'building' && 'border-blue-300 bg-blue-50 text-blue-500'}

                    `}>
                  {e.status}
                </Badge>
              </div>

              <div className="text-xs lowercase italic text-gray-400">
                {' '}
                <span>––</span> {e.oneLiner}
              </div>
            </div>
            <div className="flex  flex-col-reverse gap-2 sm:flex-row">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {e.stack.map((s, index) => {
                  return (
                    <div
                      key={index}
                      className="text-xs">
                      {s}
                    </div>
                  )
                })}
              </div>
              {/* <div className="border-black text-xs text-gray-500 sm:border-l sm:pl-2">{e.dates}</div> */}
            </div>

            <div className="w-full space-y-2 sm:max-w-[400px]">
              {e.props && e.props.length > 0 && (
                <div className="flex">
                  {/* <div className="px-1 py-1">
                      <PiArrowUpLight />
                    </div> */}
                  {/* <ul className="text-xs text-gray-500 ">
                      {e.props.map((prop) => {
                        return <li key={prop}>{prop}</li>
                      })}
                    </ul> */}
                </div>
              )}
              {e.lessons &&
                e.lessons.length > 0 &&
                false && ( // marked FALSE to hide the "lessons" section
                  <>
                    <div className="flex ">
                      <div className="px-1 py-2">
                        <PiArrowDownLight />
                      </div>
                      <ul className="text-xs text-gray-400">
                        {e.lessons!.map((lesson) => {
                          return <li key={lesson}>{lesson}</li>
                        })}
                      </ul>
                    </div>
                  </>
                )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
