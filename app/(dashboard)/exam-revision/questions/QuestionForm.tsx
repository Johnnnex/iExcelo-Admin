"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { v4 as uuidv4 } from "uuid";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { toast } from "sonner";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { Radio, CheckBox } from "@/src/components/atoms";
import { IQuestion, IExamType, IExamTypeSubject, ITopic, IPassage } from "@/src/types";
import { questionSchema, QuestionValues } from "@/src/schemas/exam-revision.schema";
import { CARD_SHADOW } from "@/src/utils";

const QUESTION_TYPE_OPTIONS = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "multiple_response", label: "Multiple Response (select all)" },
  { value: "true_false", label: "True / False" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
  { value: "short_answer", label: "Short Answer (keywords)" },
  { value: "essay", label: "Essay" },
  { value: "matching", label: "Matching" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

type OptionEntry = { id: string; text: string; isCorrect: boolean };
type MatchPair = { id: string; left: string; right: string };

interface QuestionFormProps {
  editQuestion?: IQuestion;
}

export default function QuestionForm({ editQuestion }: QuestionFormProps) {
  const router = useRouter();
  const { examTypes, fetchExamTypes } = useExamRevisionStore();

  const [examTypeId, setExamTypeId] = useState(editQuestion?.examTypeSubject?.examType?.id ?? "");
  const [subjectId, setSubjectId] = useState(editQuestion?.examTypeSubject?.subject?.id ?? "");
  const [allEts, setAllEts] = useState<IExamTypeSubject[]>([]);
  const [resolvedEtsId, setResolvedEtsId] = useState(editQuestion?.examTypeSubjectId ?? "");
  const [topics, setTopics] = useState<ITopic[]>([]);
  const [passages, setPassages] = useState<IPassage[]>([]);
  const [options, setOptions] = useState<OptionEntry[]>(() => {
    if (editQuestion?.options) return editQuestion.options;
    return [
      { id: uuidv4(), text: "", isCorrect: false },
      { id: uuidv4(), text: "", isCorrect: false },
    ];
  });
  const [matchPairs, setMatchPairs] = useState<MatchPair[]>(() => {
    if (editQuestion?.type === "matching" && editQuestion.correctAnswer) {
      return Object.entries(editQuestion.correctAnswer as Record<string, string>).map(([left, right]) => ({
        id: uuidv4(),
        left,
        right,
      }));
    }
    return [
      { id: uuidv4(), left: "", right: "" },
      { id: uuidv4(), left: "", right: "" },
    ];
  });
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionValues>({
    resolver: yupResolver(questionSchema),
    defaultValues: {
      examTypeId: editQuestion?.examTypeSubject?.examType?.id ?? "",
      subjectId: editQuestion?.examTypeSubject?.subject?.id ?? "",
      examTypeSubjectId: editQuestion?.examTypeSubjectId ?? "",
      questionText: editQuestion?.questionText ?? "",
      type: editQuestion?.type ?? "multiple_choice",
      category: editQuestion?.category ?? "objectives",
      difficulty: editQuestion?.difficulty ?? "medium",
      marks: editQuestion?.marks ?? 1,
      explanation: editQuestion?.explanation ?? "",
      topicId: editQuestion?.topicId ?? "",
      passageId: editQuestion?.passageId ?? "",
      correctAnswerText: typeof editQuestion?.correctAnswer === "string"
        ? (editQuestion.correctAnswer as string)
        : Array.isArray(editQuestion?.correctAnswer)
        ? (editQuestion.correctAnswer as string[]).join("\n")
        : "",
    },
  });

  const questionType = watch("type");
  const selectedExamTypeId = watch("examTypeId");
  const selectedSubjectId = watch("subjectId");

  // Load exam types on mount
  useEffect(() => {
    if (examTypes.length === 0) fetchExamTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load ETS when exam type changes
  useEffect(() => {
    if (!selectedExamTypeId) return;
    api
      .get<{ data: IExamTypeSubject[] }>(
        `/admin/exam-revision/exam-type-subjects?examTypeId=${selectedExamTypeId}`,
      )
      .then((res) => setAllEts(res.data.data))
      .catch(() => {});
  }, [selectedExamTypeId]);

  // Resolve ETS id when both examTypeId + subjectId are set
  useEffect(() => {
    if (!selectedExamTypeId || !selectedSubjectId) return;
    const match = allEts.find(
      (e) => e.examTypeId === selectedExamTypeId && e.subjectId === selectedSubjectId,
    );
    const etsId = match?.id ?? "";
    setResolvedEtsId(etsId);
    setValue("examTypeSubjectId", etsId);
    // Load topics + passages for this ETS
    if (etsId) {
      api
        .get<{ data: { items: ITopic[] } }>(
          `/admin/exam-revision/topics?subjectId=${selectedSubjectId}&limit=200`,
        )
        .then((res) => setTopics(res.data.data.items ?? []))
        .catch(() => {});
      api
        .get<{ data: { items: IPassage[] } }>(
          `/admin/exam-revision/passages?examTypeSubjectId=${etsId}&limit=200`,
        )
        .then((res) => setPassages(res.data.data.items ?? []))
        .catch(() => {});
    }
  }, [selectedExamTypeId, selectedSubjectId, allEts, setValue]);

  // Derive category options from selected exam type
  const selectedExamType = examTypes.find((e) => e.id === selectedExamTypeId);
  const categoryOptions = (selectedExamType?.supportedCategories ?? ["objectives"]).map((c) => ({
    value: c,
    label: c.charAt(0).toUpperCase() + c.slice(1),
  }));

  // Subjects for selected exam type (derived from ETS list)
  const subjectOptions = allEts.map((e) => ({
    value: e.subjectId,
    label: e.subject?.name ?? e.subjectId,
  }));

  const examTypeOptions = examTypes.map((e) => ({ value: e.id, label: e.name }));
  const topicOptions = [
    { value: "", label: "None" },
    ...topics.map((t) => ({ value: t.id, label: t.name })),
  ];
  const passageOptions = [
    { value: "", label: "None" },
    ...passages.map((p) => ({ value: p.id, label: p.title })),
  ];

  // ─── Option helpers ────────────────────────────────────────────────────────

  const addOption = () =>
    setOptions((prev) => [...prev, { id: uuidv4(), text: "", isCorrect: false }]);

  const removeOption = (id: string) =>
    setOptions((prev) => prev.filter((o) => o.id !== id));

  const updateOption = (id: string, field: keyof OptionEntry, value: unknown) =>
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );

  const setCorrect = (id: string, multiSelect: boolean) => {
    setOptions((prev) =>
      prev.map((o) =>
        multiSelect
          ? o.id === id ? { ...o, isCorrect: !o.isCorrect } : o
          : { ...o, isCorrect: o.id === id },
      ),
    );
  };

  const addMatchPair = () =>
    setMatchPairs((prev) => [...prev, { id: uuidv4(), left: "", right: "" }]);

  const removeMatchPair = (id: string) =>
    setMatchPairs((prev) => prev.filter((p) => p.id !== id));

  const updateMatchPair = (id: string, field: "left" | "right", value: string) =>
    setMatchPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  // ─── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: QuestionValues) => {
    if (!data.examTypeSubjectId) {
      toast.error("Select an exam type and subject that are linked");
      return;
    }

    setSaving(true);
    try {
      // Build correctAnswer based on type
      let correctAnswer: unknown = null;
      if (
        data.type === "multiple_choice" ||
        data.type === "true_false"
      ) {
        const correct = options.find((o) => o.isCorrect);
        correctAnswer = correct?.id ?? null;
      } else if (data.type === "multiple_response") {
        correctAnswer = options.filter((o) => o.isCorrect).map((o) => o.id);
      } else if (data.type === "matching") {
        correctAnswer = Object.fromEntries(
          matchPairs.map((p) => [p.left, p.right]),
        );
      } else if (data.type === "short_answer") {
        correctAnswer = (data.correctAnswerText ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        correctAnswer = data.correctAnswerText ?? null;
      }

      const hasOptions = ["multiple_choice", "true_false", "multiple_response"].includes(
        data.type,
      );

      const payload = {
        examTypeSubjectId: data.examTypeSubjectId,
        questionText: data.questionText,
        type: data.type,
        category: data.category,
        difficulty: data.difficulty,
        marks: data.marks ?? 1,
        options: hasOptions ? options : data.type === "matching" ? null : null,
        correctAnswer,
        explanation: data.explanation || null,
        topicId: data.topicId || null,
        passageId: data.passageId || null,
      };

      if (editQuestion) {
        await api.patch(
          `/admin/exam-revision/questions/${editQuestion.id}`,
          payload,
        );
        toast.success("Question updated");
      } else {
        await api.post("/admin/exam-revision/questions", payload);
        toast.success("Question created");
      }

      router.push("/exam-revision");
    } catch (error) {
      handleAxiosError(error, "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const showOptions = ["multiple_choice", "true_false", "multiple_response"].includes(questionType);
  const showMatching = questionType === "matching";
  const showTextAnswer = ["fill_in_the_blank", "short_answer", "essay"].includes(questionType);
  const isMultiResponse = questionType === "multiple_response";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/exam-revision")}
          className="text-[#667085] hover:text-[#344054] transition-colors"
        >
          <Icon icon="hugeicons:arrow-left-01" width={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">
            {editQuestion ? "Edit Question" : "New Question"}
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            {editQuestion ? "Update question details below" : "Fill in the details to create a new question"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Section: Scope */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">Scope</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="examTypeId"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Exam Type"
                  placeholder="Select exam type..."
                  value={field.value || null}
                  selectOptions={examTypeOptions}
                  error={errors.examTypeId?.message}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setValue("subjectId", "");
                    setValue("examTypeSubjectId", "");
                  }}
                />
              )}
            />
            <Controller
              name="subjectId"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Subject"
                  placeholder={selectedExamTypeId ? "Select subject..." : "Select exam type first"}
                  value={field.value || null}
                  selectOptions={subjectOptions}
                  disabled={!selectedExamTypeId}
                  error={errors.subjectId?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
          {resolvedEtsId ? (
            <p className="text-xs text-[#099137] flex items-center gap-1">
              <Icon icon="hugeicons:tick-double-01" width={14} />
              Exam type–subject link resolved
            </p>
          ) : selectedExamTypeId && selectedSubjectId ? (
            <p className="text-xs text-[#D42620] flex items-center gap-1">
              <Icon icon="hugeicons:alert-circle" width={14} />
              No link found for this combination — link them first in the Subjects tab
            </p>
          ) : null}
        </div>

        {/* Section: Question Details */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">Question Details</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Type"
                  placeholder="Select type..."
                  value={field.value || null}
                  selectOptions={QUESTION_TYPE_OPTIONS}
                  error={errors.type?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Category"
                  placeholder="Select category..."
                  value={field.value || null}
                  selectOptions={categoryOptions}
                  error={errors.category?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Difficulty"
                  placeholder="Select..."
                  value={field.value || null}
                  selectOptions={DIFFICULTY_OPTIONS}
                  error={errors.difficulty?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="marks"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Marks"
                  value={String(field.value ?? 1)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
          <Controller
            name="questionText"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="rich-text"
                label="Question Text"
                value={field.value ?? ""}
                error={errors.questionText?.message}
                richTextProps={{ maxHeight: "400px" }}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        {/* Section: Options (MC / True-False / Multiple Response) */}
        {showOptions && (
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
                Options
                <span className="ml-2 text-xs font-normal text-[#667085] normal-case">
                  {isMultiResponse ? "Tick all correct" : "Tick the correct one"}
                </span>
              </p>
              {questionType !== "true_false" && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-[#007FFF] flex items-center gap-1 hover:underline"
                >
                  <Icon icon="hugeicons:add-01" width={14} /> Add Option
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-3">
                  {isMultiResponse ? (
                    <CheckBox
                      value={opt.isCorrect}
                      onChange={() => setCorrect(opt.id, true)}
                    />
                  ) : (
                    <Radio
                      name="correct-option"
                      value={opt.isCorrect}
                      onChange={() => setCorrect(opt.id, false)}
                    />
                  )}
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, "text", e.target.value)}
                    placeholder={
                      questionType === "true_false"
                        ? i === 0
                          ? "True"
                          : "False"
                        : `Option ${String.fromCharCode(65 + i)}`
                    }
                    className="flex-1 border border-[#D0D5DD] rounded-lg h-10 px-3.5 text-sm text-[#344054] outline-none focus:border-[#007FFF] transition-colors"
                  />
                  {questionType !== "true_false" && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="text-[#D42620] hover:opacity-70"
                    >
                      <Icon icon="hugeicons:delete-01" width={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Matching Pairs */}
        {showMatching && (
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">Matching Pairs</p>
              <button
                type="button"
                onClick={addMatchPair}
                className="text-sm text-[#007FFF] flex items-center gap-1 hover:underline"
              >
                <Icon icon="hugeicons:add-01" width={14} /> Add Pair
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#667085] uppercase tracking-wide px-1">
              <span>Column A (prompts)</span>
              <span>Column B (answers)</span>
            </div>
            <div className="flex flex-col gap-2">
              {matchPairs.map((pair) => (
                <div key={pair.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(e) => updateMatchPair(pair.id, "left", e.target.value)}
                    placeholder="Prompt..."
                    className="flex-1 border border-[#D0D5DD] rounded-lg h-10 px-3.5 text-sm text-[#344054] outline-none focus:border-[#007FFF] transition-colors"
                  />
                  <Icon icon="hugeicons:arrow-right-01" className="text-[#D0D5DD] shrink-0" width={16} />
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => updateMatchPair(pair.id, "right", e.target.value)}
                    placeholder="Match..."
                    className="flex-1 border border-[#D0D5DD] rounded-lg h-10 px-3.5 text-sm text-[#344054] outline-none focus:border-[#007FFF] transition-colors"
                  />
                  {matchPairs.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMatchPair(pair.id)}
                      className="text-[#D42620] hover:opacity-70 shrink-0"
                    >
                      <Icon icon="hugeicons:delete-01" width={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Correct Answer (text-based types) */}
        {showTextAnswer && (
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
            <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
              Correct Answer
              {questionType === "short_answer" && (
                <span className="ml-2 text-xs font-normal text-[#667085] normal-case">
                  One keyword per line
                </span>
              )}
            </p>
            <Controller
              name="correctAnswerText"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type={questionType === "fill_in_the_blank" ? "text" : "textarea"}
                  label={null}
                  placeholder={
                    questionType === "fill_in_the_blank"
                      ? "The exact answer..."
                      : questionType === "short_answer"
                      ? "keyword1\nkeyword2\nkeyword3"
                      : "Model/examiner answer..."
                  }
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
        )}

        {/* Section: Explanation */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">Explanation</p>
          <Controller
            name="explanation"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="rich-text"
                label="Explanation"
                placeholder="Explain the correct answer (Markdown + LaTeX supported)..."
                value={field.value ?? ""}
                richTextProps={{ maxHeight: "400px" }}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        {/* Section: Metadata */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: CARD_SHADOW }}>
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">Metadata (optional)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="topicId"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Topic"
                  placeholder="None"
                  value={field.value || null}
                  selectOptions={topicOptions}
                  disabled={!resolvedEtsId}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="passageId"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Passage"
                  placeholder="None"
                  value={field.value || null}
                  selectOptions={passageOptions}
                  disabled={!resolvedEtsId}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            type="button"
            onClick={() => router.push("/exam-revision")}
            className="!bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="min-w-[140px]">
            {editQuestion ? "Save Changes" : "Create Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
