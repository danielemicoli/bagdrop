import { NextRequest, NextResponse } from "next/server";

// Coordinate di default per le città (centro città)
const cityDefaults: Record<string, { lat: number; lng: number }> = {
  Milano: { lat: 45.4642, lng: 9.1900 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
};

export async function POST(req: NextRequest) {
  try {
    const { address, city } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    // Se la chiave non è configurata, usa coordinate di default
    if (!apiKey || apiKey.includes("...")) {
      if (city && cityDefaults[city]) {
        return NextResponse.json({
          lat: cityDefaults[city].lat,
          lng: cityDefaults[city].lng,
          fallback: true,
        });
      }
      return NextResponse.json(
        { error: "Google Maps API key non configurata e città non specificata" },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );

      const data = await response.json();

      // Se il geocoding ha successo, ritorna le coordinate
      if (data.status === "OK" && data.results[0]) {
        const location = data.results[0].geometry.location;
        return NextResponse.json({
          lat: location.lat,
          lng: location.lng,
          fallback: false,
        });
      }

      // Se fallisce ma abbiamo la città, usa coordinate di default
      if (city && cityDefaults[city]) {
        return NextResponse.json({
          lat: cityDefaults[city].lat,
          lng: cityDefaults[city].lng,
          fallback: true,
        });
      }

      // Se non abbiamo la città, ritorna errore
      return NextResponse.json(
        { error: `Geocoding fallito: ${data.status}. Usa coordinate di default per la città.` },
        { status: 400 }
      );
    } catch (fetchError: any) {
      // Se c'è un errore di rete o API, usa coordinate di default se disponibili
      if (city && cityDefaults[city]) {
        return NextResponse.json({
          lat: cityDefaults[city].lat,
          lng: cityDefaults[city].lng,
          fallback: true,
        });
      }
      throw fetchError;
    }
  } catch (error: any) {
    // Ultimo fallback: usa coordinate di default se disponibili
    try {
      const { city } = await req.json();
      if (city && cityDefaults[city]) {
        return NextResponse.json({
          lat: cityDefaults[city].lat,
          lng: cityDefaults[city].lng,
          fallback: true,
        });
      }
    } catch {}
    
    return NextResponse.json(
      { error: `Errore geocoding: ${error.message}` },
      { status: 500 }
    );
  }
}
