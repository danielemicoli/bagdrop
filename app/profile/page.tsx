"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, UserRole } from "@/lib/types";
import { 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  Home
} from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    full_name: "",
    phone: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
      
      setLoading(false);
    };
    
    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Salvato!",
        description: "Il tuo profilo è stato aggiornato.",
      });
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Briefcase className="h-6 w-6 text-brand-navy" />
              <span className="text-xl font-bold text-brand-navy hidden sm:inline">BagDrop.it</span>
            </Link>
            
            <h1 className="text-lg md:text-xl font-bold text-brand-navy">Il tuo Profilo</h1>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-navy transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Homepage</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brand-navy to-brand-navy-dark p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {profile.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {profile.full_name || "Completa il profilo"}
                </h2>
                <p className="text-blue-100">{user?.email}</p>
                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                  profile.role === 'host' 
                    ? 'bg-brand-orange text-white' 
                    : 'bg-white/20 text-white'
                }`}>
                  {profile.role === 'host' ? '🏠 Host' : '🎒 Viaggiatore'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Nome completo
              </label>
              <Input
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Mario Rossi"
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="h-12 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Telefono
              </label>
              <Input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+39 333 1234567"
                className="h-12"
              />
            </div>

            <div className="pt-4 flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Indietro
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-brand-navy hover:bg-brand-navy-dark text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva modifiche
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Upgrade to Host */}
          {profile.role === 'traveler' && (
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Diventa Host</h3>
                  <p className="text-sm text-gray-600">Inizia a guadagnare con i tuoi spazi</p>
                </div>
                <Link
                  href="/become-host"
                  className="bg-brand-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-orange-light transition-colors"
                >
                  Scopri come →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
