import { NoteList } from "@/components/notes/note-list";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notas</h1>
        <p className="text-sm text-muted-foreground">
          Todas tus notas de WhatsApp y uploads
        </p>
      </div>
      <NoteList />
    </div>
  );
}
