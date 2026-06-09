"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IExamType, ISubject, IExamTypeSubject, ITopic, IPassage, IQuestion } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import {
  examTypeSchema, ExamTypeValues,
  subjectSchema, SubjectValues,
} from "@/src/schemas/exam-revision.schema";
import { CARD_SHADOW } from "@/src/utils";

const CATEGORY_OPTIONS = [
  { value: "objectives", label: "Objectives" },
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "multiple_response", label: "Multiple Response" },
  { value: "true_false", label: "True / False" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
  { value: "matching", label: "Matching" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

// ─── Reusable card wrapper ─────────────────────────────────────────────────

function TabCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl flex flex-col" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
        <div>
          <p className="font-semibold text-[#101828]">{title}</p>
          {subtitle && <p className="text-sm text-[#667085]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── ExamTypes Tab ─────────────────────────────────────────────────────────

function ExamTypesTab() {
  const {
    examTypes, loadingExamTypes,
    fetchExamTypes, createExamType, updateExamType, deleteExamType,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [modal, setModal] = useState<{ open: boolean; item: IExamType | null }>({ open: false, item: null });
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<IExamType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExamTypeValues>({
    resolver: yupResolver(examTypeSchema),
    defaultValues: { name: "", description: "", minSubjectsSelectable: 1, maxSubjectsSelectable: 4, freeTierQuestionLimit: 50, supportedCategories: ["objectives"] },
  });

  useEffect(() => { fetchExamTypes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    reset({ name: "", description: "", minSubjectsSelectable: 1, maxSubjectsSelectable: 4, freeTierQuestionLimit: 50, supportedCategories: ["objectives"] });
    setSelectedCats(["objectives"]);
    setModal({ open: true, item: null });
  };

  const openEdit = (item: IExamType) => {
    reset({
      name: item.name,
      description: item.description ?? "",
      minSubjectsSelectable: item.minSubjectsSelectable,
      maxSubjectsSelectable: item.maxSubjectsSelectable,
      freeTierQuestionLimit: item.freeTierQuestionLimit,
      supportedCategories: item.supportedCategories,
    });
    setSelectedCats(item.supportedCategories);
    setModal({ open: true, item });
  };

  const closeModal = () => { setModal({ open: false, item: null }); reset(); };

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const onSubmit = async (data: ExamTypeValues) => {
    const payload = { ...data, supportedCategories: selectedCats };
    if (modal.item) {
      await updateExamType(modal.item.id, payload, closeModal);
    } else {
      await createExamType(payload, closeModal);
    }
  };

  const columns: Column<IExamType>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-[#101828]">{r.name}</span> },
    { key: "subjects", header: "Subjects", render: (r) => <span className="text-sm text-[#344054]">{r.minSubjectsSelectable}–{r.maxSubjectsSelectable}</span> },
    { key: "freeTier", header: "Free Tier Limit", render: (r) => <span className="text-sm text-[#344054]">{r.freeTierQuestionLimit}</span> },
    {
      key: "categories", header: "Categories",
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {r.supportedCategories.map((c) => (
            <span key={c} className="text-[0.65rem] bg-[#F0F2F5] text-[#344054] px-2 py-0.5 rounded-full capitalize">{c}</span>
          ))}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusChip variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions", header: "", render: (r) => canEdit ? (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="text-xs text-[#007FFF] hover:underline">Edit</button>
          <span className="text-[#D0D5DD]">|</span>
          <button onClick={() => setDeleteTarget(r)} className="text-xs text-[#D42620] hover:underline">Delete</button>
        </div>
      ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Exam Types"
        subtitle={`${examTypes.length} types`}
        action={canEdit ? (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Icon icon="hugeicons:add-01" width={16} /> Add
          </Button>
        ) : undefined}
      >
        <DataTable columns={columns} data={examTypes} loading={loadingExamTypes} keyExtractor={(r) => r.id} emptyMessage="No exam types yet" />
      </TabCard>

      <Modal isOpen={modal.open} onClose={closeModal} className="w-full max-w-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-semibold text-[#101828]">{modal.item ? "Edit Exam Type" : "New Exam Type"}</p>
          <button onClick={closeModal} className="text-[#667085]"><Icon icon="hugeicons:cancel-01" width={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller name="name" control={control} render={({ field }) => (
            <InputField {...field} label="Name" placeholder="e.g. JAMB/UTME" error={errors.name?.message} onChange={(e) => field.onChange(e.target.value)} />
          )} />
          <Controller name="description" control={control} render={({ field }) => (
            <InputField {...field} type="textarea" label="Description" placeholder="Optional description..." value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
          )} />
          <div className="grid grid-cols-2 gap-4">
            <Controller name="minSubjectsSelectable" control={control} render={({ field }) => (
              <InputField {...field} type="number" label="Min Subjects" value={String(field.value)} error={errors.minSubjectsSelectable?.message} onChange={(e) => field.onChange(Number(e.target.value))} />
            )} />
            <Controller name="maxSubjectsSelectable" control={control} render={({ field }) => (
              <InputField {...field} type="number" label="Max Subjects" value={String(field.value)} error={errors.maxSubjectsSelectable?.message} onChange={(e) => field.onChange(Number(e.target.value))} />
            )} />
          </div>
          <Controller name="freeTierQuestionLimit" control={control} render={({ field }) => (
            <InputField {...field} type="number" label="Free Tier Question Limit" value={String(field.value)} onChange={(e) => field.onChange(Number(e.target.value))} />
          )} />
          <div>
            <p className="text-sm font-medium text-[#344054] mb-2">Supported Categories</p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCat(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedCats.includes(c.value)
                      ? "bg-[#007FFF] text-white border-[#007FFF]"
                      : "bg-white text-[#344054] border-[#D0D5DD]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            <Button type="button" onClick={closeModal} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">{modal.item ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Exam Type</p>
        <p className="text-sm text-[#667085] mb-6">Delete <strong>{deleteTarget?.name}</strong>? This will cascade-delete all linked subjects and questions.</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button loading={deleteLoading} onClick={async () => { setDeleteLoading(true); await deleteExamType(deleteTarget!.id); setDeleteLoading(false); setDeleteTarget(null); }} className="flex-1 !bg-[#D42620]">Delete</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Subjects Tab ──────────────────────────────────────────────────────────

function SubjectsTab() {
  const {
    subjects, loadingSubjects,
    fetchSubjects, createSubject, updateSubject, deleteSubject,
    examTypes, loadingExamTypes, fetchExamTypes,
    examTypeSubjects, loadingEts, fetchExamTypeSubjects, linkExamTypeSubject, unlinkExamTypeSubject,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [modal, setModal] = useState<{ open: boolean; item: ISubject | null }>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<ISubject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [linkModal, setLinkModal] = useState<{ open: boolean; examTypeId: string; subjectId: string }>({ open: false, examTypeId: "", subjectId: "" });
  const [selectedEtForLinks, setSelectedEtForLinks] = useState("");

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SubjectValues>({
    resolver: yupResolver(subjectSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => { fetchSubjects(); fetchExamTypes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedEtForLinks) fetchExamTypeSubjects(selectedEtForLinks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEtForLinks]);

  const openCreate = () => { reset({ name: "", description: "" }); setModal({ open: true, item: null }); };
  const openEdit = (item: ISubject) => { reset({ name: item.name, description: item.description ?? "" }); setModal({ open: true, item }); };
  const closeModal = () => { setModal({ open: false, item: null }); reset(); };

  const onSubmit = async (data: SubjectValues) => {
    if (modal.item) {
      await updateSubject(modal.item.id, data, closeModal);
    } else {
      await createSubject(data, closeModal);
    }
  };

  const subjectSelectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const etSelectOptions = examTypes.map((e) => ({ value: e.id, label: e.name }));

  const columns: Column<ISubject>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-[#101828]">{r.name}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-sm text-[#667085]">{r.description ?? "—"}</span> },
    { key: "totalQuestions", header: "Questions", render: (r) => <span className="text-sm text-[#344054]">{r.totalQuestions}</span> },
    { key: "status", header: "Status", render: (r) => <StatusChip variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions", header: "", render: (r) => canEdit ? (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="text-xs text-[#007FFF] hover:underline">Edit</button>
          <span className="text-[#D0D5DD]">|</span>
          <button onClick={() => setDeleteTarget(r)} className="text-xs text-[#D42620] hover:underline">Delete</button>
        </div>
      ) : null,
    },
  ];

  const etsColumns: Column<IExamTypeSubject>[] = [
    { key: "subject", header: "Subject", render: (r) => <span className="text-sm font-medium text-[#101828]">{r.subject?.name}</span> },
    { key: "compulsory", header: "Compulsory", render: (r) => <StatusChip variant={r.isCompulsory ? "info" : "neutral"} label={r.isCompulsory ? "Yes" : "No"} /> },
    {
      key: "unlink", header: "", render: (r) => canEdit ? (
        <button onClick={() => unlinkExamTypeSubject(r.id)} className="text-xs text-[#D42620] hover:underline">Unlink</button>
      ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Subjects"
        subtitle={`${subjects.length} subjects`}
        action={canEdit ? (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Icon icon="hugeicons:add-01" width={16} /> Add Subject
          </Button>
        ) : undefined}
      >
        <DataTable columns={columns} data={subjects} loading={loadingSubjects} keyExtractor={(r) => r.id} emptyMessage="No subjects yet" />
      </TabCard>

      {/* Exam Type ↔ Subject links */}
      <div className="bg-white rounded-2xl" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Exam Type → Subject Links</p>
            <p className="text-sm text-[#667085]">Filter by exam type to view and manage subject assignments</p>
          </div>
          {canEdit && selectedEtForLinks && (
            <Button onClick={() => setLinkModal({ open: true, examTypeId: selectedEtForLinks, subjectId: "" })} className="flex items-center gap-2">
              <Icon icon="hugeicons:link-01" width={16} /> Link Subject
            </Button>
          )}
        </div>
        <div className="px-6 py-4 border-b border-[#F0F2F5]">
          <InputField
            type="select"
            label={null}
            placeholder="Select an exam type to view its subjects..."
            value={selectedEtForLinks || null}
            selectOptions={etSelectOptions}
            onChange={(e) => setSelectedEtForLinks(e.target.value as string)}
          />
        </div>
        {selectedEtForLinks && (
          <DataTable
            columns={etsColumns}
            data={examTypeSubjects}
            loading={loadingEts}
            keyExtractor={(r) => r.id}
            emptyMessage="No subjects linked to this exam type"
          />
        )}
      </div>

      {/* Subject/Create modals */}
      <Modal isOpen={modal.open} onClose={closeModal} className="w-full max-w-md rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-semibold text-[#101828]">{modal.item ? "Edit Subject" : "New Subject"}</p>
          <button onClick={closeModal} className="text-[#667085]"><Icon icon="hugeicons:cancel-01" width={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller name="name" control={control} render={({ field }) => (
            <InputField {...field} label="Name" placeholder="e.g. Mathematics" error={errors.name?.message} onChange={(e) => field.onChange(e.target.value)} />
          )} />
          <Controller name="description" control={control} render={({ field }) => (
            <InputField {...field} type="textarea" label="Description" placeholder="Optional..." value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
          )} />
          <div className="flex gap-3">
            <Button type="button" onClick={closeModal} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">{modal.item ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Link Subject modal */}
      <Modal isOpen={linkModal.open} onClose={() => setLinkModal({ open: false, examTypeId: "", subjectId: "" })} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-4">Link Subject</p>
        <InputField
          type="select"
          label="Subject"
          placeholder="Select subject..."
          value={linkModal.subjectId || null}
          selectOptions={subjectSelectOptions}
          onChange={(e) => setLinkModal((p) => ({ ...p, subjectId: e.target.value as string }))}
        />
        <div className="flex gap-3 mt-4">
          <Button onClick={() => setLinkModal({ open: false, examTypeId: "", subjectId: "" })} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button
            onClick={async () => {
              if (!linkModal.subjectId) return;
              await linkExamTypeSubject(linkModal.examTypeId, linkModal.subjectId, false, () =>
                setLinkModal({ open: false, examTypeId: "", subjectId: "" }),
              );
            }}
            className="flex-1"
          >
            Link
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Subject</p>
        <p className="text-sm text-[#667085] mb-6">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button loading={deleteLoading} onClick={async () => { setDeleteLoading(true); await deleteSubject(deleteTarget!.id); setDeleteLoading(false); setDeleteTarget(null); }} className="flex-1 !bg-[#D42620]">Delete</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Topics Tab ────────────────────────────────────────────────────────────

function TopicsTab() {
  const {
    topics, loadingTopics, selectedTopicSubjectId, setTopicSubjectFilter,
    fetchTopics, deleteTopic, subjects, fetchSubjects,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<ITopic | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchSubjects(); fetchTopics(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  const columns: Column<ITopic>[] = [
    { key: "name", header: "Topic", render: (r) => <span className="font-medium text-[#101828]">{r.name}</span> },
    { key: "subject", header: "Subject", render: (r) => <span className="text-sm text-[#667085]">{r.subject?.name ?? "—"}</span> },
    { key: "content", header: "Has Content", render: (r) => <StatusChip variant={r.content ? "success" : "neutral"} label={r.content ? "Yes" : "No"} /> },
    { key: "status", header: "Status", render: (r) => <StatusChip variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions", header: "", render: (r) => canEdit ? (
        <div className="flex gap-2">
          <button onClick={() => router.push(`/exam-revision/topics/${r.id}/edit`)} className="text-xs text-[#007FFF] hover:underline">Edit</button>
          <span className="text-[#D0D5DD]">|</span>
          <button onClick={() => setDeleteTarget(r)} className="text-xs text-[#D42620] hover:underline">Delete</button>
        </div>
      ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Topics"
        subtitle={`${topics.length} topics`}
        action={canEdit ? (
          <Button onClick={() => router.push("/exam-revision/topics/new")} className="flex items-center gap-2">
            <Icon icon="hugeicons:add-01" width={16} /> Add Topic
          </Button>
        ) : undefined}
      >
        <div className="px-6 py-3 border-b border-[#F0F2F5]">
          <InputField
            type="select"
            label={null}
            placeholder="Filter by subject..."
            value={selectedTopicSubjectId || null}
            selectOptions={subjectOptions}
            onChange={(e) => {
              const v = e.target.value as string;
              setTopicSubjectFilter(v);
              fetchTopics(v || undefined);
            }}
          />
        </div>
        <DataTable columns={columns} data={topics} loading={loadingTopics} keyExtractor={(r) => r.id} emptyMessage="No topics found" />
      </TabCard>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Topic</p>
        <p className="text-sm text-[#667085] mb-6">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button loading={deleteLoading} onClick={async () => { setDeleteLoading(true); await deleteTopic(deleteTarget!.id); setDeleteLoading(false); setDeleteTarget(null); }} className="flex-1 !bg-[#D42620]">Delete</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Passages Tab ──────────────────────────────────────────────────────────

function PassagesTab() {
  const {
    passages, loadingPassages, selectedPassageEtsId, setPassageEtsFilter,
    fetchPassages, deletePassage, examTypeSubjects, fetchExamTypeSubjects,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<IPassage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchExamTypeSubjects(); fetchPassages(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} — ${e.subject?.name ?? "?"}`,
  }));

  const columns: Column<IPassage>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium text-[#101828]">{r.title}</span> },
    {
      key: "scope", header: "Exam Type → Subject",
      render: (r) => (
        <span className="text-sm text-[#667085]">
          {r.examTypeSubject?.examType?.name ?? "?"} → {r.examTypeSubject?.subject?.name ?? "?"}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusChip variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions", header: "", render: (r) => canEdit ? (
        <div className="flex gap-2">
          <button onClick={() => router.push(`/exam-revision/passages/${r.id}/edit`)} className="text-xs text-[#007FFF] hover:underline">Edit</button>
          <span className="text-[#D0D5DD]">|</span>
          <button onClick={() => setDeleteTarget(r)} className="text-xs text-[#D42620] hover:underline">Delete</button>
        </div>
      ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Passages"
        subtitle={`${passages.length} passages`}
        action={canEdit ? (
          <Button onClick={() => router.push("/exam-revision/passages/new")} className="flex items-center gap-2">
            <Icon icon="hugeicons:add-01" width={16} /> Add Passage
          </Button>
        ) : undefined}
      >
        <div className="px-6 py-3 border-b border-[#F0F2F5]">
          <InputField
            type="select"
            label={null}
            placeholder="Filter by exam type + subject..."
            value={selectedPassageEtsId || null}
            selectOptions={etsOptions}
            onChange={(e) => {
              const v = e.target.value as string;
              setPassageEtsFilter(v);
              fetchPassages(v || undefined);
            }}
          />
        </div>
        <DataTable columns={columns} data={passages} loading={loadingPassages} keyExtractor={(r) => r.id} emptyMessage="No passages found" />
      </TabCard>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Passage</p>
        <p className="text-sm text-[#667085] mb-6">Delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button loading={deleteLoading} onClick={async () => { setDeleteLoading(true); await deletePassage(deleteTarget!.id); setDeleteLoading(false); setDeleteTarget(null); }} className="flex-1 !bg-[#D42620]">Delete</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Questions Tab ─────────────────────────────────────────────────────────

function QuestionsTab() {
  const {
    questions, questionsTotal, questionsPage, loadingQuestions,
    questionFilters, setQuestionFilters, fetchQuestions, deleteQuestion,
    examTypeSubjects, fetchExamTypeSubjects,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [bulkModal, setBulkModal] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchExamTypeSubjects();
    fetchQuestions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} — ${e.subject?.name ?? "?"}`,
  }));

  const applyFilters = useCallback(() => { fetchQuestions(1); }, [fetchQuestions]);

  const doBulkImport = async () => {
    setBulkLoading(true);
    try {
      const parsed = JSON.parse(bulkJson) as Record<string, unknown>[];
      const { api } = await import("@/src/lib/api");
      const res = await api.post<{ data: { created: number; errors: string[] } }>(
        "/admin/exam-revision/questions/bulk-import",
        { questions: parsed },
      );
      setBulkResult(res.data.data);
      void fetchQuestions(1);
    } catch {
      setBulkResult({ created: 0, errors: ["Invalid JSON or request failed"] });
    } finally {
      setBulkLoading(false);
    }
  };

  const totalPages = Math.ceil(questionsTotal / 20);

  const columns: Column<IQuestion>[] = [
    {
      key: "text", header: "Question",
      render: (r) => (
        <p className="max-w-xs text-sm text-[#344054] truncate">{r.questionText}</p>
      ),
    },
    {
      key: "scope", header: "Exam → Subject",
      render: (r) => (
        <span className="text-xs text-[#667085]">
          {r.examTypeSubject?.examType?.name ?? "?"} / {r.examTypeSubject?.subject?.name ?? "?"}
        </span>
      ),
    },
    { key: "type", header: "Type", render: (r) => <span className="text-xs capitalize text-[#344054]">{r.type.replace(/_/g, " ")}</span> },
    { key: "difficulty", header: "Diff.", render: (r) => <StatusChip variant={r.difficulty === "hard" ? "error" : r.difficulty === "easy" ? "success" : "warning"} label={r.difficulty} /> },
    { key: "marks", header: "Marks", render: (r) => <span className="text-sm text-[#344054]">{r.marks}</span> },
    { key: "status", header: "Status", render: (r) => <StatusChip variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions", header: "",
      render: (r) => (
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/exam-revision/questions/${r.id}/edit`} className="text-xs text-[#007FFF] hover:underline">
              Edit
            </Link>
          )}
          {canEdit && (
            <>
              <span className="text-[#D0D5DD]">|</span>
              <button onClick={() => setDeleteTarget(r)} className="text-xs text-[#D42620] hover:underline">Delete</button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <TabCard
        title="Questions"
        subtitle={`${questionsTotal} questions`}
        action={canEdit ? (
          <div className="flex gap-2">
            <Button onClick={() => setBulkModal(true)} className="!bg-white !text-[#344054] border border-[#D0D5DD] flex items-center gap-2">
              <Icon icon="hugeicons:file-import" width={16} /> Import JSON
            </Button>
            <Link href="/exam-revision/questions/new">
              <Button className="flex items-center gap-2">
                <Icon icon="hugeicons:add-01" width={16} /> New Question
              </Button>
            </Link>
          </div>
        ) : undefined}
      >
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-[#F0F2F5]">
          <InputField
            type="select"
            label={null}
            placeholder="Exam → Subject"
            value={questionFilters.examTypeSubjectId || null}
            selectOptions={etsOptions}
            onChange={(e) => setQuestionFilters({ examTypeSubjectId: e.target.value as string })}
          />
          <InputField
            type="select"
            label={null}
            placeholder="Type..."
            value={questionFilters.type || null}
            selectOptions={QUESTION_TYPE_OPTIONS}
            onChange={(e) => setQuestionFilters({ type: e.target.value as string })}
          />
          <InputField
            type="select"
            label={null}
            placeholder="Difficulty..."
            value={questionFilters.difficulty || null}
            selectOptions={DIFFICULTY_OPTIONS}
            onChange={(e) => setQuestionFilters({ difficulty: e.target.value as string })}
          />
          <div className="flex gap-2">
            <InputField
              label={null}
              placeholder="Search text..."
              value={questionFilters.search}
              onChange={(e) => setQuestionFilters({ search: e.target.value as string })}
            />
            <Button onClick={applyFilters} className="!px-3 shrink-0">
              <Icon icon="hugeicons:search-01" width={16} />
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={questions}
          loading={loadingQuestions}
          keyExtractor={(r) => r.id}
          emptyMessage="No questions found. Adjust filters or add a question."
          pagination={totalPages > 1}
          metaData={{
            currentPage: questionsPage,
            endPage: totalPages,
            totalRecords: questionsTotal,
            onPageChange: (page) => fetchQuestions(page),
          }}
        />
      </TabCard>

      {/* Bulk JSON Import Modal */}
      <Modal isOpen={bulkModal} onClose={() => { setBulkModal(false); setBulkJson(""); setBulkResult(null); }} className="w-full max-w-2xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-semibold text-[#101828]">Bulk Import Questions (JSON)</p>
          <button onClick={() => { setBulkModal(false); setBulkJson(""); setBulkResult(null); }} className="text-[#667085]"><Icon icon="hugeicons:cancel-01" width={20} /></button>
        </div>
        {bulkResult ? (
          <div>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-[#166534]">{bulkResult.created} questions imported successfully</p>
            </div>
            {bulkResult.errors.length > 0 && (
              <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-[#991B1B] mb-2">{bulkResult.errors.length} errors:</p>
                <ul className="text-xs text-[#B91C1C] list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {bulkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <Button onClick={() => { setBulkModal(false); setBulkJson(""); setBulkResult(null); }} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#667085] mb-3">
              Paste a JSON array. Each object must have: <code className="bg-[#F9FAFB] px-1 rounded">examTypeSubjectId, questionText, type, category, difficulty</code> and optionally: <code className="bg-[#F9FAFB] px-1 rounded">options, correctAnswer, explanationShort, explanationLong, topicId, passageId, marks</code>
            </p>
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='[{"examTypeSubjectId":"...", "questionText":"...", "type":"multiple_choice", ...}]'
              className="w-full h-64 border border-[#D0D5DD] rounded-lg p-3 text-sm font-mono text-[#344054] focus:outline-none focus:border-[#007FFF] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setBulkModal(false)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
              <Button onClick={doBulkImport} loading={bulkLoading} disabled={!bulkJson.trim()} className="flex-1">Import</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-full max-w-sm rounded-2xl p-6">
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Question</p>
        <p className="text-sm text-[#667085] mb-6 line-clamp-2">{deleteTarget?.questionText}</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]">Cancel</Button>
          <Button loading={deleteLoading} onClick={async () => { setDeleteLoading(true); await deleteQuestion(deleteTarget!.id); setDeleteLoading(false); setDeleteTarget(null); }} className="flex-1 !bg-[#D42620]">Delete</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Main ExamRevision Component ───────────────────────────────────────────

type Tab = "Exam Types" | "Subjects" | "Topics" | "Passages" | "Questions";

const TAB_LABELS: Record<Tab, string> = {
  "Exam Types": "Exam Types",
  Subjects: "Subjects",
  Topics: "Topics",
  Passages: "Passages",
  Questions: "Questions",
};

export default function ExamRevision({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">
          {TAB_LABELS[tab]}
        </h1>
        <p className="text-sm text-[#667085] mt-1">
          Manage exam types, subjects, topics, passages, and questions
        </p>
      </div>

      {tab === "Exam Types" && <ExamTypesTab />}
      {tab === "Subjects" && <SubjectsTab />}
      {tab === "Topics" && <TopicsTab />}
      {tab === "Passages" && <PassagesTab />}
      {tab === "Questions" && <QuestionsTab />}
    </div>
  );
}
