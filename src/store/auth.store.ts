"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import {
  IAdminUser,
  IAdminProfile,
  ModulePermissionsMap,
} from "@/src/types";

interface AdminAuthState {
  accessToken: string | null;
  user: IAdminUser | null;
  isSuper: boolean;
  modulePermissions: ModulePermissionsMap;
  isAuthenticated: boolean;
  hydrated: boolean;

  setHydrated: () => void;
  login: (
    email: string,
    password: string,
    onSuccess: () => void,
  ) => Promise<void>;
  logout: () => void;
  clearAuth: () => void;
  canRead: (module: string) => boolean;
  canWrite: (module: string) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isSuper: false,
      modulePermissions: {},
      isAuthenticated: false,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      login: async (email, password, onSuccess) => {
        try {
          // Use the BFF route so the httpOnly cookie is set on this domain.
          const res = await api.post<{
            data: {
              accessToken: string;
              user: IAdminUser;
              adminProfile: IAdminProfile;
            };
          }>("/api/admin/auth/login", { email, password }, {
            baseURL: typeof window !== "undefined" ? window.location.origin : "",
          });

          const { accessToken, user, adminProfile } = res.data.data;

          set({
            accessToken,
            user,
            isSuper: adminProfile.isSuper,
            modulePermissions: adminProfile.modulePermissions,
            isAuthenticated: true,
          });

          toast.success("Welcome back!");
          onSuccess();
        } catch (error) {
          handleAxiosError(error, "Login failed. Please check your credentials.");
        }
      },

      logout: () => {
        set({
          accessToken: null,
          user: null,
          isSuper: false,
          modulePermissions: {},
          isAuthenticated: false,
        });
        // Clear the httpOnly cookie via BFF, then redirect.
        void fetch("/api/admin/auth/logout", { method: "POST" }).finally(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        });
      },

      clearAuth: () => {
        set({
          accessToken: null,
          user: null,
          isSuper: false,
          modulePermissions: {},
          isAuthenticated: false,
        });
      },

      canRead: (module) => {
        const { isSuper, modulePermissions } = get();
        if (isSuper) return true;
        return modulePermissions[module as keyof typeof modulePermissions]?.canRead ?? false;
      },

      canWrite: (module) => {
        const { isSuper, modulePermissions } = get();
        if (isSuper) return true;
        return modulePermissions[module as keyof typeof modulePermissions]?.canWrite ?? false;
      },
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage),
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
