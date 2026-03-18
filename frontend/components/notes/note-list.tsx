"use client";

import { useState, useMemo } from "react";
import { Search, Filter, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteCard } from "./note-card";
import { mockNotes, type Note } from "@/lib/mock-data";

const sourceTypes = [
  { value: "text", label: "Texto" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Imagen" },
  { value: "document", label: "Documento" },
] as const;

export function NoteList({ folderId }: { folderId?: string }) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let notes: Note[] = mockNotes;

    if (folderId) {
      notes = notes.filter((n) => n.folder_id === folderId);
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
  }, [search, activeTypes, folderId]);

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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No hay notas</p>
          <p className="text-sm">
            {search
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
