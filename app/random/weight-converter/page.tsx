import type { Metadata } from 'next'

import WeightConverter from './weight-converter'

export const metadata: Metadata = {
  title: 'weight converter | kyzo',
  description: 'a quick kilograms and pounds converter',
  alternates: {
    canonical: 'https://kyzo.io/random/weight-converter',
  },
}

export default function WeightConverterPage() {
  return (
    <main className="w-full max-w-md">
      <WeightConverter />
    </main>
  )
}
