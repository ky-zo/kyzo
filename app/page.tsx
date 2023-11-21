import HireMeButton from '@/components/HireMeButton'
import { Badge } from '@/components/ui/badge'
import { exp } from '@/content/exp'
import { PiArrowDownLight, PiArrowUpLight } from 'react-icons/pi'

export default function Home() {
  return (
    <>
      <HireMeButton />

      <div className="flex w-full items-center gap-2 text-xs">
        <span className="w-4/12 text-gray-300 sm:max-w-[80px]">my collection</span>
        <div className="border-grey-500 w-full border-b sm:max-w-[500px]" />
      </div>

      <ul className="w-full max-w-md space-y-5">
        {exp.map((e) => {
          return (
            <li
              key={e.id}
              className={`flex min-h-[50px] w-full flex-col gap-2 rounded-md border p-4 ${
                e.status === 'discontinued' && 'bg-gray-50'
              } `}>
              <div className="flex flex-col items-start ">
                <div className="flex w-full items-center justify-between">
                  <div>
                    {e.title} @
                    <a
                      href={e.company.href}
                      className="font-bold  hover:underline"
                      target="_blank">
                      {e.company.name}
                    </a>
                  </div>
                  <Badge
                    variant={'outline'}
                    className={` px-1 font-normal
                    ${e.status === 'discontinued' && 'border-red-300 bg-red-50 text-red-700'}
                    ${e.status === 'exit' && 'border-green-300 bg-green-50 text-green-700'}
                    ${e.status === 'active' && 'border-blue-300 bg-blue-50 text-blue-700'}

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
                <div className="border-black text-xs text-gray-500 sm:border-l sm:pl-2">{e.dates}</div>
              </div>

              <div className="w-full space-y-2 sm:max-w-[400px]">
                {e.props && e.props.length > 0 && (
                  <div className="flex">
                    {/* <div className="px-1 py-1">
                      <PiArrowUpLight />
                    </div> */}
                    <ul className="text-xs text-gray-500 ">
                      {e.props.map((prop) => {
                        return <li key={prop}>{prop}</li>
                      })}
                    </ul>
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
    </>
  )
}
