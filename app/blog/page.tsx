import Link from 'next/link'
import { Suspense } from 'react'
import { getMDXContent } from './fetch'

export const metadata = {
  title: 'Blog',
  description: 'Read my thoughts on software development, design, and more.',
}

export default function BlogPage() {
  let allBlogs = getMDXContent({ contentDir: 'content/blog' })

  return (
    <section>
      {allBlogs.map((post) => (
        <>{JSON.stringify(post)}</>
      ))}
      {allBlogs
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
            href={`/blog/${post.slug}`}>
            <div className="flex w-full flex-col">
              <p className="tracking-tight text-neutral-900 dark:text-neutral-100">{post.metadata.title}</p>
            </div>
          </Link>
        ))}
    </section>
  )
}

// async function Views({ slug }: { slug: string }) {
//   let views = await getViewsCount();

//   return <ViewCounter allViews={views} slug={slug} />;
