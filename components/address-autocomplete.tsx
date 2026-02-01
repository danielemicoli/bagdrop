"use client";

import { useEffect, useRef, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  city: string;
  disabled?: boolean;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  city,
  disabled = false,
  placeholder = "Inserisci indirizzo...",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || !city) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "it" },
        fields: ["formatted_address", "geometry"],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          // Estrai le coordinate direttamente dall'autocomplete
          const coordinates = place.geometry?.location ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          } : undefined;
          
          onChange(place.formatted_address, coordinates);
          setShowSuggestions(false);
        }
      });

      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }
  }, [isLoaded, city, disabled, onChange]);

  if (!isLoaded) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
