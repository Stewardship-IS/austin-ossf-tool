# Austin OSSF Tool

Internal Austin-area OSSF lead intelligence platform for septic install and service opportunities.

## Monorepo layout

- `apps/web` — Next.js internal dashboard
- `apps/worker` — ingestion and scoring worker
- `packages/db/supabase` — SQL schema and migration files
- `packages/adapters` — county source adapter framework
- `packages/shared` — shared types and utilities
- `docs` — implementation notes

## Initial counties

- Travis
- Williamson
- Hays
- Bastrop
- Caldwell

## Core product areas

- source ingestion
- normalized records and systems
- lead scoring
- map and lead queue
