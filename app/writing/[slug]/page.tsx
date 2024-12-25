import { notFound } from 'next/navigation'

import { CustomMDX } from '@/components/mdx'

import { getMDXContent } from '../fetch'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BlogPost({ params }: PageProps) {
  const slug = (await params).slug
  const allWritings = getMDXContent({ contentDir: 'content/writing' })
  const post = allWritings.find((post) => post.slug === slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="prose-quoteless prose prose-sm prose-neutral prose-h1:text-lg">
      <CustomMDX source={post.content} />
    </article>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const slug = (await params).slug
  const allWritings = getMDXContent({ contentDir: 'content/writing' })
  const post = allWritings.find((post) => post.slug === slug)

  if (!post) {
    return {}
  }

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
  }
}
