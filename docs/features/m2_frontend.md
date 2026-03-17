# Hito 2 — Frontend

## Objetivo
Dashboard web completo, diseñado y funcional con datos mock / Supabase directo. Cuando este hito esté terminado, el frontend debe verse y sentirse como producto terminado — solo faltará conectar al backend real.

**Principio:** Diseñar bien primero. No código genérico. shadcn/ui como base, personalizado para la identidad de WPNotes.

---

## M2-T1: Design system y setup shadcn/ui

### Descripción
Definir la identidad visual de WPNotes e instalar/configurar shadcn/ui.

### Tareas
1. Instalar shadcn/ui (`npx shadcn-ui@latest init`)
2. Definir paleta de colores en `tailwind.config.ts` y CSS variables
3. Configurar dark mode con `next-themes`
4. Instalar componentes base: Button, Card, Input, Badge, Dialog, DropdownMenu, Sheet, Skeleton, Toast, Avatar, Separator, ScrollArea, Tabs, Command (search)
5. Definir tipografía (Inter o similar)
6. Crear `components/ui/` con los componentes instalados

### Paleta sugerida (definir con el usuario)
- Primary: Azul/indigo (notas, acciones principales)
- Secondary: Verde (confirmaciones, WhatsApp)
- Destructive: Rojo (eliminar, errores)
- Warning: Amarillo (datos sensibles detectados)
- Vault: Púrpura/dorado (bóveda, seguridad)
- Background: Blanco/gris muy claro (light), gris oscuro (dark)

### Criterio de aceptación
- shadcn/ui instalado y funcionando
- Dark mode toggle funcional
- Colores custom definidos en CSS variables
- Componentes base disponibles

---

## M2-T2: Auth pages (login/register)

### Descripción
Páginas de autenticación con Supabase Auth. Diseño limpio y branded.

### Archivos
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/layout.tsx` — Layout centrado para auth
- `middleware.ts` — Protección de rutas (redirect a login si no autenticado, redirect a dashboard si ya autenticado)

### Funcionalidad
- Login con email + password
- Registro con email + password + nombre
- Manejo de errores (credenciales inválidas, email ya registrado)
- Loading states
- Redirect automático post-login a `/dashboard`
- Redirect automático si ya está logueado

### Criterio de aceptación
- Registro, login, logout funcionales
- Rutas `/dashboard/*` protegidas
- Redirect automáticos funcionando
- Diseño consistente con el design system

---

## M2-T3: Dashboard layout

### Descripción
Layout principal del dashboard con sidebar de navegación, header, y área de contenido.

### Archivos
- `app/dashboard/layout.tsx`
- `components/layout/sidebar.tsx` — Navegación: Notes, Folders, Vault, Upload, Settings
- `components/layout/header.tsx` — Breadcrumb, search global, user menu, dark mode toggle
- `components/layout/mobile-nav.tsx` — Sheet/drawer para mobile

### Funcionalidad
- Sidebar colapsable (desktop: sidebar fijo, mobile: drawer)
- Iconos Lucide para cada sección
- Indicador de sección activa
- User menu (dropdown): nombre, email, logout
- Search global en header (Command/⌘K)
- Responsive: mobile-first

### Criterio de aceptación
- Sidebar funcional desktop y mobile
- Dark mode toggle
- User menu con logout
- Responsive sin scroll horizontal
- Navegación entre secciones

---

## M2-T4: Lista y visor de notas

### Descripción
Página principal de notas con lista/grid, búsqueda, filtros, y vista de detalle.

### Archivos
- `app/dashboard/page.tsx` — Página principal (lista de notas)
- `app/dashboard/notes/[id]/page.tsx` — Detalle de nota
- `components/notes/note-card.tsx` — Card de nota en lista
- `components/notes/note-list.tsx` — Lista con search y filtros
- `components/notes/note-detail.tsx` — Vista completa de nota
- `components/notes/note-filters.tsx` — Filtros por source_type, carpeta, fecha
- `components/notes/note-search.tsx` — Barra de búsqueda
- `hooks/useNotes.ts` — Hook para fetch/search/filter notas

### Funcionalidad
- Lista con cards: título, resumen (truncado), source_type badge, tags, fecha, carpeta
- Badges de tipo: 📝 Texto, 🎤 Audio, 📸 Imagen, 📄 Documento
- Badge 🔒 si is_sensitive
- Search full-text (usa FTS de Supabase)
- Filtros: por tipo, por carpeta, por fecha
- Paginación (infinite scroll o pages)
- Detalle: título editable, contenido en markdown, resumen, tags, attachments descargables, metadata
- Estado vacío cuando no hay notas

### Datos mock (fase 1)
Usar datos de ejemplo hardcodeados o insertados en Supabase directamente para diseñar la UI sin backend.

### Criterio de aceptación
- Lista renderiza correctamente
- Search y filtros funcionan
- Detalle muestra toda la info
- Attachments descargables (signed URLs de Supabase)
- Responsive
- Estados vacíos/loading/error

---

## M2-T5: Gestión de carpetas

### Descripción
Vista de carpetas en árbol. CRUD. Click en carpeta filtra notas.

### Archivos
- `app/dashboard/folders/page.tsx`
- `components/folders/folder-tree.tsx` — Árbol de carpetas (soporta parent_id)
- `components/folders/create-folder-dialog.tsx` — Dialog para crear/editar
- `hooks/useFolders.ts`

### Funcionalidad
- Árbol renderiza carpetas con jerarquía (parent_id)
- Crear carpeta (nombre, icono, carpeta padre opcional)
- Renombrar carpeta
- Eliminar carpeta (con confirmación)
- Click en carpeta → navega a dashboard filtrado por esa carpeta
- Badge con cantidad de notas por carpeta
- Indicar carpetas auto-generadas (is_auto) con estilo diferente

### Criterio de aceptación
- CRUD funcional
- Árbol renderiza correctamente con anidamiento
- Filtro de notas por carpeta funciona

---

## M2-T6: Bóveda (vault)

### Descripción
Lista de vault items sin contenido desencriptado. Ver un item requiere re-autenticación. Contenido se auto-oculta tras 30 segundos.

### Archivos
- `app/dashboard/vault/page.tsx`
- `components/vault/vault-list.tsx` — Lista de items (label, type badge, fecha)
- `components/vault/vault-detail.tsx` — Detalle con re-auth y auto-hide
- `components/vault/re-auth-dialog.tsx` — Dialog para re-autenticación
- `hooks/useVault.ts`

### Funcionalidad
- Lista muestra: label, tipo (🔑 Password, 🪪 ID, 💳 Card, 📦 Other), fecha
- **Sin contenido desencriptado visible en la lista**
- Click en item → dialog de re-autenticación (email + password)
- Post re-auth → contenido desencriptado visible
- Timer de 30s visible → auto-hide del contenido
- Botón "Copiar" para copiar contenido al clipboard
- Botón "Ocultar" para ocultar antes de los 30s
- Eliminar vault item (con confirmación)
- **Sin plaintext en browser cache/localStorage**

### Criterio de aceptación
- Re-auth requerida para ver contenido
- Auto-hide 30s funcional con countdown visual
- Copiar al clipboard funciona
- Sin plaintext persistido en browser
- Eliminar con confirmación

---

## M2-T7: Upload manual

### Descripción
Dropzone para subir archivos desde el browser. Misma pipeline de procesamiento que WhatsApp (cuando el backend esté listo).

### Archivos
- `app/dashboard/upload/page.tsx`
- `components/upload/dropzone.tsx` — Drag & drop + click to upload
- `components/upload/upload-progress.tsx` — Progress bar y estado

### Funcionalidad
- Dropzone acepta: audio (OGG, MP3, WAV, M4A), imágenes (JPG, PNG, WEBP), documentos (PDF, DOCX, PPT)
- Límite 25MB por archivo
- Preview del archivo seleccionado
- Upload directo a Supabase Storage (fase mock) o via API (fase integración)
- Progress bar durante upload
- Estados: idle → uploading → processing → done / error
- Después de done → link a la nota creada

### Criterio de aceptación
- Drag & drop y click funcionan
- Validación de tipo y tamaño
- Progress visible
- Estados claros
- Responsive

---

## M2-T8: Settings

### Descripción
Página de configuración del usuario.

### Archivos
- `app/dashboard/settings/page.tsx`
- `components/settings/profile-form.tsx`
- `components/settings/whatsapp-status.tsx`

### Funcionalidad
- Editar nombre
- Ver email (read-only)
- Estado WhatsApp: vinculado/no vinculado, número vinculado
- Sección de uso/cuotas (placeholder para futuro)
- Logout

### Criterio de aceptación
- Perfil actualizable
- Estado WhatsApp visible
- Logout funcional

---

## M2-T9: Realtime

### Descripción
Notas creadas vía WhatsApp aparecen en el dashboard sin refresh, usando Supabase Realtime.

### Archivos
- `hooks/useRealtime.ts` — Suscripción a `postgres_changes` en tabla notes
- Integrar en `useNotes.ts`

### Funcionalidad
- Suscripción a INSERTs en tabla `notes` filtrado por `user_id`
- Nota nueva → aparece en la lista con animación sutil
- Toast notification: "Nueva nota: [título]"
- También suscribir a UPDATEs (edición) y DELETEs

### Criterio de aceptación
- Nota aparece sin refresh tras INSERT en Supabase
- Toast visible
- Sin memory leaks (cleanup de suscripciones)
