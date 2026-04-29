# Setup and Handoff

## What is already prepared

The scaffold includes:

- monorepo folder structure
- initial Supabase SQL schema
- county seed data
- adapter framework with county placeholders
- Railway deployment config
- environment variable template

## What still needs credentials or account access

The following actions require your live accounts or tokens:

1. Create the GitHub repository and push this scaffold
2. Create the Supabase project and run the SQL migrations
3. Create the Railway project and link the repo
4. Add environment variables in Railway and local development
5. Confirm each county source URL and access method

## Recommended exact next actions

### GitHub

- Create a private repo named `austin-ossf-tool`
- Upload or push the scaffold contents
- Enable branch protection on `main`

### Supabase

- Create a new project
- Enable PostGIS if not already available
- Run `001_initial_schema.sql`
- Run `002_seed_jurisdictions.sql`
- Generate project URL, anon key, and service role key

### Railway

- Create a new project from GitHub repo
- Add one web service and one worker service
- Set required environment variables from `.env.example`

## What the assistant can continue doing next

With repo contents in place, the next step can be:

- generate the actual Next.js app shell
- generate a worker entrypoint for sync runs
- add Supabase client code
- add first record ingestion pipeline
- create first dashboard and lead pages

## What the user needs to provide

To continue beyond scaffolding, provide one of the following:

- GitHub repo URL after creation
- Supabase project credentials
- Railway project/service details
- or exported sample records/pages from Travis and Williamson County

Without those live credentials, deployment and database provisioning cannot be completed remotely from this environment.
