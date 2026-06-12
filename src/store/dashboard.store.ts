"use client";

import { create } from "zustand";
import { authRequest } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { IPlatformStats, IRegistrationPoint } from "@/src/types";

interface DashboardState {
  stats: IPlatformStats | null;
  registrations: IRegistrationPoint[];
  totalExams: number;
  examsCompleted: number;
  granularity: "day" | "week" | "month";
  loading: boolean;

  setGranularity: (g: "day" | "week" | "month") => void;
  fetchStats: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  fetchExamCounts: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  stats: null,
  registrations: [],
  totalExams: 0,
  examsCompleted: 0,
  granularity: "day",
  loading: false,

  setGranularity: (g) => {
    set({ granularity: g });
    void get().fetchRegistrations();
  },

  fetchStats: async () => {
    try {
      const res = await authRequest<{ data: IPlatformStats }>({
        method: "GET",
        url: "/admin/dashboard/stats",
      });
      set({ stats: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load platform stats");
    }
  },

  fetchRegistrations: async () => {
    try {
      const { granularity } = get();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await authRequest<{ data: IRegistrationPoint[] }>({
        method: "GET",
        url: `/admin/dashboard/registrations?granularity=${granularity}&timezone=${tz}`,
      });
      set({ registrations: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load registration data");
    }
  },

  fetchExamCounts: async () => {
    // These will be wired to actual endpoints later; placeholder for now
    set({ totalExams: 0, examsCompleted: 0 });
  },
}));
