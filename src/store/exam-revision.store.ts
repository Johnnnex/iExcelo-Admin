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

interface ExamRevisionState {
  // ExamTypes
  examTypes: IExamType[];
  loadingExamTypes: boolean;
  fetchExamTypes: () => Promise<void>;
  createExamType: (data: CreateExamTypeDto, onSuccess: () => void) => Promise<void>;
  updateExamType: (id: string, data: Partial<CreateExamTypeDto & { isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deleteExamType: (id: string) => Promise<void>;

  // Subjects
  subjects: ISubject[];
  loadingSubjects: boolean;
  fetchSubjects: () => Promise<void>;
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
  loadingTopics: boolean;
  selectedTopicSubjectId: string;
  setTopicSubjectFilter: (subjectId: string) => void;
  fetchTopics: (subjectId?: string) => Promise<void>;
  createTopic: (data: { subjectId: string; name: string; content?: string }, onSuccess: () => void) => Promise<void>;
  updateTopic: (id: string, data: Partial<{ name: string; content: string; isActive: boolean }>, onSuccess: () => void) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;

  // Passages
  passages: IPassage[];
  loadingPassages: boolean;
  selectedPassageEtsId: string;
  setPassageEtsFilter: (etsId: string) => void;
  fetchPassages: (examTypeSubjectId?: string) => Promise<void>;
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
  loadingExamTypes: false,

  fetchExamTypes: async () => {
    set({ loadingExamTypes: true });
    try {
      const res = await api.get<{ data: IExamType[] }>(
        "/admin/exam-revision/exam-types",
      );
      set({ examTypes: res.data.data });
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
      void get().fetchExamTypes();
    } catch (error) {
      handleAxiosError(error, "Failed to create exam type");
    }
  },

  updateExamType: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/exam-types/${id}`, data);
      toast.success("Exam type updated");
      onSuccess();
      void get().fetchExamTypes();
    } catch (error) {
      handleAxiosError(error, "Failed to update exam type");
    }
  },

  deleteExamType: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/exam-types/${id}`);
      toast.success("Exam type deleted");
      set((s) => ({ examTypes: s.examTypes.filter((e) => e.id !== id) }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete exam type");
    }
  },

  // ─── Subjects ─────────────────────────────────────────────────────────────
  subjects: [],
  loadingSubjects: false,

  fetchSubjects: async () => {
    set({ loadingSubjects: true });
    try {
      const res = await api.get<{ data: ISubject[] }>(
        "/admin/exam-revision/subjects",
      );
      set({ subjects: res.data.data });
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
      void get().fetchSubjects();
    } catch (error) {
      handleAxiosError(error, "Failed to create subject");
    }
  },

  updateSubject: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/subjects/${id}`, data);
      toast.success("Subject updated");
      onSuccess();
      void get().fetchSubjects();
    } catch (error) {
      handleAxiosError(error, "Failed to update subject");
    }
  },

  deleteSubject: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/subjects/${id}`);
      toast.success("Subject deleted");
      set((s) => ({ subjects: s.subjects.filter((s) => s.id !== id) }));
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
  loadingTopics: false,
  selectedTopicSubjectId: "",

  setTopicSubjectFilter: (subjectId) => set({ selectedTopicSubjectId: subjectId }),

  fetchTopics: async (subjectId) => {
    set({ loadingTopics: true });
    try {
      const url = subjectId
        ? `/admin/exam-revision/topics?subjectId=${subjectId}`
        : "/admin/exam-revision/topics";
      const res = await api.get<{ data: ITopic[] }>(url);
      set({ topics: res.data.data });
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
      void get().fetchTopics(get().selectedTopicSubjectId || undefined);
    } catch (error) {
      handleAxiosError(error, "Failed to create topic");
    }
  },

  updateTopic: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/topics/${id}`, data);
      toast.success("Topic updated");
      onSuccess();
      void get().fetchTopics(get().selectedTopicSubjectId || undefined);
    } catch (error) {
      handleAxiosError(error, "Failed to update topic");
    }
  },

  deleteTopic: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/topics/${id}`);
      toast.success("Topic deleted");
      set((s) => ({ topics: s.topics.filter((t) => t.id !== id) }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete topic");
    }
  },

  // ─── Passages ─────────────────────────────────────────────────────────────
  passages: [],
  loadingPassages: false,
  selectedPassageEtsId: "",

  setPassageEtsFilter: (etsId) => set({ selectedPassageEtsId: etsId }),

  fetchPassages: async (examTypeSubjectId) => {
    set({ loadingPassages: true });
    try {
      const url = examTypeSubjectId
        ? `/admin/exam-revision/passages?examTypeSubjectId=${examTypeSubjectId}`
        : "/admin/exam-revision/passages";
      const res = await api.get<{ data: IPassage[] }>(url);
      set({ passages: res.data.data });
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
      void get().fetchPassages(get().selectedPassageEtsId || undefined);
    } catch (error) {
      handleAxiosError(error, "Failed to create passage");
    }
  },

  updatePassage: async (id, data, onSuccess) => {
    try {
      await api.patch(`/admin/exam-revision/passages/${id}`, data);
      toast.success("Passage updated");
      onSuccess();
      void get().fetchPassages(get().selectedPassageEtsId || undefined);
    } catch (error) {
      handleAxiosError(error, "Failed to update passage");
    }
  },

  deletePassage: async (id) => {
    try {
      await api.delete(`/admin/exam-revision/passages/${id}`);
      toast.success("Passage deleted");
      set((s) => ({ passages: s.passages.filter((p) => p.id !== id) }));
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
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (questionFilters.examTypeSubjectId)
        params.set("examTypeSubjectId", questionFilters.examTypeSubjectId);
      if (questionFilters.type) params.set("type", questionFilters.type);
      if (questionFilters.category) params.set("category", questionFilters.category);
      if (questionFilters.difficulty) params.set("difficulty", questionFilters.difficulty);
      if (questionFilters.search) params.set("search", questionFilters.search);

      const res = await api.get<{
        data: { items: IQuestion[]; total: number; page: number };
      }>(`/admin/exam-revision/questions?${params.toString()}`);
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
      set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }));
    } catch (error) {
      handleAxiosError(error, "Failed to delete question");
    }
  },
}));
