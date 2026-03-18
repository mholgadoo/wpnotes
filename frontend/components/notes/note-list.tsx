"use client";

import { useState, useMemo } from "react";
import { Search, Filter, FileText, Target, Layers, BookOpen, Archive, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteCard } from "./note-card";
import {
  mockNotes,
  mockFolders,
  PARA_CONFIG,
  getNotePara,
  type Note,
  type ParaCategory,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const sourceTypes = [
  { value: "text", label: "Texto" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Imagen" },
  { value: "document", label: "Documento" },
] as const;

const PARA_FILTER_ICONS = {
  project: Target,
  area: Layers,
  resource: BookOpen,
  archive: Archive,
} as const;

const PARA_FILTER_COLORS: Record<ParaCategory, string> = {
  project: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  area: "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300",
  resource: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  archive: "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
};

const PARA_ORDER: ParaCategory[] = ["project", "area", "resource", "archive"];

export function NoteList({
  folderId,
  paraCategory,
}: {
  folderId?: string;
  paraCategory?: ParaCategory;
}) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeParaFilter, setActiveParaFilter] = useState<ParaCategory | null>(
    paraCategory ?? null
  );

  const filtered = useMemo(() => {
    let notes: Note[] = mockNotes;

    if (folderId) {
      notes = notes.filter((n) => n.folder_id === folderId);
    }

    if (activeParaFilter) {
      notes = notes.filter((n) => getNotePara(n) === activeParaFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (activeTypes.size > 0) {
      notes = notes.filter((n) => activeTypes.has(n.source_type));
    }

    return notes;
  }, [search, activeTypes, folderId, activeParaFilter]);

  function toggleType(type: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
            <Filter className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sourceTypes.map((st) => (
              <DropdownMenuCheckboxItem
                key={st.value}
                checked={activeTypes.has(st.value)}
                onCheckedChange={() => toggleType(st.value)}
              >
                {st.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* PARA category filter pills */}
      {!folderId && (
        <div className="flex flex-wrap gap-2">
          {PARA_ORDER.map((cat) => {
            const Icon = PARA_FILTER_ICONS[cat];
            const config = PARA_CONFIG[cat];
            const isActive = activeParaFilter === cat;
            return (
              <button
                key={cat}
                onClick={() =>
                  setActiveParaFilter(isActive ? null : cat)
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? PARA_FILTER_COLORS[cat]
                    : "border-border text-muted-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-3 w-3" />
                {config.label}
                {isActive && <X className="h-3 w-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No hay notas</p>
          <p className="text-sm">
            {search || activeParaFilter
              ? "No se encontraron resultados"
              : "Enviá un mensaje por WhatsApp o subí un archivo"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
