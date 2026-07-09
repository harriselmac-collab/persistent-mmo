# Backend — Edge Functions & Microservices

This directory houses the backend serverless logic, primarily composed of Supabase Edge Functions (Deno runtime) and integrations.

## Tech Stack
*   **Runtime**: Deno
*   **Language**: TypeScript (Strict)
*   **Database Client**: Supabase JS SDK (Service Role for bypass, Client Role for user context)
*   **Authentication**: JWT (JSON Web Tokens) validated via Supabase Auth

## Folder Structure
```
backend/
├── functions/            # Supabase Edge Functions
│   ├── game-loop/        # Batch tick processing (cron-triggered)
│   ├── marketplace/      # Secure transactions (trades, escrow)
│   └── combat/           # Validate attacks, apply modifiers, determine winner
└── shared/               # Code shared between multiple Edge Functions
    ├── db.ts             # Database client helpers
    └── security.ts       # Rate limiting, validation rules
```

## Backend Coding Rules
1.  **Zero Trust**: Never trust any parameters sent by the client. Validate headers, user tokens, input data structures, and game states before making any mutation.
2.  **Stateless execution**: Edge functions must be light, stateless, and execute under 10 seconds.
3.  **Strict Transaction Management**: Any operation modifying balances, inventories, or territory ownership must run inside a PostgreSQL transaction or single RPC function to prevent race conditions.
