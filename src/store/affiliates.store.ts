"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminAffiliateListItem, IAffiliatePayout } from "@/src/types";

interface AffiliatesState {
  affiliates: IAdminAffiliateListItem[];
  affiliatesTotal: number;
  affiliatesPage: number;
  loadingAffiliates: boolean;
  searchTerm: string;

  payouts: IAffiliatePayout[];
  payoutsTotal: number;
  loadingPayouts: boolean;

  setSearchTerm: (term: string) => void;
  fetchAffiliates: (page?: number) => Promise<void>;
  deactivateAffiliate: (userId: string) => Promise<void>;
  reactivateAffiliate: (userId: string) => Promise<void>;
  fetchPayouts: (affiliateId: string, page?: number) => Promise<void>;
  approvePayout: (payoutId: string) => Promise<void>;
  rejectPayout: (payoutId: string, reason: string) => Promise<void>;
}

export const useAdminAffiliatesStore = create<AffiliatesState>()((set, get) => ({
  affiliates: [],
  affiliatesTotal: 0,
  affiliatesPage: 1,
  loadingAffiliates: false,
  searchTerm: "",

  payouts: [],
  payoutsTotal: 0,
  loadingPayouts: false,

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchAffiliates: async (page = 1) => {
    set({ loadingAffiliates: true, affiliatesPage: page });
    try {
      const { searchTerm } = get();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await api.get<{
        data: { items: IAdminAffiliateListItem[]; total: number; page: number };
      }>(`/admin/affiliates?${params.toString()}`);
      set({
        affiliates: res.data.data.items,
        affiliatesTotal: res.data.data.total,
        affiliatesPage: res.data.data.page,
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
          a.userId === userId ? { ...a, user: { ...a.user, isActive: false } } : a,
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
          a.userId === userId ? { ...a, user: { ...a.user, isActive: true } } : a,
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

  approvePayout: async (payoutId) => {
    try {
      await api.patch(`/admin/affiliates/payouts/${payoutId}/approve`);
      toast.success("Payout approved");
      set((s) => ({
        payouts: s.payouts.map((p) =>
          p.id === payoutId ? { ...p, status: "completed" as const } : p,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to approve payout");
    }
  },

  rejectPayout: async (payoutId, reason) => {
    try {
      await api.patch(`/admin/affiliates/payouts/${payoutId}/reject`, { reason });
      toast.success("Payout rejected");
      set((s) => ({
        payouts: s.payouts.map((p) =>
          p.id === payoutId ? { ...p, status: "failed" as const, failureReason: reason } : p,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to reject payout");
    }
  },
}));
