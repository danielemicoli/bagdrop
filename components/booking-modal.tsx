"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, VisuallyHidden } from "@/components/ui/dialog";import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Location } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Shield, ChevronRight, ChevronLeft, Calendar, Clock } from "lucide-react";

interface BookingModalProps {
  location: Location;
  open: boolean;
  onClose: () => void;
}

type Step = "bags" | "dates" | "summary";

export function BookingModal({ location, open, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>("bags");
  const [bags, setBags] = useState(1);
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateTotal = () => {
    const basePrice = location.price_per_bag * bags;
    const insuranceFee = insurance ? basePrice * 0.2 : 0;
    return basePrice + insuranceFee;
  };

  const handleNext = () => {
    if (step === "bags") {
      setStep("dates");
    } else if (step === "dates") {
      if (!dropoffDate || !dropoffTime || !pickupDate || !pickupTime) {
        toast({
          title: "Errore",
          description: "Compila tutte le date e gli orari",
          variant: "destructive",
        });
        return;
      }
      setStep("summary");
    }
  };

  const handleBack = () => {
    if (step === "dates") {
      setStep("bags");
    } else if (step === "summary") {
      setStep("dates");
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua il login per prenotare",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const dropoffTs = new Date(`${dropoffDate}T${dropoffTime}`).toISOString();
    const pickupTs = new Date(`${pickupDate}T${pickupTime}`).toISOString();
    const total = calculateTotal();

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        location_id: location.id,
        dropoff_ts: dropoffTs,
        pickup_ts: pickupTs,
        bags,
        total,
        ins_opt: insurance,
        status: "pending",
      })
      .select()
      .single();

    if (error || !booking) {
      toast({
        title: "Errore",
        description: "Impossibile creare la prenotazione",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        amount: Math.round(total * 100),
        locationId: location.id,
      }),
    });

    const { url } = await response.json();
    if (url) {
      window.location.href = url;
    } else {
      toast({
        title: "Errore",
        description: "Impossibile creare il pagamento",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-0 md:p-6">
        <VisuallyHidden>
          <DialogTitle>Prenota deposito bagagli - {location.address}</DialogTitle>
        </VisuallyHidden>
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          {step !== "bags" && (
            <button onClick={handleBack} className="p-2">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500">
              {step === "bags" ? "1/3" : step === "dates" ? "2/3" : "3/3"}
            </div>
          </div>
          <button onClick={onClose} className="p-2">
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Location Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-brand-navy mb-2">{location.address}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{location.city}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Bags */}
            {step === "bags" && (
            <motion.div
              key="bags"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Quanti bagagli?</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBags(n)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bags === n
                          ? "border-brand-orange bg-brand-orange/10 text-brand-orange font-semibold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl font-bold">{n}</div>
                      <div className="text-xs text-gray-500 mt-1">bag{n > 1 ? "agli" : "aglio"}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-brand-navy mt-0.5" />
                  <div>
                    <div className="font-semibold text-brand-navy mb-1">Assicurazione inclusa</div>
                    <div className="text-sm text-gray-700">
                      Copertura fino a 500€ per bagaglio. Puoi aggiungere una copertura extra (+20%) per maggiore protezione.
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-6 text-lg font-semibold"
              >
                Continua
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Dates */}
          {step === "dates" && (
            <motion.div
              key="dates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Quando?</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Deposito
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={dropoffDate}
                        onChange={(e) => setDropoffDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-12"
                      />
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="time"
                          value={dropoffTime}
                          onChange={(e) => setDropoffTime(e.target.value)}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ritiro
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={dropoffDate || new Date().toISOString().split("T")[0]}
                        className="h-12"
                      />
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                <input
                  type="checkbox"
                  id="insurance"
                  checked={insurance}
                  onChange={(e) => setInsurance(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="insurance" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Assicurazione extra (+20%)</div>
                  <div className="text-sm text-gray-600">
                    Copertura aggiuntiva fino a 1000€ per bagaglio
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white"
                >
                  Continua
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Summary */}
          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Riepilogo</h3>
                
                <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{bags} bagaglio{bags > 1 ? "i" : ""}</span>
                    <span className="font-semibold">{formatPrice(location.price_per_bag * bags)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Deposito: {new Date(dropoffDate).toLocaleDateString("it-IT")} {dropoffTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Ritiro: {new Date(pickupDate).toLocaleDateString("it-IT")} {pickupTime}
                    </span>
                  </div>
                  {insurance && (
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Assicurazione extra</span>
                      <span>{formatPrice(location.price_per_bag * bags * 0.2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-brand-navy">
                    <span>Totale</span>
                    <span className="text-brand-navy">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white py-6 text-lg font-semibold"
                >
                  {loading ? "Caricamento..." : "Paga con Stripe"}
                </Button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
