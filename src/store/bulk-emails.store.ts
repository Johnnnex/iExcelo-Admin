"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminCampaign, CampaignCategory } from "@/src/types";

export interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
  category: CampaignCategory;
  targetAudiences: string[];
}

interface BulkEmailsState {
  campaigns: IAdminCampaign[];
  loadingCampaigns: boolean;
  savingCampaign: boolean;
  sending: Record<string, boolean>;

  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: CampaignFormData) => Promise<boolean>;
  updateCampaign: (
    id: string,
    data: Partial<CampaignFormData>,
  ) => Promise<boolean>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<void>;
}

export const useAdminBulkEmailsStore = create<BulkEmailsState>()(
  (set, get) => ({
    campaigns: [],
    loadingCampaigns: false,
    savingCampaign: false,
    sending: {},

    fetchCampaigns: async () => {
      set({ loadingCampaigns: true });
      try {
        const res = await api.get<{ data: IAdminCampaign[] }>(
          "/admin/bulk-emails",
        );
        set({ campaigns: res.data.data });
      } catch (error) {
        handleAxiosError(error, "Failed to load campaigns");
      } finally {
        set({ loadingCampaigns: false });
      }
    },

    createCampaign: async (data) => {
      set({ savingCampaign: true });
      try {
        const res = await api.post<{ data: IAdminCampaign }>(
          "/admin/bulk-emails",
          data,
        );
        toast.success("Campaign created");
        set((s) => ({ campaigns: [...s.campaigns, res.data.data] }));
        return true;
      } catch (error) {
        handleAxiosError(error, "Failed to create campaign");
        return false;
      } finally {
        set({ savingCampaign: false });
      }
    },

    updateCampaign: async (id, data) => {
      set({ savingCampaign: true });
      try {
        const res = await api.patch<{ data: IAdminCampaign }>(
          `/admin/bulk-emails/${id}`,
          data,
        );
        toast.success("Campaign updated");
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === id ? res.data.data : c)),
        }));
        return true;
      } catch (error) {
        handleAxiosError(error, "Failed to update campaign");
        return false;
      } finally {
        set({ savingCampaign: false });
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
        toast.success(
          `Campaign sent to ${count} recipient${count !== 1 ? "s" : ""}`,
        );
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
  }),
);
