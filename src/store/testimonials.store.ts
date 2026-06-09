"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminTestimonial } from "@/src/types";

export interface TestimonialFormData {
  name: string;
  role?: string | null;
  content: string;
  rating: number;
  userId?: string | null;
}

interface TestimonialsState {
  testimonials: IAdminTestimonial[];
  loadingTestimonials: boolean;

  fetchTestimonials: () => Promise<void>;
  createTestimonial: (data: TestimonialFormData, onSuccess: () => void) => Promise<void>;
  updateTestimonial: (id: string, data: Partial<TestimonialFormData>, onSuccess: () => void) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  togglePublish: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

export const useAdminTestimonialsStore = create<TestimonialsState>()((set, get) => ({
  testimonials: [],
  loadingTestimonials: false,

  fetchTestimonials: async () => {
    set({ loadingTestimonials: true });
    try {
      const res = await api.get<{ data: IAdminTestimonial[] }>("/admin/testimonials");
      set({ testimonials: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load testimonials");
    } finally {
      set({ loadingTestimonials: false });
    }
  },

  createTestimonial: async (data, onSuccess) => {
    try {
      await api.post("/admin/testimonials", data);
      toast.success("Testimonial created");
      onSuccess();
      void get().fetchTestimonials();
    } catch (error) {
      handleAxiosError(error, "Failed to create testimonial");
    }
  },

  updateTestimonial: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/testimonials/${id}`, data);
      toast.success("Testimonial updated");
      onSuccess();
      void get().fetchTestimonials();
    } catch (error) {
      handleAxiosError(error, "Failed to update testimonial");
    }
  },

  deleteTestimonial: async (id) => {
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success("Testimonial deleted");
      set((s) => ({
        testimonials: s.testimonials.filter((t) => t.id !== id),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete testimonial");
    }
  },

  togglePublish: async (id) => {
    try {
      const res = await api.patch<{ data: IAdminTestimonial }>(
        `/admin/testimonials/${id}/toggle-publish`,
      );
      const updated = res.data.data;
      toast.success(updated.isPublished ? "Published" : "Unpublished");
      set((s) => ({
        testimonials: s.testimonials.map((t) =>
          t.id === id ? { ...t, isPublished: updated.isPublished } : t,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to toggle publish");
    }
  },

  reorder: async (orderedIds) => {
    // Optimistically update displayOrder in local state
    set((s) => ({
      testimonials: orderedIds
        .map((id, index) => {
          const t = s.testimonials.find((t) => t.id === id);
          return t ? { ...t, displayOrder: index } : null;
        })
        .filter(Boolean) as IAdminTestimonial[],
    }));
    try {
      await api.patch("/admin/testimonials/reorder", { orderedIds });
    } catch (error) {
      handleAxiosError(error, "Failed to reorder");
      void get().fetchTestimonials(); // revert
    }
  },
}));
