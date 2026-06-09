import EditQuestionClient from "./EditQuestionClient";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditQuestionClient id={id} />;
}
