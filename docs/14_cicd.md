# 14 — CI/CD Guide

## 1. Branching & Deployment Pipeline
We utilize a Gitflow-inspired structure with strict deployment mappings:

```
[Feature Branch] ──(PR)──> [Develop Branch] ──(Merge)──> [Main Branch]
       │                          │                          │
   Runs CI                    Deploys to                 Deploys to
(Lint, Test, Typecheck)       Staging Env              Production Env
```

*   **Feature Branches (`feature/*`)**: Local development. Every PR triggers linting, type checks, and schema validity tests.
*   **Develop Branch (`develop`)**: Auto-deployed to Staging environment.
*   **Main Branch (`main`)**: Auto-deployed to Production environment after approval.

---

## 2. GitHub Actions Workflows

### Integration Workflow (`.github/workflows/ci.yml`)
Runs on all pull requests targeting `develop` or `main`.
```yaml
name: Continuous Integration

on:
  pull_request:
    branches: [develop, main]

jobs:
  validate-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install Dependencies
        run: npm ci
        working-directory: frontend
      - name: Lint
        run: npm run lint
        working-directory: frontend
      - name: Build Check
        run: npm run build
        working-directory: frontend

  validate-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Run Schema Linter
        run: supabase db lint
```

---

### Deployment Workflow (`.github/workflows/deploy.yml`)
Triggers on direct merges to the `main` branch.
```yaml
name: Continuous Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Push Migrations
        run: supabase db push --db-url ${{ secrets.PROD_DB_URL }}
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy fight --project-ref ${{ secrets.PROD_PROJECT_REF }}
          supabase functions deploy marketplace --project-ref ${{ secrets.PROD_PROJECT_REF }}
```
*Note: Frontend deployments are handled natively via Vercel's GitHub Integration, triggering automatically upon code merges.*
