# Tests — Integration & End-to-End Test Suite

This directory contains integration, End-to-End (E2E), and API testing scripts.

## Frameworks
*   **E2E Testing**: Playwright (for automated game loop and UI flows)
*   **API/Security Testing**: Vitest / Supertest (targeting Supabase Edge Functions and RLS policies)

## Test Accounts

> ⚠️ **For local development and testing only. Never use in production.**

### Admin Test Account (`super_admin`)

| Field    | Value                            |
|----------|----------------------------------|
| Email    | `admin@test.persistentmmo.dev`   |
| Password | `AdminTest123!`                  |
| Role     | `super_admin`                    |
| Username | `TestAdmin`                      |

**How to provision:**

```bash
# Option 1 — run alongside a full DB reset (recommended)
supabase db reset
psql $DATABASE_URL -f supabase/seed_test_admin.sql

# Option 2 — apply to a running local instance
psql $(supabase status | grep "DB URL" | awk '{print $NF}') \
  -f supabase/seed_test_admin.sql
```

The script is **idempotent** — safe to run multiple times. Environment variables for tests are in `.env.test`.

## Guidelines
1.  **Testing RLS**: Always write tests verifying that a user cannot update another user's profile, steal items via manual RPC updates, or read country treasury balances without permissions.
2.  **Concurrency Testing**: Implement lock checks to simulate multiple players bidding on the same marketplace contract simultaneously.
