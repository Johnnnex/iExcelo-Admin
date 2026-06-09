"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminSubscription, IExamType } from "@/src/types";

interface SubscriptionsState {
  subscriptions: IAdminSubscription[];
  subscriptionsTotal: number;
  subscriptionsPage: number;
  loadingSubscriptions: boolean;

  examTypes: IExamType[];
  loadingExamTypes: boolean;

  filters: {
    status: string;
    examTypeId: string;
    search: string;
  };

  setFilters: (f: Partial<SubscriptionsState["filters"]>) => void;
  fetchSubscriptions: (page?: number) => Promise<void>;
  fetchExamTypes: () => Promise<void>;
  overrideStatus: (id: string, status: string, endDate?: string) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
}

export const useAdminSubscriptionsStore = create<SubscriptionsState>()((set, get) => ({
  subscriptions: [],
  subscriptionsTotal: 0,
  subscriptionsPage: 1,
  loadingSubscriptions: false,

  examTypes: [],
  loadingExamTypes: false,

  filters: { status: "", examTypeId: "", search: "" },

  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f } })),

  fetchSubscriptions: async (page = 1) => {
    set({ loadingSubscriptions: true, subscriptionsPage: page });
    try {
      const { filters } = get();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filters.status) params.set("status", filters.status);
      if (filters.examTypeId) params.set("examTypeId", filters.examTypeId);
      if (filters.search) params.set("search", filters.search);

      const res = await api.get<{
        data: { items: IAdminSubscription[]; total: number; page: number };
      }>(`/admin/subscriptions?${params.toString()}`);
      set({
        subscriptions: res.data.data.items,
        subscriptionsTotal: res.data.data.total,
        subscriptionsPage: res.data.data.page,
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load subscriptions");
    } finally {
      set({ loadingSubscriptions: false });
    }
  },

  fetchExamTypes: async () => {
    set({ loadingExamTypes: true });
    try {
      const res = await api.get<{ data: IExamType[] }>(
        "/admin/exam-revision/exam-types",
      );
      set({ examTypes: res.data.data });
    } catch {
      // non-critical — filter just won't have exam type options
    } finally {
      set({ loadingExamTypes: false });
    }
  },

  overrideStatus: async (id, status, endDate) => {
    try {
      await api.patch(`/admin/subscriptions/${id}/status`, {
        status,
        ...(endDate && { endDate }),
      });
      toast.success("Subscription status updated");
      set((s) => ({
        subscriptions: s.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, status } : sub,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to update status");
    }
  },

  cancelSubscription: async (id) => {
    try {
      await api.patch(`/admin/subscriptions/${id}/cancel`);
      toast.success("Subscription cancelled");
      set((s) => ({
        subscriptions: s.subscriptions.map((sub) =>
          sub.id === id
            ? { ...sub, status: "cancelled", cancelledAt: new Date().toISOString() }
            : sub,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to cancel subscription");
    }
  },
}));
