"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminStudentListItem } from "@/src/types";

interface StudentsState {
  students: IAdminStudentListItem[];
  studentsTotal: number;
  studentsPage: number;
  loadingStudents: boolean;
  searchTerm: string;

  setSearchTerm: (term: string) => void;
  fetchStudents: (page?: number) => Promise<void>;
  deactivateStudent: (userId: string) => Promise<void>;
  reactivateStudent: (userId: string) => Promise<void>;
  suspendStudent: (userId: string, suspendedUntil: string) => Promise<void>;
  unsuspendStudent: (userId: string) => Promise<void>;
}

export const useAdminStudentsStore = create<StudentsState>()((set, get) => ({
  students: [],
  studentsTotal: 0,
  studentsPage: 1,
  loadingStudents: false,
  searchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchStudents: async (page = 1) => {
    set({ loadingStudents: true, studentsPage: page });
    try {
      const { searchTerm } = get();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await api.get<{
        data: { items: IAdminStudentListItem[]; total: number; page: number };
      }>(`/admin/students?${params.toString()}`);
      set({
        students: res.data.data.items,
        studentsTotal: res.data.data.total,
        studentsPage: res.data.data.page,
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load students");
    } finally {
      set({ loadingStudents: false });
    }
  },

  deactivateStudent: async (userId) => {
    try {
      await api.patch(`/admin/students/${userId}/deactivate`);
      toast.success("Student deactivated");
      set((s) => ({
        students: s.students.map((st) =>
          st.userId === userId ? { ...st, user: { ...st.user, isActive: false } } : st,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to deactivate student");
    }
  },

  reactivateStudent: async (userId) => {
    try {
      await api.patch(`/admin/students/${userId}/reactivate`);
      toast.success("Student reactivated");
      set((s) => ({
        students: s.students.map((st) =>
          st.userId === userId ? { ...st, user: { ...st.user, isActive: true } } : st,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to reactivate student");
    }
  },

  suspendStudent: async (userId, suspendedUntil) => {
    try {
      await api.patch(`/admin/students/${userId}/suspend`, { suspendedUntil });
      toast.success("Student suspended");
      set((s) => ({
        students: s.students.map((st) =>
          st.userId === userId ? { ...st, user: { ...st.user, suspendedUntil } } : st,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to suspend student");
    }
  },

  unsuspendStudent: async (userId) => {
    try {
      await api.patch(`/admin/students/${userId}/unsuspend`);
      toast.success("Suspension lifted");
      set((s) => ({
        students: s.students.map((st) =>
          st.userId === userId ? { ...st, user: { ...st.user, suspendedUntil: null } } : st,
        ),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to lift suspension");
    }
  },
}));
