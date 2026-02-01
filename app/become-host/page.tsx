"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Briefcase,
  Users,
  Clock,
  Star,
  Loader2
} from "lucide-react";

type Step = 1 | 2 | 3;

export default function BecomeHostPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Non loggato → redirect a login con next
        router.push("/login?next=/become-host");
        return;
      }
      
      // Controlla se è già host
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.role === 'host') {
        // Già host → redirect a dashboard
        toast({
          title: "Sei già un Host!",
          description: "Ti reindirizziamo alla dashboard.",
        });
        router.push("/dashboard");
        return;
      }
      
      setUser(user);
      setLoading(false);
    };
    
    checkAuth();
  }, [router, toast]);

  const handleBecomeHost = async () => {
    if (!acceptedTerms) {
      toast({
        title: "Accetta i termini",
        description: "Devi accettare i termini per continuare.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    const supabase = createClient();
    
    // Aggiorna il ruolo a HOST
    const { error } = await supabase
      .from("profiles")
      .update({ role: 'host', updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile completare l'operazione. Riprova.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    
    // Successo!
    setStep(3);
    toast({
      title: "Congratulazioni!",
      description: "Sei ufficialmente un Host BagDrop.it!",
    });
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy-light flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy-light">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Briefcase className="h-6 w-6 text-white" />
            <h1 className="text-2xl font-bold text-white">BagDrop.it</h1>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-brand-orange text-white"
                      : "bg-white/20 text-white/50"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-6 w-6" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-16 md:w-24 transition-all ${
                      step > s ? "bg-brand-orange" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
                  Diventa Host
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Inizia a guadagnare con i tuoi spazi
                </p>
                <div className="inline-block bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                  0% commissioni per i primi 3 mesi
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center p-6 bg-blue-50 rounded-xl"
                >
                  <DollarSign className="h-12 w-12 text-brand-navy mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Guadagni extra</h3>
                  <p className="text-gray-600">Da 3,50€ per bagaglio</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center p-6 bg-blue-50 rounded-xl"
                >
                  <Clock className="h-12 w-12 text-brand-navy mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Flessibilità totale</h3>
                  <p className="text-gray-600">Tu decidi orari e prezzi</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-6 bg-blue-50 rounded-xl"
                >
                  <Shield className="h-12 w-12 text-brand-navy mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Pagamenti sicuri</h3>
                  <p className="text-gray-600">Stripe automatico</p>
                </motion.div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Indietro
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white py-6 text-lg font-semibold"
                >
                  Continua
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-brand-navy mb-4">
                  Termini e Condizioni Host
                </h2>
                <p className="text-gray-600">
                  Leggi e accetta per continuare
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-64 overflow-y-auto">
                <h3 className="font-bold mb-3">Responsabilità dell'Host</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Custodire con cura i bagagli dei viaggiatori</li>
                  <li>• Garantire un ambiente sicuro e pulito</li>
                  <li>• Rispettare gli orari di apertura indicati</li>
                  <li>• Comunicare tempestivamente eventuali problemi</li>
                  <li>• Accettare i metodi di pagamento tramite la piattaforma</li>
                </ul>
                
                <h3 className="font-bold mt-6 mb-3">Commissioni</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Primi 3 mesi: 0% commissioni</li>
                  <li>• Dopo: 15% su ogni prenotazione</li>
                  <li>• Pagamento settimanale automatico</li>
                </ul>
                
                <h3 className="font-bold mt-6 mb-3">Assicurazione</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Copertura fino a 500€ per bagaglio</li>
                  <li>• Protezione inclusa per furto e danni</li>
                </ul>
              </div>

              <label className="flex items-center gap-3 mb-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-gray-700">
                  Accetto i <span className="text-brand-navy font-semibold">Termini e Condizioni</span> per diventare Host
                </span>
              </label>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button
                  onClick={handleBecomeHost}
                  disabled={!acceptedTerms || submitting}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Attendi...
                    </>
                  ) : (
                    <>
                      Diventa Host
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-bold text-brand-navy mb-4">
                Benvenuto tra gli Host! 🎉
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Ora puoi aggiungere la tua prima location e iniziare a guadagnare.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="py-6"
                >
                  Torna alla Home
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-brand-orange hover:bg-brand-orange-light text-white py-6 text-lg font-semibold"
                >
                  Vai alla Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
