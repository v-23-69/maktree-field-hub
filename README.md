# Welcome to your Lovable project

TODO: Document your project here

## Deploying Edge Functions

Run:

```bash
bash supabase/functions/deploy.sh
```

Or:

```bash
supabase functions deploy create-auth-user
```

### Supabase secrets

For **production**, set the service role key (the function reads `SUPABASE_SERVICE_ROLE_KEY` from the environment Supabase injects; for deployed functions also ensure it is available via):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

Use the **service_role** key from the Supabase dashboard → **Settings** → **API**.

### Local development

For **`supabase functions serve`**, copy `supabase/functions/create-auth-user/.env.local.example` to `supabase/functions/create-auth-user/.env.local` and set:

```env
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard → Settings → API → service_role key>
```

The root `.gitignore` ignores `.env.local` so your key is not committed.
