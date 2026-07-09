# Aegis Kingdoms - Operations & Deployment Handbook

Guidelines for server deployment, scaling, database failovers, and feature flag management.

## 1. Database Infrastructure
- Aegis is built on **Supabase (PostgreSQL)**. Core triggers compute level checks and war declarations authoritatively.
- Run database migrations sequentially inside the `supabase/migrations` folder.

## 2. Feature Flags & Rollouts
- Feature flags are stored in the `feature_flags` table. Toggling updates flags instantly for players without rebooting services.
- Set rollout percentages (0-100) to safely roll out changes to a subset of profiles.

## 3. Graceful Scheduled Restarts
- GMs can schedule server restarts. A 10-minute warning signal is dispatched to all active mobile and desktop clients before lockout.
- Server instances reboot and reload templates instantly.
