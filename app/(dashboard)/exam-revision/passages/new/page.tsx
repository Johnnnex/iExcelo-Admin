"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule } from "@/src/types";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { passageSchema, PassageValues } from "@/src/schemas/exam-revision.schema";

export default function NewPassagePage() {
  const router = useRouter();
  const { examTypeSubjects, fetchExamTypeSubjects, subjects, fetchSubjects, createPassage } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PassageValues>({
    resolver: yupResolver(passageSchema),
    defaultValues: { examTypeSubjectId: "", title: "", content: "" },
  });

  useEffect(() => {
    void fetchExamTypeSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canWrite(AdminModule.EXAM_REVISION)) {
    router.replace("/exam-revision/passages");
    return null;
  }

  const etsOptions = examTypeSubjects.map((e) => ({
    value: e.id,
    label: `${e.examType?.name ?? "?"} → ${e.subject?.name ?? "?"}`,
  }));

  const onSubmit = async (data: PassageValues) => {
    await createPassage(
      { examTypeSubjectId: data.examTypeSubjectId, title: data.title, content: data.content },
      () => router.push("/exam-revision/passages"),
    );
  };

  return (
    <div className="xl:px-[2rem] px-[.875rem] py-[1.25rem] max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#667085] hover:text-[#344054] mb-6 transition-colors"
      >
        <Icon icon="hugeicons:arrow-left-01" width={16} />
        Back to Passages
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101828]">New Passage</h1>
        <p className="text-sm text-[#667085] mt-1">Create a reading passage for comprehension questions</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Controller
          name="examTypeSubjectId"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              type="select"
              label="Exam Type → Subject"
              placeholder="Select..."
              value={field.value || null}
              selectOptions={etsOptions}
              error={errors.examTypeSubjectId?.message}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              label="Title"
              placeholder="e.g. Read the following passage carefully"
              error={errors.title?.message}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              type="rich-text"
              label="Content"
              value={field.value ?? ""}
              richTextProps={{ maxHeight: "500px" }}
              error={errors.content?.message}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={() => router.back()}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            Create Passage
          </Button>
        </div>
      </form>
    </div>
  );
}
