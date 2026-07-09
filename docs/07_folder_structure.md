# 07 — Folder Structure Guide

## 1. Top-Level Hierarchy
The repository is split into clean, modular projects separating concerns: UI client, backend execution contexts, database storage patterns, and operational scripts.

```
persistent-mmo/
├── .github/              # CI/CD Workflows
├── assets/               # Static media & raw illustrations
├── backend/              # Deno Edge Functions
├── database/             # Relational logic & schema scripts
├── design/               # Theme tokens & UI/UX design maps
├── docs/                 # Enterprise System Specifications
├── frontend/             # Next.js Application Client
├── scripts/              # Migration generators & DB seeders
├── supabase/             # Local Docker orchestration configurations
└── tests/                # E2E & security integration tests
```

---

## 2. In-Depth Subdirectories

### Frontend Client Architecture (`frontend/`)
The frontend client uses a feature-based folder structure inside Next.js App Router:
```
frontend/
├── app/                  # Route groups and route layouts
│   ├── (auth)/           # Authentication layout (/login, /register)
│   ├── (game)/           # Game panel (/dashboard, /market, /battle)
│   └── layout.tsx        # Global HTML structure
├── components/           # UI elements
│   ├── ui/               # Radix / Shadcn-style components (buttons, inputs)
│   └── game/             # Complex game blocks (Map, InventoryGrid, BattleWall)
├── hooks/                # Hook-wrapped repository interactions
│   ├── useAuth.ts        # Handles user login status
│   └── useMarket.ts      # Abstracted market list query & purchase actions
├── services/             # Clean Repository implementations
│   ├── api/              # Supabase Client initializations
│   └── repository/       # Interface adapters
│       ├── UserRepository.ts
│       └── MarketRepository.ts
├── stores/               # Zustand UI stores (local drawer states, overlay state)
└── types/                # Strict type declarations (entities.d.ts)
```

---

### Backend Logic Architecture (`backend/`)
Supabase edge functions reside here:
```
backend/
└── functions/
    ├── fight/            # Processes military clicks
    │   ├── index.ts      # Function handler entrypoint
    │   └── handler.ts    # Core isolated logic (no direct network connections)
    └── shared/           # Cross-boundary helper code
        ├── utils.ts      # Formatting and validations
        └── types.ts      # Shared schema types
```

---

### Database Configurations (`database/` & `supabase/`)
Database schemas and local Supabase development settings:
```
database/
├── schemas/              # Core DDL tables
├── functions/            # PL/pgSQL stored procedures
└── triggers/             # Automatic triggers (e.g. creating profile on signup)

supabase/
├── config.toml           # local dev config (JWT secrets, port mapping)
├── migrations/           # Version controlled migrations
└── seed.sql              # Config values (Items Q1-Q5, Regions 1-500)
```
