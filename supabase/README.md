# Supabase Configuration & Migrations

This directory contains the local environment configuration, schema migrations, and database seeding files for the Supabase CLI.

## Directory Structure
```
supabase/
├── config.toml           # Supabase local environment settings
├── migrations/           # Time-stamped SQL migrations
└── seed.sql              # Core static game configurations and default values
```

## Workflows
1.  **Local Setup**: Run `npx -y firebase-tools@latest` (wait, no, Supabase CLI is used here. Supabase CLI command is `supabase start`).
2.  **Creating Migrations**: Always use the Supabase CLI to generate migrations:
    ```bash
    supabase migration new my_migration_name
    ```
3.  **Applying Migrations**: Local migrations are automatically applied on `supabase start`. Production migrations are pushed via CI/CD.
4.  **Static Data Seeding**: `seed.sql` contains default configs for countries, basic items, formulas, and baseline values.
