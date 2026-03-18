import Link from "next/link";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "./source-badge";
import { ParaBadge } from "./para-badge";
import type { Note } from "@/lib/mock-data";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/dashboard/notes/${note.id}`}>
      <Card className="transition-colors hover:bg-accent/30 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {note.title}
            </h3>
            {note.is_sensitive && (
              <Shield className="h-4 w-4 shrink-0 text-[var(--vault)]" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {note.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {note.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <SourceBadge type={note.source_type} />
            <ParaBadge note={note} />
            {note.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{timeAgo(note.created_at)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
