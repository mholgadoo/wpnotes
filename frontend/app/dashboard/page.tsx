"use client";

import { useSearchParams } from "next/navigation";
import { NoteList } from "@/components/notes/note-list";
import { PARA_CONFIG, mockFolders, type ParaCategory } from "@/lib/mock-data";

const validCategories = new Set<string>(["project", "area", "resource", "archive"]);

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const folderParam = searchParams.get("folder");

  const paraCategory = categoryParam && validCategories.has(categoryParam)
    ? (categoryParam as ParaCategory)
    : undefined;

  const folder = folderParam
    ? mockFolders.find((f) => f.id === folderParam)
    : undefined;

  let title = "Notas";
  let subtitle = "Todas tus notas de WhatsApp y uploads";

  if (folder) {
    title = `${folder.icon} ${folder.name}`;
    subtitle = `${PARA_CONFIG[folder.para_category].label} — ${folder.note_count} notas`;
  } else if (paraCategory) {
    title = PARA_CONFIG[paraCategory].label;
    subtitle = PARA_CONFIG[paraCategory].description;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <NoteList folderId={folder?.id} paraCategory={paraCategory} />
    </div>
  );
}
