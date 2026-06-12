"use client";

import { create } from "zustand";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import {
  IExamType,
  ISubject,
  IExamTypeSubject,
  ITopic,
  IPassage,
  IQuestion,
} from "@/src/types";

const LIMIT = 50;

interface PaginatedState<T> {
  items: T[];
  total: number;
  page: number;
}

interface ExamRevisionState {
  // ExamTypes
  examTypes: IExamType[];
  examTypesTotal: number;
  examTypesPage: number;
  examTypesSearch: string;
  loadingExamTypes: boolean;
  setExamTypesSearch: (s: string) => void;
  fetchExamTypes: (page?: number) => Promise<void>;
  createExamType: (data: CreateExamTypeDto, onSuccess: () => void) => Promise<void>;
  updateExamType: (id: string, data: Partial<CreateExamTypeDto & { isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deleteExamType: (id: string) => Promise<void>;

  // Subjects
  subjects: ISubject[];
  subjectsTotal: number;
  subjectsPage: number;
  subjectsSearch: string;
  loadingSubjects: boolean;
  setSubjectsSearch: (s: string) => void;
  fetchSubjects: (page?: number) => Promise<void>;
  createSubject: (data: { name: string; description?: string | null }, onSuccess: () => void) => Promise<void>;
  updateSubject: (id: string, data: Partial<{ name: string; description: string | null; isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // ExamTypeSubjects
  examTypeSubjects: IExamTypeSubject[];
  loadingEts: boolean;
  fetchExamTypeSubjects: (examTypeId?: string) => Promise<void>;
  linkExamTypeSubject: (examTypeId: string, subjectId: string, isCompulsory?: boolean, onSuccess?: () => void) => Promise<void>;
  unlinkExamTypeSubject: (id: string) => Promise<void>;

  // Topics
  topics: ITopic[];
  topicsTotal: number;
  topicsPage: number;
  topicsSearch: string;
  loadingTopics: boolean;
  selectedTopicSubjectId: string;
  setTopicSubjectFilter: (subjectId: string) => void;
  setTopicsSearch: (s: string) => void;
  fetchTopics: (page?: number) => Promise<void>;
  createTopic: (data: { subjectId: string; name: string; content?: string }, onSuccess: () => void) => Promise<void>;
  updateTopic: (id: string, data: Partial<{ name: string; content: string; isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;

  // Passages
  passages: IPassage[];
  passagesTotal: number;
  passagesPage: number;
  passagesSearch: string;
  loadingPassages: boolean;
  selectedPassageEtsId: string;
  setPassageEtsFilter: (etsId: string) => void;
  setPassagesSearch: (s: string) => void;
  fetchPassages: (page?: number) => Promise<void>;
  createPassage: (data: { examTypeSubjectId: string; title: string; content: string }, onSuccess: () => void) => Promise<void>;
  updatePassage: (id: string, data: Partial<{ title: string; content: string; isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deletePassage: (id: string) => Promise<void>;

  // Questions (list only — form is on subpage)
  questions: IQuestion[];
  questionsTotal: number;
  questionsPage: number;
  loadingQuestions: boolean;
  questionFilters: {
    examTypeSubjectId: string;
    type: string;
    category: string;
    difficulty: string;
    search: string;
  };
  setQuestionFilters: (filters: Partial<ExamRevisionState["questionFilters"]>) => void;
  fetchQuestions: (page?: number) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
}

export interface CreateExamTypeDto {
  name: string;
  description?: string | null;
  minSubjectsSelectable: number;
  maxSubjectsSelectable: number;
  freeTierQuestionLimit?: number | null;
  supportedCategories: string[];
}

export const useExamRevisionStore = create<ExamRevisionState>()((set, get) => ({
  // ─── ExamTypes ────────────────────────────────────────────────────────────
  examTypes: [],
  examTypesTotal: 0,
  examTypesPage: 1,
  examTypesSearch: "",
  loadingExamTypes: false,

  setExamTypesSearch: (s) => set({ examTypesSearch: s }),

  fetchExamTypes: async (page = 1) => {
    set({ loadingExamTypes: true, examTypesPage: page });
    try {
      const { examTypesSearch } = get();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (examTypesSearch) params.set("search", examTypesSearch);
      const res = await api.get<{ data: PaginatedState<IExamType> }>(
        `/admin/exam-revision/exam-types?${params}`,
      );
      set({ examTypes: res.data.data.items, examTypesTotal: res.data.data.total, examTypesPage: res.data.data.page });
    } catch (error) {
      handleAxiosError(error, "Failed to load exam types");
    } finally {
      set({ loadingExamTypes: false });
    }
  },

  createExamType: async (data, onSuccess) => {
    try {
      await api.post("/admin/exam-revision/exam-types", data);
      toast.success("Exam type created");
      onSuccess();
      void get().fetchExamTypes(1);
    } catch (error) {
      handleAxiosError(error, "Failed to create exam type");
    }
  },

  updateExamType: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/exam-types/${id}`, data);
      toast.success("Exam type updated");
      onSuccess();
      void get().fetchExamTypes(get().examTypesPage);
    } catch (error) {
      handleAxiosError(error, "Failed to update exam type");
    }
  },

  deleteExamType: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/exam-types/${id}`);
      toast.success("Exam type deleted");
      void get().fetchExamTypes(get().examTypesPage);
    } catch (error) {
      handleAxiosError(error, "Failed to delete exam type");
    }
  },

  // ─── Subjects ─────────────────────────────────────────────────────────────
  subjects: [],
  subjectsTotal: 0,
  subjectsPage: 1,
  subjectsSearch: "",
  loadingSubjects: false,

  setSubjectsSearch: (s) => set({ subjectsSearch: s }),

  fetchSubjects: async (page = 1) => {
    set({ loadingSubjects: true, subjectsPage: page });
    try {
      const { subjectsSearch } = get();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (subjectsSearch) params.set("search", subjectsSearch);
      const res = await api.get<{ data: PaginatedState<ISubject> }>(
        `/admin/exam-revision/subjects?${params}`,
      );
      set({ subjects: res.data.data.items, subjectsTotal: res.data.data.total, subjectsPage: res.data.data.page });
    } catch (error) {
      handleAxiosError(error, "Failed to load subjects");
    } finally {
      set({ loadingSubjects: false });
    }
  },

  createSubject: async (data, onSuccess) => {
    try {
      await api.post("/admin/exam-revision/subjects", data);
      toast.success("Subject created");
      onSuccess();
      void get().fetchSubjects(1);
    } catch (error) {
      handleAxiosError(error, "Failed to create subject");
    }
  },

  updateSubject: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/subjects/${id}`, data);
      toast.success("Subject updated");
      onSuccess();
      void get().fetchSubjects(get().subjectsPage);
    } catch (error) {
      handleAxiosError(error, "Failed to update subject");
    }
  },

  deleteSubject: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/subjects/${id}`);
      toast.success("Subject deleted");
      void get().fetchSubjects(get().subjectsPage);
    } catch (error) {
      handleAxiosError(error, "Failed to delete subject");
    }
  },

  // ─── ExamTypeSubjects ─────────────────────────────────────────────────────
  examTypeSubjects: [],
  loadingEts: false,

  fetchExamTypeSubjects: async (examTypeId) => {
    set({ loadingEts: true });
    try {
      const url = examTypeId
        ? `/admin/exam-revision/exam-type-subjects?examTypeId=${examTypeId}`
        : "/admin/exam-revision/exam-type-subjects";
      const res = await api.get<{ data: IExamTypeSubject[] }>(url);
      set({ examTypeSubjects: res.data.data });
    } catch (error) {
      handleAxiosError(error, "Failed to load links");
    } finally {
      set({ loadingEts: false });
    }
  },

  linkExamTypeSubject: async (examTypeId, subjectId, isCompulsory, onSuccess) => {
    try {
      await api.post("/admin/exam-revision/exam-type-subjects", {
        examTypeId,
        subjectId,
        isCompulsory: isCompulsory ?? false,
      });
      toast.success("Subject linked");
      onSuccess?.();
      void get().fetchExamTypeSubjects(examTypeId);
    } catch (error) {
      handleAxiosError(error, "Failed to link subject");
    }
  },

  unlinkExamTypeSubject: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/exam-type-subjects/${id}`);
      toast.success("Subject unlinked");
      set((s) => ({
        examTypeSubjects: s.examTypeSubjects.filter((e) => e.id !== id),
      }));
    } catch (error) {
      handleAxiosError(error, "Failed to unlink subject");
    }
  },

  // ─── Topics ───────────────────────────────────────────────────────────────
  topics: [],
  topicsTotal: 0,
  topicsPage: 1,
  topicsSearch: "",
  loadingTopics: false,
  selectedTopicSubjectId: "",

  setTopicSubjectFilter: (subjectId) => set({ selectedTopicSubjectId: subjectId }),
  setTopicsSearch: (s) => set({ topicsSearch: s }),

  fetchTopics: async (page = 1) => {
    set({ loadingTopics: true, topicsPage: page });
    try {
      const { selectedTopicSubjectId, topicsSearch } = get();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (selectedTopicSubjectId) params.set("subjectId", selectedTopicSubjectId);
      if (topicsSearch) params.set("search", topicsSearch);
      const res = await api.get<{ data: PaginatedState<ITopic> }>(
        `/admin/exam-revision/topics?${params}`,
      );
      set({ topics: res.data.data.items, topicsTotal: res.data.data.total, topicsPage: res.data.data.page });
    } catch (error) {
      handleAxiosError(error, "Failed to load topics");
    } finally {
      set({ loadingTopics: false });
    }
  },

  createTopic: async (data, onSuccess) => {
    try {
      await api.post("/admin/exam-revision/topics", data);
      toast.success("Topic created");
      onSuccess();
      void get().fetchTopics(1);
    } catch (error) {
      handleAxiosError(error, "Failed to create topic");
    }
  },

  updateTopic: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/topics/${id}`, data);
      toast.success("Topic updated");
      onSuccess();
      void get().fetchTopics(get().topicsPage);
    } catch (error) {
      handleAxiosError(error, "Failed to update topic");
    }
  },

  deleteTopic: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/topics/${id}`);
      toast.success("Topic deleted");
      void get().fetchTopics(get().topicsPage);
    } catch (error) {
      handleAxiosError(error, "Failed to delete topic");
    }
  },

  // ─── Passages ─────────────────────────────────────────────────────────────
  passages: [],
  passagesTotal: 0,
  passagesPage: 1,
  passagesSearch: "",
  loadingPassages: false,
  selectedPassageEtsId: "",

  setPassageEtsFilter: (etsId) => set({ selectedPassageEtsId: etsId }),
  setPassagesSearch: (s) => set({ passagesSearch: s }),

  fetchPassages: async (page = 1) => {
    set({ loadingPassages: true, passagesPage: page });
    try {
      const { selectedPassageEtsId, passagesSearch } = get();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (selectedPassageEtsId) params.set("examTypeSubjectId", selectedPassageEtsId);
      if (passagesSearch) params.set("search", passagesSearch);
      const res = await api.get<{ data: PaginatedState<IPassage> }>(
        `/admin/exam-revision/passages?${params}`,
      );
      set({ passages: res.data.data.items, passagesTotal: res.data.data.total, passagesPage: res.data.data.page });
    } catch (error) {
      handleAxiosError(error, "Failed to load passages");
    } finally {
      set({ loadingPassages: false });
    }
  },

  createPassage: async (data, onSuccess) => {
    try {
      await api.post("/admin/exam-revision/passages", data);
      toast.success("Passage created");
      onSuccess();
      void get().fetchPassages(1);
    } catch (error) {
      handleAxiosError(error, "Failed to create passage");
    }
  },

  updatePassage: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/passages/${id}`, data);
      toast.success("Passage updated");
      onSuccess();
      void get().fetchPassages(get().passagesPage);
    } catch (error) {
      handleAxiosError(error, "Failed to update passage");
    }
  },

  deletePassage: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/passages/${id}`);
      toast.success("Passage deleted");
      void get().fetchPassages(get().passagesPage);
    } catch (error) {
      handleAxiosError(error, "Failed to delete passage");
    }
  },

  // ─── Questions ────────────────────────────────────────────────────────────
  questions: [],
  questionsTotal: 0,
  questionsPage: 1,
  loadingQuestions: false,
  questionFilters: {
    examTypeSubjectId: "",
    type: "",
    category: "",
    difficulty: "",
    search: "",
  },

  setQuestionFilters: (filters) =>
    set((s) => ({ questionFilters: { ...s.questionFilters, ...filters } })),

  fetchQuestions: async (page = 1) => {
    set({ loadingQuestions: true, questionsPage: page });
    try {
      const { questionFilters } = get();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (questionFilters.examTypeSubjectId)
        params.set("examTypeSubjectId", questionFilters.examTypeSubjectId);
      if (questionFilters.type) params.set("type", questionFilters.type);
      if (questionFilters.category) params.set("category", questionFilters.category);
      if (questionFilters.difficulty) params.set("difficulty", questionFilters.difficulty);
      if (questionFilters.search) params.set("search", questionFilters.search);

      const res = await api.get<{
        data: { items: IQuestion[]; total: number; page: number };
      }>(`/admin/exam-revision/questions?${params}`);
      set({
        questions: res.data.data.items,
        questionsTotal: res.data.data.total,
        questionsPage: res.data.data.page,
      });
    } catch (error) {
      handleAxiosError(error, "Failed to load questions");
    } finally {
      set({ loadingQuestions: false });
    }
  },

  deleteQuestion: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/questions/${id}`);
      toast.success("Question deleted");
      void get().fetchQuestions(get().questionsPage);
    } catch (error) {
      handleAxiosError(error, "Failed to delete question");
    }
  },
}));
