"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { IAdminStudentListItem } from "@/src/types";

interface StudentsState {
  students: IAdminStudentListItem[];
  cursors: (string | null)[];
  cursorPage: number;
  hasMore: boolean;
  loadingStudents: boolean;
  searchTerm: string;

  setSearchTerm: (term: string) => void;
  fetchStudents: (page?: number) => Promise<void>;
  resetStudentPassword: (userId: string) => Promise<void>;
  deactivateStudent: (userId: string) => Promise<void>;
  reactivateStudent: (userId: string) => Promise<void>;
  suspendStudent: (userId: string, suspendedUntil: string) => Promise<void>;
  unsuspendStudent: (userId: string) => Promise<void>;
}

export const useAdminStudentsStore = create<StudentsState>()((set, get) => ({
  students: [],
  cursors: [null],
  cursorPage: 1,
  hasMore: false,
  loadingStudents: false,
  searchTerm: "",

  setSearchTerm: (term) => set({ searchTerm: term, cursors: [null], cursorPage: 1 }),

  fetchStudents: async (page = 1) => {
    set({ loadingStudents: true });
    try {
      const { searchTerm, cursors } = get();
      const params = new URLSearchParams({ limit: "50" });
      const cursor = cursors[page - 1];
      if (cursor) params.set("cursor", cursor);
      if (searchTerm) params.set("search", searchTerm);

      const res = await api.get<{
        data: { items: IAdminStudentListItem[]; nextCursor: string | null; hasMore: boolean };
      }>(`/admin/students?${params.toString()}`);

      const { items, nextCursor, hasMore } = res.data.data;

      set((s) => {
        const newCursors = [...s.cursors];
        if (nextCursor && newCursors.length <= page) {
          newCursors.push(nextCursor);
        }
        return { students: items, hasMore, cursors: newCursors, cursorPage: page };
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load students");
    } finally {
      set({ loadingStudents: false });
    }
  },

  resetStudentPassword: async (userId) => {
    try {
      await api.patch(`/admin/students/${userId}/reset-password`);
      toast.success("Password reset email sent to student");
    } catch (error) {
      handleAxiosError(error, "Failed to send password reset email");
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
