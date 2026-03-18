export type ParaCategory = "project" | "area" | "resource" | "archive";

export interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  source_type: "text" | "audio" | "image" | "document";
  tags: string[];
  is_sensitive: boolean;
  folder_id: string | null;
  folder_name?: string;
  reminder_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  para_category: ParaCategory;
  parent_id: string | null;
  icon: string;
  is_auto: boolean;
  note_count: number;
  created_at: string;
}

export interface VaultItem {
  id: string;
  label: string;
  type: "password" | "id_photo" | "card" | "other";
  created_at: string;
}

export const PARA_CONFIG: Record<ParaCategory, { label: string; icon: string; color: string; description: string }> = {
  project: { label: "Proyectos", icon: "Target", color: "blue", description: "Cosas con objetivo claro y deadline" },
  area: { label: "Áreas", icon: "Layers", color: "green", description: "Responsabilidades continuas" },
  resource: { label: "Recursos", icon: "BookOpen", color: "amber", description: "Temas de interés y referencia" },
  archive: { label: "Archivo", icon: "Archive", color: "gray", description: "Lo que ya no está activo" },
};

export const mockFolders: Folder[] = [
  // Projects
  { id: "f1", name: "Trabajo", para_category: "project", parent_id: null, icon: "💼", is_auto: false, note_count: 3, created_at: "2026-03-10T10:00:00Z" },
  { id: "f5", name: "Proyecto Final", para_category: "project", parent_id: null, icon: "🎯", is_auto: false, note_count: 1, created_at: "2026-03-11T10:00:00Z" },
  // Areas
  { id: "f2", name: "Universidad", para_category: "area", parent_id: null, icon: "🎓", is_auto: false, note_count: 4, created_at: "2026-03-10T10:00:00Z" },
  { id: "f4", name: "Álgebra", para_category: "area", parent_id: "f2", icon: "📐", is_auto: true, note_count: 2, created_at: "2026-03-14T10:00:00Z" },
  { id: "f6", name: "Finanzas", para_category: "area", parent_id: null, icon: "💰", is_auto: false, note_count: 0, created_at: "2026-03-12T10:00:00Z" },
  // Resources
  { id: "f7", name: "Papers IA", para_category: "resource", parent_id: null, icon: "🤖", is_auto: false, note_count: 1, created_at: "2026-03-13T10:00:00Z" },
  { id: "f8", name: "Recetas", para_category: "resource", parent_id: null, icon: "🍳", is_auto: false, note_count: 0, created_at: "2026-03-13T10:00:00Z" },
  // Archive
  { id: "f3", name: "Personal", para_category: "archive", parent_id: null, icon: "📁", is_auto: true, note_count: 2, created_at: "2026-03-12T10:00:00Z" },
];

export const mockNotes: Note[] = [
  {
    id: "n1",
    title: "Reunión con el equipo de diseño",
    content: "Se discutieron los wireframes del nuevo dashboard. Puntos clave:\n\n- Sidebar colapsable en mobile\n- Dark mode obligatorio\n- Paleta indigo como primaria\n\nPróxima reunión el jueves.",
    summary: "Resumen de reunión sobre wireframes del dashboard: sidebar mobile, dark mode, paleta indigo.",
    source_type: "text",
    tags: ["diseño", "reunión", "dashboard"],
    is_sensitive: false,
    folder_id: "f1",
    folder_name: "Trabajo",
    created_at: "2026-03-17T14:30:00Z",
    updated_at: "2026-03-17T14:30:00Z",
  },
  {
    id: "n2",
    title: "Clase de Álgebra Lineal — Espacios vectoriales",
    content: "## Definición\nUn espacio vectorial V sobre un cuerpo K es un conjunto no vacío con dos operaciones:\n1. Suma de vectores\n2. Producto por escalar\n\n## Axiomas\n- Asociatividad\n- Conmutatividad\n- Elemento neutro\n- Elemento opuesto\n\n## Ejemplos\n- R^n con las operaciones usuales\n- Matrices m×n\n- Polinomios de grado ≤ n",
    summary: "Apuntes sobre espacios vectoriales: definición, axiomas y ejemplos (R^n, matrices, polinomios).",
    source_type: "audio",
    tags: ["álgebra", "matemática", "espacios vectoriales"],
    is_sensitive: false,
    folder_id: "f4",
    folder_name: "Álgebra",
    created_at: "2026-03-16T09:15:00Z",
    updated_at: "2026-03-16T09:15:00Z",
  },
  {
    id: "n3",
    title: "Foto pizarrón — Diagrama de clases",
    content: "**Texto extraído del pizarrón:**\n\nUser → Profile (1:1)\nProfile → Notes (1:N)\nNotes → Attachments (1:N)\nNotes → Folders (N:1)\n\nVault independiente de Notes.",
    summary: "Diagrama ER del sistema: relaciones entre User, Profile, Notes, Attachments, Folders y Vault.",
    source_type: "image",
    tags: ["diagrama", "arquitectura", "base de datos"],
    is_sensitive: false,
    folder_id: "f2",
    folder_name: "Universidad",
    created_at: "2026-03-15T11:00:00Z",
    updated_at: "2026-03-15T11:00:00Z",
  },
  {
    id: "n4",
    title: "Resumen — Paper sobre transformers",
    content: "## Attention Is All You Need (2017)\n\nEl paper introduce la arquitectura Transformer, que reemplaza las RNNs con mecanismos de auto-atención.\n\n### Puntos clave\n- Self-attention permite capturar dependencias a larga distancia\n- Multi-head attention para múltiples representaciones\n- Positional encoding para preservar el orden\n- Encoder-decoder architecture\n\n### Resultados\n- BLEU score superior en traducción EN-DE y EN-FR\n- Entrenamiento más parallelizable que RNNs",
    summary: "Resumen del paper 'Attention Is All You Need': arquitectura Transformer, self-attention, multi-head attention.",
    source_type: "document",
    tags: ["IA", "transformers", "paper", "deep learning"],
    is_sensitive: false,
    folder_id: "f7",
    folder_name: "Papers IA",
    created_at: "2026-03-14T16:45:00Z",
    updated_at: "2026-03-14T16:45:00Z",
  },
  {
    id: "n5",
    title: "Dato sensible detectado",
    content: "Se detectó información sensible en este mensaje.\n\n[🔒 PROTEGIDO - Ver Bóveda: Contraseña WiFi oficina]",
    summary: null,
    source_type: "text",
    tags: [],
    is_sensitive: true,
    folder_id: "f1",
    folder_name: "Trabajo",
    created_at: "2026-03-13T09:00:00Z",
    updated_at: "2026-03-13T09:00:00Z",
  },
  {
    id: "n6",
    title: "Ideas para el proyecto final",
    content: "Opciones:\n1. App de notas con WhatsApp (← esta)\n2. Dashboard de métricas para PYMES\n3. Chatbot para atención al cliente\n\nElegimos la opción 1. Próximos pasos: armar el stack y el plan.",
    summary: "Brainstorming de proyecto final. Se eligió app de notas con WhatsApp.",
    source_type: "text",
    tags: ["proyecto", "ideas", "brainstorming"],
    is_sensitive: false,
    folder_id: "f5",
    folder_name: "Proyecto Final",
    created_at: "2026-03-12T20:00:00Z",
    updated_at: "2026-03-12T20:00:00Z",
  },
];

export const mockVaultItems: VaultItem[] = [
  { id: "v1", label: "Contraseña WiFi oficina", type: "password", created_at: "2026-03-13T09:00:00Z" },
  { id: "v2", label: "PIN tarjeta débito", type: "card", created_at: "2026-03-11T15:30:00Z" },
  { id: "v3", label: "Token API producción", type: "password", created_at: "2026-03-10T08:00:00Z" },
];

// Helper: get the PARA category of a note via its folder
export function getNotePara(note: Note): ParaCategory | null {
  if (!note.folder_id) return null;
  const folder = mockFolders.find((f) => f.id === note.folder_id);
  return folder?.para_category ?? null;
}

// Helper: get root folders for a given PARA category
export function getFoldersByCategory(category: ParaCategory): Folder[] {
  return mockFolders.filter((f) => f.para_category === category && f.parent_id === null);
}

// Helper: get sub-folders of a parent folder
export function getSubFolders(parentId: string): Folder[] {
  return mockFolders.filter((f) => f.parent_id === parentId);
}
