import { AwsClient } from 'aws4fetch'

import { stravaEffortSeed } from './seed'
import type { StravaEffortHistory } from './types'

const HISTORY_KEY = 'strava/effort.json'
const TOKEN_KEY = 'strava/token.json'

type S3Config = { client: AwsClient; base: string }

let cached: S3Config | null = null

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — required for Strava storage`)
  return value
}

function s3(): S3Config {
  if (cached) return cached
  const endpoint = required('S3_ENDPOINT').replace(/\/+$/, '')
  const bucket = required('S3_BUCKET')
  const host = new URL(endpoint).hostname
  const region = process.env.S3_REGION || (host.endsWith('r2.cloudflarestorage.com') ? 'auto' : host.split('.')[0])
  cached = {
    client: new AwsClient({
      accessKeyId: required('S3_ACCESS_KEY_ID'),
      secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
      service: 's3',
      region,
    }),
    base: `${endpoint}/${bucket}`,
  }
  return cached
}

async function putJson(key: string, payload: unknown): Promise<void> {
  const { client, base } = s3()
  const body = new TextEncoder().encode(JSON.stringify(payload))
  const response = await client.fetch(`${base}/${key}`, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(body.byteLength) },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Could not write ${key} (HTTP ${response.status})`)
}

export async function readStravaEffort(): Promise<StravaEffortHistory> {
  const { client, base } = s3()
  const response = await client.fetch(`${base}/${HISTORY_KEY}`, { cache: 'no-store' })
  if (response.status === 404) return stravaEffortSeed
  if (!response.ok) throw new Error(`Could not read Strava effort history (HTTP ${response.status})`)
  return (await response.json()) as StravaEffortHistory
}

export async function writeStravaEffort(history: StravaEffortHistory): Promise<void> {
  await putJson(HISTORY_KEY, history)
}

export async function readStravaToken(): Promise<string | null> {
  const { client, base } = s3()
  const response = await client.fetch(`${base}/${TOKEN_KEY}`, { cache: 'no-store' })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Could not read Strava token (HTTP ${response.status})`)
  const stored = (await response.json()) as { refreshToken?: string }
  return stored.refreshToken || null
}

export async function writeStravaToken(refreshToken: string): Promise<void> {
  await putJson(TOKEN_KEY, { refreshToken, updatedAt: new Date().toISOString() })
}
