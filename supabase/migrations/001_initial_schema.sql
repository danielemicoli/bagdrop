-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT CHECK (city IN ('Milano','Firenze','Bologna','Roma','Napoli')),
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  price_per_bag DECIMAL(4,2) NOT NULL,
  max_bags INT NOT NULL,
  hours JSONB NOT NULL,
  photos TEXT[] DEFAULT '{}',
  ai_desc JSONB,
  active BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  dropoff_ts TIMESTAMPTZ NOT NULL,
  pickup_ts TIMESTAMPTZ NOT NULL,
  bags INT NOT NULL,
  total DECIMAL(6,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','completed','cancelled')),
  qr_url TEXT,
  review TEXT,
  ins_opt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_active ON locations(active);
CREATE INDEX idx_locations_approved ON locations(approved);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_location_id ON bookings(location_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for locations
CREATE POLICY "Locations are viewable by everyone"
  ON locations FOR SELECT
  USING (active = true AND approved = true);

CREATE POLICY "Hosts can view their own locations"
  ON locations FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert their own locations"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own locations"
  ON locations FOR UPDATE
  USING (auth.uid() = host_id);

-- Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);
