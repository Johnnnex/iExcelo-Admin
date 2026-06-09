"use client";

import { create } from "zustand";
import { authRequest } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";

const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024;

interface AdminUtilsState {
  isUploadingImage: boolean;
  uploadImage: (file: File, folder: string) => Promise<string | null>;
}

export const useAdminUtilsStore = create<AdminUtilsState>((set) => ({
  isUploadingImage: false,

  uploadImage: async (file, folder) => {
    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      toast.error("Image must be under 10 MB");
      return null;
    }
    set({ isUploadingImage: true });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await authRequest<{ data: { url: string } }>({
        method: "POST",
        url: `/upload/image?folder=${folder}`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data.url;
    } catch (error) {
      handleAxiosError(error, "Image upload failed");
      return null;
    } finally {
      set({ isUploadingImage: false });
    }
  },
}));
