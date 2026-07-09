# Frontend — Next.js & React Web App Client

This directory houses the client application for the persistent strategy MMORPG, built with Next.js, TypeScript, and TailwindCSS.

## Tech Stack
*   **Framework**: Next.js (App Router)
*   **State Management**: Zustand (Global UI, session caches)
*   **Data Fetching**: TanStack Query (React Query)
*   **Styling**: TailwindCSS (Custom configuration following design system tokens)
*   **Icons**: Lucide React

## Folder Structure
All application logic is structured by features inside the `app/` and `components/` directories.
```
frontend/
├── app/                  # Next.js App Router folders
│   ├── (auth)/           # Authentication layout and route groups
│   ├── (game)/           # Main game interface (dashboard, map, inventory)
│   └── layout.tsx
├── components/           # Reusable shared UI elements
│   ├── ui/               # Core atomic design components
│   └── game/             # Complex context-aware game elements
├── hooks/                # Global React hooks
├── services/             # API clients, repositories, and handlers
├── stores/               # Zustand global store slices
└── types/                # Strict TypeScript declaration files
```

## Architectural Guidelines
1.  **Strict TypeScript**: Do not use `any`. Define interfaces for all API response schemas, game entities, and state slices.
2.  **Repository Pattern**: Client components do not talk directly to Supabase client or endpoints. They must consume abstraction services (e.g., `UserRepository`, `MarketplaceRepository`) provided via hooks.
3.  **State Decoupling**: Keep UI state in Zustand. Database-driven states must be synchronized via TanStack Query and cache-invalidated upon mutation.
4.  **No Mock Implementations**: Use production-ready styling, responsive layouts, and robust error handlers on every form and UI component.
