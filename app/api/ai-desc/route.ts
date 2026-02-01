import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { address, photos } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    // Se Groq non è configurato, ritorna descrizioni di default
    if (!apiKey || apiKey.includes("...") || apiKey === "gsk_LL...") {
      return NextResponse.json({
        it: `Deposito bagagli sicuro in ${address}`,
        en: `Safe luggage storage in ${address}`,
        fr: `Stockage de bagages sécurisé à ${address}`,
        de: `Sichere Gepäckaufbewahrung in ${address}`,
        es: `Almacenamiento seguro de equipaje en ${address}`,
      });
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sei un assistente che genera descrizioni accattivanti per depositi bagagli in formato JSON con chiavi: it, en, fr, de, es. Ogni descrizione deve essere breve (max 100 caratteri) e invitante.",
        },
        {
          role: "user",
          content: `Genera descrizioni multilingua per un deposito bagagli situato in ${address}.`,
        },
      ],
      model: "llama-3.1-70b-versatile",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from AI");
    }

    const parsed = JSON.parse(content);
    
    return NextResponse.json({
      it: parsed.it || `Deposito bagagli sicuro in ${address}`,
      en: parsed.en || `Safe luggage storage in ${address}`,
      fr: parsed.fr || `Stockage de bagages sécurisé à ${address}`,
      de: parsed.de || `Sichere Gepäckaufbewahrung in ${address}`,
      es: parsed.es || `Almacenamiento seguro de equipaje en ${address}`,
    });
  } catch (error: any) {
    // In caso di errore, ritorna descrizioni di default invece di fallire
    try {
      const { address } = await req.json();
      return NextResponse.json({
        it: `Deposito bagagli sicuro in ${address}`,
        en: `Safe luggage storage in ${address}`,
        fr: `Stockage de bagages sécurisé à ${address}`,
        de: `Sichere Gepäckaufbewahrung in ${address}`,
        es: `Almacenamiento seguro de equipaje en ${address}`,
      });
    } catch {
      return NextResponse.json({
        it: "Deposito bagagli sicuro",
        en: "Safe luggage storage",
        fr: "Stockage de bagages sécurisé",
        de: "Sichere Gepäckaufbewahrung",
        es: "Almacenamiento seguro de equipaje",
      });
    }
  }
}
