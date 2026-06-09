"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/src/store";

interface AdminProfileDropdownProps {
  name: string;
  email: string;
  initials: string;
}

export function AdminProfileDropdown({ name, email, initials }: AdminProfileDropdownProps) {
  const router = useRouter();
  const { logout, isSuper } = useAdminAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
          <div className="px-4 pb-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{email}</p>
            {isSuper && (
              <span className="inline-block mt-1 text-xs text-[#007FFF] font-semibold">Super Admin</span>
            )}
          </div>

          <div className="border-t border-gray-100 pt-2">
            <button
              className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <Icon
                icon={isLoggingOut ? "svg-spinners:ring-resize" : "hugeicons:logout-02"}
                className="w-5 h-5"
              />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
