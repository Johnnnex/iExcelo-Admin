"use client";

import { create } from "zustand";
import { authRequest } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import type {
  IAdminKpis,
  IExamCompletionPoint,
  ISubjectPerformancePoint,
  IQuestionDistPoint,
  IRevenuePoint,
  IExamTypePoint,
} from "@/src/types";

interface AnalyticsState {
  kpis: IAdminKpis | null;
  examCompletions: IExamCompletionPoint[];
  subjectPerformance: ISubjectPerformancePoint[];
  questionDistribution: IQuestionDistPoint[];
  revenueOverTime: IRevenuePoint[];
  examTypeBreakdown: IExamTypePoint[];

  completionsGranularity: "day" | "week" | "month";
  revenueGranularity: "day" | "week" | "month";

  isLoadingKpis: boolean;
  isLoadingCompletions: boolean;
  isLoadingSubjects: boolean;
  isLoadingDistribution: boolean;
  isLoadingRevenue: boolean;
  isLoadingExamTypes: boolean;

  setCompletionsGranularity: (g: "day" | "week" | "month") => void;
  setRevenueGranularity: (g: "day" | "week" | "month") => void;
  fetchKpis: () => Promise<void>;
  fetchExamCompletions: () => Promise<void>;
  fetchSubjectPerformance: () => Promise<void>;
  fetchQuestionDistribution: () => Promise<void>;
  fetchRevenueOverTime: () => Promise<void>;
  fetchExamTypeBreakdown: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  kpis: null,
  examCompletions: [],
  subjectPerformance: [],
  questionDistribution: [],
  revenueOverTime: [],
  examTypeBreakdown: [],

  completionsGranularity: "day",
  revenueGranularity: "day",

  isLoadingKpis: false,
  isLoadingCompletions: false,
  isLoadingSubjects: false,
  isLoadingDistribution: false,
  isLoadingRevenue: false,
  isLoadingExamTypes: false,

  setCompletionsGranularity: (g) => {
    set({ completionsGranularity: g });
    void get().fetchExamCompletions();
  },

  setRevenueGranularity: (g) => {
    set({ revenueGranularity: g });
    void get().fetchRevenueOverTime();
  },

  fetchKpis: async () => {
    set({ isLoadingKpis: true });
    try {
      const res = await authRequest<{ data: IAdminKpis }>({
        method: "GET",
        url: "/admin/analytics/kpis",
      });
      set({ kpis: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load KPIs");
    } finally {
      set({ isLoadingKpis: false });
    }
  },

  fetchExamCompletions: async () => {
    set({ isLoadingCompletions: true });
    try {
      const { completionsGranularity } = get();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await authRequest<{ data: IExamCompletionPoint[] }>({
        method: "GET",
        url: `/admin/analytics/exam-completions?granularity=${completionsGranularity}&timezone=${tz}`,
      });
      set({ examCompletions: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load exam completions");
    } finally {
      set({ isLoadingCompletions: false });
    }
  },

  fetchSubjectPerformance: async () => {
    set({ isLoadingSubjects: true });
    try {
      const res = await authRequest<{ data: ISubjectPerformancePoint[] }>({
        method: "GET",
        url: "/admin/analytics/subject-performance",
      });
      set({ subjectPerformance: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load subject performance");
    } finally {
      set({ isLoadingSubjects: false });
    }
  },

  fetchQuestionDistribution: async () => {
    set({ isLoadingDistribution: true });
    try {
      const res = await authRequest<{ data: IQuestionDistPoint[] }>({
        method: "GET",
        url: "/admin/analytics/question-distribution",
      });
      set({ questionDistribution: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load question distribution");
    } finally {
      set({ isLoadingDistribution: false });
    }
  },

  fetchRevenueOverTime: async () => {
    set({ isLoadingRevenue: true });
    try {
      const { revenueGranularity } = get();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await authRequest<{ data: IRevenuePoint[] }>({
        method: "GET",
        url: `/admin/analytics/revenue?granularity=${revenueGranularity}&timezone=${tz}`,
      });
      set({ revenueOverTime: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load revenue data");
    } finally {
      set({ isLoadingRevenue: false });
    }
  },

  fetchExamTypeBreakdown: async () => {
    set({ isLoadingExamTypes: true });
    try {
      const res = await authRequest<{ data: IExamTypePoint[] }>({
        method: "GET",
        url: "/admin/analytics/exam-types",
      });
      set({ examTypeBreakdown: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load exam type breakdown");
    } finally {
      set({ isLoadingExamTypes: false });
    }
  },

  fetchAll: async () => {
    const s = get();
    await Promise.all([
      s.fetchKpis(),
      s.fetchExamCompletions(),
      s.fetchSubjectPerformance(),
      s.fetchQuestionDistribution(),
      s.fetchRevenueOverTime(),
      s.fetchExamTypeBreakdown(),
    ]);
  },
}));
