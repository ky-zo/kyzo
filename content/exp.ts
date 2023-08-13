import { v4 as uuidv4 } from 'uuid'

type expProps = {
  id: string
  dates: string
  title: string
  company: {
    name: string
    href: string
  }
  stack: string[]
  oneLiner?: string
  props?: string[]
  lessons?: string[]
}

export const exp: expProps[] = [
  {
    id: uuidv4(),
    dates: '07.2023',
    title: 'Co-Creator',
    company: {
      name: 'copycopter',
      href: 'https://copycopter.ai',
    },
    oneLiner: 'AI-powered copywriting tool for Social Media',
    stack: ['NextJS', 'TypeScript', 'Supabase', 'Vercel', 'Stripe', 'LangChain'],
    props: ['50 users in the first 48 hours', 'optimized LLM chains to deliver value on top of OpenAI'],
    lessons: ['Failed to turn users into paying customers'],
  },
  {
    id: uuidv4(),
    dates: '06.2023',
    title: 'Creator',
    company: {
      name: 'flyfile',
      href: 'https://flyfile.io',
    },
    stack: ['NextJS', 'Supabase', 'Vercel', 'Mailgun'],
    oneLiner: 'Files & email automation workflows',
    props: ['Built first project in 2 weeks', 'Integration with 3rd party APIs'],
    lessons: [
      'Users did not understand how the product could help',
      'Lack of TypeScript led to a complicated codebase',
    ],
  },
  {
    id: uuidv4(),
    dates: '07.2020-02.2023',
    title: 'Ex-COO/Co-Founder',
    company: {
      name: 'epinote',
      href: 'https://epinote.io',
    },
    stack: ['Zapier', 'Sheets', 'Notion', 'Typeform'],
    oneLiner: 'Fully automated remote workforce management platform',
    props: [
      'Managed 500+ remote workers worldwide',
      'Built solely on no-code, 100% automated',
      'From zero to €1.4m seed VC round',
      '+50 B2B clients over the course of 2 years',
      '~€50k MRR with a peak of ~€100k Monthly Revenue',
    ],
    lessons: [
      'Failed to build a sustainable revenue stream',
      'Scaled too quickly pre-PMF',
      'Spent too much time on cap-table issues',
    ],
  },
]
