import { Badge } from '@/components/ui/badge'
import { exp } from '@/content/exp'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <ul className="w-full max-w-md space-y-5">
      {exp.map((e) => {
        return (
          <li
            key={e.id}
            className={cn('shadow-neumorphic flex min-h-[50px] w-full flex-col gap-2 rounded-2xl border-[0.5px] p-4', {
              'bg-gray-50': e.status === 'quit' || e.status === 'failed',
            })}>
            <div className="flex flex-col items-start">
              <div className="flex w-full items-center justify-between">
                <div>
                  {e.title && e.title + '@'}
                  <a
                    href={e.company.href}
                    className="font-bold hover:underline"
                    target="_blank">
                    {e.company.name}
                  </a>
                </div>
                <Badge
                  variant={'outline'}
                  className={cn('font-normal', {
                    'border-red-300 bg-red-50 text-red-500': e.status === 'failed',
                    'border-green-300 bg-green-50 text-green-500': e.status === 'acquired',
                    'border-blue-300 bg-blue-50 text-blue-500': e.status === 'building',
                    'border-gray-300 bg-gray-50 text-gray-500': e.status === 'quit',
                  })}>
                  {e.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <span className="text-xs text-black/50">{e.oneLiner}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
