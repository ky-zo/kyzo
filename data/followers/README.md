# Twitter follower growth

A compact, Typefully-inspired follower chart for [@ky__zo](https://x.com/ky__zo).

## Data quality

The dashboard merges three evidence streams into one canonical follower history:

- **Typefully:** observed absolute follower snapshots from November 2023 through November 2025, plus the current August 2026 snapshot after reactivation. These values are stored in `followers-monthly.csv`; the complete export audit is in `typefully-followers-history.csv`.
- **Tweet evidence:** dated posts and attached analytics screenshots add six historical anchors. Screenshot-readable counts are treated as exact; wording such as “hit 1200” is explicitly classified as a reported milestone. The audit trail and tweet URLs are in `followers-history-anchors.csv`.
- **X Account Analytics:** the original daily `Follows - Unfollows` series from August 16, 2025 through August 15, 2026 supplies the day-to-day shape between absolute anchors.

Tweet-derived anchors used by the graph:

- Aug 11, 2023 — **132** (exact analytics screenshot)
- Mar 26, 2024 — **1,200** (reported milestone)
- Jun 29, 2024 — **2,000** (reported milestone)
- Jul 7, 2024 — **2,731** (exact archived Typefully screenshot)
- Dec 28, 2024 — **10,046** (exact analytics screenshot)
- Oct 21, 2025 — **12,199** (exact archived Typefully screenshot)

### Canonical reconciliation

Absolute Typefully and tweet counts take precedence. Starting August 16, 2025, each interval between two known counts begins and ends at those exact anchors. X's daily net-follow movements determine the shape inside the interval. The difference between the raw X change and the observed change is distributed evenly across that interval, representing untracked deletions, suspensions, restorations, spam removals, or reporting adjustments.

For example, Typefully reports 10,990 on August 16, 2025 while the backward X event reconstruction implies 10,541. The canonical line uses 10,990, then reconciles subsequent X movements to the next known absolute count. It therefore contains one value per day without competing lines and exactly matches every dated anchor.

Values between anchors are calibrated daily values, not independently observed absolute counts. The source log remains the audit trail for which points are exact screenshots, exports, or reported milestones.

Typefully has no follower values for August–October 2023 or any earlier period. Its one-year export repeats 12,447 for December 2025 through July 2026, but the six-month chart contains no corresponding follower points. Those repeated rows are therefore classified as Typefully fill-forward values and are excluded from the chart.

The public timeline begins at a user-defined baseline of 0 followers on April 1, 2023. A straight visual segment connects that baseline to the first exact screenshot count of 132 on August 11, 2023. Before August 2025, straight segments connect the sparse dated anchors; no earlier daily values are generated. The maximum range is labeled “All” and begins at the April 2023 baseline.

## X API investigation

The Account Analytics frontend calls the persisted GraphQL operation `accountOverviewDailyQuery` (`_P1caq0YB4SVuEtFLPDMfQ`). An authenticated five-year replay returned HTTP 200 but silently clamped both analytics series to August 16, 2025 onward. A second authenticated request targeting August 2024–August 2025 returned zero rows. This proves the backend itself retains/exposes only the latest year through this query; splitting the request into older yearly windows does not recover more history. Full protocol and response findings are in [`x-analytics-api.md`](x-analytics-api.md).

The interactive dashboard now lives at `public/follower-counter/index.html` and reads the merged history from `/api/followers`.

## Daily update system

Vercel calls `/api/cron/followers` every day at `09:17 UTC`. The protected route:

1. replays X's internal `accountOverviewDailyQuery` for the trailing 45 days;
2. anchors the result to the exact current `relationship_counts.followers` value;
3. merges the refreshed dates over the retained history without deleting older points; and
4. writes the complete result to the same private S3-compatible storage used by the Garmin sync, under `followers/history.json`.

The website serves stored history when available and falls back to the committed `history.seed.json` archive if storage is unavailable. X credentials are Vercel environment secrets and are never written to this repository.

Required production variables are `X_AUTH_TOKEN`, `X_CSRF_TOKEN`, and `X_BEARER_TOKEN`. `X_GRAPHQL_QUERY_ID`, `X_CLIENT_TRANSACTION_ID`, `X_EXTRA_COOKIE`, and `FOLLOWER_TIMEZONE` are optional. The default timezone is `America/Los_Angeles`.

Because this uses X's private web API, its session cookies can expire. A failed fetch returns an error without overwriting the last good history. Replace the two session variables in Vercel when X returns `401` or `403`.
