"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SourceBadge } from "./source-badge";
import { ParaBadge } from "./para-badge";
import type { Note } from "@/lib/mock-data";

export function NoteDetail({ note }: { note: Note }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold">{note.title}</h1>
            {note.is_sensitive && (
              <Shield className="h-5 w-5 shrink-0 text-[var(--vault)]" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge type={note.source_type} />
            <ParaBadge note={note} />
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {new Date(note.created_at).toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </CardHeader>

        {note.summary && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground italic">{note.summary}</p>
            </CardContent>
          </>
        )}

        <Separator />
        <CardContent className="pt-4 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}
