# 18 — Risk Analysis & Mitigations

## 1. Technical Risk Matrix

| Risk Event | Severity | Probability | Core Mitigation |
| :--- | :--- | :--- | :--- |
| **Database Race Conditions** (Gold duplication) | Critical | High | Wrap balance deductions in isolated transactions using `SELECT FOR UPDATE` to lock records. |
| **Market Bot Sniping** | High | High | Enforce API rate-limiting via Cloudflare WAF and introduce a 5-second cooldown between market purchases. |
| **WebSocket Broadcast Collapse** | Medium | Medium | Force narrow client channel subscriptions; do not broadcast global transactions to all connected players. |
| **DB Connection Pool Exhaustion** | High | Low | Route all read-only API calls through pooled transaction ports; restrict session ports to migrations. |

---

## 2. Economic Failure Risks

### Inflationary Collapse
*   **The Hazard**: Players print too much currency from working, causing prices of basic items (weapons, food) to skyrocket, making the game unplayable for new users.
*   **Mitigations**:
    *   **Sink Mechanics**: Charge Gold/currency fees for establishing companies, traveling, and posting items on the market.
    *   **Currency Burns**: Congress can pass laws to sink national currency back to the central bank treasury to control circulating supply.

### Monopoly Syndicate Manipulation
*   **The Hazard**: Large coalitions of players purchase all iron mines, price-gouging the weapon market to block other players from fighting.
*   **Mitigations**:
    *   **Global Export/Import Taxes**: Target regions with high tariffs to protect domestic industries.
    *   **Alternate Resource Nodes**: Randomly distribute raw resource abundance variations across natural geographic regions over time.

---

## 3. Cheating & Botting Vectors
*   **Autoclicker Battle Hits**: Players scripting clicks to gain military rank overnight.
    *   *Mitigation*: Implement dynamic rate-limit thresholds on the `fight` API. If a player submits more than 3 combat actions in under 1 second, temporarily lock their combat interface for 15 minutes.
*   **Multiple Accounts (Multi-Accounting)**: A single player creating 10 accounts to vote for themselves in presidential elections.
    *   *Mitigation*: IP-matching tracking logs, cookie fingerprinting, and requiring a minimum level (e.g. Level 15) to participate in national voting.
