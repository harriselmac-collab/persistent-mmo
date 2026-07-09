# GitHub Operations

This directory contains configuration workflows for GitHub Actions, PR templates, and issue tracking settings.

## Workflows
*   `workflows/ci.yml`: Triggered on every pull request to run linting, formatting check, typescript type checks, and API tests.
*   `workflows/deploy.yml`: Triggered on main branch push. Pushes migrations to Supabase, deploys edge functions, and deploys the client to Vercel.
