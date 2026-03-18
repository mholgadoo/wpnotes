"use client";

import { useState } from "react";
import { Plus, FolderOpen, ChevronRight, Trash2, Sparkles } from "lucide-react";
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
import { mockFolders, type Folder } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

function FolderItem({
  folder,
  children,
  level = 0,
}: {
  folder: Folder;
  children?: Folder[];
  level?: number;
}) {
  return (
    <div>
      <Link href={`/dashboard?folder=${folder.id}`}>
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50 cursor-pointer",
          )}
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <div className="flex items-center gap-2">
            {children && children.length > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-base">{folder.icon}</span>
            <span className="text-sm font-medium">{folder.name}</span>
            {folder.is_auto && (
              <Sparkles className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
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
      </Link>
      {children?.map((child) => (
        <FolderItem
          key={child.id}
          folder={child}
          children={mockFolders.filter((f) => f.parent_id === child.id)}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export default function FoldersPage() {
  const [newName, setNewName] = useState("");

  const rootFolders = mockFolders.filter((f) => f.parent_id === null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Carpetas</h1>
          <p className="text-sm text-muted-foreground">Organizá tus notas</p>
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
            <div className="space-y-3 py-2">
              <Input
                placeholder="Nombre de la carpeta"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-2">
          {rootFolders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Sin carpetas</p>
              <p className="text-sm">Creá una carpeta o dejá que la IA las organice</p>
            </div>
          ) : (
            rootFolders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                children={mockFolders.filter((f) => f.parent_id === folder.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
