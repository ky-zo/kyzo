import { createHmac, randomBytes } from "node:crypto";

/**
 * Minimal RFC 5849 (OAuth 1.0a, HMAC-SHA1) request signer.
 *
 * Garmin's mobile OAuth endpoints — the ones that turn an SSO service ticket
 * into a long-lived token — are still OAuth1. This is the only reason we need
 * a signer at all; every other call is a plain Bearer request.
 */

export type Credential = { key: string; secret: string };

/** RFC 3986 percent-encoding. encodeURIComponent leaves !'()* alone; OAuth doesn't. */
function encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Builds the `Authorization: OAuth ...` header for a request.
 *
 * `bodyParams` must be supplied when the request has an
 * application/x-www-form-urlencoded body — the spec folds those into the
 * signature base string alongside the query parameters.
 */
export function oauth1Header({
  method,
  url,
  consumer,
  token,
  bodyParams,
  nonce,
  timestamp,
}: {
  method: string;
  url: string;
  consumer: Credential;
  token?: Credential;
  bodyParams?: Record<string, string>;
  /** Test-only overrides; generated per request otherwise. */
  nonce?: string;
  timestamp?: number;
}): string {
  const target = new URL(url);

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumer.key,
    oauth_nonce: nonce ?? randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: (timestamp ?? Math.floor(Date.now() / 1000)).toString(),
    oauth_version: "1.0",
  };
  if (token) oauthParams.oauth_token = token.key;

  const params: [string, string][] = [];
  target.searchParams.forEach((value, key) => params.push([key, value]));
  for (const [key, value] of Object.entries(bodyParams ?? {})) params.push([key, value]);
  for (const [key, value] of Object.entries(oauthParams)) params.push([key, value]);

  const normalized = params
    .map(([key, value]) => [encode(key), encode(value)] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const baseString = [method.toUpperCase(), encode(`${target.origin}${target.pathname}`), encode(normalized)].join("&");
  const signingKey = `${encode(consumer.secret)}&${encode(token?.secret ?? "")}`;

  oauthParams.oauth_signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  return (
    "OAuth " +
    Object.entries(oauthParams)
      .map(([key, value]) => `${encode(key)}="${encode(value)}"`)
      .join(", ")
  );
}
