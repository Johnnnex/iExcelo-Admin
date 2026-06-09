"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminSponsorListItem } from "@/src/types";

interface SponsorsState {
  sponsors: IAdminSponsorListItem[];
  sponsorsTotal: number;
  sponsorsPage: number;
  loadingSponsors: boolean;
  searchTerm: string;

  setSearchTerm: (term: string) => void;
  fetchSponsors: (page?: number) => Promise<void>;
  deactivateSponsor: (userId: string) => Promise<void>;
  reactivateSponsor: (userId: string) => Promise<void>;
}

export const useAdminSponsorsStore = create<SponsorsState>()((set, get) => ({
  sponsors: [],
  sponsorsTotal: 0,
  sponsorsPage: 1,
  loadingSponsors: false,
  searchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchSponsors: async (page = 1) => {
    set({ loadingSponsors: true, sponsorsPage: page });
    try {
      const { searchTerm } = get();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await api.get<{
        data: { items: IAdminSponsorListItem[]; total: number; page: number };
      }>(`/admin/sponsors?${params.toString()}`);
      set({
        sponsors: res.data.data.items,
        sponsorsTotal: res.data.data.total,
        sponsorsPage: res.data.data.page,
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load sponsors");
    } finally {
      set({ loadingSponsors: false });
    }
  },

  deactivateSponsor: async (userId) => {
    try {
      await api.patch(`/admin/sponsors/${userId}/deactivate`);
      toast.success("Sponsor deactivated");
      set((s) => ({
        sponsors: s.sponsors.map((sp) =>
          sp.userId === userId ? { ...sp, user: { ...sp.user, isActive: false } } : sp,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to deactivate sponsor");
    }
  },

  reactivateSponsor: async (userId) => {
    try {
      await api.patch(`/admin/sponsors/${userId}/reactivate`);
      toast.success("Sponsor reactivated");
      set((s) => ({
        sponsors: s.sponsors.map((sp) =>
          sp.userId === userId ? { ...sp, user: { ...sp.user, isActive: true } } : sp,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to reactivate sponsor");
    }
  },
}));
