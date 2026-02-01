export type City = 'Milano' | 'Firenze' | 'Bologna' | 'Roma' | 'Napoli';

export type UserRole = 'host' | 'traveler';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  host_id: string;
  city: City;
  address: string;
  lat: number;
  lng: number;
  price_per_bag: number;
  max_bags: number;
  hours: {
    [key: string]: { open: string; close: string };
  };
  photos: string[];
  ai_desc: {
    it: string;
    en: string;
    fr: string;
    de: string;
    es: string;
  };
  active: boolean;
  created_at: string;
  approved?: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  location_id: string;
  dropoff_ts: string;
  pickup_ts: string;
  bags: number;
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  qr_url: string | null;
  review: string | null;
  ins_opt: boolean;
  created_at: string;
  location?: Location;
}
