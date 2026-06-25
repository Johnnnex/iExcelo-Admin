"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { IQuestion, IExamTypeSubject, ITopic, IPassage } from "@/src/types";
import {
  questionSchema,
  QuestionValues,
} from "@/src/schemas/exam-revision.schema";
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
  const { examTypes, fetchExamTypes, examTypeSubjects, fetchExamTypeSubjects } =
    useExamRevisionStore();

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
      return Object.entries(
        editQuestion.correctAnswer as Record<string, string>,
      ).map(([left, right]) => ({
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
  const passageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionValues>({
    resolver: yupResolver(questionSchema),
    defaultValues: {
      examTypeSubjectIds:
        editQuestion?.examTypeSubjects?.map((e) => e.id) ?? [],
      questionText: editQuestion?.questionText ?? "",
      type: editQuestion?.type ?? "multiple_choice",
      category: editQuestion?.category ?? "objectives",
      difficulty: editQuestion?.difficulty ?? "medium",
      marks: editQuestion?.marks ?? 1,
      explanation: editQuestion?.explanation ?? "",
      topicId: editQuestion?.topicId ?? "",
      passageId: editQuestion?.passageId ?? "",
      correctAnswerText:
        typeof editQuestion?.correctAnswer === "string"
          ? (editQuestion.correctAnswer as string)
          : Array.isArray(editQuestion?.correctAnswer)
            ? (editQuestion.correctAnswer as string[]).join("\n")
            : "",
    },
  });

  const questionType = watch("type");
  const selectedEtsIds = watch("examTypeSubjectIds") ?? [];

  // Load exam types + all ETS on mount
  useEffect(() => {
    if (examTypes.length === 0) fetchExamTypes();
    if (examTypeSubjects.length === 0) fetchExamTypeSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selected ETS changes: load topics + passages
  useEffect(() => {
    if (selectedEtsIds.length === 0) {
      setTopics([]);
      setPassages([]);
      return;
    }

    // Unique subjects from selected ETS
    const selectedEts = examTypeSubjects.filter((e) =>
      selectedEtsIds.includes(e.id),
    );
    const uniqueSubjectIds = [...new Set(selectedEts.map((e) => e.subjectId))];

    // Topics: if single unique subject, load topics for it
    if (uniqueSubjectIds.length === 1) {
      api
        .get<{ data: { items: ITopic[] } }>(
          `/admin/exam-revision/topics?subjectId=${uniqueSubjectIds[0]}&limit=200`,
        )
        .then((res) => setTopics(res.data.data.items ?? []))
        .catch(() => {});
    } else {
      setTopics([]);
    }

    // Passages: load for all selected ETS (comma-separated)
    if (passageTimerRef.current) clearTimeout(passageTimerRef.current);
    passageTimerRef.current = setTimeout(() => {
      const etsParam = selectedEtsIds.join(",");
      api
        .get<{ data: { items: IPassage[] } }>(
          `/admin/exam-revision/passages?etsIds=${etsParam}&limit=200`,
        )
        .then((res) => setPassages(res.data.data.items ?? []))
        .catch(() => {});
    }, 300);

    return () => {
      if (passageTimerRef.current) clearTimeout(passageTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEtsIds.join(","), examTypeSubjects.length]);

  // Derive category options from the exam types of the selected ETS
  const selectedEts = examTypeSubjects.filter((e) =>
    selectedEtsIds.includes(e.id),
  );
  const examTypeIdsInSelection = [
    ...new Set(selectedEts.map((e) => e.examTypeId)),
  ];
  const categoryOptions = (() => {
    const allCategories = new Set<string>();
    for (const et of examTypes) {
      if (examTypeIdsInSelection.includes(et.id)) {
        for (const c of et.supportedCategories ?? []) allCategories.add(c);
      }
    }
    const cats = allCategories.size > 0 ? [...allCategories] : ["objectives"];
    return cats.map((c) => ({
      value: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
    }));
  })();

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} / ${e.subject?.name ?? "?"}`,
  }));

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
    setOptions((prev) => [
      ...prev,
      { id: uuidv4(), text: "", isCorrect: false },
    ]);

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
          ? o.id === id
            ? { ...o, isCorrect: !o.isCorrect }
            : o
          : { ...o, isCorrect: o.id === id },
      ),
    );
  };

  const addMatchPair = () =>
    setMatchPairs((prev) => [...prev, { id: uuidv4(), left: "", right: "" }]);

  const removeMatchPair = (id: string) =>
    setMatchPairs((prev) => prev.filter((p) => p.id !== id));

  const updateMatchPair = (
    id: string,
    field: "left" | "right",
    value: string,
  ) =>
    setMatchPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  // ─── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: QuestionValues) => {
    if (!data.examTypeSubjectIds?.length) {
      toast.error("Select at least one Exam Type / Subject");
      return;
    }

    setSaving(true);
    try {
      let correctAnswer: unknown = null;
      if (data.type === "multiple_choice" || data.type === "true_false") {
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

      const hasOptions = [
        "multiple_choice",
        "true_false",
        "multiple_response",
      ].includes(data.type);

      const payload = {
        examTypeSubjectIds: data.examTypeSubjectIds,
        questionText: data.questionText,
        type: data.type,
        category: data.category,
        difficulty: data.difficulty,
        marks: data.marks ?? 1,
        options: hasOptions ? options : null,
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

      router.push("/exam-revision/questions");
    } catch (error) {
      handleAxiosError(error, "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const showOptions = [
    "multiple_choice",
    "true_false",
    "multiple_response",
  ].includes(questionType);
  const showMatching = questionType === "matching";
  const showTextAnswer = [
    "fill_in_the_blank",
    "short_answer",
    "essay",
  ].includes(questionType);
  const isMultiResponse = questionType === "multiple_response";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/exam-revision/questions")}
          className="text-[#667085] hover:text-[#344054] transition-colors"
        >
          <Icon icon="hugeicons:arrow-left-01" width={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">
            {editQuestion ? "Edit Question" : "New Question"}
          </h1>
          <p className="text-sm text-[#667085] mt-0.5">
            {editQuestion
              ? "Update question details below"
              : "Fill in the details to create a new question"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Section: Scope */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
            Scope
          </p>
          <Controller
            name="examTypeSubjectIds"
            control={control}
            render={({ field }) => (
              <InputField
                type="multi-select"
                label="Exam Type / Subject (select all that apply)"
                placeholder="Select one or more..."
                value={(field.value ?? []).join(",")}
                selectOptions={etsOptions}
                error={errors.examTypeSubjectIds?.message}
                onChange={(e) => {
                  const val = e.target.value as string;
                  field.onChange(val ? val.split(",").filter(Boolean) : []);
                  setValue("topicId", "");
                  setValue("passageId", "");
                }}
              />
            )}
          />
          {selectedEtsIds.length > 0 && (
            <p className="text-xs text-[#099137] flex items-center gap-1">
              <Icon icon="hugeicons:tick-double-01" width={14} />
              {selectedEtsIds.length} scope{selectedEtsIds.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        {/* Section: Question Details */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
            Question Details
          </p>
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
                richTextProps={{ maxHeight: "400px", image: { allowed: true, folder: "questions" } }}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        {/* Section: Options (MC / True-False / Multiple Response) */}
        {showOptions && (
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
                Options
                <span className="ml-2 text-xs font-normal text-[#667085] normal-case">
                  {isMultiResponse
                    ? "Tick all correct"
                    : "Tick the correct one"}
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
                    onChange={(e) =>
                      updateOption(opt.id, "text", e.target.value)
                    }
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
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
                Matching Pairs
              </p>
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
                    onChange={(e) =>
                      updateMatchPair(pair.id, "left", e.target.value)
                    }
                    placeholder="Prompt..."
                    className="flex-1 border border-[#D0D5DD] rounded-lg h-10 px-3.5 text-sm text-[#344054] outline-none focus:border-[#007FFF] transition-colors"
                  />
                  <Icon
                    icon="hugeicons:arrow-right-01"
                    className="text-[#D0D5DD] shrink-0"
                    width={16}
                  />
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) =>
                      updateMatchPair(pair.id, "right", e.target.value)
                    }
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
          <div
            className="bg-white rounded-2xl p-6 flex flex-col gap-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
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
                  type={
                    questionType === "fill_in_the_blank" ? "text" : "textarea"
                  }
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
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
            Explanation
          </p>
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
                richTextProps={{ maxHeight: "400px", image: { allowed: true, folder: "questions" } }}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        {/* Section: Metadata */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] uppercase tracking-wide">
            Metadata (optional)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="topicId"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="select"
                  label="Topic"
                  placeholder={
                    topics.length === 0 && selectedEtsIds.length > 0
                      ? "No topics available"
                      : "None"
                  }
                  value={field.value || null}
                  selectOptions={topicOptions}
                  disabled={selectedEtsIds.length === 0 || topics.length === 0}
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
                  disabled={selectedEtsIds.length === 0}
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
            onClick={() => router.push("/exam-revision/questions")}
            className="bg-white! text-[#344054]! border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="min-w-35">
            {editQuestion ? "Save Changes" : "Create Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
