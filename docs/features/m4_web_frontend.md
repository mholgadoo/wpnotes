# Hito 4 — Web Frontend

## Objetivo
Dashboard web completo con Next.js: autenticación, gestión de notas, carpetas, bóveda segura, upload manual y actualizaciones en tiempo real.

---

## M4-T1: Auth pages (login/register)

### Descripción
Páginas de autenticación con Supabase Auth. Email + password. Middleware de Next.js para proteger rutas.

### Archivo: `frontend/app/(auth)/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Archivo: `frontend/app/(auth)/register/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Crear cuenta</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Archivo: `frontend/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Proteger rutas de dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirigir a dashboard si ya está autenticado
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
```

### Criterio de aceptación
- Registro con email + password funcional
- Login funcional, redirect a dashboard
- Logout funcional
- Rutas `/dashboard/*` protegidas → redirect a `/login`
- Usuario logueado en `/login` → redirect a `/dashboard`

---

## M4-T2: Dashboard layout y navegación

### Descripción
Layout principal del dashboard con sidebar responsive, navegación, y dark mode.

### Archivo: `frontend/app/dashboard/layout.tsx`

```tsx
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

### Archivo: `frontend/components/dashboard/sidebar.tsx`

```tsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  FileText, FolderOpen, Shield, Upload, Settings, LogOut,
  Menu, X, Moon, Sun,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Notas", icon: FileText },
  { href: "/dashboard/folders", label: "Carpetas", icon: FolderOpen },
  { href: "/dashboard/vault", label: "Bóveda", icon: Shield },
  { href: "/dashboard/upload", label: "Subir", icon: Upload },
  { href: "/dashboard/settings", label: "Config", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700
          transform transition-transform lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 px-2">
            <FileText className="text-blue-600" size={28} />
            <span className="text-xl font-bold">WPNotes</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="space-y-2 pt-4 border-t dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? "Modo claro" : "Modo oscuro"}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

### Criterio de aceptación
- Sidebar con todos los nav items
- Responsive: hamburger en mobile, sidebar fija en desktop
- Dark mode toggle funcional
- Active state en nav item correcto
- Logout funcional

---

## M4-T3: Lista y visor de notas

### Descripción
Vista principal del dashboard: lista de notas con búsqueda, filtros, paginación. Vista detalle con markdown rendering.

### Archivo: `frontend/app/dashboard/page.tsx`

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { NoteCard } from "@/components/notes/note-card";
import { NoteFilters } from "@/components/notes/note-filters";
import { Search, Grid, List } from "lucide-react";

interface Note {
  id: string;
  title: string;
  summary: string;
  source_type: string;
  tags: string[];
  is_sensitive: boolean;
  folder_id: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [folderFilter, setFolderFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("q", search);
    if (sourceFilter) params.set("source_type", sourceFilter);
    if (folderFilter) params.set("folder_id", folderFilter);

    const data = await apiFetch(`/api/notes?${params}`);
    setNotes(data.notes);
    setLoading(false);
  }, [page, search, sourceFilter, folderFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis Notas</h1>

      {/* Search bar */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-100 dark:bg-blue-900" : ""}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100 dark:bg-blue-900" : ""}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <NoteFilters
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        folderFilter={folderFilter}
        onFolderChange={setFolderFilter}
      />

      {/* Notes grid/list */}
      <div className={viewMode === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
        : "space-y-2 mt-4"
      }>
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} viewMode={viewMode} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-4 py-2">Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={notes.length < 20}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

### Archivo: `frontend/components/notes/note-card.tsx`

```tsx
import Link from "next/link";
import { FileText, Mic, Image, FileIcon, Shield } from "lucide-react";

const sourceIcons = {
  text: FileText,
  audio: Mic,
  image: Image,
  document: FileIcon,
};

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    summary: string;
    source_type: string;
    tags: string[];
    is_sensitive: boolean;
    created_at: string;
  };
  viewMode: "grid" | "list";
}

export function NoteCard({ note, viewMode }: NoteCardProps) {
  const Icon = sourceIcons[note.source_type as keyof typeof sourceIcons] ?? FileText;
  const date = new Date(note.created_at).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  if (viewMode === "list") {
    return (
      <Link
        href={`/dashboard/notes/${note.id}`}
        className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 hover:shadow-sm transition"
      >
        <Icon size={18} className="text-gray-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{note.title ?? "Sin título"}</p>
          <p className="text-sm text-gray-500 truncate">{note.summary}</p>
        </div>
        {note.is_sensitive && <Shield size={16} className="text-amber-500 shrink-0" />}
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/dashboard/notes/${note.id}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:shadow-md transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-gray-500" />
        <span className="text-xs text-gray-400">{date}</span>
        {note.is_sensitive && <Shield size={14} className="text-amber-500" />}
      </div>
      <h3 className="font-medium mb-1">{note.title ?? "Sin título"}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{note.summary}</p>
      {note.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {note.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
```

### Archivo: `frontend/components/notes/note-filters.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  sourceFilter: string;
  onSourceChange: (v: string) => void;
  folderFilter: string;
  onFolderChange: (v: string) => void;
}

const sourceTypes = [
  { value: "", label: "Todos" },
  { value: "text", label: "Texto" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Imagen" },
  { value: "document", label: "Documento" },
];

export function NoteFilters({ sourceFilter, onSourceChange, folderFilter, onFolderChange }: Props) {
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch("/api/folders").then((data) => setFolders(data.folders ?? []));
  }, []);

  return (
    <div className="flex gap-3 flex-wrap">
      {/* Source type filter */}
      <div className="flex gap-1">
        {sourceTypes.map((st) => (
          <button
            key={st.value}
            onClick={() => onSourceChange(st.value)}
            className={`px-3 py-1 text-sm rounded-full border transition
              ${sourceFilter === st.value
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Folder filter */}
      <select
        value={folderFilter}
        onChange={(e) => onFolderChange(e.target.value)}
        className="px-3 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600"
      >
        <option value="">Todas las carpetas</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
    </div>
  );
}
```

### Archivo: `frontend/app/dashboard/notes/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Download, Trash2, Mic, Image, FileIcon, FileText } from "lucide-react";

interface NoteDetail {
  id: string;
  title: string;
  content: string;
  summary: string;
  source_type: string;
  tags: string[];
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
  attachments: {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }[];
}

const sourceLabels = { text: "Texto", audio: "Audio", image: "Imagen", document: "Documento" };
const sourceIcons = { text: FileText, audio: Mic, image: Image, document: FileIcon };

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [note, setNote] = useState<NoteDetail | null>(null);

  useEffect(() => {
    apiFetch(`/api/notes/${id}`).then(setNote);
  }, [id]);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta nota?")) return;
    await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  async function handleDownload(attachmentId: string, fileName: string) {
    const data = await apiFetch(`/api/notes/${id}/attachments/${attachmentId}/url`);
    const a = document.createElement("a");
    a.href = data.url;
    a.download = fileName;
    a.click();
  }

  if (!note) return <div className="animate-pulse">Cargando...</div>;

  const Icon = sourceIcons[note.source_type as keyof typeof sourceIcons] ?? FileText;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{note.title ?? "Sin título"}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Icon size={14} />
            <span>{sourceLabels[note.source_type as keyof typeof sourceLabels]}</span>
            <span>·</span>
            <span>{new Date(note.created_at).toLocaleDateString("es-AR")}</span>
          </div>
        </div>
        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {note.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {note.summary && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
          <h3 className="font-medium text-sm mb-1">Resumen</h3>
          <p className="text-sm">{note.summary}</p>
        </div>
      )}

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>

      {/* Attachments */}
      {note.attachments.length > 0 && (
        <div className="mt-8 border-t dark:border-gray-700 pt-4">
          <h3 className="font-medium mb-3">Archivos adjuntos</h3>
          <div className="space-y-2">
            {note.attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-md">
                <FileIcon size={18} className="text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{att.file_name}</p>
                  <p className="text-xs text-gray-500">{(att.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => handleDownload(att.id, att.file_name)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Criterio de aceptación
- Lista de notas con grid/list toggle
- Búsqueda full-text funcional
- Filtros por tipo y carpeta
- Paginación
- Vista detalle con markdown, resumen, tags, attachments
- Attachments descargables
- Eliminar nota con confirmación

---

## M4-T4: Gestión de carpetas

### Archivo: `frontend/app/dashboard/folders/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { FolderOpen, Plus, Edit2, Trash2 } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  icon: string;
  is_auto: boolean;
  parent_id: string | null;
  note_count?: number;
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    const data = await apiFetch("/api/folders");
    setFolders(data.folders ?? []);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await apiFetch("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name: newFolderName }),
    });
    setNewFolderName("");
    loadFolders();
  }

  async function updateFolder(id: string) {
    await apiFetch(`/api/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editName }),
    });
    setEditingId(null);
    loadFolders();
  }

  async function deleteFolder(id: string) {
    if (!confirm("¿Eliminar esta carpeta? Las notas no se borran.")) return;
    await apiFetch(`/api/folders/${id}`, { method: "DELETE" });
    loadFolders();
  }

  // Construir árbol
  const rootFolders = folders.filter((f) => !f.parent_id);
  const getChildren = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  function renderFolder(folder: Folder, depth = 0) {
    return (
      <div key={folder.id}>
        <div
          className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <span>{folder.icon}</span>
          {editingId === folder.id ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => updateFolder(folder.id)}
              onKeyDown={(e) => e.key === "Enter" && updateFolder(folder.id)}
              autoFocus
              className="flex-1 px-2 py-1 border rounded text-sm dark:bg-gray-800"
            />
          ) : (
            <span className="flex-1 text-sm font-medium">{folder.name}</span>
          )}
          {folder.is_auto && (
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">auto</span>
          )}
          <button
            onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => deleteFolder(folder.id)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {getChildren(folder.id).map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Carpetas</h1>

      {/* Create folder */}
      <div className="flex gap-2 mb-6">
        <input
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createFolder()}
          placeholder="Nueva carpeta..."
          className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        />
        <button
          onClick={createFolder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={18} />
          Crear
        </button>
      </div>

      {/* Folder tree */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        {rootFolders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FolderOpen size={40} className="mx-auto mb-2 text-gray-300" />
            <p>No hay carpetas todavía</p>
            <p className="text-sm">Las carpetas se crean automáticamente al recibir notas</p>
          </div>
        ) : (
          rootFolders.map((f) => renderFolder(f))
        )}
      </div>
    </div>
  );
}
```

### Criterio de aceptación
- CRUD de carpetas funcional
- Vista de árbol con indentación
- Badge "auto" en carpetas creadas por AI
- Inline editing
- Eliminar carpeta no borra notas (folder_id → null)

---

## M4-T5: Bóveda (vault)

### Archivo: `frontend/app/dashboard/vault/page.tsx`

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Shield, Eye, EyeOff, Trash2, Lock } from "lucide-react";

interface VaultItem {
  id: string;
  label: string;
  type: string;
  createdAt: string;
}

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [decryptedId, setDecryptedId] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<string>("");
  const [showReAuth, setShowReAuth] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadItems();
    return () => { if (autoHideTimer.current) clearTimeout(autoHideTimer.current); };
  }, []);

  async function loadItems() {
    const data = await apiFetch("/api/vault");
    setItems(data.items ?? []);
  }

  async function requestDecrypt(itemId: string) {
    setPendingItemId(itemId);
    setShowReAuth(true);
    setPassword("");
    setError("");
  }

  async function handleReAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("No se pudo verificar tu identidad");
      return;
    }

    // Re-autenticar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (authError) {
      setError("Contraseña incorrecta");
      return;
    }

    // Obtener dato desencriptado
    try {
      const data = await apiFetch(`/api/vault/${pendingItemId}`);
      setDecryptedData(data.decryptedData);
      setDecryptedId(pendingItemId);
      setShowReAuth(false);

      // Auto-hide después de 30s
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      autoHideTimer.current = setTimeout(() => {
        setDecryptedId(null);
        setDecryptedData("");
      }, 30_000);
    } catch {
      setError("Error al desencriptar");
    }
  }

  function hideDecrypted() {
    setDecryptedId(null);
    setDecryptedData("");
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este item de la bóveda? Esta acción no se puede deshacer.")) return;
    await apiFetch(`/api/vault/${id}`, { method: "DELETE" });
    loadItems();
  }

  const typeLabels: Record<string, string> = {
    password: "Contraseña",
    id_photo: "Documento de identidad",
    card: "Tarjeta",
    other: "Otro",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-amber-500" size={28} />
        <h1 className="text-2xl font-bold">Bóveda Segura</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Tus datos sensibles están cifrados con AES-256-GCM. Para ver el contenido necesitás re-autenticarte.
        El contenido se oculta automáticamente después de 30 segundos.
      </p>

      {/* Re-auth modal */}
      {showReAuth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={20} className="text-amber-500" />
              <h2 className="font-bold">Verificar identidad</h2>
            </div>
            <form onSubmit={handleReAuth} className="space-y-4">
              {error && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoFocus
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Verificar
                </button>
                <button
                  type="button"
                  onClick={() => setShowReAuth(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <Shield size={40} className="mx-auto mb-2 text-gray-300" />
            <p>La bóveda está vacía</p>
            <p className="text-sm">Los datos sensibles se detectan automáticamente</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    {typeLabels[item.type] ?? item.type} · {new Date(item.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>

                {decryptedId === item.id ? (
                  <button onClick={hideDecrypted} className="p-2 text-gray-500 hover:text-gray-700">
                    <EyeOff size={18} />
                  </button>
                ) : (
                  <button onClick={() => requestDecrypt(item.id)} className="p-2 text-blue-500 hover:text-blue-700">
                    <Eye size={18} />
                  </button>
                )}

                <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Decrypted content */}
              {decryptedId === item.id && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-sm font-mono break-all">{decryptedData}</p>
                  <p className="text-xs text-amber-600 mt-2">Se ocultará automáticamente en 30 segundos</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### Criterio de aceptación
- Lista items sin datos desencriptados
- Click "ver" → re-auth con password
- Re-auth exitosa → contenido desencriptado visible
- Auto-hide después de 30 segundos
- Sin plaintext en browser cache/memory después de hide
- Eliminar item con confirmación

---

## M4-T6: Upload manual de archivos

### Archivo: `frontend/app/dashboard/upload/page.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Upload, File, CheckCircle, Loader, XCircle } from "lucide-react";

interface UploadJob {
  id: string;
  fileName: string;
  status: "uploading" | "processing" | "completed" | "failed";
}

export default function UploadPage() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      const jobId = crypto.randomUUID();
      setJobs((prev) => [...prev, { id: jobId, fileName: file.name, status: "uploading" }]);

      try {
        // Upload via API
        const formData = new FormData();
        formData.append("file", file);

        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${session?.access_token}` },
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Upload failed");

        setJobs((prev) => prev.map((j) =>
          j.id === jobId ? { ...j, status: "processing" } : j
        ));

        // Poll for completion (simple approach)
        const data = await response.json();
        // La nota aparecerá via realtime (M4-T8)

        setJobs((prev) => prev.map((j) =>
          j.id === jobId ? { ...j, status: "completed" } : j
        ));
      } catch {
        setJobs((prev) => prev.map((j) =>
          j.id === jobId ? { ...j, status: "failed" } : j
        ));
      }
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  const statusIcons = {
    uploading: <Loader size={18} className="animate-spin text-blue-500" />,
    processing: <Loader size={18} className="animate-spin text-amber-500" />,
    completed: <CheckCircle size={18} className="text-green-500" />,
    failed: <XCircle size={18} className="text-red-500" />,
  };

  const statusLabels = {
    uploading: "Subiendo...",
    processing: "Procesando con IA...",
    completed: "Completado",
    failed: "Error",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Subir archivos</h1>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition
          ${isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
          }
        `}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = "audio/*,image/*,.pdf,.doc,.docx,.ppt,.pptx";
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFiles(files);
          };
          input.click();
        }}
      >
        <Upload size={40} className="mx-auto mb-4 text-gray-400" />
        <p className="font-medium">Arrastrá archivos o hacé click para seleccionar</p>
        <p className="text-sm text-gray-500 mt-1">
          Audio, imágenes, PDF, DOCX, PPT (máx. 25MB)
        </p>
      </div>

      {/* Upload jobs */}
      {jobs.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="font-medium text-sm text-gray-500">Archivos</h2>
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
              <File size={18} className="text-gray-500" />
              <span className="flex-1 text-sm truncate">{job.fileName}</span>
              {statusIcons[job.status]}
              <span className="text-xs text-gray-500">{statusLabels[job.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Criterio de aceptación
- Dropzone funcional (drag & drop + click)
- Tipos aceptados: audio, imagen, PDF, DOCX, PPT
- Estado de upload visible (uploading → processing → completed/failed)
- Archivos pasan por la misma pipeline de procesamiento que WhatsApp
- Nota aparece en dashboard al completar

---

## M4-T7: Página de settings

### Archivo: `frontend/app/dashboard/settings/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Settings, Smartphone, User } from "lucide-react";

interface Profile {
  display_name: string;
  phone_number: string | null;
  whatsapp_linked: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name ?? "");
    }
  }

  async function saveProfile() {
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    setSaving(false);
    setMessage(error ? "Error al guardar" : "Guardado");
    setTimeout(() => setMessage(""), 3000);
  }

  if (!profile) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      {/* Profile */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} />
          <h2 className="font-bold">Perfil</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>

          {message && <p className="text-sm text-green-600">{message}</p>}
        </div>
      </section>

      {/* WhatsApp */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={20} />
          <h2 className="font-bold">WhatsApp</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${profile.whatsapp_linked ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-sm">
            {profile.whatsapp_linked
              ? `Vinculado: ${profile.phone_number}`
              : "No vinculado"
            }
          </span>
        </div>

        {!profile.whatsapp_linked && (
          <p className="text-sm text-gray-500 mt-3">
            Para vincular WhatsApp, enviá un mensaje desde tu teléfono al número del bot.
            Tu cuenta se vinculará automáticamente.
          </p>
        )}
      </section>
    </div>
  );
}
```

### Criterio de aceptación
- Nombre editable y guardable
- Estado de WhatsApp visible (vinculado/no vinculado)
- Número de teléfono mostrado si está vinculado

---

## M4-T8: Actualizaciones en tiempo real

### Descripción
Usar Supabase Realtime para que notas creadas via WhatsApp aparezcan en el dashboard sin refresh.

### Archivo: `frontend/lib/use-realtime-notes.ts`

```typescript
"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "./supabase-browser";

interface UseRealtimeNotesOptions {
  userId: string;
  onInsert: (note: any) => void;
  onUpdate?: (note: any) => void;
  onDelete?: (id: string) => void;
}

export function useRealtimeNotes({ userId, onInsert, onUpdate, onDelete }: UseRealtimeNotesOptions) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onInsert(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onDelete?.(payload.old.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onInsert, onUpdate, onDelete]);
}
```

### Uso en dashboard/page.tsx:

```tsx
// Agregar al componente DashboardPage:
import { useRealtimeNotes } from "@/lib/use-realtime-notes";

// Dentro del componente:
useRealtimeNotes({
  userId: user.id,
  onInsert: (note) => {
    setNotes((prev) => [note, ...prev]);
  },
  onUpdate: (note) => {
    setNotes((prev) => prev.map((n) => n.id === note.id ? note : n));
  },
  onDelete: (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  },
});
```

### Configuración Supabase requerida

Habilitar Realtime en la tabla `notes`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

### Criterio de aceptación
- Nota creada via WhatsApp aparece en dashboard sin refresh
- Nota actualizada se refleja en tiempo real
- Nota eliminada desaparece en tiempo real
- Channel se limpia al desmontar componente
