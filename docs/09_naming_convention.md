# 09 — Naming Convention

## 1. Database Layer (PostgreSQL)

### Tables
*   Use **snake_case** and **plural** nouns.
*   *Correct*: `profiles`, `marketplace_offers`, `battle_fights`
*   *Incorrect*: `Profile`, `marketplaceOffer`, `battle_fight`

### Columns
*   Use **snake_case** and **singular** nouns.
*   Foreign keys must end in `_id` and match their reference table name.
*   *Correct*: `citizenship_country_id`, `local_balance`, `created_at`
*   *Incorrect*: `citizenshipCountryId`, `Balance`, `createDate`

### Functions & Procedures (RPCs)
*   Use **snake_case** starting with a verb.
*   *Correct*: `travel_to_region`, `work_at_company`, `execute_battle_tick`

### Indexes, Triggers, & Constraints
*   **Indexes**: `idx_{table}_{column(s)}` (e.g., `idx_inventories_owner_template_quality`)
*   **Triggers**: `trg_{table}_{action}` (e.g., `trg_profiles_audit_log_insert`)
*   **Foreign Keys**: `fk_{source_table}_{target_table}` (e.g., `fk_profiles_regions`)

---

## 2. Frontend Layer (Next.js & TypeScript)

### React Components
*   Use **PascalCase** for component filenames and declarations.
*   *Correct*: `MarketplaceCard.tsx`, `CombatWall.tsx`, `InventoryGrid.tsx`

### Hooks
*   Use **camelCase** prefixed with `use`.
*   *Correct*: `usePlayerProfile.ts`, `useMarketplaceOffers.ts`

### Zustand Stores
*   Filenames must be **camelCase** prefixed with `use` and end with `Store`.
*   *Correct*: `useUIStore.ts`, `useGameSessionStore.ts`

### Folders (Next.js Route Structure)
*   Route groups must use parentheses: `(auth)`, `(game)`
*   Static paths must use **kebab-case**: `/region-map`, `/market-details`

---

## 3. Configuration & Environment
*   Environment variables must be **UPPER_SNAKE_CASE**.
*   Frontend-accessible environment variables must be prefixed with `NEXT_PUBLIC_`.
*   *Correct*: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
