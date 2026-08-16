export type FollowerPoint = {
  date: string
  followers: number
  kind: 'baseline' | 'observed' | 'calibrated' | 'x-daily'
  source?: string
}

export type FollowerHistory = {
  version: 1
  account: {
    id: string
    username: string
  }
  updatedAt: string
  currentFollowers: number
  points: FollowerPoint[]
  lastSync?: {
    at: string
    provider: 'x-account-analytics'
    windowStart: string
    windowEnd: string
  }
}

export type XFollowerSnapshot = {
  currentFollowers: number
  fetchedAt: string
  dailyNet: Array<{ date: string; net: number }>
}
