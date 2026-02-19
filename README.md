# QiOne - Multi-tenant App Skeleton

This project is a React + Vite application integrated with Supabase, featuring a multi-tenant architecture with a launcher and modules (starting with QiHome).

## Project Structure

- `apps/qione-web/`: React frontend application.
- `supabase/migrations/`: Database schema migrations (adapted for `qione` schema).
- `supabase/bootstrap_tenant.sql`: SQL template to bootstrap a new tenant with roles and module access.

## Schema Configuration

As requested, all tables and views are located within the `qione` schema.
The web application uses `.schema('qione')` on all Supabase queries.

## Getting Started

1.  **Supabase Setup**:
    - Run the migrations in `supabase/migrations/` on your Supabase project.
    - Ensure you have the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.

2.  **Bootstrap a Tenant**:
    - Create a tenant via the web UI or SQL.
    - Use `supabase/bootstrap_tenant.sql` to grant yourself the 'Owner' role and enable modules for that tenant.

3.  **Frontend**:
    - `cd apps/qione-web`
    - `npm install` (If node/npm is not in your path, ensure it is installed)
    - `npm run dev`

## Deployment

Deploy the `apps/qione-web` directory to Cloudflare Pages or similar, setting the required environment variables.