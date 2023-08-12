import { exp } from '@/content/exp'
import { GoDotFill } from 'react-icons/go'
import { PiArrowDownLight, PiArrowUpLight } from 'react-icons/pi'
import HireMeButton from '@/components/HireMeButton'
import Socials from '@/components/Socials'

export default function Home() {
  return (
    <div className=" flex min-h-[100dvh] w-full flex-col items-start justify-start gap-10 p-4 text-sm sm:p-10">
      <div className="flex flex-col">
        <h1 className=" font-black">kyzo</h1>
        <Socials />
      </div>

      <div>
        <h3>build, automate, manage, scale</h3>
        <h3 className="lowercase">operations | process automation | zapier | nextJS | sheets</h3>
      </div>

      <HireMeButton />

      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-300">my collection</span>
        <div className="border-grey-500 min-w-[400px] border-b" />
      </div>

      <ul className="space-y-10">
        {exp.map((e) => {
          return (
            <li
              key={e.id}
              className="flex flex-col gap-1">
              <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center">
                  {/* <span className='pr-2 hidden sm:inline'><GoDotFill className="w-2 h-2" /></span> */}
                  {e.title} @
                  <a
                    href={e.company.href}
                    className="font-bold  hover:underline"
                    target="_blank">
                    {e.company.name}
                  </a>
                </div>
                <div className="text-xs lowercase italic text-gray-400">
                  {' '}
                  <span className="hidden sm:inline">––</span> {e.oneLiner}
                </div>
              </div>
              <div className="flex  flex-col-reverse gap-2 sm:flex-row">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {e.stack.map((s) => {
                    return (
                      <>
                        <div className="text-xs">{s}</div>
                      </>
                    )
                  })}
                </div>
                <div className="border-black text-xs text-gray-500 sm:border-l sm:pl-2">{e.dates}</div>
              </div>

              <div className="w-full space-y-2 sm:max-w-[400px]">
                {e.props && e.props.length > 0 && (
                  <div className="flex">
                    <div className="px-1 py-1">
                      <PiArrowUpLight />
                    </div>
                    <ul className="text-xs text-gray-500 ">
                      {e.props.map((prop) => {
                        return <li key={prop}>{prop}</li>
                      })}
                    </ul>
                  </div>
                )}
                {e.lessons && e.lessons.length > 0 && (
                  <>
                    <div className="flex ">
                      <div className="px-1 py-2">
                        <PiArrowDownLight />
                      </div>

                      <ul className="text-xs text-gray-400">
                        {e.lessons.map((lesson) => {
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
    </div>
  )
}
