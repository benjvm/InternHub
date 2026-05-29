# InternHub migration layer

Supabase database migrations live in `supabase/`.

Runtime migration helpers live in `scripts/`:

- `npm run firebase:users:export`
- `npm run supabase:users:import`
- `npm run migrate:firestore:supabase`

Keep Firebase enabled until the Supabase schema, policies, auth import and data migration have been validated.
