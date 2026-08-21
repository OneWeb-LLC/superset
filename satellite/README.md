# Superset OWeb satellite

This directory is a Next.js App Router **constellation satellite** for the
Apache Superset repository. Flask/Celery/Redis cannot run on Vercel, so the
satellite follows OWeb's federation model (same pattern as Kanba and Inbox):

1. Shared One OS Auth at `auth.oweb.one` with session key `ao-supabase-auth`
2. Namespaced `ss_profiles` projection (`id = auth.users.id`) — no global
   `auth.users` trigger
3. Continue with OWeb → `https://oweb.one/login?launch=superset`
4. App Store SSO: `GET /sso?launch_token=` → `POST /api/oweb/sso`
5. OneID activation via `ao_upsert_app_activation` and
   `POST /api/v1/oneid/activate`

The full Flask Superset backend stays out of this Vercel project. Set
`NEXT_PUBLIC_SUPERSET_URL` to embed a separately hosted instance.

## Local development

```bash
cd satellite
cp .env.example .env.local
# fill keys from the Vercel oweb project
npm install
npm run dev
```

Vercel project root is this `satellite/` folder.
