import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getNotePara, PARA_CONFIG, type Note, type ParaCategory } from "@/lib/mock-data";

const PARA_BADGE_COLORS: Record<ParaCategory, string> = {
  project: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
  area: "border-green-300 text-green-700 dark:border-green-700 dark:text-green-300",
  resource: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
  archive: "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400",
};

export function ParaBadge({ note }: { note: Note }) {
  const category = getNotePara(note);
  if (!note.folder_name) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal text-xs",
        category && PARA_BADGE_COLORS[category]
      )}
    >
      <FolderOpen className="h-3 w-3" />
      {note.folder_name}
    </Badge>
  );
}
