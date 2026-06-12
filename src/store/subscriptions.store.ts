"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminSubscription, IAdminSubscriptionPlan } from "@/src/types";

interface TabState {
  items: IAdminSubscription[];
  cursors: (string | null)[];
  cursorPage: number;
  hasMore: boolean;
  loading: boolean;
  searchTerm: string;
}

const defaultTabState = (): TabState => ({
  items: [],
  cursors: [null],
  cursorPage: 1,
  hasMore: false,
  loading: false,
  searchTerm: "",
});

interface SubscriptionsState {
  studentSubs: TabState;
  sponsorSubs: TabState;

  plans: IAdminSubscriptionPlan[];
  loadingPlans: boolean;
  savingPlan: boolean;

  setStudentSearch: (term: string) => void;
  fetchStudentSubs: (page?: number) => Promise<void>;

  setSponsorSearch: (term: string) => void;
  fetchSponsorSubs: (page?: number) => Promise<void>;

  cancelSubscription: (id: string, type: "student" | "sponsor") => Promise<void>;

  fetchPlans: () => Promise<void>;
  createPlan: (data: {
    examTypeId: string;
    name: string;
    description?: string;
    durationDays: number;
    sortOrder?: number;
    stripeProductId?: string;
  }) => Promise<void>;
  updatePlan: (
    id: string,
    data: {
      name?: string;
      description?: string;
      durationDays?: number;
      sortOrder?: number;
      stripeProductId?: string;
      isActive?: boolean;
    },
  ) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export const useAdminSubscriptionsStore = create<SubscriptionsState>()(
  (set, get) => ({
    studentSubs: defaultTabState(),
    sponsorSubs: defaultTabState(),
    plans: [],
    loadingPlans: false,
    savingPlan: false,

    // ─── Student Subs ──────────────────────────────────────────────────────

    setStudentSearch: (term) =>
      set((s) => ({
        studentSubs: {
          ...s.studentSubs,
          searchTerm: term,
          cursors: [null],
          cursorPage: 1,
        },
      })),

    fetchStudentSubs: async (page = 1) => {
      set((s) => ({ studentSubs: { ...s.studentSubs, loading: true } }));
      try {
        const { studentSubs } = get();
        const params = new URLSearchParams({ limit: "50", type: "student" });
        const cursor = studentSubs.cursors[page - 1];
        if (cursor) params.set("cursor", cursor);
        if (studentSubs.searchTerm) params.set("search", studentSubs.searchTerm);

        const res = await api.get<{
          data: { items: IAdminSubscription[]; nextCursor: string | null; hasMore: boolean };
        }>(`/admin/subscriptions?${params.toString()}`);

        const { items, nextCursor, hasMore } = res.data.data;

        set((s) => {
          const newCursors = [...s.studentSubs.cursors];
          if (nextCursor && newCursors.length <= page) newCursors.push(nextCursor);
          return {
            studentSubs: {
              ...s.studentSubs,
              items,
              hasMore,
              cursors: newCursors,
              cursorPage: page,
              loading: false,
            },
          };
        });
      } catch (error) {
        handleAxiosError(error, "Failed to load student subscriptions");
        set((s) => ({ studentSubs: { ...s.studentSubs, loading: false } }));
      }
    },

    // ─── Sponsor Subs ──────────────────────────────────────────────────────

    setSponsorSearch: (term) =>
      set((s) => ({
        sponsorSubs: {
          ...s.sponsorSubs,
          searchTerm: term,
          cursors: [null],
          cursorPage: 1,
        },
      })),

    fetchSponsorSubs: async (page = 1) => {
      set((s) => ({ sponsorSubs: { ...s.sponsorSubs, loading: true } }));
      try {
        const { sponsorSubs } = get();
        const params = new URLSearchParams({ limit: "50", type: "sponsor" });
        const cursor = sponsorSubs.cursors[page - 1];
        if (cursor) params.set("cursor", cursor);
        if (sponsorSubs.searchTerm) params.set("search", sponsorSubs.searchTerm);

        const res = await api.get<{
          data: { items: IAdminSubscription[]; nextCursor: string | null; hasMore: boolean };
        }>(`/admin/subscriptions?${params.toString()}`);

        const { items, nextCursor, hasMore } = res.data.data;

        set((s) => {
          const newCursors = [...s.sponsorSubs.cursors];
          if (nextCursor && newCursors.length <= page) newCursors.push(nextCursor);
          return {
            sponsorSubs: {
              ...s.sponsorSubs,
              items,
              hasMore,
              cursors: newCursors,
              cursorPage: page,
              loading: false,
            },
          };
        });
      } catch (error) {
        handleAxiosError(error, "Failed to load sponsor subscriptions");
        set((s) => ({ sponsorSubs: { ...s.sponsorSubs, loading: false } }));
      }
    },

    // ─── Cancel ────────────────────────────────────────────────────────────

    cancelSubscription: async (id, type) => {
      try {
        await api.patch(`/admin/subscriptions/${id}/cancel`);
        toast.success("Subscription cancelled");
        const key = type === "student" ? "studentSubs" : "sponsorSubs";
        set((s) => ({
          [key]: {
            ...s[key],
            items: (s[key] as TabState).items.map((sub) =>
              sub.id === id
                ? { ...sub, status: "cancelled", cancelledAt: new Date().toISOString() }
                : sub,
            ),
          },
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to cancel subscription");
      }
    },

    // ─── Plans ─────────────────────────────────────────────────────────────

    fetchPlans: async () => {
      set({ loadingPlans: true });
      try {
        const res = await api.get<{ data: IAdminSubscriptionPlan[] }>(
          "/admin/subscriptions/plans",
        );
        set({ plans: res.data.data });
      } catch (error) {
        handleAxiosError(error, "Failed to load plans");
      } finally {
        set({ loadingPlans: false });
      }
    },

    createPlan: async (data) => {
      set({ savingPlan: true });
      try {
        const res = await api.post<{ data: IAdminSubscriptionPlan }>(
          "/admin/subscriptions/plans",
          data,
        );
        toast.success("Plan created");
        set((s) => ({ plans: [...s.plans, res.data.data] }));
      } catch (error) {
        handleAxiosError(error, "Failed to create plan");
        throw error;
      } finally {
        set({ savingPlan: false });
      }
    },

    updatePlan: async (id, data) => {
      set({ savingPlan: true });
      try {
        const res = await api.patch<{ data: IAdminSubscriptionPlan }>(
          `/admin/subscriptions/plans/${id}`,
          data,
        );
        toast.success("Plan updated");
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? res.data.data : p)),
        }));
      } catch (error) {
        handleAxiosError(error, "Failed to update plan");
        throw error;
      } finally {
        set({ savingPlan: false });
      }
    },

    deletePlan: async (id) => {
      try {
        await api.delete(`/admin/subscriptions/plans/${id}`);
        toast.success("Plan deleted");
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
      } catch (error) {
        handleAxiosError(error, "Failed to delete plan");
        throw error;
      }
    },
  }),
);
