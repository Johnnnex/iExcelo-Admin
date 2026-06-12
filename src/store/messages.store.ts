"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminMessageFlag, FlagStatus } from "@/src/types";

interface MessagesState {
  flags: IAdminMessageFlag[];
  total: number;
  page: number;
  loadingFlags: boolean;
  statusFilter: FlagStatus | "";
  search: string;
  actingId: string | null;

  setStatusFilter: (status: FlagStatus | "") => void;
  setPage: (page: number) => void;
  setSearch: (s: string) => void;
  fetchFlags: () => Promise<void>;
  reviewFlag: (id: string, adminNotes?: string) => Promise<void>;
  dismissFlag: (id: string, adminNotes?: string) => Promise<void>;
  suspendUser: (userId: string, suspendedUntil: string, onSuccess?: () => void) => Promise<void>;
}

const LIMIT = 50;

export const useAdminMessagesStore = create<MessagesState>()((set, get) => ({
  flags: [],
  total: 0,
  page: 1,
  loadingFlags: false,
  statusFilter: "",
  search: "",
  actingId: null,

  setStatusFilter: (status) => {
    set({ statusFilter: status, page: 1 });
    void get().fetchFlags();
  },

  setPage: (page) => {
    set({ page });
    void get().fetchFlags();
  },

  setSearch: (s) => {
    set({ search: s, page: 1 });
    void get().fetchFlags();
  },

  fetchFlags: async () => {
    const { page, statusFilter, search } = get();
    set({ loadingFlags: true });
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get<{
        data: { items: IAdminMessageFlag[]; total: number };
      }>("/admin/messages/flags", { params });
      const { items, total } = res.data.data;
      set({ flags: items, total });
    } catch (error) {
      handleAxiosError(error, "Failed to load flagged messages");
    } finally {
      set({ loadingFlags: false });
    }
  },

  reviewFlag: async (id, adminNotes) => {
    set({ actingId: id });
    try {
      await api.patch(`/admin/messages/flags/${id}/review`, { adminNotes });
      toast.success("Flag marked as reviewed");
      set((s) => ({
        flags: s.flags.map((f) =>
          f.id === id ? { ...f, status: "reviewed" as FlagStatus } : f,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to review flag");
    } finally {
      set({ actingId: null });
    }
  },

  dismissFlag: async (id, adminNotes) => {
    set({ actingId: id });
    try {
      await api.patch(`/admin/messages/flags/${id}/dismiss`, { adminNotes });
      toast.success("Flag dismissed");
      set((s) => ({
        flags: s.flags.map((f) =>
          f.id === id ? { ...f, status: "dismissed" as FlagStatus } : f,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to dismiss flag");
    } finally {
      set({ actingId: null });
    }
  },

  suspendUser: async (userId, suspendedUntil, onSuccess) => {
    try {
      await api.patch(`/admin/messages/users/${userId}/suspend`, {
        suspendedUntil,
      });
      toast.success("User suspended");
      onSuccess?.();
    } catch (error) {
      handleAxiosError(error, "Failed to suspend user");
    }
  },
}));
