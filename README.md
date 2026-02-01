# BagDrop.it - MVP Marketplace Deposito Bagagli

Marketplace minimalista per deposito bagagli nelle principali città italiane. Stile Pieter Levels: funzionale, scalabile, solo-founder friendly.

## Stack Tecnologico

- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Stripe** (Checkout + Webhooks)
- **Vercel** (Deploy)
- **shadcn/ui** (Componenti UI)
- **Google Maps API** (Mappe e geocoding)
- **QRCode.react** (Generazione QR codes)
- **Groq API** (AI per descrizioni multilingua)

## Setup Locale

1. **Clona e installa dipendenze**
```bash
npm install
```

2. **Configura variabili d'ambiente**
Copia `.env.local.example` in `.env.local` e compila:
```bash
cp .env.local.example .env.local
```

Variabili richieste:
- `NEXT_PUBLIC_SUPABASE_URL` - URL progetto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (per webhooks)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `GROQ_API_KEY` - Groq API key
- `NEXT_PUBLIC_APP_URL` - URL app (es. http://localhost:3000)

3. **Setup Supabase**

   a. Crea progetto su [supabase.com](https://supabase.com)
   
   b. Esegui migration:
   ```sql
   -- Copia contenuto di supabase/migrations/001_initial_schema.sql
   -- Esegui nel SQL Editor di Supabase
   ```

   c. Crea storage bucket:
   - Vai su Storage → Create bucket
   - Nome: `locations`
   - Public: ✅
   - Policies: Permetti upload per autenticati

   d. Abilita Email Auth in Authentication → Providers

4. **Setup Stripe**

   a. Crea account su [stripe.com](https://stripe.com)
   
   b. Ottieni API keys da Dashboard → Developers → API keys
   
   c. Configura webhook:
   - Dashboard → Developers → Webhooks
   - Endpoint: `https://tuodominio.com/api/webhook`
   - Eventi: `checkout.session.completed`
   - Copia webhook secret

5. **Setup Google Maps**

   a. Crea progetto su [Google Cloud Console](https://console.cloud.google.com)
   
   b. Abilita Maps JavaScript API e Geocoding API
   
   c. Crea API key e aggiungila a `.env.local`

6. **Setup Groq**

   a. Registrati su [groq.com](https://groq.com)
   
   b. Ottieni API key dal dashboard
   
   c. Aggiungi a `.env.local`

7. **Avvia sviluppo**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Seed Data

Per popolare con dati fake (20 host, 4 per città):
```sql
-- Esegui supabase/seed.sql nel SQL Editor di Supabase
-- Nota: aggiorna gli UUID host_id con ID utenti reali dopo aver creato account test
```

## Deploy su Vercel

1. **Push su GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo>
git push -u origin main
```

2. **Deploy su Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Importa repository GitHub
   - Aggiungi tutte le variabili d'ambiente da `.env.local`
   - Deploy automatico

3. **Configura Stripe Webhook**
   - Aggiorna webhook endpoint con URL Vercel: `https://tuodominio.vercel.app/api/webhook`
   - Verifica che webhook secret sia corretto

4. **Configura Google Maps**
   - Aggiungi dominio Vercel alle restrizioni API key Google Maps

## Struttura Progetto

```
├── app/
│   ├── api/              # API routes (checkout, webhook, geocode, ai-desc)
│   ├── bookings/         # Pagina prenotazioni utente
│   ├── dashboard/        # Dashboard host
│   ├── host/             # Onboarding host pubblico
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Homepage con mappa
├── components/
│   ├── ui/               # Componenti shadcn/ui
│   └── booking-modal.tsx # Modal prenotazione
├── lib/
│   ├── supabase/         # Client Supabase (client, server, admin)
│   ├── stripe.ts         # Client Stripe
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── seed.sql         # Seed data
└── hooks/
    └── use-toast.ts      # Toast notifications
```

## Feature Principali

### 1. Homepage (`/`)
- Selezione città (Milano/Firenze/Bologna/Roma/Napoli)
- Mappa Google Maps con pin host (verde = disponibile)
- Cards host con prezzo, distanza, rating
- Modal booking con calcolo totale

### 2. Booking Flow
- Selezione numero bagagli (1-5)
- Date/ora dropoff e pickup
- Assicurazione opzionale (+20%)
- Checkout Stripe
- QR code post-pagamento

### 3. Dashboard Host (`/dashboard`)
- Auth Supabase richiesta
- Form creazione location:
  - Indirizzo → geocoding automatico
  - Upload foto → Supabase Storage
  - Prezzo/max bagagli/orari
  - AI genera descrizioni 5 lingue (IT/EN/FR/DE/ES)
- Lista location host
- Approvazione admin (campo `approved`)

### 4. Bookings (`/bookings`)
- Lista prenotazioni utente
- Visualizzazione QR code
- Form recensione post-pickup

### 5. Host Onboarding (`/host`)
- Form pubblico registrazione/login
- Incentivi "0% commissioni 3 mesi"

## Schema Database

### `locations`
- Informazioni deposito (indirizzo, coordinate, prezzo, orari)
- Foto (array URL Supabase Storage)
- Descrizioni AI multilingua (JSONB)
- Flag `approved` per approvazione admin

### `bookings`
- Prenotazioni utenti
- Status: pending → paid → completed
- QR URL generato post-pagamento
- Recensione opzionale

## API Routes

- `POST /api/checkout` - Crea Stripe checkout session
- `POST /api/webhook` - Stripe webhook handler (aggiorna booking, genera QR)
- `POST /api/geocode` - Geocoding indirizzo → lat/lng
- `POST /api/ai-desc` - Genera descrizioni multilingua con Groq

## Testing End-to-End

1. Crea account host su `/host`
2. Crea location su `/dashboard`
3. Approva location manualmente in Supabase (set `approved = true`)
4. Crea account utente
5. Seleziona città su homepage
6. Clicca su location → booking modal
7. Compila form → Stripe checkout (usa card test: 4242 4242 4242 4242)
8. Verifica booking su `/bookings`
9. Verifica QR code generato

## Note

- **Approval Host**: Admin deve approvare manualmente location (set `approved = true` in Supabase)
- **Email QR**: TODO - implementare invio email con QR post-pagamento
- **Validazione Slot**: TODO - validare disponibilità slot/orari prima di booking
- **Rating**: Attualmente hardcoded 4.8, implementare calcolo da reviews

## License

MIT
