"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminSponsorListItem } from "@/src/types";

interface SponsorsState {
  sponsors: IAdminSponsorListItem[];
  cursors: (string | null)[];
  cursorPage: number;
  hasMore: boolean;
  loadingSponsors: boolean;
  searchTerm: string;

  setSearchTerm: (term: string) => void;
  fetchSponsors: (page?: number) => Promise<void>;
  sendResetLink: (userId: string) => Promise<void>;
  deactivateSponsor: (userId: string) => Promise<void>;
  reactivateSponsor: (userId: string) => Promise<void>;
}

export const useAdminSponsorsStore = create<SponsorsState>()((set, get) => ({
  sponsors: [],
  cursors: [null],
  cursorPage: 1,
  hasMore: false,
  loadingSponsors: false,
  searchTerm: "",

  setSearchTerm: (term) =>
    set({ searchTerm: term, cursors: [null], cursorPage: 1 }),

  fetchSponsors: async (page = 1) => {
    set({ loadingSponsors: true });
    try {
      const { searchTerm, cursors } = get();
      const params = new URLSearchParams({ limit: "50" });
      const cursor = cursors[page - 1];
      if (cursor) params.set("cursor", cursor);
      if (searchTerm) params.set("search", searchTerm);

      const res = await api.get<{
        data: {
          items: IAdminSponsorListItem[];
          nextCursor: string | null;
          hasMore: boolean;
        };
      }>(`/admin/sponsors?${params.toString()}`);

      const { items, nextCursor, hasMore } = res.data.data;

      set((s) => {
        const newCursors = [...s.cursors];
        if (nextCursor && newCursors.length <= page) {
          newCursors.push(nextCursor);
        }
        return {
          sponsors: items,
          hasMore,
          cursors: newCursors,
          cursorPage: page,
        };
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load sponsors");
    } finally {
      set({ loadingSponsors: false });
    }
  },

  sendResetLink: async (userId) => {
    try {
      await api.patch(`/admin/sponsors/${userId}/send-reset-link`);
      toast.success("Password reset email sent to sponsor");
    } catch (error) {
      handleAxiosError(error, "Failed to send password reset email");
    }
  },

  deactivateSponsor: async (userId) => {
    try {
      await api.patch(`/admin/sponsors/${userId}/deactivate`);
      toast.success("Sponsor deactivated");
      set((s) => ({
        sponsors: s.sponsors.map((sp) =>
          sp.userId === userId
            ? { ...sp, user: { ...sp.user, isActive: false } }
            : sp,
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
          sp.userId === userId
            ? { ...sp, user: { ...sp.user, isActive: true } }
            : sp,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to reactivate sponsor");
    }
  },
}));
