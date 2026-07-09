# 04 — Technical Design Document (TDD)

## 1. Architectural Philosophy
We implement **Clean Architecture** combined with **Domain-Driven Design (DDD)**. The system is split into distinct conceptual boundaries to make features decoupled and highly testable.

```
┌─────────────────────────────────────────────────────────┐
│                      Presentation                       │
│     (Next.js App Router, Tailwind React Components)    │
└───────────┬─────────────────────────────────▲───────────┘
            │ Writes                          │ Subscribes
            ▼                                 │
┌─────────────────────────────────────────────────────────┐
│                    Application/State                    │
│      (Zustand UI Stores, TanStack Query Cache)          │
└───────────┬─────────────────────────────────▲───────────┘
            │ Queries/Mutations               │ Syncs
            ▼                                 │
┌─────────────────────────────────────────────────────────┐
│                    Domain/Repository                    │
│    (Types, Business Invariants, Repo Interfaces)       │
└───────────┬─────────────────────────────────▲───────────┘
            │ Executes                        │ Triggers (Realtime)
            ▼                                 │
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure                       │
│   (Supabase JS Client, DB Functions/RPCs, RLS Rules)   │
└─────────────────────────────────────────────────────────┘
```

## 2. Layers & Domain Separation

### Presentation Layer
Located inside `frontend/app` and `frontend/components`. Core rules:
*   Components must be stateless presentation nodes.
*   They communicate with the domain layer through Custom hooks which encapsulate data querying and mutations.

### Application/State Layer
Located inside `frontend/stores` (Zustand) and React query caching mechanisms.
*   **Zustand**: Handles UI state (e.g., whether sidebar is open, active modal, current language selection, dynamic un-submitted calculations).
*   **TanStack Query**: Manages server state caching, caching expiration times, and optimistic UI updates for lag-free visual cues.

### Domain/Repository Layer
*   Defines abstract data interfaces (e.g., `UserRepository`, `MarketplaceRepository`).
*   Houses domain models and validation entities using TypeScript schemas.
*   This ensures the codebase is not tied directly to the Supabase client implementation. If we decide to swap Supabase for direct PostgreSQL or another DB provider, only the infrastructure layer requires modification.

### Infrastructure Layer
*   Implements the Repository interfaces.
*   Initiates connection to the database.
*   Executes SQL triggers, procedures, and handles raw Supabase connections.

## 3. Real-Time State Synchronizations
State updates like combat wall movements and live chat are handled via **Supabase Realtime WebSockets**:
1.  Client opens subscription to channel (`battle_wall:battle_id`).
2.  Database updates occur via edge functions or stored procedures.
3.  PostgreSQL writes to replication streams.
4.  Supabase Realtime parses logical replication and pushes structured payloads to connected sockets.
5.  Client receives the socket payload and triggers TanStack cache invalidation to pull fresh detailed data.
