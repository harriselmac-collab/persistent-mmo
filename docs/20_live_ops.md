# 20 — Live Operations Plan (Live Ops)

## 1. Release Cycle & Balancing Cadence
To maintain player retention, the team operates on a structured updates cycle:
*   **Weekly Balance Patches (Tuesdays)**: Adjust database-driven game config fields (e.g. minor weapon decay rates, energy tick timings) based on economic analytics.
*   **Monthly Feature Updates**: Introduce new cosmetic skins, map locations, or item categories.
*   **Seasonal Campaigns (Quarterly)**: 3-month tournaments introducing specific global conditions (e.g., "Economic Depression" where raw factory output drops by 20%, or "World War" reducing travel ticket costs).

---

## 2. Telemetry, Logging & Monitoring
We monitor application health using three tools:
1.  **Sentry**: Tracks Javascript exceptions on the frontend client and timeout logs in Supabase Edge Functions.
2.  **pgHero**: Monitors long-running database queries, table bloat, and missing indexes.
3.  **Grafana + Supabase Metrics**: Tracks CPU spikes, RAM usage, WebSocket client counts, and connection pool utilization.

---

## 3. Database Maintenance & Backups
*   **Point-in-Time Recovery (PITR)**: Enabled via Supabase Enterprise. Allows reversing database states to the exact second in the event of critical exploits or data loss.
*   **Daily Snapshots**: Automated exports of schemas and tables to external GCS (Google Cloud Storage) buckets, retained for 90 days.
*   **Migration Safety**: Schema modifications are tested against a replicated staging DB copy before being deployed to production.

---

## 4. Community Support & Game Moderation
*   **In-Game Admin Console**: Custom dashboard querying `audit_logs` to detect suspect transfers of Gold or rapid IP hops.
*   **Discord Integration**: Webhook alerts triggered when server errors occur, or when high-value marketplace listings are posted.
*   **Player Report System**: Tickets written directly to a support table in the database, viewable by game moderators.
