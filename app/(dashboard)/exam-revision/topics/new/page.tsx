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
import { topicSchema, TopicValues } from "@/src/schemas/exam-revision.schema";

const FIELDS = [
  { name: "subjectId" as const, label: "Subject", type: "select" as const, placeholder: "Select subject..." },
  { name: "name" as const, label: "Topic Name", type: "text" as const, placeholder: "e.g. Differentiation" },
] as const;

export default function NewTopicPage() {
  const router = useRouter();
  const { subjects, fetchSubjects, createTopic } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<TopicValues>({
    resolver: yupResolver(topicSchema),
    defaultValues: { subjectId: "", name: "", content: "" },
  });

  useEffect(() => {
    void fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canWrite(AdminModule.EXAM_REVISION)) {
    router.replace("/exam-revision/topics");
    return null;
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  const onSubmit = async (data: TopicValues) => {
    await createTopic(
      { subjectId: data.subjectId, name: data.name, content: data.content ?? "" },
      () => router.push("/exam-revision/topics"),
    );
  };

  return (
    <div className="xl:px-[2rem] px-[.875rem] py-[1.25rem] max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#667085] hover:text-[#344054] mb-6 transition-colors"
      >
        <Icon icon="hugeicons:arrow-left-01" width={16} />
        Back to Topics
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101828]">New Topic</h1>
        <p className="text-sm text-[#667085] mt-1">Create a study topic with optional rich content</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Controller
          name="subjectId"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              type="select"
              label="Subject"
              placeholder="Select subject..."
              value={field.value || null}
              selectOptions={subjectOptions}
              error={errors.subjectId?.message}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              label="Topic Name"
              placeholder="e.g. Differentiation"
              error={errors.name?.message}
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
            Create Topic
          </Button>
        </div>
      </form>
    </div>
  );
}
