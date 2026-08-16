export type StravaEffortPoint = {
  date: string
  effort: number
  runKm: number
  rideKm: number
  gymVisits: number
  otherMinutes: number
}

export type StravaEffortHistory = {
  version: 1
  semantics: string
  updatedAt: string
  totalEffort: number
  points: StravaEffortPoint[]
  lastSync?: { syncedAt: string; activities: number }
}
