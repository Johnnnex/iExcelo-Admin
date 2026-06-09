import * as yup from "yup";

export const examTypeSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().nullable().default(null),
  minSubjectsSelectable: yup
    .number()
    .min(1)
    .required("Min subjects is required"),
  maxSubjectsSelectable: yup
    .number()
    .min(1)
    .required("Max subjects is required"),
  freeTierQuestionLimit: yup.number().min(0).default(50),
  supportedCategories: yup
    .array(yup.string().required())
    .min(1, "Select at least one category")
    .required(),
});
export type ExamTypeValues = yup.InferType<typeof examTypeSchema>;

export const subjectSchema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().nullable().default(null),
});
export type SubjectValues = yup.InferType<typeof subjectSchema>;

export const topicSchema = yup.object({
  subjectId: yup.string().required("Subject is required"),
  name: yup.string().required("Name is required"),
  content: yup.string().nullable().default(null),
});
export type TopicValues = yup.InferType<typeof topicSchema>;

export const passageSchema = yup.object({
  examTypeSubjectId: yup.string().required("Exam Type + Subject is required"),
  title: yup.string().required("Title is required"),
  content: yup.string().required("Content is required"),
});
export type PassageValues = yup.InferType<typeof passageSchema>;

export const questionSchema = yup.object({
  examTypeId: yup.string().required("Exam type is required"),
  subjectId: yup.string().required("Subject is required"),
  examTypeSubjectId: yup.string().required("Exam type + subject link is required"),
  questionText: yup.string().required("Question text is required"),
  type: yup.string().required("Question type is required"),
  category: yup.string().required("Category is required"),
  difficulty: yup.string().required("Difficulty is required"),
  marks: yup.number().min(0.5).default(1),
  explanationShort: yup.string().nullable().default(null),
  explanationLong: yup.string().nullable().default(null),
  topicId: yup.string().nullable().default(null),
  passageId: yup.string().nullable().default(null),
  correctAnswerText: yup.string().nullable().default(null),
});
export type QuestionValues = yup.InferType<typeof questionSchema>;
