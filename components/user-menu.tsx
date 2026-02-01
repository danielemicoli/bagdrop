"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/types";
import { User, LogOut, LayoutDashboard, ChevronDown, UserCircle } from "lucide-react";

interface UserMenuProps {
  user: any;
  userRole: UserRole | null;
  userName?: string | null;
}

export function UserMenu({ user, userRole, userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Chiudi menu quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  // Mostra nome o email
  const displayName = userName || user?.email?.split("@")[0] || "Utente";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
      >
        <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-sm font-semibold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:inline font-medium max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-scale-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              userRole === 'host' 
                ? 'bg-brand-orange/10 text-brand-orange' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {userRole === 'host' ? 'Host' : 'Viaggiatore'}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="h-5 w-5 text-gray-400" />
              Il tuo profilo
            </Link>

            {userRole === 'host' && (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-gray-400" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
