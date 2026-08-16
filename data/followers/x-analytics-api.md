# X Account Analytics API notes

Reverse-engineered from X's `bundle.AccountAnalytics` frontend bundle on August 15, 2026.

## Persisted query

- Operation: `accountOverviewDailyQuery`
- Query ID: `_P1caq0YB4SVuEtFLPDMfQ`
- Relay hash: `71830bd8818368ebc980334d527c8430`
- Web endpoint: `GET https://x.com/i/api/graphql/_P1caq0YB4SVuEtFLPDMfQ/accountOverviewDailyQuery`
- Safety level: `UserSelfViewOnly`

The request has two URL parameters:

- `variables`: JSON encoded as a URL component;
- `features`: X feature-switch JSON. The analytics bundle does not add operation-specific feature flags.

## Variables

```json
{
  "backfill_from": 1786665600000,
  "backfill_to": 1786838400000,
  "current_from": 1628985600000,
  "current_from_iso": "2021-08-15T00:00:00.000Z",
  "current_to": 1786838400000,
  "current_to_iso": "2026-08-16T00:00:00.000Z",
  "prev_from": 1471132800000,
  "prev_from_iso": "2016-08-14T00:00:00.000Z",
  "prev_to": 1628985600000,
  "prev_to_iso": "2021-08-15T00:00:00.000Z",
  "show_verified_followers": true
}
```

All epoch values are milliseconds. X normalizes the selected dates to UTC midnight and makes `current_to` exclusive by adding one day. The previous range has the same duration immediately before the current range. `backfill_from` is yesterday at UTC midnight and `backfill_to` is two days later.

## Response contract

```text
viewer_v2(safety_level: UserSelfViewOnly)
└── user_results.result (User)
    ├── relationship_counts.followers
    ├── verified_follower_count                         [conditional]
    ├── author_follower_metrics                         [conditional]
    │   ├── active_followers
    │   └── active_verified_followers
    ├── current_time_series: uec_metrics_daily_time_series_count
    │   ├── count
    │   ├── timestamp
    │   ├── engagement_type
    │   └── is_engaging_user_verified
    ├── previous_totals: uec_metrics_daily_time_series_count
    ├── hourly_backfill: uec_metrics_hourly_time_series_count
    ├── legacy_current_follow_metrics: organic_metrics_time_series
    │   ├── timestamp.iso8601_time
    │   └── metric_values { metric_type, metric_value }
    └── legacy_previous_follow_metrics: organic_metrics_time_series
```

The UEC daily series requests `Count`, grouped by `EngagementType` and `IsEngagingUserVerified`. The legacy series requests only `Follows` and `Unfollows` at `Daily` granularity.

## Client-side merge behavior

1. X groups UEC rows by timestamp and converts engagement types such as `Follow` and `Unfollow` to dashboard metrics.
2. It fills missing days with zeros.
3. Recent trailing zero-impression days are replaced by hourly backfill rows.
4. Legacy `Follows` and `Unfollows` values override the corresponding UEC values for the same timestamp.
5. `relationship_counts.followers` is the exact current cumulative follower count. It returned **16,435** for `@ky__zo` in the authenticated replay.

The dashboard's cumulative series is reconstructed by subtracting the exact net daily change from the current count and then replaying daily `Follows - Unfollows` forward.

## Range limit and authentication

The `365`-day ceiling appears in the frontend date picker (`maxDays=365`) but not in the persisted query's variable schema. The query builder accepts arbitrary timestamps.

An unauthenticated request to the web endpoint returns HTTP 403. The equivalent `api.x.com/graphql/...` request returns HTTP 400 with error code `215` (`Bad Authentication data`). X's logged-in frontend adds session-bound headers. Browser cookies, session stores, and token values were not inspected or exported.

An authenticated request covering August 15, 2021 through August 16, 2026 returned HTTP 200, but:

- `current_time_series` began at epoch `1755302400000` (August 16, 2025), despite the requested 2021 start;
- `legacy_current_follow_metrics` also began August 16, 2025;
- `previous_totals` and `legacy_previous_follow_metrics` were empty;
- the legacy series contained 363 non-empty daily rows through August 15, 2026, with two zero-activity dates omitted;
- totals were 7,038 follows, 1,145 unfollows, and a net gain of 5,893.

A second authenticated request explicitly targeting August 16, 2024 through August 16, 2025 returned HTTP 200 with zero current, previous, and legacy metric rows. Therefore the backend—not just the UI—hard-limits this analytics data to the latest year. Splitting the five-year period into older windows does not recover exact historical values.
