import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { highlight } from 'sugar-high'

import { cn } from '@/lib/utils'

import { TweetComponent } from './tweet'

interface TableProps {
  data: {
    headers: string[]
    rows: string[][]
  }
}

function Table({ data }: TableProps) {
  const headers = data.headers.map((header: string, index: number) => <th key={index}>{header}</th>)
  const rows = data.rows.map((row: string[], index: number) => (
    <tr key={index}>
      {row.map((cell: string, cellIndex: number) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ))

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

interface CustomLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
}

function CustomLink(props: CustomLinkProps) {
  const { href, ...rest } = props

  if (!href) {
    return <span>{props.children}</span>
  }

  if (href.startsWith('/')) {
    return (
      <Link
        href={href}
        {...rest}>
        {props.children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return <a {...props} />
  }

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  )
}

interface RoundedImageProps extends React.ComponentProps<typeof Image> {
  alt: string
}

function RoundedImage(props: RoundedImageProps) {
  const { alt, className, ...rest } = props
  return (
    <Image
      alt={alt}
      className={cn('rounded-lg', className)}
      {...rest}
    />
  )
}

interface CalloutProps {
  emoji: React.ReactNode
  children: React.ReactNode
}

function Callout(props: CalloutProps) {
  return (
    <div className="mb-8 flex items-center rounded border border-neutral-200 bg-neutral-50 p-1 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
      <div className="mr-4 flex w-4 items-center">{props.emoji}</div>
      <div className="callout w-full">{props.children}</div>
    </div>
  )
}

interface ProsCardProps {
  title: string
  pros: string[]
}

function ProsCard({ title, pros }: ProsCardProps) {
  return (
    <div className="my-4 w-full rounded-xl border border-emerald-200 bg-neutral-50 p-6 dark:border-emerald-900 dark:bg-neutral-900">
      <span>{`You might use ${title} if...`}</span>
      <div className="mt-4">
        {pros.map((pro: string) => (
          <div
            key={pro}
            className="mb-2 flex items-baseline font-medium">
            <div className="mr-2 h-4 w-4">
              <svg
                className="h-4 w-4 text-emerald-500"
                viewBox="0 0 24 24">
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </g>
              </svg>
            </div>
            <span>{pro}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ConsCardProps {
  title: string
  cons: string[]
}

function ConsCard({ title, cons }: ConsCardProps) {
  return (
    <div className="my-6 w-full rounded-xl border border-red-200 bg-neutral-50 p-6 dark:border-red-900 dark:bg-neutral-900">
      <span>{`You might not use ${title} if...`}</span>
      <div className="mt-4">
        {cons.map((con: string) => (
          <div
            key={con}
            className="mb-2 flex items-baseline font-medium">
            <div className="mr-2 h-4 w-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-red-500">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </div>
            <span>{con}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

function Code({ children, ...props }: CodeProps) {
  if (typeof children !== 'string') return null
  const codeHTML = highlight(children)
  return (
    <code
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  )
}

function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode
}

function createHeading(level: number) {
  const Heading = ({ children, ...props }: HeadingProps) => {
    if (typeof children !== 'string') return null
    const slug = slugify(children)
    return React.createElement(`h${level}`, { id: slug, ...props }, [
      React.createElement('a', {
        href: `#${slug}`,
        key: `link-${slug}`,
        className: 'anchor',
      }),
      children,
    ])
  }
  Heading.displayName = `Heading${level}`
  return Heading
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  Callout,
  ProsCard,
  ConsCard,
  StaticTweet: TweetComponent,
  code: Code,
  Table,
}

interface CustomMDXProps {
  source: string
  components?: Record<string, React.ComponentType<any>>
  [key: string]: any
}

export function CustomMDX({ source, ...props }: CustomMDXProps) {
  return (
    <MDXRemote
      source={source}
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  )
}
