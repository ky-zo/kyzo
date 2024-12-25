import { v4 as uuidv4 } from 'uuid'

type expProps = {
  id: string
  dates: string
  title?: string
  company: {
    name: string
    href: string
  }

  oneLiner?: string
  status: 'failed' | 'quit' | 'building' | 'acquired'
}

export const exp: expProps[] = [
  
  {
    id: uuidv4(),
    dates: '01.2024',
    company: {
      name: 'copycopter',
      href: 'https://copycopter.ai',
    },
    oneLiner: 'generate AI videos from simple text prompts',
    status: 'acquired',
  },
  {
    id: uuidv4(),
    dates: '08.2023',
    company: {
      name: 'Yove',
      href: 'https://www.hiyove.com',
    },
    oneLiner: 'reach your personal goals with a little help from AI',
    status: 'failed',
  },

  {
    id: uuidv4(),
    dates: '06.2023',
    company: {
      name: 'finey',
      href: 'https://finey.io',
    },
    oneLiner: 'classify, sort and categorize your invoices automatically',
  
    status: 'failed',
  },
  {
    id: uuidv4(),
    dates: '06.2023',
    company: {
      name: 'flyfile',
      href: 'https://flyfile.io',
    },
  
    oneLiner: 'sort out your email attachments automatically',
    status: 'failed',
  },
  {
    id: uuidv4(),
    dates: '07.2020-02.2023',
    title: 'COO & co-founder',
    company: {
      name: 'epinote',
      href: 'https://epinote.io',
    },
    oneLiner: 'automated remote workforce management platform. raised $1.6m',
    status: 'quit',
  },
]
