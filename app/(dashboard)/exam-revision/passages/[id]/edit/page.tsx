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
import * as yup from "yup";

const editSchema = yup.object({
  title: yup.string().required("Title is required"),
  content: yup.string().required("Content is required"),
});
type EditPassageValues = yup.InferType<typeof editSchema>;

export default function EditPassagePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { passages, loadingPassages, fetchPassages, updatePassage } = useExamRevisionStore();
  const { canWrite } = useAdminAuthStore();

  const passage = passages.find((p) => p.id === id);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditPassageValues>({
    resolver: yupResolver(editSchema),
    defaultValues: { title: "", content: "" },
  });

  useEffect(() => {
    if (!passages.length) void fetchPassages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (passage) {
      reset({ title: passage.title, content: passage.content ?? "" });
    }
  }, [passage, reset]);

  if (!canWrite(AdminModule.EXAM_REVISION)) {
    router.replace("/exam-revision/passages");
    return null;
  }

  const onSubmit = async (data: EditPassageValues) => {
    await updatePassage(
      id,
      { title: data.title, content: data.content },
      () => router.push("/exam-revision/passages"),
    );
  };

  if (loadingPassages && !passage) {
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
        Back to Passages
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101828]">Edit Passage</h1>
        {passage?.examTypeSubject && (
          <p className="text-sm text-[#667085] mt-1">
            {passage.examTypeSubject.examType?.name} → {passage.examTypeSubject.subject?.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
