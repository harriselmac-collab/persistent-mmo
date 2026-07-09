# 02 — Product Requirements Document (PRD)

## 1. Feature Scope (MVP vs. Full Scope)

| Feature Area | MVP Scope | Target Scale (V1) |
| :--- | :--- | :--- |
| **Authentication** | Email/Password, Magic Link via Supabase Auth | OAuth providers (Google, Discord) |
| **Character System**| Profile stats, Energy, Leveling, Job stats | Custom avatars, inventory skins, titles |
| **Economy** | Work once daily, raw resource companies | Advanced production queues, stock exchanges |
| **Marketplace** | Simple item trading (weapons, food) | Bid/Ask orders, currency forex markets |
| **Politics** | Regional elections, tax management | Parliament, custom national constitutions |
| **Combat** | Individual fight button, regional walls | Coordinated strikes, alliances, logistics |

## 2. Core Functional Requirements

### FR-1: Account & Profile Management
*   Players must be able to sign up, log in, and customize basic profile parameters.
*   Profiles track dynamic resources: **Energy** (regenerates by 5 points every 6 minutes), **Gold** (global reserve currency), and **Local Currency** (based on current citizen country).

### FR-2: Geographic Location & Movement
*   The world is map-based, composed of **Countries** which own discrete **Regions**.
*   A player resides in a specific region and must pay ticket costs to travel to adjacent or distant regions.

### FR-3: Industrial & Labor Market
*   Players can create **Companies** (e.g., Grain Farm, Iron Mine, Weapon Factory).
*   Company owners list job vacancies with fixed salaries.
*   Other players can sign contracts to work once per day, consuming 10 Energy, receiving wages, and generating raw or refined products for the company storage.

### FR-4: Marketplace Trading
*   Players list items (food, weapons, tickets) with quantities and unit prices in local currency.
*   Transactions must execute atomically: verifying stock availability, transfer of funds, tax deductions, and item transfers.

### FR-5: Combat & Battle Walls
*   When a country declares war on another country over a region, a **Battle** is initialized.
*   The battle consists of an Attacker wall and a Defender wall. Players in the region can spend energy to "Fight" for either side, shifting the wall influence percentage.

## 3. Non-Functional Requirements (NFRs)
*   **Security (NFR-S1)**: Every state mutation must be validated on the backend. Client coordinates are purely visual.
*   **Performance (NFR-P1)**: Home page and core dashboards must load under 1.2 seconds on 3G connections.
*   **Scalability (NFR-S2)**: Database indexing and architecture must support at least 1,000,000 transactions daily.
*   **Realtime Updates (NFR-R1)**: Active battle walls must synchronize state via WebSockets (Supabase Realtime) within 200ms.
