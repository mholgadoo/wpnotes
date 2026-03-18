import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Image, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const sourceConfig = {
  text: { label: "Texto", icon: FileText, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  audio: { label: "Audio", icon: Mic, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  image: { label: "Imagen", icon: Image, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  document: { label: "Documento", icon: FileSpreadsheet, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
} as const;

export function SourceBadge({ type }: { type: keyof typeof sourceConfig }) {
  const config = sourceConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={cn("gap-1 font-normal", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
