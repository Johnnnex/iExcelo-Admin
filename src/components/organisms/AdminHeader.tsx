"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useAdminAuthStore } from "@/src/store";
import { AdminProfileDropdown } from "./AdminProfileDropdown";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAdminAuthStore();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifPanel) return;
    const handle = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotifPanel]);

  const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
  const email = user?.email || "";
  const initials = user?.firstName ? user.firstName[0] : "A";

  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-gray-600">
          <Icon icon="hugeicons:menu-02" className="w-6 h-6" />
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <Icon icon="hugeicons:search-01" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div ref={bellRef} className="relative flex items-center justify-center">
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            className="relative text-gray-500 hover:text-gray-700"
          >
            <Icon icon="hugeicons:notification-01" className="w-6 h-6" color="#141B34" />
          </button>
        </div>

        <AdminProfileDropdown name={name} email={email} initials={initials} />
      </div>
    </header>
  );
}
