# 08 — Coding Standards

## 1. Strict TypeScript Rules
We enforce strict TypeScript configurations. Our `tsconfig.json` contains:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
*   **No Implicit Any**: Every variable, function parameter, and return value must be typed explicitly.
*   **Avoid Casting**: Avoid the use of `as unknown as Type` or type assertions unless processing external payloads. Use validation frameworks (e.g., Zod) instead.

---

## 2. SOLID Architectural Guidelines

### Single Responsibility Principle (SRP)
*   React components do not write directly to repositories or execute calculations. They parse props and render layouts.
*   Data mutations are isolated within repository classes (`MarketRepository`), and calculation formulas are isolated in helper modules (`formulas.ts`).

### Dependency Inversion Principle (DIP)
*   Our custom hooks depend on Repository interfaces, not the implementation details.
*   Example: A component imports `useUserRepository()`, which returns an instance of `UserRepository` conforming to the `IUserRepository` interface. This allows us to inject fake repositories during test suites easily.

---

## 3. ESLint & Prettier Settings
Code styling is strictly enforced via Prettier and ESLint.

### Prettier Rules (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

### ESLint Rules (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 4. Database Cleanliness & Safety
*   **No raw SQL construction in Edge Functions**: All database mutations must use either Supabase JS Client builders or execute database functions via RPC (`supabase.rpc('func_name')`).
*   **Transaction safety**: Use PostgreSQL locks (`SELECT ... FOR UPDATE`) in procedures that perform inventory or cash subtractions to prevent double-spending anomalies.
*   **Trigger limitations**: Triggers must only be used for tracking audit logs and synchronizing system states (e.g., initializing default inventory rows on new profile creation). Business mechanics should not run inside database triggers to keep debugging simple.
