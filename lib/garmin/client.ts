import { oauth1Header, type Credential } from "./oauth1";

/**
 * TypeScript port of the Garmin Connect mobile auth flow.
 *
 * Garmin has no public API for individuals, so this speaks the same protocol
 * the Android app does:
 *
 *   1. GET  sso.garmin.com/mobile/sso/en/sign-in    -> session cookies
 *   2. POST sso.garmin.com/mobile/api/login         -> service ticket (or MFA challenge)
 *   3. GET  connectapi/oauth-service/.../preauthorized  -> OAuth1 token (~1 year)
 *   4. POST connectapi/oauth-service/.../exchange/user/2.0 -> OAuth2 access token (~1 hour)
 *
 * Steps 1-2 need a browser-shaped request and interactive MFA, so they run once
 * locally (see scripts/garmin-login.mts). The cron only ever does step 4, which
 * is why the client can be stateless apart from the stored OAuth1 token.
 */

const DOMAIN = "garmin.com";
const SSO_ORIGIN = `https://sso.${DOMAIN}`;
const API_ORIGIN = `https://connectapi.${DOMAIN}`;
const SERVICE_URL = `https://mobile.integration.${DOMAIN}/gcm/android`;
const CLIENT_ID = "GCM_ANDROID_DARK";

const CONSUMER_URL = "https://thegarth.s3.amazonaws.com/oauth_consumer.json";

/** Must match the Android consumer key, or the OAuth1 endpoints reject the request. */
const OAUTH_USER_AGENT = "com.garmin.android.apps.connectmobile";
const API_USER_AGENT = "GCM-iOS-5.22.1.4";
/** SSO runs in a WebView; a non-browser UA trips Cloudflare. */
const SSO_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const SSO_HEADERS = {
  "User-Agent": SSO_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
};

export type OAuth1Token = {
  oauth_token: string;
  oauth_token_secret: string;
  mfa_token?: string;
};

export type OAuth2Token = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** Unix seconds. */
  expires_at: number;
  refresh_token_expires_in: number;
  refresh_token_expires_at: number;
  scope?: string;
  jti?: string;
};

export type GarminSession = {
  oauth1: OAuth1Token;
  oauth2: OAuth2Token;
};

export class GarminError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "GarminError";
  }
}

/** Cookie jar. `fetch` has no persistence, and the SSO handshake needs it. */
class CookieJar {
  private jar = new Map<string, string>();

  constructor(cookies?: Record<string, string>) {
    for (const [name, value] of Object.entries(cookies ?? {})) this.jar.set(name, value);
  }

  /** Plain snapshot, so a half-finished login can be resumed by another process. */
  toJSON(): Record<string, string> {
    return Object.fromEntries(this.jar);
  }

  absorb(response: Response) {
    // getSetCookie exists in undici but not in this project's @types/node.
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = headers.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);

    for (const cookie of cookies) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      if (index > 0) this.jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }

  header(): string {
    return Array.from(this.jar, ([name, value]) => `${name}=${value}`).join("; ");
  }
}

let consumerPromise: Promise<Credential> | null = null;

/**
 * Garmin's public Android consumer credentials. They rotate rarely; env vars
 * win so a cron run never hard-depends on a third-party bucket being up.
 */
async function getConsumer(): Promise<Credential> {
  const key = process.env.GARMIN_CONSUMER_KEY;
  const secret = process.env.GARMIN_CONSUMER_SECRET;
  if (key && secret) return { key, secret };

  consumerPromise ??= (async () => {
    const response = await fetch(CONSUMER_URL);
    if (!response.ok) throw new GarminError("Could not fetch Garmin OAuth consumer credentials", response.status);
    const json = (await response.json()) as { consumer_key: string; consumer_secret: string };
    return { key: json.consumer_key, secret: json.consumer_secret };
  })();

  return consumerPromise;
}

async function readError(response: Response, message: string): Promise<GarminError> {
  const body = await response.text().catch(() => "");
  return new GarminError(`${message} (HTTP ${response.status})`, response.status, body.slice(0, 500));
}

/** Exchanges an OAuth1 token for a fresh OAuth2 access token. */
async function exchange(oauth1: OAuth1Token, { initial }: { initial: boolean }): Promise<OAuth2Token> {
  const consumer = await getConsumer();
  const url = `${API_ORIGIN}/oauth-service/oauth/exchange/user/2.0`;

  const body: Record<string, string> = {};
  if (initial) body.audience = "GARMIN_CONNECT_MOBILE_ANDROID_DI";
  if (oauth1.mfa_token) body.mfa_token = oauth1.mfa_token;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauth1Header({
        method: "POST",
        url,
        consumer,
        token: { key: oauth1.oauth_token, secret: oauth1.oauth_token_secret },
        bodyParams: body,
      }),
      "User-Agent": OAUTH_USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) throw await readError(response, "OAuth2 exchange failed");

  const token = (await response.json()) as OAuth2Token;
  const now = Math.floor(Date.now() / 1000);
  return {
    ...token,
    expires_at: now + token.expires_in,
    refresh_token_expires_at: now + token.refresh_token_expires_in,
  };
}

async function getOAuth1Token(ticket: string, jar: CookieJar): Promise<OAuth1Token> {
  const consumer = await getConsumer();
  const url =
    `${API_ORIGIN}/oauth-service/oauth/preauthorized` +
    `?ticket=${encodeURIComponent(ticket)}&login-url=${encodeURIComponent(SERVICE_URL)}&accepts-mfa-tokens=true`;

  const response = await fetch(url, {
    headers: { Authorization: oauth1Header({ method: "GET", url, consumer }), "User-Agent": OAUTH_USER_AGENT, Cookie: jar.header() },
  });

  if (!response.ok) throw await readError(response, "Could not obtain OAuth1 token");

  const parsed = new URLSearchParams(await response.text());
  const oauthToken = parsed.get("oauth_token");
  const oauthTokenSecret = parsed.get("oauth_token_secret");
  if (!oauthToken || !oauthTokenSecret) throw new GarminError("OAuth1 response did not contain a token");

  return {
    oauth_token: oauthToken,
    oauth_token_secret: oauthTokenSecret,
    mfa_token: parsed.get("mfa_token") ?? undefined,
  };
}

async function completeLogin(ticket: string, jar: CookieJar): Promise<GarminSession> {
  const oauth1 = await getOAuth1Token(ticket, jar);
  const oauth2 = await exchange(oauth1, { initial: true });
  return { oauth1, oauth2 };
}

type LoginParams = { clientId: string; locale: string; service: string };

/**
 * Returned when Garmin wants a 2FA code; pass it back to `submitMfaCode`.
 *
 * Plain JSON on purpose — the code arrives by email or SMS seconds later, and
 * the two halves of the login usually run as separate processes.
 */
export type MfaChallenge = {
  status: "mfa_required";
  method: string;
  params: LoginParams;
  cookies: Record<string, string>;
};

/**
 * Signs in with email + password. Resolves to a session, or to an MFA
 * challenge that must be completed with `submitMfaCode`.
 */
export async function login(email: string, password: string): Promise<{ status: "ok"; session: GarminSession } | MfaChallenge> {
  const jar = new CookieJar();
  const params: LoginParams = { clientId: CLIENT_ID, locale: "en-US", service: SERVICE_URL };

  // Priming request — establishes the cookies the login POST expects.
  const priming = await fetch(`${SSO_ORIGIN}/mobile/sso/en/sign-in?clientId=${CLIENT_ID}`, {
    headers: { ...SSO_HEADERS, "Sec-Fetch-Site": "none" },
  });
  jar.absorb(priming);

  const response = await fetch(`${SSO_ORIGIN}/mobile/api/login?${new URLSearchParams(params)}`, {
    method: "POST",
    headers: { ...SSO_HEADERS, "Content-Type": "application/json", Cookie: jar.header() },
    body: JSON.stringify({ username: email, password, rememberMe: false, captchaToken: "" }),
  });
  jar.absorb(response);

  if (!response.ok) throw await readError(response, "Garmin sign-in failed");

  const json = (await response.json()) as {
    responseStatus?: { type?: string; message?: string };
    serviceTicketId?: string;
    customerMfaInfo?: { mfaLastMethodUsed?: string };
  };
  const type = json.responseStatus?.type;

  if (type === "SUCCESSFUL" && json.serviceTicketId) {
    return { status: "ok", session: await completeLogin(json.serviceTicketId, jar) };
  }

  if (type === "MFA_REQUIRED") {
    return { status: "mfa_required", method: json.customerMfaInfo?.mfaLastMethodUsed ?? "email", params, cookies: jar.toJSON() };
  }

  throw new GarminError(`Garmin sign-in returned ${type ?? "an unknown status"}: ${json.responseStatus?.message ?? ""}`);
}

/** Completes a login that was interrupted by a 2FA challenge. */
export async function submitMfaCode(challenge: MfaChallenge, code: string): Promise<GarminSession> {
  const jar = new CookieJar(challenge.cookies);

  const response = await fetch(`${SSO_ORIGIN}/mobile/api/mfa/verifyCode?${new URLSearchParams(challenge.params)}`, {
    method: "POST",
    headers: { ...SSO_HEADERS, "Content-Type": "application/json", Cookie: jar.header() },
    body: JSON.stringify({
      mfaMethod: challenge.method,
      mfaVerificationCode: code,
      rememberMyBrowser: false,
      reconsentList: [],
      mfaSetup: false,
    }),
  });
  jar.absorb(response);

  if (!response.ok) throw await readError(response, "MFA verification failed");

  const json = (await response.json()) as { responseStatus?: { type?: string; message?: string }; serviceTicketId?: string };
  if (json.responseStatus?.type !== "SUCCESSFUL" || !json.serviceTicketId) {
    throw new GarminError(`MFA verification returned ${json.responseStatus?.type ?? "an unknown status"}: ${json.responseStatus?.message ?? ""}`);
  }

  return completeLogin(json.serviceTicketId, jar);
}

/**
 * Authenticated Garmin Connect client.
 *
 * The OAuth2 access token expires hourly, so the client refreshes it from the
 * stored OAuth1 token as needed. `refreshed` tells the caller whether the
 * session is worth persisting again.
 */
export class GarminClient {
  private session: GarminSession;
  private refreshInFlight: Promise<void> | null = null;

  /** True once this instance has minted a new access token. */
  refreshed = false;

  constructor(session: GarminSession) {
    this.session = session;
  }

  /** The current session — persist it when `refreshed` is true. */
  getSession(): GarminSession {
    return this.session;
  }

  /**
   * The OAuth1 token is the one that matters; when it expires (~1 year, or
   * whenever Garmin invalidates it) the login flow has to be re-run by hand.
   */
  private async accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // 60s of slack so a token doesn't expire mid-flight.
    if (this.session.oauth2.expires_at > now + 60) return this.session.oauth2.access_token;

    this.refreshInFlight ??= (async () => {
      this.session = { ...this.session, oauth2: await exchange(this.session.oauth1, { initial: false }) };
      this.refreshed = true;
    })().finally(() => {
      this.refreshInFlight = null;
    });

    await this.refreshInFlight;
    return this.session.oauth2.access_token;
  }

  /** GETs a Garmin Connect API path. Returns null for 204/404 responses. */
  async get<T>(path: string): Promise<T | null> {
    const response = await fetch(`${API_ORIGIN}${path}`, {
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        "User-Agent": API_USER_AGENT,
        Accept: "application/json",
      },
    });

    if (response.status === 204 || response.status === 404) return null;
    if (!response.ok) throw await readError(response, `GET ${path} failed`);

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }
}

/** Serialises a session for storage. */
export function serializeSession(session: GarminSession): string {
  return JSON.stringify(session);
}

export function parseSession(raw: string): GarminSession {
  const session = JSON.parse(raw) as GarminSession;
  if (!session?.oauth1?.oauth_token || !session?.oauth2?.access_token) {
    throw new GarminError("Stored Garmin session is malformed — re-run the login script");
  }
  return session;
}
