"use client";

import { useState } from "react";
import {
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sparkles,
  Target,
  Layers,
  BookOpen,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  mockFolders,
  getFoldersByCategory,
  getSubFolders,
  PARA_CONFIG,
  type Folder,
  type ParaCategory,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PARA_ICONS = {
  project: Target,
  area: Layers,
  resource: BookOpen,
  archive: Archive,
} as const;

const PARA_COLORS = {
  project: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  area: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: "text-green-500",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  resource: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  archive: {
    bg: "bg-gray-50 dark:bg-gray-950/30",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    icon: "text-gray-500",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
} as const;

function FolderItem({
  folder,
  subFolders,
  level = 0,
}: {
  folder: Folder;
  subFolders: Folder[];
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = subFolders.length > 0;

  return (
    <div>
      <div
        className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        <Link
          href={`/dashboard?folder=${folder.id}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
              }}
              className="p-0.5 -ml-1 rounded hover:bg-accent"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ) : level === 0 ? (
            <span className="w-4.5" />
          ) : null}
          <span className="text-base">{folder.icon}</span>
          <span className="text-sm font-medium truncate">{folder.name}</span>
          {folder.is_auto && (
            <Sparkles className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {folder.note_count}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {hasChildren && expanded &&
        subFolders.map((child) => (
          <FolderItem
            key={child.id}
            folder={child}
            subFolders={[]}
            level={level + 1}
          />
        ))}
    </div>
  );
}

function ParaSection({ category }: { category: ParaCategory }) {
  const config = PARA_CONFIG[category];
  const colors = PARA_COLORS[category];
  const Icon = PARA_ICONS[category];
  const folders = getFoldersByCategory(category);

  return (
    <Card className={cn("border", colors.border)}>
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-t-lg", colors.bg)}>
        <Icon className={cn("h-5 w-5", colors.icon)} />
        <div className="flex-1 min-w-0">
          <h2 className={cn("text-sm font-semibold", colors.text)}>
            {config.label}
          </h2>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        <Badge className={cn("text-xs border-0", colors.badge)}>
          {folders.length}
        </Badge>
      </div>
      <CardContent className="p-2">
        {folders.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <p className="text-sm">Sin carpetas en {config.label.toLowerCase()}</p>
          </div>
        ) : (
          folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              subFolders={getSubFolders(folder.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

const PARA_ORDER: ParaCategory[] = ["project", "area", "resource", "archive"];

export default function FoldersPage() {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ParaCategory>("project");
  const [newParentId, setNewParentId] = useState<string | null>(null);

  const availableParents = getFoldersByCategory(newCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Carpetas</h1>
          <p className="text-sm text-muted-foreground">
            Organizadas con el método PARA
          </p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva carpeta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear carpeta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {PARA_ORDER.map((cat) => {
                    const Icon = PARA_ICONS[cat];
                    const colors = PARA_COLORS[cat];
                    const config = PARA_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setNewCategory(cat);
                          setNewParentId(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          newCategory === cat
                            ? cn(colors.bg, colors.border, colors.text)
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", newCategory === cat ? colors.icon : "text-muted-foreground")} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parent folder selector */}
              {availableParents.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Carpeta padre{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setNewParentId(null)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm transition-colors",
                        newParentId === null
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent/50"
                      )}
                    >
                      Raíz
                    </button>
                    {availableParents.map((parent) => (
                      <button
                        key={parent.id}
                        onClick={() => setNewParentId(parent.id)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm transition-colors",
                          newParentId === parent.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        {parent.icon} {parent.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  placeholder="Nombre de la carpeta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button disabled={!newName.trim()}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {PARA_ORDER.map((category) => (
          <ParaSection key={category} category={category} />
        ))}
      </div>
    </div>
  );
}
