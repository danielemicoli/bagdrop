"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// Questa pagina ora fa redirect a /become-host
export default function HostPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Utente loggato → vai a become-host
        router.replace("/become-host");
      } else {
        // Non loggato → vai a login con redirect a become-host
        router.replace("/login?next=/become-host");
      }
    };
    
    checkAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy-light flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p>Reindirizzamento...</p>
      </div>
    </div>
  );
}
