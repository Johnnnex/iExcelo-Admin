"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminCampaign, CampaignTargetAudience } from "@/src/types";

export interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
  targetAudience: CampaignTargetAudience;
}

interface BulkEmailsState {
  campaigns: IAdminCampaign[];
  loadingCampaigns: boolean;
  sending: Record<string, boolean>;

  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: CampaignFormData, onSuccess: () => void) => Promise<void>;
  updateCampaign: (id: string, data: Partial<CampaignFormData>, onSuccess: () => void) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
}

export const useAdminBulkEmailsStore = create<BulkEmailsState>()((set, get) => ({
  campaigns: [],
  loadingCampaigns: false,
  sending: {},

  fetchCampaigns: async () => {
    set({ loadingCampaigns: true });
    try {
      const res = await api.get<{ data: IAdminCampaign[] }>("/admin/bulk-emails");
      set({ campaigns: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load campaigns");
    } finally {
      set({ loadingCampaigns: false });
    }
  },

  createCampaign: async (data, onSuccess) => {
    try {
      await api.post("/admin/bulk-emails", data);
      toast.success("Campaign created");
      onSuccess();
      void get().fetchCampaigns();
    } catch (error) {
      handleAxiosError(error, "Failed to create campaign");
    }
  },

  updateCampaign: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/bulk-emails/${id}`, data);
      toast.success("Campaign updated");
      onSuccess();
      void get().fetchCampaigns();
    } catch (error) {
      handleAxiosError(error, "Failed to update campaign");
    }
  },

  deleteCampaign: async (id) => {
    try {
      await api.delete(`/admin/bulk-emails/${id}`);
      toast.success("Campaign deleted");
      set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete campaign");
    }
  },

  sendCampaign: async (id) => {
    set((s) => ({ sending: { ...s.sending, [id]: true } }));
    try {
      const res = await api.post<{ data: { recipientCount: number } }>(
        `/admin/bulk-emails/${id}/send`,
      );
      const count = res.data.data.recipientCount;
      toast.success(`Campaign sent to ${count} recipient${count !== 1 ? "s" : ""}`);
      void get().fetchCampaigns();
    } catch (error) {
      handleAxiosError(error, "Failed to send campaign");
    } finally {
      set((s) => {
        const sending = { ...s.sending };
        delete sending[id];
        return { sending };
      });
    }
  },
}));
