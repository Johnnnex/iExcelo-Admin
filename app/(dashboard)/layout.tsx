"use client";

import { useState } from "react";
import { AdminSidebar } from "@/src/components/organisms";
import { AdminHeader } from "@/src/components/organisms";
import { useAdminAuthStore } from "@/src/store";

// Auth is gated by proxy.ts — this layout only needs to hydrate the Zustand store
// before rendering, so client state (permissions, user) is available to components.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated } = useAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#007FFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="flex h-screen bg-white">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
          {children}
        </main>
      </div>
    </section>
  );
}
