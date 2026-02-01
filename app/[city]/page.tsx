"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { Location, City } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";
import { MapPin, Star, Filter, X } from "lucide-react";
import { formatPrice, calculateDistance } from "@/lib/utils";
import { LocationCardSkeleton, MapSkeleton } from "@/components/loading-skeletons";
// ErrorBoundary removed - Next.js has built-in error boundaries

const libraries: ("places")[] = ["places"];

const cityCoords: Record<City, { lat: number; lng: number }> = {
  Milano: { lat: 45.4642, lng: 9.1900 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
};

export default function CityPage() {
  const params = useParams();
  const router = useRouter();
  const cityParam = params.city as string;
  const city = cityParam.charAt(0).toUpperCase() + cityParam.slice(1) as City;

  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: "",
    minRating: "",
    sortBy: "distance",
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (city && Object.keys(cityCoords).includes(city)) {
      loadLocations();
    } else {
      router.push("/");
    }
  }, [city]);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, locations]);

  const loadLocations = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("city", city)
      .eq("active", true)
      .eq("approved", true);

    if (!error && data) {
      const sorted = data.map((loc) => {
        const distance = userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
          : Infinity;
        return { ...loc, distance };
      }).sort((a, b) => a.distance - b.distance);
      setLocations(sorted);
      setFilteredLocations(sorted);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...locations];

    if (filters.maxPrice) {
      filtered = filtered.filter((loc) => loc.price_per_bag <= parseFloat(filters.maxPrice));
    }

    if (filters.sortBy === "price") {
      filtered.sort((a, b) => a.price_per_bag - b.price_per_bag);
    } else if (filters.sortBy === "distance") {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setFilteredLocations(filtered);
  };

  if (!city || !Object.keys(cityCoords).includes(city)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="text-gray-700"
                >
                  ← Torna
                </Button>
                <h1 className="text-xl font-bold text-brand-navy">
                  Deposito bagagli {city}
                </h1>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtri
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-b border-gray-200 p-4"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prezzo massimo</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="€"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ordina per</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="distance">Distanza</option>
                    <option value="price">Prezzo</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ maxPrice: "", minRating: "", sortBy: "distance" });
                      setShowFilters(false);
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
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
                  className="h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-xl"
                >
                  <GoogleMap
                    zoom={13}
                    center={cityCoords[city]}
                    mapContainerClassName="w-full h-full"
                  >
                    {filteredLocations.map((loc) => (
                      <Marker
                        key={loc.id}
                        position={{ lat: loc.lat, lng: loc.lng }}
                        icon={{
                          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                          fillColor: "#1E3A8A",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                          scale: 1.5,
                        }}
                        onClick={() => setSelectedLocation(loc)}
                      />
                    ))}
                  </GoogleMap>
                </motion.div>
              )}
            </div>

            {/* Location Cards */}
            <div className="order-1 lg:order-2">
              <div className="mb-4 text-sm text-gray-600">
                {filteredLocations.length} depositi trovati
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <>
                    <LocationCardSkeleton />
                    <LocationCardSkeleton />
                    <LocationCardSkeleton />
                  </>
                ) : filteredLocations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl p-6">
                    Nessun deposito trovato
                  </div>
                ) : (
                  filteredLocations.map((loc) => (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                        {loc.photos && loc.photos.length > 0 ? (
                          <img
                            src={loc.photos[0]}
                            alt={loc.address}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{loc.address}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          {loc.distance ? (
                            <span>{Math.round(loc.distance)}m</span>
                          ) : (
                            <span>{loc.city}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-brand-navy">
                              {formatPrice(loc.price_per_bag)}
                            </div>
                            <div className="text-xs text-gray-500">per bagaglio</div>
                          </div>
                          <Button className="bg-brand-orange hover:bg-brand-orange-light text-white">
                            Prenota
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

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
