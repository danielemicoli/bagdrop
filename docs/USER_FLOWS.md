# BagDrop.it - Flussi Utente

## 📋 Panoramica

L'applicazione gestisce tre tipi di utenti con esperienze diverse:

| Tipo Utente | Ruolo DB | Accesso |
|-------------|----------|---------|
| 🚶 Non loggato | - | Limitato |
| 🎒 Viaggiatore | `traveler` | Completo (prenotazioni) |
| 🏠 Host | `host` | Completo (dashboard) |

---

## 1️⃣ FLUSSO UTENTE NON LOGGATO

### Header Navigation
```
[Logo BagDrop.it] -------- [Cerca Depositi] [Diventa Host] [Login]
```

### Pagine Accessibili
- ✅ Homepage (ricerca città, hero, info servizio)
- ✅ Pagina Host `/host` (registrazione)
- ✅ Pagina Login `/login`
- ❌ Dashboard `/dashboard` → Redirect a `/`
- ❌ Prenotazioni `/bookings` → Redirect a `/`

### User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Hero: "Viaggia leggero, deposita da 3,50€"             │   │
│  │  [Select città] [🔍 Trova Deposito]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│     [Cerca Depositi]   [Diventa Host]    [Login]               │
│              │               │               │                  │
│              ▼               ▼               ▼                  │
│      Seleziona città    /host page      /login page            │
│              │               │               │                  │
│              ▼               │               │                  │
│      Vede mappa +            │               │                  │
│      location cards          │               │                  │
│              │               │               │                  │
│              ▼               │               │                  │
│      Click su card           │               │                  │
│              │               │               │                  │
│              ▼               │               │                  │
│      ⚠️ BOOKING MODAL        │               │                  │
│      "Accedi per             │               │                  │
│       prenotare"             │               │                  │
│              │               │               │                  │
│              └───────────────┴───────────────┘                  │
│                              │                                   │
│                              ▼                                   │
│                      /login page                                │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                  │
│        [Registrati]                     [Accedi]               │
│      (nuovo account)                (account esistente)         │
└─────────────────────────────────────────────────────────────────┘
```

### Azioni Possibili
| Azione | Risultato |
|--------|-----------|
| Cerca città | Vede mappa e location |
| Click location card | Apre modal (richiede login per prenotare) |
| Click "Diventa Host" | Va a `/host` |
| Click "Login" | Va a `/login` |

---

## 2️⃣ FLUSSO VIAGGIATORE (TRAVELER)

### Header Navigation
```
[Logo BagDrop.it] -------- [Cerca Depositi] [Diventa Host] [Le mie prenotazioni]
```

### Pagine Accessibili
- ✅ Homepage
- ✅ Pagina Login `/login`
- ✅ Pagina Host `/host` (può diventare anche host)
- ✅ **Prenotazioni** `/bookings`
- ❌ Dashboard `/dashboard` → Mostra comunque (vuota)

### User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOGIN come VIAGGIATORE                        │
│                              │                                   │
│                              ▼                                   │
│                    Redirect a HOMEPAGE                          │
│                    Toast: "Bentornato!"                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE                                 │
│  Header: [Logo] --- [Cerca Depositi] [Diventa Host] [Prenotazioni]│
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Hero + Search                                           │   │
│  │  [Select città] [🔍 Trova Deposito]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                      Seleziona città                            │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MAPPA + LOCATION CARDS                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │   │
│  │  │ Bar X   │ │ Hotel Y │ │ Shop Z  │                    │   │
│  │  │ 3,50€   │ │ 4,00€   │ │ 3,50€   │                    │   │
│  │  │ ⭐ 4.9  │ │ ⭐ 4.8  │ │ ⭐ 4.7  │                    │   │
│  │  └────┬────┘ └─────────┘ └─────────┘                    │   │
│  └───────┼──────────────────────────────────────────────────┘   │
│          │                                                       │
│          ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦 BOOKING MODAL (Step 1-3)                             │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Step 1: Seleziona date/orari                   │    │   │
│  │  │  Step 2: Numero bagagli                         │    │   │
│  │  │  Step 3: Riepilogo + Pagamento                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                    Prenotazione creata!                         │
│                    Redirect a /bookings                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LE MIE PRENOTAZIONI                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Prenotazione #1234                                      │   │
│  │  📍 Bar dei Viaggiatori, Milano                         │   │
│  │  📅 15 Gen 2026, 10:00 - 18:00                          │   │
│  │  🎒 2 bagagli | 💰 7,00€                                 │   │
│  │  Status: ✅ Confermata                                   │   │
│  │  [📱 Mostra QR] [⭐ Lascia recensione]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Azioni Possibili
| Azione | Risultato |
|--------|-----------|
| Cerca città | Vede mappa e location |
| Click location | Apre booking modal |
| Completa prenotazione | Crea booking, genera QR |
| "Le mie prenotazioni" | Vede storico prenotazioni |
| "Diventa Host" | Può registrarsi come host |

---

## 3️⃣ FLUSSO HOST

### Header Navigation
```
[Logo BagDrop.it] -------- [Cerca Depositi] [Dashboard Host]
```
*Nota: "Diventa Host" non è visibile (già host)*

### Pagine Accessibili
- ✅ Homepage
- ✅ **Dashboard** `/dashboard`
- ✅ Prenotazioni `/bookings` (sue prenotazioni come cliente)
- ❌ Pagina Host `/host` → Può accedere ma è già registrato

### User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN come HOST                             │
│                              │                                   │
│                              ▼                                   │
│                    Redirect a DASHBOARD                         │
│                    Toast: "Bentornato Host!"                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD HOST                              │
│  Header: [Logo → /] [Dashboard Host] [Homepage] [user@email] [Logout]│
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 STATISTICHE                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │   │
│  │  │ Guadagni │ │Prenotaz. │ │ Rating   │                 │   │
│  │  │  €245    │ │    12    │ │  ⭐ 4.8  │                 │   │
│  │  └──────────┘ └──────────┘ └──────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📍 LE TUE LOCATION                     [+ Aggiungi]    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Bar dei Viaggiatori                              │    │   │
│  │  │ 📍 Via Roma 123, Milano                          │    │   │
│  │  │ 💰 3,50€/bag | 🎒 Max 10 | ✅ Attivo             │    │   │
│  │  │ [Modifica] [Disattiva]                           │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                      [+ Aggiungi Location]                      │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📝 FORM NUOVA LOCATION                                  │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Città: [Select ▼]                                │    │   │
│  │  │ Indirizzo: [Autocomplete Google]                 │    │   │
│  │  │ Prezzo/bag: [€ ____]                             │    │   │
│  │  │ Max bagagli: [____]                              │    │   │
│  │  │ Orari: [09:00] - [18:00]                         │    │   │
│  │  │                                                   │    │   │
│  │  │ [Salva Location]                                  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📅 PRENOTAZIONI RICEVUTE                                │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ #5678 | Mario Rossi                              │    │   │
│  │  │ 📅 Oggi 14:00 - 19:00 | 🎒 3 bagagli            │    │   │
│  │  │ Status: 🟡 In attesa check-in                    │    │   │
│  │  │ [✅ Check-in] [❌ Cancella]                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Azioni Possibili
| Azione | Risultato |
|--------|-----------|
| Vede statistiche | Guadagni, prenotazioni, rating |
| Aggiunge location | Form con autocomplete indirizzo |
| Modifica location | Cambia prezzo, orari, disponibilità |
| Gestisce prenotazioni | Check-in, check-out, cancella |
| Vede pagamenti | Storico transazioni |
| Click su "Homepage" | Torna alla home (può anche prenotare) |

---

## 🔄 Confronto Rapido

| Funzionalità | Non Loggato | Viaggiatore | Host |
|--------------|:-----------:|:-----------:|:----:|
| Vede homepage | ✅ | ✅ | ✅ |
| Cerca location | ✅ | ✅ | ✅ |
| Prenota bagagli | ❌ | ✅ | ✅ |
| Vede prenotazioni | ❌ | ✅ | ✅ |
| Dashboard host | ❌ | ❌ | ✅ |
| Aggiunge location | ❌ | ❌ | ✅ |
| Riceve prenotazioni | ❌ | ❌ | ✅ |
| "Diventa Host" visibile | ✅ | ✅ | ❌ |

---

## 🔐 Logica di Redirect

```javascript
// Al login
if (profile.role === 'host') {
  redirect('/dashboard');  // Host → Dashboard
} else {
  redirect('/');           // Traveler → Homepage
}

// Protezione rotte
/dashboard → richiede auth + role='host'
/bookings  → richiede auth (qualsiasi ruolo)
```

---

## 📱 Header Dinamico

```tsx
// Desktop Navigation
{userRole !== 'host' && <Link href="/host">Diventa Host</Link>}

{user ? (
  userRole === 'host' 
    ? <Link href="/dashboard">Dashboard Host</Link>
    : <Link href="/bookings">Le mie prenotazioni</Link>
) : (
  <Link href="/login">Login</Link>
)}
```
