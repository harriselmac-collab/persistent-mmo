# 06 — API Specification

## 1. REST & RPC Endpoints Spec

### Base URL
`https://<project-ref>.supabase.co/rest/v1`

### Global Headers
*   `apikey`: Supabase anon public key.
*   `Authorization`: `Bearer <jwt_token>` (user session JWT verified via Supabase Auth).
*   `Content-Type`: `application/json`

---

## 2. Endpoint Specifications

### A. Profiles & Location

#### Travel to Region (RPC)
Moves player to a new region if ticket/energy requirements are met.
*   **Path**: `POST /rpc/travel_to_region`
*   **Request Body**:
    ```json
    {
      "target_region_id": 142
    }
    ```
*   **Responses**:
    *   `200 OK`: Successful travel. Returns updated region ID and cost deducted.
    *   `400 Bad Request`: Insufficient funds, target region does not exist, or target region is not adjacent and no tickets are in inventory.

---

### B. Economy & Corporate Actions

#### Daily Work (RPC)
Initiates work at a company, pays wages, and increments skills.
*   **Path**: `POST /rpc/work_at_company`
*   **Request Body**:
    ```json
    {
      "company_id": "c1a9c3b8-8e6f-4d66-ba9c-34d44547900b"
    }
    ```
*   **Responses**:
    *   `200 OK`: Returns `{ "earned_salary": 50.00, "skill_increase": 0.10, "exp_gained": 10 }`
    *   `400 Bad Request`: Already worked today, company has zero funds to pay salary, or employee does not have a contract at this company.

---

### C. Trading & Marketplace

#### List Marketplace Offers (REST Query)
*   **Path**: `GET /marketplace_offers?item_template_id=eq.10&quality=eq.3&order=price.asc`
*   **Responses**:
    *   `200 OK`: Returns an array of available contracts.

#### Buy Offer (RPC)
Executes transaction inside database transaction block.
*   **Path**: `POST /rpc/buy_market_offer`
*   **Request Body**:
    ```json
    {
      "offer_id": "f5f5c1d1-6789-498c-9a4f-56bb44e057ba",
      "purchase_quantity": 2
    }
    ```
*   **Responses**:
    *   `200 OK`: Transferred items to buyer's inventory, transferred cash to seller, subtracted taxes to country treasury.
    *   `400 Bad Request`: Insufficient balance, insufficient stock in offer, or offer has been cancelled/completed.

---

### D. Combat Systems

#### Fight in Battle (RPC)
Computes hit damage, reduces player energy, logs battle contribution, and pushes to real-time stream.
*   **Path**: `POST /rpc/fight_in_battle`
*   **Request Body**:
    ```json
    {
      "battle_id": "b88b22ff-11ee-44dd-aa9c-123456789abc",
      "side_country_id": 5,
      "use_weapon_quality": 1
    }
    ```
*   **Responses**:
    *   `200 OK`: Returns `{ "damage_dealt": 340.50, "xp_gained": 2, "energy_remaining": 90 }`
    *   `400 Bad Request`: Insufficient energy (requires at least 10), battle has expired, or player is not physically located in the battle's region.
