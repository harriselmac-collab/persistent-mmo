# 17 — Milestone Plan

## Sprint Delivery Cadence (2-Week Iterations)

```
[M1: Base Infra] ─> [M2: Profiles & Map] ─> [M3: Core Economy] ─> [M4: Combat Loop] ─> [M5: Governance]
    Sprint 1            Sprint 2-3             Sprint 4-5            Sprint 6-7           Sprint 8-9
```

---

## Milestone Detail Board

### Milestone 1: Base Infrastructure Setup (Sprint 1)
*   **Target Objective**: Local developer stack running in Docker; verification tests passing.
*   **Deliverables**:
    *   Supabase local container deployment.
    *   Base user authentication workflows (Sign Up / Sign In).
    *   Initial schema migrations pushed and verified.
*   **Success Metric**: `npm run build` succeeds on both `frontend` and `backend` repositories; CI pipeline passes.

### Milestone 2: Profiles & Geographic Navigation (Sprints 2-3)
*   **Target Objective**: Character dashboard rendering dynamic states; geographical movement enabled.
*   **Deliverables**:
    *   Profile card display (Stats, Level, EXP).
    *   Energy ticks running via PostgreSQL functions.
    *   Travel RPC validating ticket ownership and location changes.
*   **Success Metric**: User can log in, see their profile, click travel, and change their location within the database.

### Milestone 3: Industrial Economy & Trading (Sprints 4-5)
*   **Target Objective**: Complete circular economy foundations.
*   **Deliverables**:
    *   Company creation and employee job posting interfaces.
    *   Daily work RPC reducing energy and updating inventory.
    *   Marketplace listing and atomized purchase transactions.
*   **Success Metric**: User A works for User B's company, receives wages, and lists the generated item for sale; User C purchases it securely.

### Milestone 4: Combat Mechanics Beta (Sprints 6-7)
*   **Target Objective**: Regional wars and player strength tracking.
*   **Deliverables**:
    *   Strength training RPC.
    *   Active battle wall layout with real-time score updates.
    *   Combat hit calculations validating weapons and rank multipliers.
*   **Success Metric**: Two players in opposing countries fight, modifying battle wall metrics in real time.

### Milestone 5: Geopolitics & Governance (Sprints 8-9)
*   **Target Objective**: Elections and political tax policy.
*   **Deliverables**:
    *   Automated election timers and candidate registration.
    *   Congress voting console to approve tax adjustments.
    *   Integration of tax deductions from market sales to country treasuries.
*   **Success Metric**: Elected president alters VAT tax rate, shifting transaction outcomes immediately.
