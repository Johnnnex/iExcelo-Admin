"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminAffiliateListItem, IAffiliatePayout } from "@/src/types";

interface AffiliatesState {
  affiliates: IAdminAffiliateListItem[];
  cursors: (string | null)[];
  cursorPage: number;
  hasMore: boolean;
  loadingAffiliates: boolean;
  searchTerm: string;
  userTypeFilter: string;

  payouts: IAffiliatePayout[];
  payoutsTotal: number;
  loadingPayouts: boolean;

  allPayouts: IAffiliatePayout[];
  allPayoutsTotal: number;
  allPayoutsPage: number;
  loadingAllPayouts: boolean;

  setSearchTerm: (term: string) => void;
  setUserTypeFilter: (type: string) => void;
  fetchAffiliates: (page?: number) => Promise<void>;
  deactivateAffiliate: (userId: string) => Promise<void>;
  reactivateAffiliate: (userId: string) => Promise<void>;
  fetchPayouts: (affiliateId: string, page?: number) => Promise<void>;
  fetchAllPayouts: (page?: number, status?: string) => Promise<void>;
  approvePayout: (payoutId: string) => Promise<void>;
  rejectPayout: (payoutId: string, reason: string) => Promise<void>;
}

export const useAdminAffiliatesStore = create<AffiliatesState>()(
  (set, get) => ({
    affiliates: [],
    cursors: [null],
    cursorPage: 1,
    hasMore: false,
    loadingAffiliates: false,
    searchTerm: "",
    userTypeFilter: "",

    payouts: [],
    payoutsTotal: 0,
    loadingPayouts: false,

    allPayouts: [],
    allPayoutsTotal: 0,
    allPayoutsPage: 1,
    loadingAllPayouts: false,

    setSearchTerm: (term) =>
      set({ searchTerm: term, cursors: [null], cursorPage: 1 }),

    setUserTypeFilter: (type) =>
      set({ userTypeFilter: type, cursors: [null], cursorPage: 1 }),

    fetchAffiliates: async (page = 1) => {
      set({ loadingAffiliates: true });
      try {
        const { searchTerm, userTypeFilter, cursors } = get();
        const params = new URLSearchParams({ limit: "50" });
        const cursor = cursors[page - 1];
        if (cursor) params.set("cursor", cursor);
        if (searchTerm) params.set("search", searchTerm);
        if (userTypeFilter) params.set("userType", userTypeFilter);

        const res = await api.get<{
          data: {
            items: IAdminAffiliateListItem[];
            nextCursor: string | null;
            hasMore: boolean;
          };
        }>(`/admin/affiliates?${params.toString()}`);

        const { items, nextCursor, hasMore } = res.data.data;

        set((s) => {
          const newCursors = [...s.cursors];
          if (nextCursor && newCursors.length <= page) {
            newCursors.push(nextCursor);
          }
          return {
            affiliates: items,
            hasMore,
            cursors: newCursors,
            cursorPage: page,
          };
        });
      } catch (error) {
        handleAxiosError(error, "Failed to load affiliates");
      } finally {
        set({ loadingAffiliates: false });
      }
    },

    deactivateAffiliate: async (userId) => {
      try {
        await api.patch(`/admin/affiliates/${userId}/deactivate`);
        toast.success("Affiliate deactivated");
        set((s) => ({
          affiliates: s.affiliates.map((a) =>
            a.userId === userId
              ? { ...a, user: { ...a.user, isActive: false } }
              : a,
          ),
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to deactivate affiliate");
      }
    },

    reactivateAffiliate: async (userId) => {
      try {
        await api.patch(`/admin/affiliates/${userId}/reactivate`);
        toast.success("Affiliate reactivated");
        set((s) => ({
          affiliates: s.affiliates.map((a) =>
            a.userId === userId
              ? { ...a, user: { ...a.user, isActive: true } }
              : a,
          ),
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to reactivate affiliate");
      }
    },

    fetchPayouts: async (affiliateId, page = 1) => {
      set({ loadingPayouts: true });
      try {
        const res = await api.get<{
          data: { items: IAffiliatePayout[]; total: number };
        }>(`/admin/affiliates/${affiliateId}/payouts?page=${page}&limit=20`);
        set({
          payouts: res.data.data.items,
          payoutsTotal: res.data.data.total,
        });
      } catch (error) {
        handleAxiosError(error, "Failed to load payouts");
      } finally {
        set({ loadingPayouts: false });
      }
    },

    fetchAllPayouts: async (page = 1, status?: string) => {
      set({ loadingAllPayouts: true });
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (status) params.set("status", status);
        const res = await api.get<{
          data: { items: IAffiliatePayout[]; total: number; page: number };
        }>(`/admin/affiliates/payouts?${params.toString()}`);
        set({
          allPayouts: res.data.data.items,
          allPayoutsTotal: res.data.data.total,
          allPayoutsPage: res.data.data.page,
        });
      } catch (error) {
        handleAxiosError(error, "Failed to load payouts");
      } finally {
        set({ loadingAllPayouts: false });
      }
    },

    approvePayout: async (payoutId) => {
      try {
        await api.patch(`/admin/affiliates/payouts/${payoutId}/approve`);
        toast.success("Payout approved");
        set((s) => ({
          payouts: s.payouts.map((p) =>
            p.id === payoutId ? { ...p, status: "completed" as const } : p,
          ),
          allPayouts: s.allPayouts.map((p) =>
            p.id === payoutId ? { ...p, status: "completed" as const } : p,
          ),
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to approve payout");
      }
    },

    rejectPayout: async (payoutId, reason) => {
      try {
        await api.patch(`/admin/affiliates/payouts/${payoutId}/reject`, {
          reason,
        });
        toast.success("Payout rejected");
        set((s) => ({
          payouts: s.payouts.map((p) =>
            p.id === payoutId
              ? { ...p, status: "failed" as const, failureReason: reason }
              : p,
          ),
          allPayouts: s.allPayouts.map((p) =>
            p.id === payoutId
              ? { ...p, status: "failed" as const, failureReason: reason }
              : p,
          ),
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to reject payout");
      }
    },
  }),
);
