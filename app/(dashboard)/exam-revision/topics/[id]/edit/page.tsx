"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule } from "@/src/types";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { topicSchema, TopicValues } from "@/src/schemas/exam-revision.schema";
import * as yup from "yup";

const editSchema = yup.object({
  name: yup.string().required("Name is required"),
  content: yup.string().nullable().default(null),
});
type EditTopicValues = yup.InferType<typeof editSchema>;

export default function EditTopicPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { topics, loadingTopics, fetchTopics, updateTopic } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();

  const topic = topics.find((t) => t.id === id);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditTopicValues>({
    resolver: yupResolver(editSchema),
    defaultValues: { name: "", content: "" },
  });

  useEffect(() => {
    if (!topics.length) void fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (topic) {
      reset({ name: topic.name, content: topic.content ?? "" });
    }
  }, [topic, reset]);

  if (!canWrite(AdminModule.EXAM_REVISION)) {
    router.replace("/exam-revision/topics");
    return null;
  }

  const onSubmit = async (data: EditTopicValues) => {
    await updateTopic(
      id,
      { name: data.name, content: data.content ?? "" },
      () => router.push("/exam-revision/topics"),
    );
  };

  if (loadingTopics && !topic) {
    return (
      <div className="xl:px-[2rem] px-[.875rem] py-[1.25rem]">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-4 max-w-3xl">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-[#101828]">Edit Topic</h1>
        {topic?.subject && (
          <p className="text-sm text-[#667085] mt-1">Subject: {topic.subject.name}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
