import { AwsClient } from 'aws4fetch'

import { followerSeed } from './seed'
import type { FollowerHistory } from './types'

const HISTORY_KEY = 'followers/history.json'

type ReadOptions = { revalidate?: number }
type S3Config = { client: AwsClient; base: string }

let cached: S3Config | null = null

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — required for follower storage`)
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

export async function readFollowerHistory(options: ReadOptions = {}): Promise<FollowerHistory> {
  const { client, base } = s3()
  const init: RequestInit = options.revalidate === undefined ? { cache: 'no-store' } : ({ next: { revalidate: options.revalidate } } as RequestInit)
  const response = await client.fetch(`${base}/${HISTORY_KEY}`, init)
  if (response.status === 404) return followerSeed
  if (!response.ok) throw new Error(`Could not read follower history (HTTP ${response.status})`)
  return (await response.json()) as FollowerHistory
}

export async function writeFollowerHistory(history: FollowerHistory): Promise<void> {
  const { client, base } = s3()
  const body = new TextEncoder().encode(JSON.stringify(history))
  const response = await client.fetch(`${base}/${HISTORY_KEY}`, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(body.byteLength) },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Could not write follower history (HTTP ${response.status})`)
}
