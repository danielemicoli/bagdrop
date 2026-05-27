# Sicurezza Biglietti - Ticket Xchange

## Problema: Manomissione QR Code

**Scenario di attacco:**
1. Venditore vende biglietto → genera QR originale
2. Venditore sostituisce QR con uno falso nel PDF/immagine
3. Venditore entra al concerto con QR originale
4. Acquirente resta con QR falsificato

## Soluzione: Token Firmato + Verifica Server-Side

### 1. Generazione QR Sicuro

```typescript
// lib/ticket-security.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SECRET_KEY = process.env.TICKET_SECRET_KEY!; // Chiave segreta server-side

interface TicketData {
  ticketId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  buyerId: string;
  buyerName: string;
  price: number;
}

/**
 * Genera un token firmato per il biglietto
 */
export function generateTicketToken(ticketData: TicketData): string {
  // Crea hash dei dati critici (impossibile alterare senza invalidare)
  const dataHash = crypto
    .createHash('sha256')
    .update(`${ticketData.ticketId}-${ticketData.eventId}-${ticketData.eventDate}-${ticketData.buyerId}`)
    .digest('hex');

  const payload = {
    ticketId: ticketData.ticketId,
    eventId: ticketData.eventId,
    eventName: ticketData.eventName,
    eventDate: ticketData.eventDate,
    buyerId: ticketData.buyerId,
    buyerName: ticketData.buyerName,
    price: ticketData.price,
    dataHash, // Hash dei dati per verificare integrità
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  // Firma il token (solo il server può generarlo)
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '30d' });
}

/**
 * Verifica il token e restituisce i dati se validi
 */
export function verifyTicketToken(token: string): TicketData | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    
    // Verifica hash dei dati
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${decoded.ticketId}-${decoded.eventId}-${decoded.eventDate}-${decoded.buyerId}`)
      .digest('hex');

    if (decoded.dataHash !== expectedHash) {
      return null; // Dati alterati!
    }

    return {
      ticketId: decoded.ticketId,
      eventId: decoded.eventId,
      eventName: decoded.eventName,
      eventDate: decoded.eventDate,
      buyerId: decoded.buyerId,
      buyerName: decoded.buyerName,
      price: decoded.price,
    };
  } catch (error) {
    return null; // Token invalido o scaduto
  }
}
```

### 2. API Route per Generare QR

```typescript
// app/api/tickets/[id]/qr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateTicketToken } from '@/lib/ticket-security';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Carica biglietto dal DB
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, event:events(*)')
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  // Genera token firmato
  const token = generateTicketToken({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    eventName: ticket.event.name,
    eventDate: ticket.event.date,
    buyerId: ticket.buyer_id,
    buyerName: ticket.buyer_name,
    price: ticket.price,
  });

  // Il QR contiene il token, NON solo l'ID
  const qrValue = `TICKET:${token}`;

  return NextResponse.json({ qrValue, token });
}
```

### 3. API Route per Verificare QR (Scanner)

```typescript
// app/api/tickets/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyTicketToken } from '@/lib/ticket-security';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { qrData } = await req.json();

  // Estrai token dal QR (formato: "TICKET:eyJhbGc...")
  const tokenMatch = qrData.match(/^TICKET:(.+)$/);
  if (!tokenMatch) {
    return NextResponse.json(
      { valid: false, error: 'Invalid QR format' },
      { status: 400 }
    );
  }

  const token = tokenMatch[1];

  // Verifica token e firma
  const ticketData = verifyTicketToken(token);
  if (!ticketData) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or tampered ticket' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Verifica nel DB che il biglietto esista e corrisponda
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, event:events(*)')
    .eq('id', ticketData.ticketId)
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { valid: false, error: 'Ticket not found in database' },
      { status: 404 }
    );
  }

  // Verifica che i dati corrispondano (doppio controllo)
  if (
    ticket.event_id !== ticketData.eventId ||
    ticket.buyer_id !== ticketData.buyerId ||
    ticket.event.date !== ticketData.eventDate
  ) {
    return NextResponse.json(
      { valid: false, error: 'Ticket data mismatch' },
      { status: 400 }
    );
  }

  // Verifica che non sia già stato usato
  if (ticket.used_at) {
    return NextResponse.json(
      { valid: false, error: 'Ticket already used', usedAt: ticket.used_at },
      { status: 400 }
    );
  }

  // Marca come usato (BURN - non può essere riutilizzato)
  await supabase
    .from('tickets')
    .update({ used_at: new Date().toISOString() })
    .eq('id', ticketData.ticketId);

  return NextResponse.json({
    valid: true,
    ticket: {
      id: ticket.id,
      eventName: ticket.event.name,
      eventDate: ticket.event.date,
      buyerName: ticket.buyer_name,
    },
  });
}
```

### 4. Component Scanner QR

```typescript
// components/ticket-scanner.tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function TicketScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleScan = async (qrData: string) => {
    setScanning(true);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();

      if (data.valid) {
        setResult({
          success: true,
          ticket: data.ticket,
        });
        toast({
          title: 'Biglietto valido!',
          description: `${data.ticket.eventName} - ${data.ticket.buyerName}`,
        });
      } else {
        setResult({
          success: false,
          error: data.error,
        });
        toast({
          title: 'Biglietto non valido',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile verificare il biglietto',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      {/* Usa una libreria QR scanner (es. react-qr-reader) */}
      {/* Quando scannerizza, chiama handleScan(qrData) */}
      {result && (
        <div>
          {result.success ? (
            <div className="text-green-600">
              ✅ Biglietto valido: {result.ticket.eventName}
            </div>
          ) : (
            <div className="text-red-600">❌ {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Schema Database

```sql
-- Tabella tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),
  buyer_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  qr_token TEXT UNIQUE NOT NULL, -- Token firmato salvato nel DB
  used_at TIMESTAMPTZ, -- NULL = non usato, timestamp = già usato
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_qr_token ON tickets(qr_token);
CREATE INDEX idx_tickets_used_at ON tickets(used_at);
```

## Flusso Completo

### 1. Vendita Biglietto
```
1. Venditore crea biglietto → DB
2. Server genera token firmato (JWT) con dati del biglietto
3. QR code contiene: "TICKET:{token}"
4. QR viene mostrato all'acquirente
```

### 2. Tentativo di Manomissione
```
❌ Venditore sostituisce QR con uno falso
   → Il QR falso non ha token valido
   → Scanner verifica token → FALLISCE
   → Biglietto rifiutato
```

### 3. Verifica all'Ingresso
```
1. Scanner legge QR code
2. Estrae token dal QR
3. Verifica firma JWT (solo server può generarla)
4. Verifica hash dei dati (impossibile alterare)
5. Verifica nel DB che biglietto esista e corrisponda
6. Verifica che non sia già stato usato
7. Marca come usato (BURN)
```

## Protezioni Implementate

✅ **Firma Crittografica**: Solo il server può generare token validi
✅ **Hash Dati**: Impossibile alterare dati senza invalidare hash
✅ **Verifica DB**: Doppio controllo con database
✅ **Burn Token**: Una volta usato, non può essere riutilizzato
✅ **Expiration**: Token scade dopo 30 giorni
✅ **Timestamp**: Previene replay attacks

## Note Importanti

1. **SECRET_KEY**: Deve essere segreta e mai esposta al client
2. **QR Format**: Usa prefisso "TICKET:" per distinguere da altri QR
3. **Rate Limiting**: Limita tentativi di verifica per prevenire brute force
4. **Logging**: Registra tutti i tentativi di verifica per audit
5. **Offline Mode**: Considera verifica offline con chiavi pubbliche/private
