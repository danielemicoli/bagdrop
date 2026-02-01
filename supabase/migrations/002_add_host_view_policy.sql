-- Migration 002: Add missing policy for hosts to view their own locations
-- This allows hosts to see their locations even if they're not approved yet

-- Drop policy if it exists (safe to run multiple times)
DROP POLICY IF EXISTS "Hosts can view their own locations" ON locations;

-- Create the policy: hosts can view ALL their own locations (approved or not)
CREATE POLICY "Hosts can view their own locations"
  ON locations FOR SELECT
  USING (auth.uid() = host_id);
