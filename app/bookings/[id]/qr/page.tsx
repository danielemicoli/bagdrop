"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle, MapPin, Calendar, Clock } from "lucide-react";

export default function QRPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, location:locations(*)")
      .eq("id", bookingId)
      .single();

    if (data) setBooking(data);
    setLoading(false);
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `bagdrop-qr-${bookingId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QR Code BagDrop.it",
          text: `Mostra questo QR code al deposito: ${(booking.location as any)?.address}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiato negli appunti!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Prenotazione non trovata</p>
          <Button onClick={() => router.push("/bookings")}>Torna alle prenotazioni</Button>
        </div>
      </div>
    );
  }

  const location = booking.location as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white">
      {/* Header */}
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/bookings")}
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Torna
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Condividi
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 md:p-8">
        <div className="max-w-2xl w-full text-center">
          {/* Success Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Prenotazione confermata</span>
            </div>
          </div>

          {/* Instructions */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mostra questo QR code in negozio
          </h1>
          <p className="text-green-100 text-lg mb-8">
            Presenta il codice al momento del deposito e del ritiro
          </p>

          {/* QR Code */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl mb-8 inline-block">
            <div id="qr-code">
              <QRCode
                value={booking.id}
                size={256}
                level="H"
                fgColor="#1E3A8A"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-left">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-green-100 mb-1">Deposito</div>
                  <div className="font-semibold text-lg">{location?.address}</div>
                  <div className="text-green-100">{location?.city}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-green-100 mb-1">Deposito</div>
                  <div className="font-semibold">
                    {new Date(booking.dropoff_ts).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div className="text-green-100 flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    {new Date(booking.dropoff_ts).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-green-100 mb-1">Ritiro</div>
                  <div className="font-semibold">
                    {new Date(booking.pickup_ts).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div className="text-green-100 flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    {new Date(booking.pickup_ts).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Bagagli</span>
                  <span className="font-semibold text-lg">{booking.bags}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-green-100 text-sm">
            Assicurati di avere una connessione internet attiva per visualizzare il QR code
          </p>
        </div>
      </div>
    </div>
  );
}
