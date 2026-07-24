import { createInterface } from "node:readline/promises";

import { login, submitMfaCode } from "../lib/garmin/client";
import { writeSession } from "../lib/garmin/store";

/**
 * One-time Garmin login. Run locally, not in the cron.
 *
 * Garmin's sign-in needs a real password and usually a 2FA code, so it can't be
 * automated on a schedule. This mints the long-lived OAuth1 token once and
 * stores it in object storage; after that the cron refreshes access tokens on
 * its own and this only needs re-running when the token is revoked or expires
 * (~1 year).
 *
 *   vercel env pull .env.local
 *   pnpm garmin:login
 */

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    for (const name of ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
      if (!process.env[name]) throw new Error(`${name} is missing — run \`vercel env pull .env.local\` first`);
    }

    const email = process.env.GARMIN_EMAIL || (await rl.question("Garmin email: "));
    const password = process.env.GARMIN_PASSWORD || (await rl.question("Garmin password: "));

    console.log("Signing in…");
    const result = await login(email, password);

    const session =
      result.status === "ok"
        ? result.session
        : await submitMfaCode(result, (await rl.question(`MFA code (sent via ${result.method}): `)).trim());

    await writeSession(session);

    // The OAuth2 refresh token expires in weeks, but the cron never uses it —
    // it re-exchanges from the OAuth1 token, which Garmin issues for ~a year.
    // So that shorter date is not when you need to run this again.
    console.log(`\nSession stored in ${process.env.S3_BUCKET}.`);
    console.log("The cron can now sync on its own — no Garmin credentials needed in production.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`\nLogin failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
