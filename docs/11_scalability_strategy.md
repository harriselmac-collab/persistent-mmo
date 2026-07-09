# 11 — Scalability Strategy

## 1. Database Connection Pooling
To support thousands of concurrent players executing rapid API actions without hitting PostgreSQL connection limits (which can cause slow queries and site crashes):
*   **Supabase Connection Pooler**: We use the connection pooler in **Transaction Mode** (port 6543) for stateless REST and Edge Function queries. This recycles database connections immediately after a query finishes.
*   **Session Mode**: Direct, non-pooled connections (port 5432) are reserved strictly for schema migrations and long-running batch processing jobs.

---

## 2. Horizontal Partitioning
Highly dynamic tables that accumulate millions of logs must be partitioned to prevent index lookup degradation.
*   **Partition Key**: `battle_fights` table is partitioned by range on the `created_at` timestamp.
*   **Cycle**: A script generates partitions for the next 3 months in advance. Partitions older than 6 months are archived to cold storage (Supabase Storage buckets in compressed CSV formats) and dropped from the active database.

---

## 3. Real-Time WebSocket Scoping
Supabase Realtime runs on a cluster of Elixir nodes. If 5,000 players subscribe to a global `battle_fights` channel, the server broadcasts every fight to all players, overwhelming client bandwidth and server cpu.
*   **Scoping Rule**: Clients must subscribe only to a specific combat instance using filters (e.g. `battle_fights?battle_id=eq.uuid`).
*   **Payload Minimization**: Realtime payloads broadcast only foreign keys and value changes (e.g. `{ "battle_id": "uuid", "wall_health": 850000, "attacker_pct": 52.3 }`). Detail lookups of the player names contributing to the wall are queried on-demand.

---

## 4. Edge Distribution Grid
*   **State Localization**: Client files are hosted on Vercel's global CDN nodes.
*   **Serverless Edge**: Supabase Edge Functions deploy to Deno Deploy, executing in the network node physically closest to the client's location.
*   **Cache Headers**: Static game configurations (item templates, map layout assets) are served with long-lived Cache-Control headers (`public, max-age=31536000`) and distributed via Cloudflare CDN nodes.
