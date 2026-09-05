import EditorClient from "@/components/Editor/EditorClient";

export const metadata = { title: "编辑文章" };

export default function EditEditorPage({
  params
}: {
  params: { id: string };
}) {
  return <EditorClient postId={params.id} />;
}
