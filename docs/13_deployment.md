# 13 — Deployment Guide

## 1. Prerequisites & Environment Setup
Make sure you have accounts and projects set up on:
1.  **Supabase** (Managed Database & Edge Functions context)
2.  **Vercel** (Next.js hosting)
3.  **Cloudflare** (DNS, proxying, CDN routing, and rate-limiting)

---

## 2. Infrastructure Setup Walkthrough

### Step A: Database Provisioning (Supabase CLI)
1.  Initialize the project:
    ```bash
    supabase init
    ```
2.  Link your local environment to the remote Supabase project:
    ```bash
    supabase link --project-ref <your-supabase-project-ref>
    ```
3.  Deploy schema migrations:
    ```bash
    supabase db push
    ```
4.  Seed static database constants (Item catalogs, coordinate maps, default formulas):
    ```bash
    # Runs the SQL scripts in supabase/seed.sql against the live instance
    psql -h db.<ref>.supabase.co -U postgres -d postgres -f supabase/seed.sql
    ```

---

### Step B: Edge Functions Deployment
1.  Deploy all active serverless logic to Deno Deploy:
    ```bash
    supabase functions deploy fight --project-ref <ref>
    supabase functions deploy marketplace --project-ref <ref>
    ```
2.  Set environment secrets on Supabase:
    ```bash
    supabase secrets set GAME_SECRET_KEY=highly-secure-value --project-ref <ref>
    ```

---

### Step C: Client Deployment (Vercel)
1.  Link your Git repository to Vercel.
2.  Set the Root Directory to `frontend`.
3.  Configure Environment Variables:
    *   `NEXT_PUBLIC_SUPABASE_URL`: `<your-supabase-url>`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your-anon-key>`
4.  Run Build Command: `npm run build`.

---

### Step D: Cloudflare DNS & Proxy Setup
1.  Point the apex domain (`@`) and subdomains (`www`) to Vercel's CNAME records.
2.  Set the SSL/TLS Encryption Mode to **Full (Strict)**.
3.  Create Cloudflare Page Rules to force browser-level caching of static asset assets:
    *   Target: `example.com/assets/*`
    *   Setting: Cache Level: Cache Everything, Edge Cache TTL: 1 Month.
4.  Configure Cloudflare WAF rules to limit requests to `/api/rpc/*` to 5 requests per second per IP to prevent bot script execution.
