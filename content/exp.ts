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
    title: 'co-creator',
    company: {
      name: 'copycopter',
      href: 'https://copycopter.ai',
    },
    oneLiner: 'AI powered copywriting tool for Social Media',
    stack: ['NextJS', 'TypeScript', 'Supabase', 'Vercel', 'Stripe', 'LangChain'],
    props: ['50 users in the first 48 hours', ' optimised LLMchains to deliver value on top of OpenAI'],
    lessons: ['failed to turn users into paying customers', 'ambiguous value proposition'],
  },

  {
    id: uuidv4(),
    dates: '06.2023',
    title: 'creator',
    company: {
      name: 'flyfile',
      href: 'https://flyfile.io',
    },
    stack: ['NextJS', 'Supabase', 'Vercel', 'Mailgun'],
    oneLiner: 'files & email automation workflows',
    props: ['build first project in 2 weeks', 'integration with 3rd party APIs'],
    lessons: [
      'coulnd not turn mega social media reach to product traction',
      'users did not understand how product can help',
      'failed with go-to-market activities',
      'spent too much time on detailing small features',
      'lack of TypeScript led to compligated codebase',
    ],
  },
  {
    id: uuidv4(),
    dates: '07.2020-02.2023',
    title: 'ex-COO/co-founder',
    company: {
      name: 'epinote',
      href: 'https://epinote.io',
    },
    stack: ['Zapier', 'Sheets', 'Notion', 'Typeform'],
    oneLiner: 'fully automated remote workforce management platform',
    props: [
      'managed 500+ remote workers worldwide',
      'built solely on no-code, 100% automated',
      'from Zero to €1.4m seed VC round',
      '+50 B2B clients over the course of 2 years',
      '~€50k MRR with peak of ~€100k Monthly Revenue',
    ],
    lessons: [
      'failed to build a sustainable revenue stream',
      'focused on "agency" model instead of "product" model',
      'spent too much time on chasing happy clients than building product',
      'scaled too fast pre-PMF',
      'faild to align founders team on one vision',
      'spent too muh time on cap-table bullshit',
    ],
  },
]
