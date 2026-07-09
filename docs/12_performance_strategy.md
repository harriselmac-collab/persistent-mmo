# 12 — Performance Strategy

## 1. Next.js App Router Architecture
To maximize load speeds, we split pages into Server and Client boundaries:
*   **React Server Components (RSC)**: Dashboard baselines, country profile lists, and historical battle tables are rendered on the server. This passes static HTML to the browser with zero JavaScript bundle overhead.
*   **Client Components (`'use client'`)**: Isolated interactive modules (e.g. the battle hitting component, form inputs, trade purchase buttons) are loaded dynamically.
*   **Code Splitting**: The complex geographical vector map component is loaded lazily using `next/dynamic` only when the player navigates to the Map route.

---

## 2. Client Caching System (TanStack Query)
To prevent constant, expensive REST calls on page transitions, we configure TanStack Query with custom caching rules:
*   **Static Assets (Items, Maps)**: `staleTime: Infinity`. The cache is loaded once per user session.
*   **User Profiles**: `staleTime: 30000` (30 seconds). Profile stats are synced in the background. Mutations (e.g., travel, training) trigger explicit cache invalidation:
    ```typescript
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    ```
*   **Optimistic UI Updates**: When a user clicks "Fight", the UI immediately deducts 10 Energy and updates the local combat wall before the database RPC confirms success. If the RPC fails (e.g. network disconnect), the cache rolls back to the previous state.

---

## 3. Database Performance Tuning
*   **No SELECT ***: API queries must select explicit columns (e.g., `select('id, name')`). This minimizes server memory consumption and networking serialization load.
*   **Materialized Views**: Global player ranking statistics and economic indexes are computed using PostgreSQL Materialized Views (`refresh materialized view concurrently profile_rankings`). This occurs once per hour via a cron worker, transforming a costly $O(N \log N)$ query into a fast $O(1)$ lookup for dashboard readers.
*   **Query Index Optimization**: Run `EXPLAIN ANALYZE` on every query with joins to ensure it hits index sweeps instead of sequential scans.
