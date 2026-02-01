import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const metadata: Metadata = {
  title: "BagDrop.it - Deposito Bagagli Sicuro",
  description: "Deposita i tuoi bagagli in modo sicuro e conveniente nelle principali città italiane",
  manifest: "/manifest.json",
  themeColor: "#1E3A8A",
  openGraph: {
    title: "BagDrop.it - Deposito Bagagli Sicuro",
    description: "Deposita i tuoi bagagli in modo sicuro e conveniente nelle principali città italiane",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={inter.variable}>
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Maps - preconnect per velocizzare il caricamento */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        
        {/* Supabase - preconnect */}
        <link rel="preconnect" href="https://imhmrjpimnxqhqesjwkz.supabase.co" />
        
        {/* DNS prefetch per risorse secondarie */}
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
