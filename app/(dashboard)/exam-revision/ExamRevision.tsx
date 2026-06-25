"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import {
  AdminModule,
  IExamType,
  ISubject,
  IExamTypeSubjectWithStats,
  ITopic,
  IPassage,
  IQuestion,
} from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import {
  examTypeSchema,
  ExamTypeValues,
  subjectSchema,
  SubjectValues,
  topicSchema,
  TopicValues,
  passageSchema,
  PassageValues,
} from "@/src/schemas/exam-revision.schema";
import { CheckBox } from "@/src/components/atoms/CheckBox";
import { CARD_SHADOW, stripMarkdownPreview } from "@/src/utils";

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
    <div
      className="bg-white overflow-hidden rounded-2xl flex flex-col"
      style={{ boxShadow: CARD_SHADOW }}
    >
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
    examTypes,
    examTypesTotal,
    examTypesPage,
    examTypesSearch,
    loadingExamTypes,
    setExamTypesSearch,
    fetchExamTypes,
    createExamType,
    updateExamType,
    deleteExamType,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [modal, setModal] = useState<{ open: boolean; item: IExamType | null }>(
    { open: false, item: null },
  );
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<IExamType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingExamTypeId, setTogglingExamTypeId] = useState<string | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamTypeValues>({
    resolver: yupResolver(examTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      minSubjectsSelectable: 1,
      maxSubjectsSelectable: 4,
      freeTierQuestionLimit: 50,
      supportedCategories: ["objectives"],
    },
  });

  useEffect(() => {
    fetchExamTypes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    reset({
      name: "",
      description: "",
      minSubjectsSelectable: 1,
      maxSubjectsSelectable: 4,
      freeTierQuestionLimit: 50,
      supportedCategories: ["objectives"],
    });
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

  const closeModal = () => {
    setModal({ open: false, item: null });
    reset();
  };

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
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <span className="font-medium text-[#101828]">{r.name}</span>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (r) => (
        <span className="text-sm text-[#344054]">
          {r.minSubjectsSelectable}–{r.maxSubjectsSelectable}
        </span>
      ),
    },
    {
      key: "freeTier",
      header: "Free Tier Limit",
      render: (r) => (
        <span className="text-sm text-[#344054]">
          {r.freeTierQuestionLimit}
        </span>
      ),
    },
    {
      key: "categories",
      header: "Categories",
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          {r.supportedCategories.map((c) => (
            <span
              key={c}
              className="text-[0.65rem] bg-[#F0F2F5] text-[#344054] px-2 py-0.5 rounded-full capitalize"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingExamTypeId(r.id);
                await updateExamType(r.id, { isActive: !r.isActive }, () => {});
                setTogglingExamTypeId(null);
              }}
              disabled={
                togglingExamTypeId === r.id ||
                (r.isActive && (r.etsCount ?? 0) > 0)
              }
              title={
                r.isActive && (r.etsCount ?? 0) > 0
                  ? `Cannot deactivate: ${r.etsCount} subject link(s) still attached`
                  : undefined
              }
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingExamTypeId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Exam Types"
        subtitle={`${examTypes.length} types`}
        action={
          canEdit ? (
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Icon icon="hugeicons:add-01" width={16} /> Add
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={columns}
          data={examTypes}
          loading={loadingExamTypes}
          keyExtractor={(r) => r.id}
          emptyMessage="No exam types yet"
          shouldNotHaveBorder
          searchProps={{
            value: examTypesSearch,
            onChange: setExamTypesSearch,
            onSearch: () => fetchExamTypes(1),
            placeholder: "Search exam types...",
          }}
          pagination
          metaData={{
            currentPage: (examTypesPage - 1) * 50 + 1,
            endPage:
              examTypesTotal > examTypesPage * 50
                ? examTypesPage * 50 + 1
                : (examTypesPage - 1) * 50 + 1,
            totalRecords: examTypesTotal,
            onPageChange: (skip) => fetchExamTypes(Math.floor(skip / 50) + 1),
          }}
        />
      </TabCard>

      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        className="w-full max-w-lg rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-semibold text-[#101828]">
            {modal.item ? "Edit Exam Type" : "New Exam Type"}
          </p>
          <button onClick={closeModal} className="text-[#667085]">
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Name"
                placeholder="e.g. JAMB/UTME"
                error={errors.name?.message}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="textarea"
                label="Description"
                placeholder="Optional description..."
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="minSubjectsSelectable"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Min Subjects"
                  value={String(field.value)}
                  error={errors.minSubjectsSelectable?.message}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            <Controller
              name="maxSubjectsSelectable"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Max Subjects"
                  value={String(field.value)}
                  error={errors.maxSubjectsSelectable?.message}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
          <Controller
            name="freeTierQuestionLimit"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="number"
                label="Free Tier Question Limit"
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          <div>
            <p className="text-sm font-medium text-[#344054] mb-2">
              Supported Categories
            </p>
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
            <Button
              type="button"
              onClick={closeModal}
              className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {modal.item ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          Delete Exam Type
        </p>
        <p className="text-sm text-[#667085] mb-6">
          Delete <strong>{deleteTarget?.name}</strong>? This will cascade-delete
          all linked subjects and questions.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            loading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);
              await deleteExamType(deleteTarget!.id);
              setDeleteLoading(false);
              setDeleteTarget(null);
            }}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Subjects Tab ──────────────────────────────────────────────────────────

function SubjectsTab() {
  const {
    subjects,
    subjectsAll,
    subjectsTotal,
    subjectsPage,
    subjectsSearch,
    loadingSubjects,
    setSubjectsSearch,
    fetchSubjects,
    fetchAllSubjectsForSelect,
    createSubject,
    updateSubject,
    deleteSubject,
    examTypes,
    fetchExamTypes,
    linkExamTypeSubject,
    unlinkExamTypeSubject,
    updateEts,
    etsAll,
    etsAllTotal,
    etsAllPage,
    etsAllSearch,
    etsAllExamTypeFilter,
    etsAllSubjectFilter,
    loadingEtsAll,
    setEtsAllSearch,
    setEtsAllExamTypeFilter,
    setEtsAllSubjectFilter,
    fetchAllEts,
  } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [modal, setModal] = useState<{ open: boolean; item: ISubject | null }>({
    open: false,
    item: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<ISubject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [linkModal, setLinkModal] = useState<{
    open: boolean;
    examTypeId: string;
    subjectId: string;
    isCompulsory: boolean;
  }>({ open: false, examTypeId: "", subjectId: "", isCompulsory: false });
  const [etsFilterOpen, setEtsFilterOpen] = useState(false);
  const [etsPendingExamType, setEtsPendingExamType] = useState("");
  const [etsPendingSubject, setEtsPendingSubject] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [togglingEtsId, setTogglingEtsId] = useState<string | null>(null);
  const [togglingSubjectId, setTogglingSubjectId] = useState<string | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectValues>({
    resolver: yupResolver(subjectSchema),
    defaultValues: { name: "", description: "", isActive: true },
  });

  useEffect(() => {
    fetchSubjects();
    fetchExamTypes();
    fetchAllSubjectsForSelect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [subTab, setSubTab] = useState<"subjects" | "links">("subjects");
  const subTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [subPillStyle, setSubPillStyle] = useState({ left: 4, width: 80 });

  useLayoutEffect(() => {
    const el = subTabRefs.current[subTab === "subjects" ? 0 : 1];
    if (el) setSubPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [subTab]);

  useEffect(() => {
    if (subTab === "links") void fetchAllEts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const openCreate = () => {
    reset({ name: "", description: "", isActive: true, isAlsoPractical: false });
    setModal({ open: true, item: null });
  };
  const openEdit = (item: ISubject) => {
    reset({
      name: item.name,
      description: item.description ?? "",
      isActive: item.isActive,
      isAlsoPractical: item.isAlsoPractical ?? false,
    });
    setModal({ open: true, item });
  };
  const closeModal = () => {
    setModal({ open: false, item: null });
    reset();
  };

  const onSubmit = async (data: SubjectValues) => {
    if (modal.item) {
      await updateSubject(modal.item.id, data, closeModal);
    } else {
      await createSubject(data, closeModal);
    }
  };

  const subjectSelectOptions = (
    subjectsAll.length ? subjectsAll : subjects
  ).map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const etSelectOptions = examTypes.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const columns: Column<ISubject>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <span className="font-medium text-[#101828]">{r.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => (
        <span className="text-sm text-[#667085]">{r.description ?? "—"}</span>
      ),
    },
    {
      key: "totalQuestions",
      header: "Questions",
      render: (r) => (
        <span className="text-sm text-[#344054]">{r.totalQuestions}</span>
      ),
    },
    {
      key: "isAlsoPractical",
      header: "Practical",
      render: (r) =>
        r.isAlsoPractical ? (
          <StatusChip variant="warning" label="Practical" />
        ) : (
          <span className="text-xs text-[#667085]">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingSubjectId(r.id);
                await updateSubject(r.id, { isActive: !r.isActive }, () => {});
                setTogglingSubjectId(null);
              }}
              disabled={
                togglingSubjectId === r.id ||
                (r.isActive && (r.etsCount ?? 0) > 0)
              }
              title={
                r.isActive && (r.etsCount ?? 0) > 0
                  ? `Cannot deactivate: ${r.etsCount} exam type link(s) still attached`
                  : undefined
              }
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingSubjectId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  const etsColumns: Column<IExamTypeSubjectWithStats>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (r) => (
        <span className="text-sm font-medium text-[#101828]">
          {r.subject?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "examType",
      header: "Exam Type",
      render: (r) => (
        <span className="text-sm text-[#344054]">
          {r.examType?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "compulsory",
      header: "Compulsory",
      render: (r) => (
        <StatusChip
          variant={r.isCompulsory ? "info" : "neutral"}
          label={r.isCompulsory ? "Yes" : "No"}
        />
      ),
    },
    {
      key: "questionCount",
      header: "Questions",
      render: (r) => (
        <span className="text-sm text-[#344054]">{r.questionCount}</span>
      ),
    },
    {
      key: "passageCount",
      header: "Passages",
      render: (r) => (
        <span className="text-sm text-[#344054]">{r.passageCount}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setTogglingEtsId(r.id);
                await updateEts(r.id, { isCompulsory: !r.isCompulsory });
                setTogglingEtsId(null);
              }}
              disabled={togglingEtsId === r.id || unlinkingId === r.id}
              title={r.isCompulsory ? "Mark as optional" : "Mark as compulsory"}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {togglingEtsId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
              {r.isCompulsory ? "Optional" : "Compulsory"}
            </button>
            <button
              onClick={async () => {
                setUnlinkingId(r.id);
                await unlinkExamTypeSubject(r.id);
                setUnlinkingId(null);
              }}
              disabled={
                r.questionCount > 0 ||
                r.passageCount > 0 ||
                unlinkingId === r.id
              }
              title={
                r.questionCount > 0 || r.passageCount > 0
                  ? `Cannot unlink: ${r.questionCount} question(s), ${r.passageCount} passage(s)`
                  : undefined
              }
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent flex items-center gap-1"
            >
              {unlinkingId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
              Unlink
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      {/* Sub-tab switcher */}
      <div className="relative flex bg-[#F9FAFB] p-1 rounded-xl w-fit border border-[#F0F2F5]">
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
          style={{
            left: `${subPillStyle.left}px`,
            width: `${subPillStyle.width}px`,
            transition:
              "left 300ms cubic-bezier(0.34, 1.56, 0.64, 1), width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
        {(["subjects", "links"] as const).map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              subTabRefs.current[i] = el;
            }}
            onClick={() => setSubTab(t)}
            className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              subTab === t
                ? "text-[#101828]"
                : "text-[#667085] hover:text-[#344054]"
            }`}
          >
            {t === "subjects" ? "Subjects" : "Exam Type Links"}
          </button>
        ))}
      </div>

      {subTab === "subjects" && (
        <TabCard
          title="Subjects"
          subtitle={`${subjects.length} subjects`}
          action={
            canEdit ? (
              <Button onClick={openCreate} className="flex items-center gap-2">
                <Icon icon="hugeicons:add-01" width={16} /> Add Subject
              </Button>
            ) : undefined
          }
        >
          <DataTable
            columns={columns}
            data={subjects}
            loading={loadingSubjects}
            keyExtractor={(r) => r.id}
            emptyMessage="No subjects yet"
            shouldNotHaveBorder
            searchProps={{
              value: subjectsSearch,
              onChange: setSubjectsSearch,
              onSearch: () => fetchSubjects(1),
              placeholder: "Search subjects...",
            }}
            pagination
            metaData={{
              currentPage: (subjectsPage - 1) * 50 + 1,
              endPage:
                subjectsTotal > subjectsPage * 50
                  ? subjectsPage * 50 + 1
                  : (subjectsPage - 1) * 50 + 1,
              totalRecords: subjectsTotal,
              onPageChange: (skip) => fetchSubjects(Math.floor(skip / 50) + 1),
            }}
          />
        </TabCard>
      )}

      {subTab === "links" && (
        <TabCard
          title="Exam Type Links"
          subtitle={`${etsAllTotal} links`}
          action={
            canEdit ? (
              <Button
                onClick={() =>
                  setLinkModal({
                    open: true,
                    examTypeId: "",
                    subjectId: "",
                    isCompulsory: false,
                  })
                }
                className="flex items-center gap-2"
              >
                <Icon icon="hugeicons:link-01" width={16} /> Link Subject
              </Button>
            ) : undefined
          }
        >
          {/* Filter bar */}
          <div className="px-6 py-3 border-b border-[#F0F2F5] flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setEtsFilterOpen((o) => !o)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                etsFilterOpen || etsAllExamTypeFilter || etsAllSubjectFilter
                  ? "border-[#007FFF] text-[#007FFF] bg-[#E5F0FF]"
                  : "border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB]"
              }`}
            >
              <Icon icon="hugeicons:filter" width={14} />
              Filters
              {(etsAllExamTypeFilter || etsAllSubjectFilter) && (
                <span className="ml-1 bg-[#007FFF] text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {
                    [etsAllExamTypeFilter, etsAllSubjectFilter].filter(Boolean)
                      .length
                  }
                </span>
              )}
            </button>
            {etsAllExamTypeFilter && (
              <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full">
                {examTypes.find((e) => e.id === etsAllExamTypeFilter)?.name ??
                  "Exam Type"}
                <button
                  onClick={() => {
                    setEtsAllExamTypeFilter("");
                    setEtsPendingExamType("");
                    void fetchAllEts(1);
                  }}
                  className="hover:text-[#D42620]"
                >
                  <Icon icon="hugeicons:cancel-01" width={10} />
                </button>
              </span>
            )}
            {etsAllSubjectFilter && (
              <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full">
                {subjects.find((s) => s.id === etsAllSubjectFilter)?.name ??
                  "Subject"}
                <button
                  onClick={() => {
                    setEtsAllSubjectFilter("");
                    setEtsPendingSubject("");
                    void fetchAllEts(1);
                  }}
                  className="hover:text-[#D42620]"
                >
                  <Icon icon="hugeicons:cancel-01" width={10} />
                </button>
              </span>
            )}
          </div>

          {/* Collapsible filter panel */}
          {etsFilterOpen && (
            <div className="px-6 py-4 border-b border-[#F0F2F5] bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 gap-3">
              <InputField
                type="select"
                label="Exam Type"
                placeholder="Any..."
                value={etsPendingExamType || null}
                selectOptions={etSelectOptions}
                onChange={(e) =>
                  setEtsPendingExamType(e.target.value as string)
                }
              />
              <InputField
                type="select"
                label="Subject"
                placeholder="Any..."
                value={etsPendingSubject || null}
                selectOptions={subjectSelectOptions}
                onChange={(e) => setEtsPendingSubject(e.target.value as string)}
              />
              <div className="md:col-span-3 flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setEtsPendingExamType("");
                    setEtsPendingSubject("");
                    setEtsAllExamTypeFilter("");
                    setEtsAllSubjectFilter("");
                    void fetchAllEts(1);
                    setEtsFilterOpen(false);
                  }}
                  className="bg-white! text-[#344054]! border border-[#D0D5DD]"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => {
                    setEtsAllExamTypeFilter(etsPendingExamType);
                    setEtsAllSubjectFilter(etsPendingSubject);
                    void fetchAllEts(1);
                    setEtsFilterOpen(false);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={etsColumns}
            data={etsAll}
            loading={loadingEtsAll}
            keyExtractor={(r) => r.id}
            emptyMessage="No exam type / subject links yet"
            shouldNotHaveBorder
            searchProps={{
              value: etsAllSearch,
              onChange: setEtsAllSearch,
              onSearch: () => fetchAllEts(1),
              placeholder: "Search by exam type or subject...",
            }}
            pagination
            metaData={{
              currentPage: (etsAllPage - 1) * 50 + 1,
              endPage:
                etsAllTotal > etsAllPage * 50
                  ? etsAllPage * 50 + 1
                  : (etsAllPage - 1) * 50 + 1,
              totalRecords: etsAllTotal,
              onPageChange: (skip) => fetchAllEts(Math.floor(skip / 50) + 1),
            }}
          />
        </TabCard>
      )}

      {/* Subject/Create modals */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        className="w-full max-w-md rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-semibold text-[#101828]">
            {modal.item ? "Edit Subject" : "New Subject"}
          </p>
          <button onClick={closeModal} className="text-[#667085]">
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Name"
                placeholder="e.g. Mathematics"
                error={errors.name?.message}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="textarea"
                label="Description"
                placeholder="Optional..."
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          {modal.item && (
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <CheckBox
                    value={!!field.value}
                    onChange={() => field.onChange(!field.value)}
                  />
                  <span className="text-sm text-[#344054]">Active</span>
                </label>
              )}
            />
          )}
          <Controller
            name="isAlsoPractical"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer">
                <CheckBox
                  value={!!field.value}
                  onChange={() => field.onChange(!field.value)}
                />
                <span className="text-sm text-[#344054]">Also has practical component</span>
              </label>
            )}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={closeModal}
              className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {modal.item ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Subject modal */}
      <Modal
        isOpen={linkModal.open}
        onClose={() =>
          setLinkModal({
            open: false,
            examTypeId: "",
            subjectId: "",
            isCompulsory: false,
          })
        }
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-4">
          Link Subject
        </p>
        <div className="flex flex-col gap-4">
          <InputField
            type="select"
            label="Exam Type"
            placeholder="Select exam type..."
            value={linkModal.examTypeId || null}
            selectOptions={etSelectOptions}
            onChange={(e) =>
              setLinkModal((p) => ({
                ...p,
                examTypeId: e.target.value as string,
              }))
            }
          />
          <InputField
            type="select"
            label="Subject"
            placeholder="Select subject..."
            value={linkModal.subjectId || null}
            selectOptions={subjectSelectOptions}
            onChange={(e) =>
              setLinkModal((p) => ({
                ...p,
                subjectId: e.target.value as string,
              }))
            }
          />
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <CheckBox
                value={linkModal.isCompulsory}
                onChange={() =>
                  setLinkModal((p) => ({ ...p, isCompulsory: !p.isCompulsory }))
                }
              />
              <div>
                <p className="text-sm font-medium text-[#344054]">
                  Compulsory subject
                </p>
                <p className="text-xs text-[#667085] mt-0.5">
                  Compulsory subjects are mandatory for all students in this
                  exam type — they cannot deselect it when choosing subjects.
                  Example: English Language is compulsory for JAMB.
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() =>
              setLinkModal({
                open: false,
                examTypeId: "",
                subjectId: "",
                isCompulsory: false,
              })
            }
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            disabled={!linkModal.examTypeId || !linkModal.subjectId}
            loading={linkLoading}
            onClick={async () => {
              if (!linkModal.examTypeId || !linkModal.subjectId) return;
              setLinkLoading(true);
              await linkExamTypeSubject(
                linkModal.examTypeId,
                linkModal.subjectId,
                linkModal.isCompulsory,
                () =>
                  setLinkModal({
                    open: false,
                    examTypeId: "",
                    subjectId: "",
                    isCompulsory: false,
                  }),
              );
              setLinkLoading(false);
            }}
            className="flex-1"
          >
            Link
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          Delete Subject
        </p>
        <p className="text-sm text-[#667085] mb-6">
          Delete <strong>{deleteTarget?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            loading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);
              await deleteSubject(deleteTarget!.id);
              setDeleteLoading(false);
              setDeleteTarget(null);
            }}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Topics Tab ────────────────────────────────────────────────────────────

function TopicsTab() {
  const {
    topics,
    topicsTotal,
    topicsPage,
    topicsSearch,
    loadingTopics,
    selectedTopicSubjectId,
    setTopicSubjectFilter,
    setTopicsSearch,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    subjects,
    subjectsAll,
    fetchSubjects,
    fetchAllSubjectsForSelect,
  } = useExamRevisionStore();
  const [togglingTopicId, setTogglingTopicId] = useState<string | null>(null);
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [deleteTarget, setDeleteTarget] = useState<ITopic | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingSubject, setPendingSubject] = useState("");
  const [topicDrawer, setTopicDrawer] = useState<{
    open: boolean;
    topic: ITopic | null;
  }>({ open: false, topic: null });

  const {
    control: topicControl,
    handleSubmit: handleTopicSubmit,
    reset: resetTopicForm,
    formState: { errors: topicErrors, isSubmitting: topicSubmitting },
  } = useForm<TopicValues>({
    resolver: yupResolver(topicSchema),
    defaultValues: { subjectId: "", name: "", content: "" },
  });

  useEffect(() => {
    fetchSubjects();
    fetchTopics();
    fetchAllSubjectsForSelect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subjectOptions = (subjectsAll.length ? subjectsAll : subjects).map(
    (s) => ({ value: s.id, label: s.name }),
  );

  const columns: Column<ITopic>[] = [
    {
      key: "name",
      header: "Topic",
      render: (r) => (
        <span className="font-medium text-[#101828]">{r.name}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (r) => (
        <span className="text-sm text-[#667085]">{r.subject?.name ?? "—"}</span>
      ),
    },
    {
      key: "content",
      header: "Content Preview",
      render: (r) => (
        <p className="max-w-xs text-sm text-[#344054] line-clamp-2">
          {r.content
            ? stripMarkdownPreview(r.content, 200, true)
            : <span className="text-[#667085] italic text-xs">No content</span>}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetTopicForm({
                  subjectId: r.subjectId ?? "",
                  name: r.name,
                  content: r.content ?? "",
                });
                setTopicDrawer({ open: true, topic: r });
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingTopicId(r.id);
                await updateTopic(r.id, { isActive: !r.isActive }, () => {});
                setTogglingTopicId(null);
              }}
              disabled={togglingTopicId === r.id}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingTopicId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Topics"
        subtitle={`${topics.length} topics`}
        action={
          canEdit ? (
            <Button
              onClick={() => {
                resetTopicForm({ subjectId: "", name: "", content: "" });
                setTopicDrawer({ open: true, topic: null });
              }}
              className="flex items-center gap-2"
            >
              <Icon icon="hugeicons:add-01" width={16} /> Add Topic
            </Button>
          ) : undefined
        }
      >
        <div className="px-6 py-3 border-b border-[#F0F2F5] flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filterOpen || selectedTopicSubjectId
                ? "border-[#007FFF] text-[#007FFF] bg-[#E5F0FF]"
                : "border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB]"
            }`}
          >
            <Icon icon="hugeicons:filter" width={14} />
            Filters
            {selectedTopicSubjectId && (
              <span className="ml-1 bg-[#007FFF] text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
          {selectedTopicSubjectId && (
            <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full">
              {subjectOptions.find((o) => o.value === selectedTopicSubjectId)
                ?.label ?? "Subject"}
              <button
                onClick={() => {
                  setPendingSubject("");
                  setTopicSubjectFilter("");
                  fetchTopics(1);
                }}
                className="hover:text-[#D42620]"
              >
                <Icon icon="hugeicons:cancel-01" width={10} />
              </button>
            </span>
          )}
        </div>

        {filterOpen && (
          <div className="px-6 py-4 border-b border-[#F0F2F5] bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField
              type="select"
              label="Subject"
              placeholder="Any..."
              value={pendingSubject || null}
              selectOptions={subjectOptions}
              onChange={(e) => setPendingSubject(e.target.value as string)}
            />
            <div className="md:col-span-2 flex gap-2 items-end justify-end">
              <Button
                onClick={() => {
                  setPendingSubject("");
                  setTopicSubjectFilter("");
                  fetchTopics(1);
                  setFilterOpen(false);
                }}
                className="bg-white! text-[#344054]! border border-[#D0D5DD]"
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  setTopicSubjectFilter(pendingSubject);
                  fetchTopics(1);
                  setFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={topics}
          loading={loadingTopics}
          keyExtractor={(r) => r.id}
          emptyMessage="No topics found"
          shouldNotHaveBorder
          searchProps={{
            value: topicsSearch,
            onChange: setTopicsSearch,
            onSearch: () => fetchTopics(1),
            placeholder: "Search topics...",
          }}
          pagination
          metaData={{
            currentPage: (topicsPage - 1) * 50 + 1,
            endPage:
              topicsTotal > topicsPage * 50
                ? topicsPage * 50 + 1
                : (topicsPage - 1) * 50 + 1,
            totalRecords: topicsTotal,
            onPageChange: (skip) => fetchTopics(Math.floor(skip / 50) + 1),
          }}
        />
      </TabCard>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          Delete Topic
        </p>
        <p className="text-sm text-[#667085] mb-6">
          Delete <strong>{deleteTarget?.name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            loading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);
              await deleteTopic(deleteTarget!.id);
              setDeleteLoading(false);
              setDeleteTarget(null);
            }}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Topic Drawer */}
      {topicDrawer.open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setTopicDrawer({ open: false, topic: null })}
          />
          <div className="absolute right-0 top-0 h-full w-[720px] bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
              <div>
                <p className="font-semibold text-[#101828]">
                  {topicDrawer.topic ? "Edit Topic" : "New Topic"}
                </p>
                {topicDrawer.topic?.subject && (
                  <p className="text-sm text-[#667085]">
                    Subject: {topicDrawer.topic.subject.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setTopicDrawer({ open: false, topic: null })}
                className="text-[#667085]"
              >
                <Icon icon="hugeicons:cancel-01" width={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form
                id="topic-drawer-form"
                onSubmit={handleTopicSubmit(async (data) => {
                  if (topicDrawer.topic) {
                    await updateTopic(
                      topicDrawer.topic.id,
                      { name: data.name, content: data.content ?? "" },
                      () => setTopicDrawer({ open: false, topic: null }),
                    );
                  } else {
                    await createTopic(
                      {
                        subjectId: data.subjectId,
                        name: data.name,
                        content: data.content ?? "",
                      },
                      () => setTopicDrawer({ open: false, topic: null }),
                    );
                  }
                })}
                className="flex flex-col gap-5"
              >
                {!topicDrawer.topic && (
                  <Controller
                    name="subjectId"
                    control={topicControl}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        type="select"
                        label="Subject"
                        placeholder="Select subject..."
                        value={field.value || null}
                        selectOptions={subjectOptions}
                        error={topicErrors.subjectId?.message}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    )}
                  />
                )}
                <Controller
                  name="name"
                  control={topicControl}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Topic Name"
                      placeholder="e.g. Differentiation"
                      error={topicErrors.name?.message}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name="content"
                  control={topicControl}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      type="rich-text"
                      label="Content"
                      value={field.value ?? ""}
                      richTextProps={{
                        minHeight: "400px",
                        image: { allowed: true, folder: "topics" },
                      }}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-[#EAECF0] flex gap-3">
              <Button
                type="button"
                onClick={() => setTopicDrawer({ open: false, topic: null })}
                className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="topic-drawer-form"
                loading={topicSubmitting}
                className="flex-1"
              >
                {topicDrawer.topic ? "Save Changes" : "Create Topic"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Passages Tab ──────────────────────────────────────────────────────────

function PassagesTab() {
  const {
    passages,
    passagesTotal,
    passagesPage,
    passagesSearch,
    loadingPassages,
    selectedPassageEtsId,
    setPassageEtsFilter,
    setPassagesSearch,
    fetchPassages,
    createPassage,
    updatePassage,
    deletePassage,
    examTypeSubjects,
    fetchExamTypeSubjects,
  } = useExamRevisionStore();
  const [togglingPassageId, setTogglingPassageId] = useState<string | null>(
    null,
  );
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [deleteTarget, setDeleteTarget] = useState<IPassage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingEts, setPendingEts] = useState("");
  const [passageDrawer, setPassageDrawer] = useState<{
    open: boolean;
    passage: IPassage | null;
  }>({ open: false, passage: null });

  const {
    control: passageControl,
    handleSubmit: handlePassageSubmit,
    reset: resetPassageForm,
    formState: { errors: passageErrors, isSubmitting: passageSubmitting },
  } = useForm<PassageValues>({
    resolver: yupResolver(passageSchema),
    defaultValues: { examTypeSubjectIds: [], title: "", content: "" },
  });

  useEffect(() => {
    fetchExamTypeSubjects();
    fetchPassages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`,
  }));

  const columns: Column<IPassage>[] = [
    {
      key: "title",
      header: "Title / Content",
      render: (r) => (
        <div className="max-w-xs">
          <span className="font-medium text-[#101828] block">{r.title}</span>
          {r.content && (
            <p className="text-sm text-[#344054] line-clamp-2 mt-0.5">
              {stripMarkdownPreview(r.content, 200, true)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "scope",
      header: "Exam Type / Subject",
      render: (r) => {
        const text = r.examTypeSubjects?.length
          ? r.examTypeSubjects
              .map((e) => `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`)
              .join(", ")
          : "—";
        return (
          <span
            title={text}
            className="text-sm text-[#667085] block max-w-[200px] truncate"
          >
            {text}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetPassageForm({
                  examTypeSubjectIds: r.examTypeSubjectIds ?? [],
                  title: r.title,
                  content: r.content ?? "",
                });
                setPassageDrawer({ open: true, passage: r });
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingPassageId(r.id);
                await updatePassage(r.id, { isActive: !r.isActive }, () => {});
                setTogglingPassageId(null);
              }}
              disabled={togglingPassageId === r.id}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingPassageId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Passages"
        subtitle={`${passages.length} passages`}
        action={
          canEdit ? (
            <Button
              onClick={() => {
                resetPassageForm({
                  examTypeSubjectIds: [],
                  title: "",
                  content: "",
                });
                setPassageDrawer({ open: true, passage: null });
              }}
              className="flex items-center gap-2"
            >
              <Icon icon="hugeicons:add-01" width={16} /> Add Passage
            </Button>
          ) : undefined
        }
      >
        <div className="px-6 py-3 border-b border-[#F0F2F5] flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filterOpen || selectedPassageEtsId
                ? "border-[#007FFF] text-[#007FFF] bg-[#E5F0FF]"
                : "border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB]"
            }`}
          >
            <Icon icon="hugeicons:filter" width={14} />
            Filters
            {selectedPassageEtsId && (
              <span className="ml-1 bg-[#007FFF] text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
          {selectedPassageEtsId && (
            <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full">
              {etsOptions.find((o) => o.value === selectedPassageEtsId)
                ?.label ?? "Scope"}
              <button
                onClick={() => {
                  setPendingEts("");
                  setPassageEtsFilter("");
                  fetchPassages(1);
                }}
                className="hover:text-[#D42620]"
              >
                <Icon icon="hugeicons:cancel-01" width={10} />
              </button>
            </span>
          )}
        </div>

        {filterOpen && (
          <div className="px-6 py-4 border-b border-[#F0F2F5] bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField
              type="select"
              label="Exam Type / Subject"
              placeholder="Any..."
              value={pendingEts || null}
              selectOptions={etsOptions}
              onChange={(e) => setPendingEts(e.target.value as string)}
            />
            <div className="md:col-span-2 flex gap-2 items-end justify-end">
              <Button
                onClick={() => {
                  setPendingEts("");
                  setPassageEtsFilter("");
                  fetchPassages(1);
                  setFilterOpen(false);
                }}
                className="bg-white! text-[#344054]! border border-[#D0D5DD]"
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  setPassageEtsFilter(pendingEts);
                  fetchPassages(1);
                  setFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={passages}
          loading={loadingPassages}
          keyExtractor={(r) => r.id}
          emptyMessage="No passages found"
          shouldNotHaveBorder
          searchProps={{
            value: passagesSearch,
            onChange: setPassagesSearch,
            onSearch: () => fetchPassages(1),
            placeholder: "Search passages...",
          }}
          pagination
          metaData={{
            currentPage: (passagesPage - 1) * 50 + 1,
            endPage:
              passagesTotal > passagesPage * 50
                ? passagesPage * 50 + 1
                : (passagesPage - 1) * 50 + 1,
            totalRecords: passagesTotal,
            onPageChange: (skip) => fetchPassages(Math.floor(skip / 50) + 1),
          }}
        />
      </TabCard>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          Delete Passage
        </p>
        <p className="text-sm text-[#667085] mb-6">
          Delete <strong>{deleteTarget?.title}</strong>?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            loading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);
              await deletePassage(deleteTarget!.id);
              setDeleteLoading(false);
              setDeleteTarget(null);
            }}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Passage Drawer */}
      {passageDrawer.open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPassageDrawer({ open: false, passage: null })}
          />
          <div className="absolute right-0 top-0 h-full w-[720px] bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
              <div>
                <p className="font-semibold text-[#101828]">
                  {passageDrawer.passage ? "Edit Passage" : "New Passage"}
                </p>
                {passageDrawer.passage?.examTypeSubjects?.length ? (
                  <p className="text-sm text-[#667085]">
                    {passageDrawer.passage.examTypeSubjects
                      .map((e) => `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <button
                onClick={() => setPassageDrawer({ open: false, passage: null })}
                className="text-[#667085]"
              >
                <Icon icon="hugeicons:cancel-01" width={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form
                id="passage-drawer-form"
                onSubmit={handlePassageSubmit(async (data) => {
                  if (passageDrawer.passage) {
                    await updatePassage(
                      passageDrawer.passage.id,
                      { examTypeSubjectIds: data.examTypeSubjectIds, title: data.title, content: data.content },
                      () => setPassageDrawer({ open: false, passage: null }),
                    );
                  } else {
                    await createPassage(
                      {
                        examTypeSubjectIds: data.examTypeSubjectIds,
                        title: data.title,
                        content: data.content,
                      },
                      () => setPassageDrawer({ open: false, passage: null }),
                    );
                  }
                })}
                className="flex flex-col gap-5"
              >
                <Controller
                  name="examTypeSubjectIds"
                  control={passageControl}
                  render={({ field }) => (
                    <InputField
                      type="multi-select"
                      label="Exam Type / Subject (select all that apply)"
                      placeholder="Select one or more..."
                      value={(field.value ?? []).join(",")}
                      selectOptions={etsOptions}
                      error={(passageErrors.examTypeSubjectIds as { message?: string })?.message}
                      onChange={(e) =>
                        field.onChange(
                          (e.target.value as string)
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  )}
                />
                <Controller
                  name="title"
                  control={passageControl}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Title"
                      placeholder="e.g. Read the following passage carefully"
                      error={passageErrors.title?.message}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name="content"
                  control={passageControl}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      type="rich-text"
                      label="Content"
                      value={field.value ?? ""}
                      richTextProps={{
                        minHeight: "400px",
                        image: { allowed: true, folder: "passages" },
                      }}
                      error={passageErrors.content?.message}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </form>
            </div>
            <div className="px-6 py-4 border-t border-[#EAECF0] flex gap-3">
              <Button
                type="button"
                onClick={() => setPassageDrawer({ open: false, passage: null })}
                className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="passage-drawer-form"
                loading={passageSubmitting}
                className="flex-1"
              >
                {passageDrawer.passage ? "Save Changes" : "Create Passage"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Questions Tab ─────────────────────────────────────────────────────────

function QuestionsTab() {
  const {
    questions,
    questionsTotal,
    questionsPage,
    loadingQuestions,
    questionFilters,
    setQuestionFilters,
    fetchQuestions,
    updateQuestion,
    deleteQuestion,
    examTypeSubjects,
    fetchExamTypeSubjects,
  } = useExamRevisionStore();
  const [togglingQuestionId, setTogglingQuestionId] = useState<string | null>(
    null,
  );
  const { canWrite } = useAdminAuthStore();
  const canEdit = canWrite(AdminModule.EXAM_REVISION);

  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingEts, setPendingEts] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [pendingDifficulty, setPendingDifficulty] = useState("");
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchExamTypeSubjects();
    fetchQuestions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`,
  }));

  const applyFilters = () => {
    setQuestionFilters({
      examTypeSubjectId: pendingEts,
      type: pendingType,
      difficulty: pendingDifficulty,
    });
    fetchQuestions(1);
    setFilterOpen(false);
  };

  const clearFilter = (key: "examTypeSubjectId" | "type" | "difficulty") => {
    const next = {
      examTypeSubjectId: pendingEts,
      type: pendingType,
      difficulty: pendingDifficulty,
      [key]: "",
    };
    if (key === "examTypeSubjectId") setPendingEts("");
    if (key === "type") setPendingType("");
    if (key === "difficulty") setPendingDifficulty("");
    setQuestionFilters(next);
    fetchQuestions(1);
  };

  const activeFilterCount = [
    questionFilters.examTypeSubjectId,
    questionFilters.type,
    questionFilters.difficulty,
  ].filter(Boolean).length;

  const doBulkImport = async () => {
    setBulkLoading(true);
    try {
      const parsed = JSON.parse(bulkJson) as Record<string, unknown>[];
      const { api } = await import("@/src/lib/api");
      const res = await api.post<{
        data: { created: number; errors: string[] };
      }>("/admin/exam-revision/questions/bulk-import", { questions: parsed });
      setBulkResult(res.data.data);
      void fetchQuestions(1);
    } catch {
      setBulkResult({ created: 0, errors: ["Invalid JSON or request failed"] });
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<IQuestion>[] = [
    {
      key: "text",
      header: "Question",
      render: (r) => (
        <p className="max-w-xs text-sm text-[#344054] line-clamp-2">
          {stripMarkdownPreview(r.questionText, 300, true)}
        </p>
      ),
    },
    {
      key: "scope",
      header: "Exam Type / Subject",
      render: (r) => {
        const text = r.examTypeSubjects?.length
          ? r.examTypeSubjects
              .map((e) => `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`)
              .join(", ")
          : "—";
        return (
          <span
            className="max-w-[200px] truncate block text-xs text-[#667085]"
            title={text}
          >
            {text}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span className="text-xs capitalize text-[#344054]">
          {r.type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "difficulty",
      header: "Diff.",
      render: (r) => (
        <StatusChip
          variant={
            r.difficulty === "hard"
              ? "error"
              : r.difficulty === "easy"
                ? "success"
                : "warning"
          }
          label={r.difficulty.charAt(0).toUpperCase() + r.difficulty.slice(1)}
        />
      ),
    },
    {
      key: "marks",
      header: "Marks",
      render: (r) => <span className="text-sm text-[#344054]">{r.marks}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        canEdit ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/exam-revision/questions/${r.id}/edit`}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={async () => {
                setTogglingQuestionId(r.id);
                await updateQuestion(r.id, { isActive: !r.isActive });
                setTogglingQuestionId(null);
              }}
              disabled={togglingQuestionId === r.id}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingQuestionId === r.id && (
                <svg
                  className="animate-spin w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setDeleteTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Questions"
        subtitle={`${questionsTotal} questions`}
        action={
          canEdit ? (
            <div className="flex gap-2">
              <Button
                onClick={() => toast.info("Feature coming soon")}
                className="!bg-white !text-[#344054] border border-[#D0D5DD] flex items-center gap-2"
              >
                <Icon icon="hugeicons:download-04" width={16} /> CSV Template
              </Button>
              <Button
                onClick={() => toast.info("Feature coming soon")}
                className="!bg-white !text-[#344054] border border-[#D0D5DD] flex items-center gap-2"
              >
                <Icon icon="hugeicons:file-import" width={16} /> Import JSON
              </Button>
              <Link href="/exam-revision/questions/new">
                <Button className="flex items-center gap-2">
                  <Icon icon="hugeicons:add-01" width={16} /> New Question
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      >
        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-[#F0F2F5] flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filterOpen || activeFilterCount > 0
                ? "border-[#007FFF] text-[#007FFF] bg-[#E5F0FF]"
                : "border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB]"
            }`}
          >
            <Icon icon="hugeicons:filter" width={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-[#007FFF] text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {questionFilters.examTypeSubjectId && (
            <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full">
              {etsOptions.find(
                (o) => o.value === questionFilters.examTypeSubjectId,
              )?.label ?? "Scope"}
              <button
                onClick={() => clearFilter("examTypeSubjectId")}
                className="hover:text-[#D42620]"
              >
                <Icon icon="hugeicons:cancel-01" width={10} />
              </button>
            </span>
          )}
          {questionFilters.type && (
            <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full capitalize">
              {questionFilters.type.replace(/_/g, " ")}
              <button
                onClick={() => clearFilter("type")}
                className="hover:text-[#D42620]"
              >
                <Icon icon="hugeicons:cancel-01" width={10} />
              </button>
            </span>
          )}
          {questionFilters.difficulty && (
            <span className="flex items-center gap-1 text-xs bg-[#F0F2F5] text-[#344054] px-2 py-1 rounded-full capitalize">
              {questionFilters.difficulty}
              <button
                onClick={() => clearFilter("difficulty")}
                className="hover:text-[#D42620]"
              >
                <Icon icon="hugeicons:cancel-01" width={10} />
              </button>
            </span>
          )}
        </div>

        {/* Collapsible filter panel */}
        {filterOpen && (
          <div className="px-6 py-4 border-b border-[#F0F2F5] bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField
              type="select"
              label="Exam Type / Subject"
              placeholder="Any..."
              value={pendingEts || null}
              selectOptions={etsOptions}
              onChange={(e) => setPendingEts(e.target.value as string)}
            />
            <InputField
              type="select"
              label="Question Type"
              placeholder="Any..."
              value={pendingType || null}
              selectOptions={QUESTION_TYPE_OPTIONS}
              onChange={(e) => setPendingType(e.target.value as string)}
            />
            <InputField
              type="select"
              label="Difficulty"
              placeholder="Any..."
              value={pendingDifficulty || null}
              selectOptions={DIFFICULTY_OPTIONS}
              onChange={(e) => setPendingDifficulty(e.target.value as string)}
            />
            <div className="md:col-span-3 flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setPendingEts("");
                  setPendingType("");
                  setPendingDifficulty("");
                  setQuestionFilters({
                    examTypeSubjectId: "",
                    type: "",
                    difficulty: "",
                  });
                  fetchQuestions(1);
                  setFilterOpen(false);
                }}
                className="bg-white! text-[#344054]! border border-[#D0D5DD]"
              >
                Reset
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={questions}
          loading={loadingQuestions}
          keyExtractor={(r) => r.id}
          emptyMessage="No questions found. Adjust filters or add a question."
          shouldNotHaveBorder
          searchProps={{
            value: questionFilters.search,
            onChange: (v) => setQuestionFilters({ search: v }),
            onSearch: () => fetchQuestions(1),
            placeholder: "Search question text...",
          }}
          pagination
          metaData={{
            currentPage: (questionsPage - 1) * 50 + 1,
            endPage:
              questionsTotal > questionsPage * 50
                ? questionsPage * 50 + 1
                : (questionsPage - 1) * 50 + 1,
            totalRecords: questionsTotal,
            onPageChange: (skip) => fetchQuestions(Math.floor(skip / 50) + 1),
          }}
        />
      </TabCard>

      {/* Bulk JSON Import Modal */}
      <Modal
        isOpen={bulkModal}
        onClose={() => {
          setBulkModal(false);
          setBulkJson("");
          setBulkResult(null);
        }}
        className="w-full max-w-2xl rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-semibold text-[#101828]">
            Bulk Import Questions (JSON)
          </p>
          <button
            onClick={() => {
              setBulkModal(false);
              setBulkJson("");
              setBulkResult(null);
            }}
            className="text-[#667085]"
          >
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>
        {bulkResult ? (
          <div>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-[#166534]">
                {bulkResult.created} questions imported successfully
              </p>
            </div>
            {bulkResult.errors.length > 0 && (
              <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-[#991B1B] mb-2">
                  {bulkResult.errors.length} errors:
                </p>
                <ul className="text-xs text-[#B91C1C] list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {bulkResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              onClick={() => {
                setBulkModal(false);
                setBulkJson("");
                setBulkResult(null);
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#667085] mb-3">
              Paste a JSON array. Each object must have:{" "}
              <code className="bg-[#F9FAFB] px-1 rounded">
                examTypeSubjectId, questionText, type, category, difficulty
              </code>{" "}
              and optionally:{" "}
              <code className="bg-[#F9FAFB] px-1 rounded">
                options, correctAnswer, explanationShort, explanationLong,
                topicId, passageId, marks
              </code>
            </p>
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='[{"examTypeSubjectId":"...", "questionText":"...", "type":"multiple_choice", ...}]'
              className="w-full h-64 border border-[#D0D5DD] rounded-lg p-3 text-sm font-mono text-[#344054] focus:outline-none focus:border-[#007FFF] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setBulkModal(false)}
                className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
              >
                Cancel
              </Button>
              <Button
                onClick={doBulkImport}
                loading={bulkLoading}
                disabled={!bulkJson.trim()}
                className="flex-1"
              >
                Import
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          Delete Question
        </p>
        <p className="text-sm text-[#667085] mb-6 line-clamp-2">
          {deleteTarget?.questionText}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            loading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);
              await deleteQuestion(deleteTarget!.id);
              setDeleteLoading(false);
              setDeleteTarget(null);
            }}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
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
        <h1 className="text-2xl font-bold text-[#101828]">{TAB_LABELS[tab]}</h1>
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
