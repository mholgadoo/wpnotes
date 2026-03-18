# Feature: Migración Frontend a PARA (Second Brain)

## Objetivo
Adaptar el frontend existente para reflejar la organización PARA (Projects, Areas, Resources, Archive) del Second Brain de Tiago Forte. Actualmente el frontend usa carpetas genéricas; hay que agregar el concepto de categoría PARA en mock data, componentes y navegación.

---

## Tareas

- [x] **T1: Actualizar mock data y tipos**
  - Descripción: Agregar `para_category` al interface `Folder` y clasificar los mock folders existentes. Agregar `reminder_at` al interface `Note`.
  - Archivos: `lib/mock-data.ts`
  - Criterio de aceptación: Todos los folders tienen `para_category` asignado. Hay al menos 2 folders por categoría PARA en los mocks. Los sub-folders heredan la categoría del padre.

- [x] **T2: Rediseñar la página de Carpetas con layout PARA**
  - Descripción: Reorganizar `folders/page.tsx` para mostrar 4 secciones (Projects, Areas, Resources, Archive) con sus carpetas adentro. Cada sección tiene encabezado con ícono y color distintivo. Las sub-carpetas se muestran anidadas dentro de su padre.
  - Archivos: `app/dashboard/folders/page.tsx`
  - Criterio de aceptación: Las 4 categorías PARA se muestran como secciones separadas. Carpetas agrupadas correctamente. Sub-carpetas visibles bajo su padre.

- [x] **T3: Actualizar diálogo de crear carpeta**
  - Descripción: El diálogo de "Nueva carpeta" debe incluir selector de `para_category` (obligatorio) y opcionalmente seleccionar una carpeta padre (solo carpetas raíz de la misma categoría).
  - Archivos: `app/dashboard/folders/page.tsx` (o extraer a `components/folders/create-folder-dialog.tsx`)
  - Criterio de aceptación: El diálogo tiene selector de categoría PARA. Si se elige padre, solo muestra carpetas raíz de esa categoría. No permite crear sub-sub-carpetas.

- [x] **T4: Actualizar NoteCard y NoteDetail con contexto PARA**
  - Descripción: Mostrar la categoría PARA como badge con color junto al nombre de carpeta. Colores sugeridos: Projects=blue, Areas=green, Resources=amber, Archive=gray.
  - Archivos: `components/notes/note-card.tsx`, `components/notes/note-detail.tsx`
  - Criterio de aceptación: El badge de carpeta muestra la categoría PARA con color distintivo. Si la nota no tiene carpeta, no se muestra badge.

- [x] **T5: Agregar filtro por categoría PARA en NoteList**
  - Descripción: Agregar botones/tabs de filtro por categoría PARA en la lista de notas, además del filtro por folder existente. Aceptar prop `paraCategory` opcional.
  - Archivos: `components/notes/note-list.tsx`, `lib/mock-data.ts` (agregar helper para obtener categoría de una nota vía su folder)
  - Criterio de aceptación: Se puede filtrar notas por categoría PARA. El filtro es combinable con los filtros existentes (search, source_type). Mostrar indicador de filtro activo.

- [x] **T6: Actualizar Dashboard page con soporte de filtros PARA**
  - Descripción: Soportar query params `?category=project` y `?folder=id` en la URL. Pasar los filtros a NoteList. Mostrar contexto del filtro en el header.
  - Archivos: `app/dashboard/page.tsx`
  - Criterio de aceptación: Navegar a `/dashboard?category=project` filtra las notas de Projects. El título refleja el filtro activo (ej: "Notas — Proyectos").

- [x] **T7: Actualizar Sidebar con navegación PARA**
  - Descripción: Cuando el usuario está en la sección de Carpetas o navega por categoría, la sidebar muestra las 4 categorías PARA como sub-ítems expandibles bajo "Carpetas", con links directos a `/dashboard?category=X`.
  - Archivos: `components/layout/sidebar.tsx`
  - Criterio de aceptación: La sidebar muestra las 4 categorías PARA como sub-navegación. Click en una categoría filtra el dashboard. Indicador visual de categoría activa.

---

## Dependencias
- M1 completo (migraciones PARA ya aplicadas en `002_folders.sql`)
- M2 frontend base completo (componentes existentes)

## Notas técnicas
- **Colores PARA**: Projects=blue, Areas=green, Resources=amber, Archive=gray (consistente en toda la app)
- **Íconos PARA sugeridos**: Projects=Target, Areas=Layers, Resources=BookOpen, Archive=Archive (de lucide-react)
- **No se toca el backend**: Todo sigue con mock data hasta M3
- **`reminder_at`**: Solo agregar al tipo por ahora, la UI de recordatorios es trabajo futuro (Google Calendar integration)
- **Orden de ejecución recomendado**: T1 → T2+T3 (paralelo) → T4 → T5 → T6 → T7
