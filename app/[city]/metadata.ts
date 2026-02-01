import { Metadata } from "next";
import { City } from "@/lib/types";

export function generateMetadata(city: City): Metadata {
  const cityNames: Record<City, string> = {
    Milano: "Milano Centrale",
    Firenze: "Firenze Centro",
    Bologna: "Bologna Centrale",
    Roma: "Roma Termini",
    Napoli: "Napoli Centrale",
  };

  return {
    title: `Deposito bagagli ${cityNames[city]} da 3€ - BagDrop.it`,
    description: `Deposita i tuoi bagagli a ${city} in modo sicuro e conveniente. Prezzi da 3,50€/bag, assicurazione inclusa, depositi verificati.`,
    openGraph: {
      title: `Deposito bagagli ${cityNames[city]} - BagDrop.it`,
      description: `Deposita i tuoi bagagli a ${city} in modo sicuro. Prezzi da 3,50€/bag.`,
      type: "website",
    },
  };
}
