"use client";

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Location, City, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, TrendingUp, Users, Sparkles, Shield, CheckCircle, Search, Briefcase, LogIn, Luggage, Home, Clock, Zap, Heart, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice, calculateDistance } from "@/lib/utils";
import { LocationCardSkeleton, MapSkeleton } from "@/components/loading-skeletons";
import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { UserMenu } from "@/components/user-menu";

// Lazy load componenti pesanti
const BookingModal = dynamic(
  () => import("@/components/booking-modal").then(mod => ({ default: mod.BookingModal })),
  { ssr: false, loading: () => null }
);

// Cache delle librerie Google Maps (importante: deve essere fuori dal componente!)
const libraries: ("places")[] = ["places"];

// Animazioni semplificate per performance
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
const slideUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const cityCoords: Record<City, { lat: number; lng: number }> = {
  Milano: { lat: 45.4642, lng: 9.1900 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
};


// Memoize Supabase client
const getSupabase = () => createClient();

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<City | "">("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 45.4642, lng: 9.1900 });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const router = useRouter();
  
  // Carica Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries,
  });

  // Mostra pagina subito
  useEffect(() => {
    setPageReady(true);
  }, []);

  // Check utente in background (non blocca il render)
  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          // Fetch profilo in parallelo (role + nome)
          supabase
            .from("profiles")
            .select("role, full_name")
            .eq("user_id", user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile?.role) {
                setUserRole(profile.role as UserRole);
              }
              if (profile?.full_name) {
                setUserName(profile.full_name);
              }
            });
        }
      } catch (e) {
        // Silently fail - user not logged in
      }
    };
    checkUser();
  }, []);

  // Geolocalizzazione in background
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      // Usa timeout basso per non rallentare
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {}, // Ignora errori silenziosamente
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 } // Cache 5 minuti
      );
    }
  }, []);

  // Carica locations quando cambia città
  useEffect(() => {
    if (selectedCity) {
      setMapCenter(cityCoords[selectedCity]);
      loadLocations(selectedCity);
    }
  }, [selectedCity]);

  // Memoize loadLocations per evitare ricreazioni
  const loadLocations = useCallback(async (city: City) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("city", city)
        .eq("active", true)
        .eq("approved", true)
        .limit(6);

      if (!error && data) {
        const sorted = data.map((loc) => {
          const distance = userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
            : Infinity;
          return { ...loc, distance };
        }).sort((a, b) => a.distance - b.distance);
        setLocations(sorted);
      }
    } catch (e) {
      console.error("Error loading locations:", e);
    }
    setLoading(false);
  }, [userLocation]);

  // Memoize featured locations
  const featuredLocations = useMemo(() => locations.slice(0, 3), [locations]);

  // Memoize map options per evitare re-render
  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#1f2937" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#d1d5db" }] },
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d1d5db" }, { weight: 1.5 }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#9ca3af" }, { weight: 2.5 }] },
    ]
  }), []);

  // Loading iniziale ultra-rapido
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-brand-navy mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" prefetch={true}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Briefcase className="h-6 w-6 text-brand-navy" />
                  <h1 className="text-2xl font-bold text-brand-navy">BagDrop.it</h1>
                </motion.div>
              </Link>
              <nav className="flex items-center gap-3 md:gap-4">
                {/* Cerca Depositi - sempre visibile */}
                <Link 
                  href="/" 
                  className="hidden md:flex bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-navy-dark transition-colors items-center gap-2 shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  Cerca Depositi
                </Link>
                
                {/* Diventa Host - solo se non loggato o se è traveler */}
                {(!user || userRole === 'traveler') && (
                  <Link 
                    href={user ? "/become-host" : "/login?next=/become-host"}
                    prefetch={true}
                    className="bg-brand-orange text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-brand-orange-light transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Diventa Host</span>
                    <span className="sm:hidden">Host</span>
                  </Link>
                )}
                
                {/* User Menu o Login */}
                {user ? (
                  <UserMenu user={user} userRole={userRole} userName={userName} />
                ) : (
                  <Link 
                    href="/login" 
                    prefetch={true}
                    className="text-sm text-gray-700 hover:text-brand-navy transition-colors font-medium flex items-center gap-2 border border-gray-300 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        {!selectedCity ? <> 
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy-light text-white animate-fade-in">
            {/* Static Background Elements - più leggeri */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Static gradient circles */}
              <div className="absolute top-20 left-10 w-72 h-72 bg-brand-orange/15 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brand-orange/10 to-blue-500/10 rounded-full blur-3xl" />
              
              {/* Static decorative icons */}
              <div className="absolute top-32 right-[15%] text-white/10">
                <Luggage className="h-16 w-16" />
              </div>
              <div className="absolute bottom-32 left-[10%] text-white/10">
                <Briefcase className="h-20 w-20" />
              </div>
              <div className="absolute top-1/2 right-[5%] text-white/5">
                <MapPin className="h-24 w-24" />
              </div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <span className="text-sm font-medium">Oltre 10.000 viaggiatori soddisfatti</span>
                </div>
              </motion.div>

              {/* Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center mb-6"
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  <span className="block">Viaggia leggero,</span>
                  <span className="block mt-2">
                    deposita da{" "}
                    <motion.span 
                      className="relative inline-block"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="relative z-10 text-brand-orange">3,50€</span>
                      <motion.span
                        className="absolute -inset-2 bg-brand-orange/20 rounded-lg -z-0"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.span>
                  </span>
                </h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl lg:text-2xl text-blue-100/90 mb-8 max-w-3xl mx-auto leading-relaxed"
                >
                  Il modo più semplice per depositare i tuoi bagagli nelle 
                  <span className="text-white font-semibold"> migliori città italiane</span>.
                  Sicuro, assicurato e a portata di click.
                </motion.p>
              </motion.div>

              {/* City Search - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="max-w-2xl mx-auto mb-12"
              >
                <div className="relative">
                  {/* Glow effect behind search box */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange via-white/50 to-blue-400 rounded-3xl blur-lg opacity-30" />
                  
                  <div className="relative bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-gray-100 rounded-xl hover:border-brand-navy/30 transition-all focus-within:border-brand-navy/50 focus-within:shadow-lg">
                      <Search className="h-5 w-5 text-brand-navy flex-shrink-0" />
                      <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v as City)}>
                        <SelectTrigger className="border-0 focus:ring-0 text-left w-full text-base font-medium">
                          <SelectValue placeholder="🌍 Dove vuoi depositare i tuoi bagagli?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Milano">📍 Milano - Centro, Stazione</SelectItem>
                          <SelectItem value="Firenze">📍 Firenze - Santa Maria Novella</SelectItem>
                          <SelectItem value="Bologna">📍 Bologna - Centro Storico</SelectItem>
                          <SelectItem value="Roma">📍 Roma - Termini, Vaticano</SelectItem>
                          <SelectItem value="Napoli">📍 Napoli - Centro, Porto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => selectedCity && loadLocations(selectedCity)}
                        disabled={!selectedCity}
                        className="w-full sm:w-auto bg-gradient-to-r from-brand-orange to-orange-500 hover:from-brand-orange-light hover:to-orange-400 text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-brand-orange/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        <Search className="h-5 w-5" />
                        Trova Deposito
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Quick city buttons */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-2 mt-4"
                >
                  <span className="text-blue-200/70 text-sm">Città popolari:</span>
                  {(['Milano', 'Roma', 'Firenze'] as City[]).map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1 rounded-full transition-all border border-white/20 hover:border-white/40"
                    >
                      {city}
                    </button>
                  ))}
                </motion.div>
              </motion.div>

              {/* Trust Bar - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { value: "10k+", label: "Bagagli depositati", icon: Luggage },
                    { value: "500€", label: "Assicurazione inclusa", icon: Shield },
                    { value: "4.9", label: "Valutazione media", icon: Star, isStar: true },
                    { value: "24/7", label: "Supporto clienti", icon: Clock },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl group-hover:bg-white/10 transition-all" />
                      <div className="relative bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:border-white/30 transition-all">
                        <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.isStar ? 'fill-yellow-400 text-yellow-400' : 'text-brand-orange'}`} />
                        <div className="text-2xl md:text-3xl font-bold mb-1 flex items-center justify-center gap-1">
                          {stat.value}
                          {stat.isStar && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <div className="text-blue-100/80 text-sm">{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex justify-center mt-12"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-white/50 flex flex-col items-center gap-2"
                >
                  <span className="text-xs">Scopri di più</span>
                  <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <motion.div
                      animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-white/70 rounded-full"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

{/* Service Features Section */}
<section className="bg-white py-16 md:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-4 py-2 rounded-full mb-4">
        <Sparkles className="h-5 w-5 text-brand-orange" />
        <span className="text-brand-orange font-semibold text-sm">Il futuro del deposito bagagli</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Perché migliaia di viaggiatori
        <br />
        <span className="text-brand-orange">scelgono BagDrop.it?</span>
      </h2>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Non è solo deposito bagagli. È libertà di esplorare senza zavorre.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Feature 1 - Velocità */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-brand-orange/5 to-brand-orange/10 rounded-2xl p-8 border border-brand-orange/20 hover:border-brand-orange/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl group-hover:bg-brand-orange/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-brand-orange rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">3 click, zero stress</h3>
          <p className="text-gray-600 leading-relaxed">
            Prenota in meno di 60 secondi. Scegli città, deposito e paga. Fine.
          </p>
        </div>
      </motion.div>

      {/* Feature 2 - Sicurezza */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-blue-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">500€ assicurati</h3>
          <p className="text-gray-600 leading-relaxed">
            Ogni bagaglio è protetto automaticamente. Depositi verificati e recensiti.
          </p>
        </div>
      </motion.div>

      {/* Feature 3 - Ubicazione */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-purple-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Vicino a tutto</h3>
          <p className="text-gray-600 leading-relaxed">
            Stazioni, aeroporti, centri storici. I depositi migliori sono sempre a portata di mano.
          </p>
        </div>
      </motion.div>

      {/* Feature 4 - Prezzo */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-yellow-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Da 3,50€</h3>
          <p className="text-gray-600 leading-relaxed">
            Prezzi chiari, zero sorprese. Il miglior rapporto qualità-prezzo sul mercato.
          </p>
        </div>
      </motion.div>

      {/* Feature 5 - Community */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-pink-500/5 to-pink-500/10 rounded-2xl p-8 border border-pink-500/20 hover:border-pink-500/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-pink-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">10k+ viaggiatori</h3>
          <p className="text-gray-600 leading-relaxed">
            Unisciti alla community di viaggiatori che hanno scelto la libertà.
          </p>
        </div>
      </motion.div>

      {/* Feature 6 - Semplicità */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="group relative bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-colors" />
        <div className="relative z-10">
          <div className="bg-green-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">QR code istantaneo</h3>
          <p className="text-gray-600 leading-relaxed">
            Ricevi il QR code subito dopo il pagamento. Mostralo e ritira i bagagli.
          </p>
        </div>
      </motion.div>
    </div>

    {/* CTA Section */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.7 }}
      className="mt-16 bg-gradient-to-r from-brand-orange to-brand-orange-light rounded-3xl p-8 md:p-12 text-center shadow-2xl"
    >
      <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
        Pronto a viaggiare leggero?
      </h3>
      <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
        Scegli la tua città e trova il deposito perfetto in pochi secondi
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v as City)}>
          <SelectTrigger className="bg-white text-brand-navy border-0 w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold">
            <SelectValue placeholder="Scegli la città" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Milano">📍 Milano</SelectItem>
            <SelectItem value="Firenze">📍 Firenze</SelectItem>
            <SelectItem value="Bologna">📍 Bologna</SelectItem>
            <SelectItem value="Roma">📍 Roma</SelectItem>
            <SelectItem value="Napoli">📍 Napoli</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => selectedCity && loadLocations(selectedCity)}
          disabled={!selectedCity}
          className="bg-white text-brand-orange hover:bg-white/90 px-8 py-3 h-12 text-base font-bold transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Cerca Ora
        </Button>
      </div>
    </motion.div>
  </div>
</section>

</> : (
          <div className="bg-brand-navy text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Deposito bagagli a {selectedCity}
                  </h2>
                  <p className="text-blue-100">
                    {locations.length} depositi disponibili • Da {locations[0] ? formatPrice(locations[0].price_per_bag) : "3,50€"}/bag
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCity("");
                    setLocations([]);
                  }}
                  className="hidden md:flex border-white text-white bg-transparent hover:bg-white/10 transition-transform hover:scale-105"
                >
                  Cambia città
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedCity && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                {loading ? (
                  <MapSkeleton />
                ) : !isLoaded ? (
                  <MapSkeleton />
                ) : (
                  <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-[500px] md:h-[600px] rounded-xl overflow-hidden border-2 border-gray-300 shadow-xl bg-gray-50"
                >
                  <GoogleMap
                    zoom={13}
                    center={mapCenter}
                    mapContainerClassName="w-full h-full"
                    options={mapOptions}
                  >
                      {locations.map((loc, index) => (
                        <Marker
                          key={loc.id}
                          position={{ lat: loc.lat, lng: loc.lng }}
                          icon={{
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
                                <defs>
                                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
                                  </filter>
                                  <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#EA580C;stop-opacity:1" />
                                  </linearGradient>
                                </defs>
                                <!-- Pin shape -->
                                <path d="M24 0C12.954 0 4 8.954 4 20c0 14.5 20 38 20 38s20-23.5 20-38C44 8.954 35.046 0 24 0z" 
                                      fill="url(#pinGradient)" 
                                      stroke="white" 
                                      stroke-width="3"
                                      filter="url(#shadow)"/>
                                <!-- Luggage icon inside -->
                                <rect x="15" y="12" width="18" height="16" rx="2" fill="white"/>
                                <rect x="19" y="9" width="10" height="4" rx="1" fill="white"/>
                                <line x1="21" y1="16" x2="21" y2="24" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
                                <line x1="27" y1="16" x2="27" y2="24" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
                                <!-- Price badge -->
                                <circle cx="38" cy="10" r="9" fill="#1E3A8A" stroke="white" stroke-width="2"/>
                                <text x="38" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">€</text>
                              </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(48, 60),
                            anchor: new google.maps.Point(24, 60),
                          }}
                          animation={google.maps.Animation.DROP}
                          onClick={() => setSelectedLocation(loc)}
                        />
                      ))}
                    </GoogleMap>
                  </motion.div>
                )}
              </div>

              {/* Location Cards */}
              <div className="order-1 lg:order-2 space-y-4">
                {loading ? (
                  <>
                    <LocationCardSkeleton />
                    <LocationCardSkeleton />
                    <LocationCardSkeleton />
                  </>
                ) : locations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl p-6">
                    Nessun deposito disponibile
                  </div>
                ) : (
                  <div className="space-y-4">
                  {locations.map((loc, index) => (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer group p-5"
                      onClick={() => setSelectedLocation(loc)}
                    >
                      {/* Content */}
                      <div>
                        <h3 className="font-bold text-xl mb-3 text-gray-900">{loc.address}</h3>
                        <div className="flex items-center gap-4 mb-4">
                          {loc.distance && loc.distance !== Infinity && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {loc.distance >= 1000 
                                  ? `${(loc.distance / 1000).toFixed(1)} km da te` 
                                  : `${Math.round(loc.distance)}m da te`
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-900">4.9</span>
                            <span className="text-gray-500">(127)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div>
                            <div className="text-2xl font-bold text-brand-navy">
                              {formatPrice(loc.price_per_bag)}
                            </div>
                            <div className="text-xs text-gray-500">per bagaglio</div>
                          </div>
                          <Button className="bg-brand-orange hover:bg-brand-orange-light text-white transition-transform hover:scale-105">
                            Prenota
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Featured Locations (when no city selected) */}
        {!selectedCity && featuredLocations.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Depositi consigliati</h2>
              <p className="text-gray-600">Le migliori location nelle principali città</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredLocations.map((loc, index) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  viewport={{ once: true }}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 transition-transform hover:scale-105 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-gray-200"
                  onClick={() => {
                    setSelectedCity(loc.city);
                    setSelectedLocation(loc);
                  }}
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {loc.photos && loc.photos.length > 0 ? (
                      <img
                        src={loc.photos[0]}
                        alt={loc.address}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2">{loc.address}</h3>
                    <p className="text-sm text-gray-600 mb-3">{loc.city}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-brand-navy">
                        {formatPrice(loc.price_per_bag)}/bag
                      </div>
                      <Button className="bg-brand-orange hover:bg-brand-orange-light text-white">
                        Prenota
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Booking Modal */}
        {selectedLocation && (
          <BookingModal
            location={selectedLocation}
            open={!!selectedLocation}
            onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
