import Link from 'next/link'

import { getMDXContent } from './fetch'

export const metadata = {
  title: 'Blog',
  description: 'Brain dump on various topics.',
}

export default function BlogPage() {
  const allWritings = getMDXContent({ contentDir: 'content/writing' })

  return (
    <section>
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
            className="mb-4 flex flex-col space-y-1"
            href={`/writing/${post.slug}`}>
            <div className="flex w-full flex-col">
              <p className="tracking-tight text-neutral-900 dark:text-neutral-100">{post.metadata.title}</p>
            </div>
          </Link>
        ))}
    </section>
  )
}
