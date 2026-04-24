# CineStream

Movie recommendation app built with Next.js.

## Setup

1. Install dependencies:
   - `npm install`
2. Create `.env.local` with:
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - `GMAIL_USER=...`
   - `GMAIL_PASS=...`
3. Run the app:
   - `npm run dev`

## Required Supabase table

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.users (
  email text primary key,
  name text not null,
  password_hash text not null,
  is_verified boolean not null default false,
  verification_token text,
  token_expiry bigint
);
```

The auth API now stores users in Supabase instead of local JSON files, so it works correctly on Vercel serverless deployments.
