import { createClient } from "@/lib/supabase/client";

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

/**
 * Recupera il profilo dell'utente corrente
 * @returns Il profilo utente o null se non autenticato
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  if (error || !profile) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return profile as UserProfile;
}

/**
 * Verifica se l'utente corrente è un host
 * @returns true se l'utente è un host, false altrimenti
 */
export async function isUserHost(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === 'host';
}

/**
 * Verifica se l'utente corrente è un viaggiatore
 * @returns true se l'utente è un viaggiatore, false altrimenti
 */
export async function isUserTraveler(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === 'traveler';
}

/**
 * Hook-friendly function per ottenere ruolo e profilo
 * Da usare in useEffect
 */
export async function checkUserRole(): Promise<{
  isAuthenticated: boolean;
  role: UserRole | null;
  profile: UserProfile | null;
}> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { isAuthenticated: false, role: null, profile: null };
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  return {
    isAuthenticated: true,
    role: profile?.role || null,
    profile: profile as UserProfile | null
  };
}
