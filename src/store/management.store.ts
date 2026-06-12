"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminListItem, IAdminRole, ModulePermissionsMap } from "@/src/types";

interface ManagementState {
  admins: IAdminListItem[];
  roles: IAdminRole[];
  total: number;
  page: number;
  loadingAdmins: boolean;
  loadingRoles: boolean;
  adminsSearch: string;
  rolesSearch: string;
  setAdminsSearch: (s: string) => void;
  setRolesSearch: (s: string) => void;

  fetchAdmins: (page?: number) => Promise<void>;
  inviteAdmin: (
    data: {
      email: string;
      firstName: string;
      lastName: string;
      roleId?: string | null;
      modulePermissions: ModulePermissionsMap;
    },
    onSuccess: () => void,
  ) => Promise<void>;
  updatePermissions: (
    adminId: string,
    modulePermissions: ModulePermissionsMap,
    onSuccess: () => void,
  ) => Promise<void>;
  deactivateAdmin: (adminId: string) => Promise<void>;
  reactivateAdmin: (adminId: string) => Promise<void>;

  fetchRoles: () => Promise<void>;
  createRole: (
    data: { name: string; description?: string | null; modules: ModulePermissionsMap },
    onSuccess: () => void,
  ) => Promise<void>;
  updateRole: (
    id: string,
    data: { name?: string; description?: string | null; modules?: ModulePermissionsMap },
    onSuccess: () => void,
  ) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
}

export const useManagementStore = create<ManagementState>()((set, get) => ({
  admins: [],
  roles: [],
  total: 0,
  page: 1,
  loadingAdmins: false,
  loadingRoles: false,
  adminsSearch: "",
  rolesSearch: "",

  setAdminsSearch: (s) => set({ adminsSearch: s }),
  setRolesSearch: (s) => set({ rolesSearch: s }),

  fetchAdmins: async (page = 1) => {
    set({ loadingAdmins: true });
    try {
      const { adminsSearch } = get();
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (adminsSearch) params.set("search", adminsSearch);
      const res = await api.get<{
        data: { items: IAdminListItem[]; total: number; page: number };
      }>(`/admin/management?${params}`);
      set({
        admins: res.data.data.items,
        total: res.data.data.total,
        page: res.data.data.page,
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load admins");
    } finally {
      set({ loadingAdmins: false });
    }
  },

  inviteAdmin: async (data, onSuccess) => {
    try {
      await api.post("/admin/management/invite", data);
      toast.success("Invite sent successfully");
      onSuccess();
      void get().fetchAdmins(get().page);
    } catch (error) {
      handleAxiosError(error, "Failed to send invite");
    }
  },

  updatePermissions: async (adminId, modulePermissions, onSuccess) => {
    try {
      await api.patch(`/admin/management/${adminId}/permissions`, {
        modulePermissions,
      });
      toast.success("Permissions updated");
      onSuccess();
      void get().fetchAdmins(get().page);
    } catch (error) {
      handleAxiosError(error, "Failed to update permissions");
    }
  },

  deactivateAdmin: async (adminId) => {
    try {
      await api.patch(`/admin/management/${adminId}/deactivate`);
      toast.success("Admin deactivated");
      set((s) => ({
        admins: s.admins.map((a) =>
          a.id === adminId ? { ...a, isActive: false } : a,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to deactivate admin");
    }
  },

  reactivateAdmin: async (adminId) => {
    try {
      await api.patch(`/admin/management/${adminId}/reactivate`);
      toast.success("Admin reactivated");
      set((s) => ({
        admins: s.admins.map((a) =>
          a.id === adminId ? { ...a, isActive: true } : a,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to reactivate admin");
    }
  },

  fetchRoles: async () => {
    set({ loadingRoles: true });
    try {
      const { rolesSearch } = get();
      const params = rolesSearch ? `?search=${encodeURIComponent(rolesSearch)}` : "";
      const res = await api.get<{ data: IAdminRole[] }>(`/admin/roles${params}`);
      set({ roles: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load roles");
    } finally {
      set({ loadingRoles: false });
    }
  },

  createRole: async (data, onSuccess) => {
    try {
      await api.post("/admin/roles", data);
      toast.success("Role created");
      onSuccess();
      void get().fetchRoles();
    } catch (error) {
      handleAxiosError(error, "Failed to create role");
    }
  },

  updateRole: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/roles/${id}`, data);
      toast.success("Role updated");
      onSuccess();
      void get().fetchRoles();
    } catch (error) {
      handleAxiosError(error, "Failed to update role");
    }
  },

  deleteRole: async (id) => {
    try {
      await api.delete(`/admin/roles/${id}`);
      toast.success("Role deleted");
      set((s) => ({ roles: s.roles.filter((r) => r.id !== id) }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete role");
    }
  },
}));
