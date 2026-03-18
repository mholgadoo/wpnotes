"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Mic, Image, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

const ACCEPTED_TYPES = [
  "audio/ogg", "audio/mpeg", "audio/wav", "audio/mp4",
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_SIZE = 25 * 1024 * 1024;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  function validateFile(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Tipo de archivo no soportado";
    if (f.size > MAX_SIZE) return "El archivo supera los 25MB";
    return null;
  }

  function handleFile(f: File) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError("");
    setState("idle");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  function handleUpload() {
    if (!file) return;
    setState("uploading");
    // Mock upload flow
    setTimeout(() => setState("processing"), 1500);
    setTimeout(() => setState("done"), 3500);
  }

  function getFileIcon() {
    if (!file) return Upload;
    if (file.type.startsWith("audio/")) return Mic;
    if (file.type.startsWith("image/")) return Image;
    return FileText;
  }

  const FileIcon = getFileIcon();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Subir archivo</h1>
        <p className="text-sm text-muted-foreground">
          Audio, imágenes o documentos — se procesan igual que por WhatsApp
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {state === "done" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-[var(--success)] mb-3" />
              <p className="font-medium">Procesado correctamente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu nota ya está disponible en el dashboard
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setFile(null);
                  setState("idle");
                }}
              >
                Subir otro
              </Button>
            </div>
          ) : state === "error" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="font-medium">Error al procesar</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setState("idle");
                  setError("");
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => {
                  if (state !== "idle" || file) return;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ACCEPTED_TYPES.join(",");
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFile(f);
                  };
                  input.click();
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 transition-colors cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50",
                  file && "border-solid border-muted",
                )}
              >
                <FileIcon
                  className={cn(
                    "h-10 w-10 mb-3",
                    file ? "text-primary" : "text-muted-foreground/40",
                  )}
                />

                {file ? (
                  <div className="text-center">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-sm">
                      Arrastrá un archivo o hacé click
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Audio, imágenes, PDF, DOCX — máx. 25MB
                    </p>
                  </>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}

              {file && state === "idle" && (
                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={handleUpload} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    Subir y procesar
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setError("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {(state === "uploading" || state === "processing") && (
                <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {state === "uploading" ? "Subiendo..." : "Procesando con IA..."}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
