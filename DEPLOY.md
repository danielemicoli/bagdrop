# Guida Deploy BagDrop.it

## Setup Iniziale

### 1. Supabase

1. Crea progetto su [supabase.com](https://supabase.com)
2. Copia URL e API keys dal Settings → API
3. Esegui migration:
   - Vai su SQL Editor
   - Copia contenuto di `supabase/migrations/001_initial_schema.sql`
   - Esegui query
4. Crea Storage Bucket:
   - Storage → Create bucket
   - Nome: `locations`
   - Public: ✅
   - Policies: Crea policy per upload autenticati
5. Abilita Email Auth:
   - Authentication → Providers → Email → Enable

### 2. Stripe

1. Crea account su [stripe.com](https://stripe.com)
2. Ottieni API keys:
   - Dashboard → Developers → API keys
   - Copia Publishable key e Secret key
3. Configura Webhook:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://tuodominio.com/api/webhook`
   - Seleziona evento: `checkout.session.completed`
   - Copia Webhook signing secret

### 3. Google Maps

1. Crea progetto su [Google Cloud Console](https://console.cloud.google.com)
2. Abilita API:
   - Maps JavaScript API
   - Geocoding API
3. Crea API key:
   - Credentials → Create Credentials → API Key
   - Aggiungi restrizioni (domini Vercel)

### 4. Groq

1. Registrati su [groq.com](https://groq.com)
2. Ottieni API key dal dashboard
3. Aggiungi a variabili ambiente

## Deploy Vercel

1. **Push su GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import su Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - New Project → Import GitHub repo
   - Framework: Next.js (auto-detected)

3. **Configura Environment Variables**
Aggiungi tutte le variabili da `.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_APP_URL` (es. https://bagdrop.vercel.app)

4. **Deploy**
   - Click Deploy
   - Attendi completamento build

5. **Aggiorna Stripe Webhook**
   - Vai su Stripe Dashboard → Webhooks
   - Aggiorna endpoint con URL Vercel: `https://tuodominio.vercel.app/api/webhook`
   - Verifica che webhook secret sia corretto

6. **Aggiorna Google Maps**
   - Aggiungi dominio Vercel alle restrizioni API key

## Post-Deploy

1. **Seed Data** (opzionale):
   - Esegui `supabase/seed.sql` nel SQL Editor Supabase
   - Aggiorna UUID host_id con ID utenti reali

2. **Test Flow**:
   - Crea account host su `/host`
   - Crea location su `/dashboard`
   - Approva location in Supabase (set `approved = true`)
   - Crea account utente
   - Testa booking end-to-end

3. **Admin Approval**:
   - Per approvare location, vai su Supabase → Table Editor → locations
   - Set `approved = true` per location da approvare

## Troubleshooting

- **Webhook non funziona**: Verifica STRIPE_WEBHOOK_SECRET e URL endpoint
- **Mappa non carica**: Verifica GOOGLE_MAPS_API_KEY e restrizioni dominio
- **Upload foto fallisce**: Verifica Storage bucket policies Supabase
- **AI descrizioni falliscono**: Verifica GROQ_API_KEY e quota API
