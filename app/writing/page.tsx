import Link from 'next/link'

import { getMDXContent } from './fetch'

export const metadata = {
  title: 'Blog',
  description: 'Brain dump on various topics.',
}

export default function BlogPage() {
  const allWritings = getMDXContent({ contentDir: 'content/writing' })

  return (
    <section className="flex w-full max-w-md flex-col gap-4">
      {allWritings
        .sort((a, b) => {
          if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
            return -1
          }
          return 1
        })
        .map((post) => (
          <Link
            key={post.slug}
            className="group tracking-tight text-neutral-900"
            href={`/writing/${post.slug}`}>
            <div className="flex flex-col gap-1">
              <p className="text-sm transition-all duration-100 group-hover:font-medium">{post.metadata.title}</p>
              <p className="text-xs italic text-neutral-500/50">{post.metadata.publishedAt}</p>
            </div>
          </Link>
        ))}
    </section>
  )
}
