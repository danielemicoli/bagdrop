"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Booking } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { useToast } from "@/hooks/use-toast";
import { Star, ExternalLink, Briefcase, LogOut, Home } from "lucide-react";
import { BookingCardSkeleton } from "@/components/loading-skeletons";
// ErrorBoundary removed - Next.js has built-in error boundaries

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    if (searchParams.get("success")) {
      toast({
        title: "Pagamento completato",
        description: "La tua prenotazione è stata confermata",
      });
    }
  }, []);

  const loadBookings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data } = await supabase
      .from("bookings")
      .select("*, location:locations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setBookings(data);
    setLoading(false);
  };

  const submitReview = async (bookingId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ review: reviewText })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la recensione",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Successo",
        description: "Recensione salvata",
      });
      setSelectedBooking(null);
      loadBookings();
    }
  };

  if (loading) return <div className="p-8">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" prefetch={true} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Briefcase className="h-6 w-6 text-brand-navy" />
                <span className="text-xl font-bold text-brand-navy hidden sm:inline">BagDrop.it</span>
              </Link>
              
              {/* Title */}
              <h1 className="text-lg md:text-xl font-bold text-brand-navy">Le mie prenotazioni</h1>
              
              {/* Navigation */}
              <div className="flex items-center gap-2 md:gap-4">
                <Link 
                  href="/" 
                  prefetch={true}
                  className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-brand-navy transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Home className="h-4 w-4" />
                  Homepage
                </Link>
                <button
                  onClick={async () => {
                    await createClient().auth.signOut();
                    router.push("/");
                  }}
                  className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Esci</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="space-y-4">
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </div>
          ) : bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
            >
              <p className="text-gray-600 text-lg mb-4">Nessuna prenotazione</p>
              <Link href="/" prefetch={true} className="text-brand-orange hover:underline inline-flex items-center gap-2 font-medium">
                Crea la tua prima prenotazione <ExternalLink className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {(booking.location as any)?.address}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {(booking.location as any)?.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(booking.total)}</p>
                      {booking.status === "paid" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Pagato
                        </span>
                      ) : booking.status === "completed" ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Completato
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          In attesa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Deposito</p>
                      <p>{new Date(booking.dropoff_ts).toLocaleString("it-IT")}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ritiro</p>
                      <p>{new Date(booking.pickup_ts).toLocaleString("it-IT")}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {booking.status === "paid" && booking.qr_url && (
                      <Button
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-brand-orange hover:bg-brand-orange-light text-white"
                      >
                        Mostra QR Code
                      </Button>
                    )}
                    {booking.status === "completed" && !booking.review && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        Lascia recensione
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedBooking.qr_url ? "QR Code" : "Lascia recensione"}
              </DialogTitle>
            </DialogHeader>
            {selectedBooking.qr_url ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <QRCode
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/bookings/${selectedBooking.id}/qr`}
                    size={256}
                    fgColor="#1E3A8A"
                  />
                </div>
                <p className="text-sm text-gray-600 font-medium">Mostra questo QR code al deposito</p>
                <Button
                  onClick={() => window.open(`/bookings/${selectedBooking.id}/qr`, '_blank')}
                  className="bg-brand-orange hover:bg-brand-orange-light text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri fullscreen
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valutazione</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            n <= reviewRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recensione</label>
                  <Input
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Scrivi la tua recensione..."
                  />
                </div>
                <Button
                  onClick={() => submitReview(selectedBooking.id)}
                  className="w-full"
                >
                  Invia
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
