# 15 — Testing Strategy

## 1. Testing Framework Matrix
To ensure high stability from Day 1, we implement three testing layers:

| Layer | Target | Framework | Key Objective |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | Math formulas, utility functions, stores | Vitest | Ensure calculations (combat damage, level EXP requirements) remain accurate. |
| **Integration Testing**| Supabase RPC endpoints, database triggers | Vitest + Supabase client | Ensure database rules, RLS, and transactions behave securely. |
| **E2E Testing** | Web pages, login funnels, combat actions | Playwright | Verify layout, loading speeds, and multi-user interactions. |

---

## 2. Writing Unit Tests (Vitest)
Unit tests must target state calculations and formulas in isolation from the database connection.
```typescript
// frontend/services/formulas.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCombatDamage } from './formulas';

describe('calculateCombatDamage', () => {
  it('should scale damage proportionally with player strength and weapon modifiers', () => {
    const strength = 100; // +100% damage multiplier
    const weaponMod = 1.5; // Q2 Weapon
    const rankMod = 1.0;   // Private Rank
    
    const damage = calculateCombatDamage(strength, weaponMod, rankMod);
    
    // Base damage is 10. Max expected damage = 10 * (1 + 100/100) * 1.5 * 1.0 = 30
    expect(damage).toBe(30);
  });
});
```

---

## 3. Row Level Security (RLS) Integration Testing
We run integration tests to verify database rules. These tests connect to the local Docker database container.
```typescript
// tests/database/rls.test.ts
import { createClient } from '@supabase/supabase-js';
import { describe, beforeAll, it, expect } from 'vitest';

const SUPABASE_URL = 'http://localhost:54321';
const ANON_KEY = 'local-anon-key';

describe('RLS Policies', () => {
  it('should reject unauthorized user modifications to foreign profile data', async () => {
    // Create an authenticated client simulating User A
    const userAClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: 'Bearer user-a-jwt' } }
    });

    // Attempt to update User B's profile row
    const { error } = await userAClient
      .from('profiles')
      .update({ gold: 1000000 })
      .eq('id', 'user-b-uuid');

    // Expected to fail due to RLS checking ownership
    expect(error).toBeDefined();
    expect(error?.message).toContain('violates row-level security');
  });
});
```

---

## 4. End-to-End Tests (Playwright)
E2E tests simulate actual player clicks.
*   **Location**: `/tests/e2e`
*   **Focus**: Traveling, placing an item on the market, purchasing that item using a secondary browser instance context to test concurrent lock safety.
