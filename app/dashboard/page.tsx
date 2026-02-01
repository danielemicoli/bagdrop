"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { City, Location } from "@/lib/types";
import { Upload, MapPin, DollarSign, Calendar, TrendingUp, CheckCircle, Clock, X, CreditCard, Briefcase, Home, LogOut, User } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatsCardSkeleton } from "@/components/loading-skeletons";
import { AddressAutocomplete } from "@/components/address-autocomplete";
// ErrorBoundary removed - Next.js has built-in error boundaries

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    city: "" as City | "",
    address: "",
    price_per_bag: "",
    max_bags: "",
    hours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { open: "09:00", close: "18:00" },
    },
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      setLoading(false);
      
      // Carica i dati solo dopo che l'utente è verificato
      await loadLocations();
      await loadBookings();
    };
    init();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const loadLocations = async () => {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }
    
    if (!user) {
      console.log("No user found");
      return;
    }

    console.log("Loading locations for user:", user.id);

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading locations:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Errore",
        description: `Impossibile caricare le location: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    console.log("Locations loaded:", data?.length || 0, data);
    if (data) {
      setLocations(data);
    } else {
      setLocations([]);
    }
  };

  const loadBookings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Prima carica gli ID delle location dell'host
    const { data: hostLocations } = await supabase
      .from("locations")
      .select("id")
      .eq("host_id", user.id);

    if (!hostLocations || hostLocations.length === 0) {
      setBookings([]);
      return;
    }

    // Poi carica le prenotazioni per quelle location
    const locationIds = hostLocations.map((loc) => loc.id);
    const { data } = await supabase
      .from("bookings")
      .select("*, location:locations(*)")
      .in("location_id", locationIds)
      .order("created_at", { ascending: false });

    if (data) setBookings(data);
  };

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [locations, user]);

  // Ricarica le location quando l'utente cambia
  useEffect(() => {
    if (user && !loading) {
      loadLocations();
    }
  }, [user, loading]);

  const handleGeocode = async (address: string, city: City) => {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, city }),
    });
    const data = await res.json();
    
    if (data.error && !data.lat) {
      throw new Error(data.error);
    }
    
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Usa le coordinate dall'autocomplete se disponibili, altrimenti fai geocoding
      let lat: number, lng: number, fallback = false;
      
      if (addressCoordinates) {
        // Usa le coordinate dall'autocomplete (più precise)
        lat = addressCoordinates.lat;
        lng = addressCoordinates.lng;
        console.log("Using coordinates from autocomplete:", lat, lng);
      } else {
        // Fallback: geocoding dell'indirizzo
        const geocodeResult = await handleGeocode(formData.address, formData.city);
        
        if (geocodeResult.error && !geocodeResult.lat) {
          throw new Error(geocodeResult.error);
        }
        
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;
        fallback = geocodeResult.fallback || false;
        
        if (fallback) {
          toast({
            title: "Attenzione",
            description: "Geocoding non disponibile. Usate coordinate di default per la città.",
            variant: "default",
          });
        }
      }

      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `${user.id}/${Date.now()}-${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("locations")
          .upload(fileName, photo);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("locations")
            .getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const aiRes = await fetch("/api/ai-desc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: formData.address, photos: photoUrls }),
      });
      const aiDesc = await aiRes.json();

      const { error } = await supabase.from("locations").insert({
        host_id: user.id,
        city: formData.city,
        address: formData.address,
        lat,
        lng,
        price_per_bag: parseFloat(formData.price_per_bag),
        max_bags: parseInt(formData.max_bags),
        hours: formData.hours,
        photos: photoUrls,
        ai_desc: aiDesc,
        active: true,
        approved: false,
      });

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Location creata! In attesa di approvazione.",
      });

      setFormData({
        city: "" as City | "",
        address: "",
        price_per_bag: "",
        max_bags: "",
        hours: {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" },
        },
      });
      setPhotos([]);
      setAddressCoordinates(null);
      setShowForm(false);
      
      // Ricarica le location immediatamente dopo la creazione
      await loadLocations();
      await loadBookings();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  // Calculate stats
  const totalRevenue = bookings
    .filter((b) => b.status === "paid" || b.status === "completed")
    .reduce((sum, b) => sum + parseFloat(b.total || 0), 0);
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const activeLocations = locations.filter((l) => l.approved && l.active).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" prefetch={true} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Briefcase className="h-6 w-6 text-brand-navy" />
                <span className="text-xl font-bold text-brand-navy hidden sm:inline">BagDrop.it</span>
              </Link>
              
              {/* Center - Page Title */}
              <h1 className="text-lg md:text-xl font-bold text-brand-navy">Dashboard Host</h1>
              
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
                <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 border-l border-gray-200">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline truncate max-w-[150px]">{user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await createClient().auth.signOut();
                    router.push("/");
                  }}
                  className="transition-transform hover:scale-105 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analytics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Guadagni totali</p>
                <p className="text-2xl font-bold text-brand-navy">{formatPrice(totalRevenue)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Prenotazioni attive</p>
                <p className="text-2xl font-bold text-brand-navy">{pendingBookings}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Location attive</p>
                <p className="text-2xl font-bold text-brand-navy">{activeLocations}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-brand-orange" />
              </div>
            </div>
          </div>
          </motion.div>

          {/* Payout Button */}
          {totalRevenue > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-brand-navy to-brand-navy-dark rounded-xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-1">Disponibile per il prelievo</p>
                    <p className="text-3xl font-bold">{formatPrice(totalRevenue)}</p>
                  </div>
                  <Button
                    className="bg-white text-brand-navy hover:bg-blue-50 transition-transform hover:scale-105"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Richiedi pagamento
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex gap-4"
          >
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-brand-orange hover:bg-brand-orange-light text-white"
            >
              {showForm ? "Annulla" : "+ Nuova Location"}
            </Button>
          </motion.div>

        {/* New Location Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-brand-navy mb-6">Crea nuova location</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Città *</label>
                  <Select
                    value={formData.city}
                    onValueChange={(v) => {
                      setFormData({ 
                        ...formData, 
                        city: v as City,
                        // Reset altri campi quando cambia città
                        address: "",
                      });
                      setAddressCoordinates(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona città prima" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Milano">Milano</SelectItem>
                      <SelectItem value="Firenze">Firenze</SelectItem>
                      <SelectItem value="Bologna">Bologna</SelectItem>
                      <SelectItem value="Roma">Roma</SelectItem>
                      <SelectItem value="Napoli">Napoli</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Seleziona la città per abilitare gli altri campi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Indirizzo *</label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(address, coordinates) => {
                      setFormData({ ...formData, address });
                      setAddressCoordinates(coordinates || null);
                    }}
                    city={formData.city}
                    disabled={!formData.city}
                    placeholder={formData.city ? "Inizia a digitare l'indirizzo..." : "Seleziona prima la città"}
                  />
                  {addressCoordinates && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Coordinate precise dall'autocomplete
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Prezzo per bagaglio (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_bag}
                    onChange={(e) => setFormData({ ...formData, price_per_bag: e.target.value })}
                    disabled={!formData.city}
                    placeholder="es. 3.50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Massimo bagagli *</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_bags}
                    onChange={(e) => setFormData({ ...formData, max_bags: e.target.value })}
                    disabled={!formData.city}
                    placeholder="es. 5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Foto</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting || !formData.city || !formData.address} 
                className="w-full md:w-auto bg-brand-orange hover:bg-brand-orange-light text-white"
              >
                {submitting ? "Caricamento..." : "Crea Location"}
              </Button>
              {(!formData.city || !formData.address) && (
                <p className="text-sm text-gray-500">
                  Compila città e indirizzo per continuare
                </p>
              )}
            </form>
          </div>
        )}

        {/* Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-navy">Le tue location</h2>
            <Button
              variant="outline"
              onClick={loadLocations}
              className="text-sm"
            >
              Aggiorna
            </Button>
          </div>
          <div className="divide-y divide-gray-200">
            {locations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nessuna location creata
              </div>
            ) : (
              locations.map((loc) => (
                <div key={loc.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{loc.address}</h3>
                      <p className="text-sm text-gray-600 mb-2">{loc.city}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          {formatPrice(loc.price_per_bag)}/bag • Max {loc.max_bags} bagagli
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {loc.approved ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Approvata
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          In attesa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-brand-navy">Prenotazioni</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bagagli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nessuna prenotazione
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(booking.created_at).toLocaleDateString("it-IT")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {(booking.location as any)?.address || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.bags}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatPrice(booking.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.status === "paid" ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Pagato
                          </span>
                        ) : booking.status === "completed" ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Completato
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            In attesa
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
