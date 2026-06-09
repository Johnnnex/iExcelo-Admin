"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/lib/api";
import { handleAxiosError } from "@/src/utils";
import { IQuestion } from "@/src/types";
import QuestionForm from "../../QuestionForm";

export default function EditQuestionClient({ id }: { id: string }) {
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: IQuestion }>(`/admin/exam-revision/questions/${id}`)
      .then((res) => setQuestion(res.data.data))
      .catch((err) => handleAxiosError(err, "Failed to load question"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 h-40 animate-pulse"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 5px 22px 0 rgba(0,0,0,0.04)" }}
          />
        ))}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-[#667085]"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 5px 22px 0 rgba(0,0,0,0.04)" }}>
        <p className="text-lg font-semibold text-[#344054]">Question not found</p>
        <p className="text-sm mt-1">It may have been deleted or the ID is invalid.</p>
      </div>
    );
  }

  return <QuestionForm editQuestion={question} />;
}
