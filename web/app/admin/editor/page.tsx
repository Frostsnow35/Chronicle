import EditorClient from "@/components/Editor/EditorClient";

export const metadata = { title: "新建文章" };

export default function NewEditorPage({
  searchParams
}: {
  searchParams: { note?: string };
}) {
  return <EditorClient noteId={searchParams.note} />;
}
