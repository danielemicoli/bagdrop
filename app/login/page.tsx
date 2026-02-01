"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn, Mail, Lock, Briefcase } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Ottieni il parametro ?next= per redirect dopo login
  const nextUrl = searchParams.get("next") || "/";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (isSignUp) {
      // Registrazione - SEMPRE come TRAVELER
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'traveler' // SEMPRE traveler alla registrazione
          }
        }
      });
      
      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account creato!",
          description: "Controlla la tua email per verificare l'account.",
        });
        // Redirect al next URL o homepage
        router.push(nextUrl);
      }
    } else {
      // Login esistente
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      } else if (authData.user) {
        toast({
          title: "Bentornato!",
          description: "Accesso effettuato.",
        });
        // Redirect al next URL (es: /become-host) o homepage
        router.push(nextUrl);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" prefetch={true} className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-brand-navy" />
            <h1 className="text-2xl font-bold text-brand-navy">BagDrop.it</h1>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy mb-2">
              {isSignUp ? "Crea Account" : "Accedi"}
            </h2>
            <p className="text-gray-600">
              {isSignUp 
                ? "Registrati per prenotare depositi bagagli" 
                : "Accedi al tuo account BagDrop.it"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.com"
                  required
                  className="h-12 pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-navy hover:bg-brand-navy-dark text-white py-6 text-lg font-semibold transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Caricamento...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <LogIn className="h-5 w-5" />
                  {isSignUp ? "Registrati" : "Accedi"}
                </span>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-brand-navy transition-colors"
            >
              {isSignUp ? (
                <>Hai già un account? <span className="font-semibold text-brand-navy">Accedi</span></>
              ) : (
                <>Non hai un account? <span className="font-semibold text-brand-navy">Registrati</span></>
              )}
            </button>
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full mt-6 text-gray-600 hover:text-brand-navy"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Homepage
          </Button>
        </motion.div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Accedendo accetti i nostri Termini di Servizio e la Privacy Policy
        </p>
      </main>
    </div>
  );
}
