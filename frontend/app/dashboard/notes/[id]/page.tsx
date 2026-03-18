import { notFound } from "next/navigation";
import { NoteDetail } from "@/components/notes/note-detail";
import { mockNotes } from "@/lib/mock-data";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = mockNotes.find((n) => n.id === id);

  if (!note) notFound();

  return <NoteDetail note={note} />;
}
