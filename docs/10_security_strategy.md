# 10 — Security Strategy

## 1. Core Rule: Zero-Trust Client
The client application is treated as a visual interface only. The server does not trust any user calculations.
*   **Coordinate Manipulation**: A player cannot claim they are in Region B to execute combat actions there. The database stores the player's actual `current_region_id`. The combat function compares the battle's location to the player's database region location, completely ignoring client UI parameters.
*   **Item Creation**: Players cannot submit transactions specifying item creations. All items are initialized inside database procedures checking template validity.

---

## 2. Row Level Security (RLS) Blueprint
Supabase RLS is enabled on all tables. A developer bypass is allowed only inside Edge Functions using the service role key for cron maintenance tasks.

```sql
-- Enable RLS
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

-- Select Policy: Users can only view their own inventory
CREATE POLICY "Users can view own inventory"
ON inventories FOR SELECT
USING (auth.uid() = owner_id);

-- Insert/Update Policy: Denied to client directly.
-- Inventories can only be modified via database RPC functions
-- that run with security definer under strict validation.
CREATE POLICY "System modifies inventory"
ON inventories FOR ALL
USING (false)
WITH CHECK (false);
```

---

## 3. Double-Spend & Concurrency Controls
State transitions affecting player balances or inventories must lock the relevant rows to prevent race conditions (exploits where players trigger rapid double clicks to buy an item twice using one balance).

```sql
-- Inside PL/pgSQL transaction
SELECT local_balance INTO current_bal
FROM profiles
WHERE id = buyer_uuid
FOR UPDATE; -- Locks the profile row until transaction commits

IF current_bal < cost THEN
  RAISE EXCEPTION 'Insufficient balance';
END IF;
```

---

## 4. Anti-Botting & Rate Limiting
To prevent automated scripts from taking over the economy (e.g. sniping items underpriced on the market instantly):
*   **API Rate Limiting**: Deployed via Cloudflare rate limiting rules, capping HTTP requests to 5 requests per second per IP for mutation endpoints (`/rpc/work_at_company`, `/rpc/buy_market_offer`).
*   **Game Cooldowns**: Enforced at the database level. For example, a player profile contains `last_work_at`. The `work_at_company` RPC checks:
    ```sql
    IF last_work_at >= NOW() - INTERVAL '20 hours' THEN
      RAISE EXCEPTION 'You are too exhausted to work again yet';
    END IF;
    ```

---

## 5. Security Auditing (Immutable Logs)
Crucial mutations (transfer of Gold, company ownership updates, and regional declarations) are logged in the `audit_logs` table.
*   The `audit_logs` table uses an RLS policy that prevents `UPDATE` or `DELETE` actions by any user, including the owner. Once written, the log is immutable, creating an audit trail for game admins.
*   Trigger `trg_profiles_audit_log_insert` records changes to profile gold balances automatically.
