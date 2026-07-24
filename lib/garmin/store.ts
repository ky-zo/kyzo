import { AwsClient } from "aws4fetch";

import { parseSession, serializeSession, type GarminSession } from "./client";
import type { GarminDay, Vo2MaxPoint } from "./metrics";

/**
 * S3-compatible object storage for the Garmin session and daily history.
 *
 * Points at Hetzner Object Storage by default, but nothing here is
 * Hetzner-specific — any S3 API (MinIO or Garage on your own box, R2, S3
 * itself) works by changing the endpoint.
 *
 * Objects are written without a public-read ACL. The session holds live
 * credentials, and the daily history is personal enough that publishing it
 * should be a deliberate rendering decision, not a consequence of where the
 * file sits.
 */

const SESSION_KEY = "garmin/session.json";
const HISTORY_KEY = "garmin/daily.json";
const VO2MAX_KEY = "garmin/vo2max.json";

type S3Config = {
  client: AwsClient;
  /** Base URL for objects, path-style: {endpoint}/{bucket} */
  base: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — required for Garmin storage`);
  return value;
}

let cached: S3Config | null = null;

function s3(): S3Config {
  if (cached) return cached;

  // e.g. https://fsn1.your-objectstorage.com
  const endpoint = required("S3_ENDPOINT").replace(/\/+$/, "");
  const bucket = required("S3_BUCKET");

  // R2 signs against "auto"; Hetzner signs against its location code (fsn1,
  // nbg1, hel1), which is the first label of the endpoint host. Override via
  // S3_REGION for anything else.
  const host = new URL(endpoint).hostname;
  const region = process.env.S3_REGION || (host.endsWith("r2.cloudflarestorage.com") ? "auto" : host.split(".")[0]);

  cached = {
    client: new AwsClient({
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
      service: "s3",
      region,
    }),
    // Path-style addressing — the one form every S3 implementation supports.
    base: `${endpoint}/${bucket}`,
  };

  return cached;
}

/**
 * `revalidate` in seconds lets a page cache the read; omit it for the
 * read-modify-write in the cron, which can't tolerate a stale copy.
 */
type ReadOptions = { revalidate?: number };

async function readJson<T>(key: string, options: ReadOptions = {}): Promise<T | null> {
  const { client, base } = s3();

  // A no-store read opts the calling route out of static rendering entirely,
  // so pages pass a revalidate window instead and stay on ISR.
  const init: RequestInit =
    options.revalidate === undefined
      ? { cache: "no-store" }
      : ({ next: { revalidate: options.revalidate } } as RequestInit);

  const response = await client.fetch(`${base}/${key}`, init);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Could not read ${key} from object storage (HTTP ${response.status}): ${(await response.text()).slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const { client, base } = s3();

  // Next patches fetch and will stream a string body without a Content-Length,
  // which R2 rejects with 411 MissingContentLength. Send bytes and set the
  // length explicitly so the request is never chunked.
  const body = new TextEncoder().encode(JSON.stringify(value));

  const response = await client.fetch(`${base}/${key}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json", "Content-Length": String(body.byteLength) },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not write ${key} to object storage (HTTP ${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
}

export async function readSession(): Promise<GarminSession | null> {
  const raw = await readJson<GarminSession>(SESSION_KEY);
  return raw ? parseSession(JSON.stringify(raw)) : null;
}

export async function writeSession(session: GarminSession): Promise<void> {
  await writeJson(SESSION_KEY, JSON.parse(serializeSession(session)));
}

export async function readHistory(options?: ReadOptions): Promise<GarminDay[]> {
  return (await readJson<GarminDay[]>(HISTORY_KEY, options)) ?? [];
}

export async function writeHistory(days: GarminDay[]): Promise<void> {
  await writeJson(HISTORY_KEY, days);
}

export async function readVo2MaxSeries(options?: ReadOptions): Promise<Vo2MaxPoint[]> {
  return (await readJson<Vo2MaxPoint[]>(VO2MAX_KEY, options)) ?? [];
}

export async function writeVo2MaxSeries(points: Vo2MaxPoint[]): Promise<void> {
  await writeJson(VO2MAX_KEY, points);
}

/** Merges a freshly pulled VO2max series over the stored one, oldest first. */
export function mergeVo2Max(existing: Vo2MaxPoint[], incoming: Vo2MaxPoint[]): Vo2MaxPoint[] {
  const byDate = new Map(existing.map((point) => [point.date, point]));
  for (const point of incoming) byDate.set(point.date, point);
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Merges freshly pulled days over the stored history, newest last. */
export function mergeDays(existing: GarminDay[], incoming: GarminDay[]): GarminDay[] {
  const byDate = new Map(existing.map((day) => [day.date, day]));
  for (const day of incoming) byDate.set(day.date, day);
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
