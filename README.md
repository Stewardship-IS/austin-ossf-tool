# Austin OSSF Tool

Automated OSSF (On-Site Sewage Facility) record monitoring and lead generation for septic system service companies in the Austin, TX area.

## Overview

This tool helps septic system service companies discover new business opportunities by:

- **Monitoring** OSSF records across 5 Austin-area counties
- **Detecting** new installation permits and service-needed signals
- **Scoring** leads based on urgency and opportunity
- **Presenting** actionable leads through a clean dashboard

## Coverage Area

The tool monitors OSSF records in these Texas counties:

1. **Travis County** - Austin metro core
2. **Williamson County** - North Austin suburbs
3. **Hays County** - South Austin / San Marcos
4. **Bastrop County** - East Austin area
5. **Caldwell County** - Southeast Austin area

## Project Structure

```
austin-ossf-tool/
├── apps/
│   ├── web/              # Next.js dashboard (React + Tailwind)
│   │   ├── src/
│   │   │   ├── app/      # Dashboard pages
│   │   │   └── lib/      # Supabase client + types
│   │   └── package.json
│   └── worker/           # Node.js sync & lead gen service
│       ├── index.js      # Main worker script
│       └── package.json
├── packages/             # Shared packages
├── docs/                 # Documentation
├── railway.json          # Root Railway config
└── .env.example          # Environment template
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Worker**: Node.js with node-cron, cheerio, node-fetch
- **Deployment**: Railway
- **Database**: PostgreSQL (Supabase)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Railway account

### Environment Variables

#### Web App (apps/web)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

#### Worker (apps/worker)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Local Development

#### Web App

```bash
cd apps/web
npm install
npm run dev
```

#### Worker

```bash
cd apps/worker
npm install
npm run dev
```

### Deployment

This project is configured for [Railway](https://railway.app).

1. Push code to GitHub
2. Link your Railway project to this repo
3. Railway will auto-detect and deploy both services

## Database Schema

The Supabase database includes these tables:

| Table | Purpose |
|-------|----------|
| `jurisdictions` | County/jurisdiction metadata |
| `sources` | OSSF data sources (URLs, access methods) |
| `sync_runs` | Sync job history |
| `properties` | Property addresses |
| `septic_systems` | Septic system records |
| `osff_records` | OSSF filing records |
| `record_documents` | Supporting documents |
| `contacts` | Property/system contacts |
| `lead_signals` | Detected lead signals |
| `leads` | Generated business leads |
| `activities` | Lead activity log |

## Lead Scoring

The worker assigns scores to detected opportunities:

| Signal Type | Score | Description |
|-------------|-------|-------------|
| New Installation | 70 | New septic system installation permit |
| Service Needed | 50 | Failed inspection or repair required |
| Permit Renewal | 50 | Expiring permit needs renewal |

## License

Private - All rights reserved.
