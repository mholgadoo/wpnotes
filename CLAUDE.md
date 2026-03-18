# CLAUDE.md — WPNotes

Este archivo es la fuente de verdad para el asistente IA. Debe consultarse al inicio de cada sesión.

---

## Qué es WPNotes

Asistente personal inteligente vía WhatsApp + Web App. El usuario envía audios, fotos, archivos y texto por WhatsApp; el backend los procesa con IA (transcripción, OCR, resúmenes); los datos sensibles se detectan y cifran; todo se presenta en un dashboard web con una "bóveda" segura.

**Flujo:** Usuario → WhatsApp → Evolution API → Backend (Fastify/Node/TS) → IA (Gemini/OpenAI) → Supabase → Web App (Next.js)

**Organización:** Second Brain (Tiago Forte). Las notas se organizan con el sistema PARA (Projects, Areas, Resources, Archive). La IA auto-clasifica cada nota en la categoría y carpeta correspondiente. El pipeline sigue CODE (Capture → Organize → Distill → Express).

**Escala MVP:** 10-100 usuarios simultáneos.

---

## Stack Tecnológico

| Capa       | Tecnología                                                        |
|------------|-------------------------------------------------------------------|
| Frontend   | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, TypeScript    |
| Backend    | Fastify (Node.js/TypeScript), BullMQ (colas)                     |
| Base datos | Supabase (PostgreSQL + Auth + Storage + Realtime)                 |
| IA         | OpenAI (Whisper, GPT-4o), Google Gemini (docs grandes)            |
| WhatsApp   | Evolution API v2 (self-hosted, webhooks HTTP)                     |
| Cola       | BullMQ + Redis                                                    |
| Seguridad  | AES-256-GCM (vault), bcrypt (hashing)                             |
| Monorepo   | pnpm workspaces                                                   |
| Hosting    | Render.com                                                        |

---

## Arquitectura

```
wpnotes/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Bootstrap Fastify
│   │   ├── config/                   # env.ts, supabase.ts, redis.ts, logger.ts
│   │   ├── middleware/               # error-handler, rate-limiter, request-logger
│   │   └── modules/
│   │       ├── auth/                 # auth.middleware.ts, auth.types.ts
│   │       ├── whatsapp/             # controller, service, queue, worker, types
│   │       ├── ai/                   # ai.service.ts, transcription, ocr, document, organizer, study
│   │       │   └── providers/        # provider.interface.ts, openai, gemini
│   │       ├── security/             # encryption, hashing, detector, vault
│   │       ├── storage/              # storage.service.ts
│   │       ├── notes/                # controller, service
│   │       └── folders/              # controller, service
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing / redirect
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx              # Notes overview
│   │       ├── notes/[id]/page.tsx
│   │       ├── folders/page.tsx
│   │       ├── vault/page.tsx
│   │       ├── upload/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui
│   │   ├── layout/                   # sidebar, header, theme
│   │   ├── notes/                    # list, card, detail, search
│   │   ├── folders/                  # tree, create-dialog
│   │   └── vault/                    # list, detail, re-auth
│   ├── lib/
│   │   ├── supabase-browser.ts
│   │   ├── supabase-server.ts
│   │   └── api-client.ts
│   ├── hooks/                        # useNotes, useFolders, useVault, useRealtime
│   ├── Dockerfile
│   └── package.json
├── supabase/
│   └── migrations/                   # 001-007 SQL
├── docs/
│   ├── features/                     # Specs por hito (ver _template.md)
│   └── adr/                          # Architecture Decision Records
├── docker-compose.yml                # Redis + Evolution API
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

---

## Convenciones de Código

### Backend (Node.js/TypeScript/Fastify)
- Un módulo por dominio en `src/modules/` (controller + service + types)
- Controllers solo rutean requests → services. Lógica de negocio en services.
- Auth via `requireAuth` preHandler hook (verifica JWT con Supabase)
- `supabaseAdmin` (service-role) para operaciones del backend
- Variables de entorno validadas con Zod al iniciar — falta una variable = server no arranca
- Logs estructurados con Pino (JSON en prod, pretty en dev)
- Tests con Vitest + Supertest

### Frontend (Next.js/TypeScript)
- App Router con layouts anidados
- Supabase Auth manejado client-side (`supabase-browser.ts`) y server-side (`supabase-server.ts`)
- API client con auth automática (`api-client.ts` → agrega Bearer token)
- shadcn/ui para todos los componentes de UI
- Componentes organizados por feature: `components/notes/`, `components/vault/`, etc.
- Custom hooks en `hooks/` para lógica reutilizable
- Dark mode con next-themes

### General
- TypeScript strict en ambos
- pnpm workspaces (@wpnotes/backend, @wpnotes/frontend)
- ESLint + Prettier

---

## Reglas de Nombrado

| Elemento              | Convención     | Ejemplo                     |
|-----------------------|----------------|-----------------------------|
| Archivos TS backend   | kebab-case     | `whatsapp.service.ts`       |
| Clases TS             | PascalCase     | `WhatsAppService`           |
| Funciones TS          | camelCase      | `parseWebhookMessage()`     |
| Archivos TSX frontend | kebab-case     | `note-card.tsx`             |
| Componentes React     | PascalCase     | `NoteCard`                  |
| Tablas Supabase       | snake_case     | `vault_items`               |
| Migraciones SQL       | NNN_desc.sql   | `003_notes.sql`             |
| Features docs         | snake_case     | `m2_frontend.md`            |

---

## Flujo de Trabajo (Spec-Driven)

**Para cualquier tarea que no sea un fix trivial:**

### PASO 1 — Plan
1. Analizar el pedido y explorar el código relevante.
2. Crear o actualizar `docs/features/<nombre>.md` usando `docs/features/_template.md`.
3. Presentar el plan al usuario con un resumen.

### PASO 2 — Validación (STOP)
- **NO se escribe código hasta recibir aprobación explícita.**
- Si hay cambios al plan, actualizar el `.md` y volver al PASO 2.

### PASO 3 — Ejecución
- Ejecutar tarea por tarea, marcando checkboxes `[ ]` → `[x]`.
- **Regla de Errores:** Si un fix no funciona al primer intento, DETENERSE y explicar.

### PASO 4 — Cierre
- Verificar todos los checkboxes marcados.
- Actualizar `MEMORY.md` si hubo cambios arquitecturales.

---

## Estrategia de Implementación

**Frontend primero, backend después.** El frontend se diseña y construye con datos mock / Supabase directo. Cuando el frontend esté como queremos, se arma el backend y se conecta. El backend se puede ir armando en paralelo pero sin conectar.

### Orden de Hitos
1. **M1 — Infraestructura Base**: Monorepo, Supabase, Docker, CI
2. **M2 — Frontend**: Diseño, componentes, páginas completas (con mocks)
3. **M3 — Backend**: Fastify, APIs, WhatsApp, AI, Security
4. **M4 — Integración y Testing E2E**: Conectar frontend↔backend, tests

Ver `docs/features/` para el detalle de cada hito.

---

## Database Schema

### profiles
`id` UUID PK (→ auth.users), `display_name`, `phone_number` UNIQUE, `whatsapp_linked` BOOLEAN, timestamps

### folders (PARA)
`id` UUID PK, `user_id` FK, `name`, `para_category` CHECK(project,area,resource,archive), `parent_id` FK NULLABLE (max 1 nivel), `icon`, `is_auto` BOOLEAN, timestamps. UNIQUE(user_id, name, para_category, parent_id). Triggers: validación de profundidad máxima 1 nivel y herencia de `para_category` del padre.

### notes
`id` UUID PK, `user_id` FK, `folder_id` FK NULLABLE, `title`, `content`, `summary`, `source_type` CHECK(text,audio,image,document), `original_wa_id`, `tags` TEXT[], `is_sensitive` BOOLEAN, `reminder_at` TIMESTAMPTZ NULLABLE (futuro Google Calendar), `fts` tsvector GENERATED, timestamps

### attachments
`id` UUID PK, `note_id` FK CASCADE, `user_id` FK, `file_name`, `file_type`, `file_size`, `storage_path`, timestamp

### vault_items
`id` UUID PK, `user_id` FK, `label`, `type` CHECK(password,id_photo,card,other), `encrypted_data`, `iv`, `auth_tag`, `metadata` JSONB, timestamps

### processing_jobs
`id` UUID PK, `user_id` FK, `status` CHECK(queued,processing,completed,failed), `job_type`, `input_ref`, `output_ref`, `error`, timestamps

RLS en todas las tablas con `user_id = auth.uid()`.

---

## API Endpoints (Backend)

| Método | Ruta                    | Auth | Descripción                    |
|--------|-------------------------|------|--------------------------------|
| POST   | /webhook/whatsapp       | API key | Recibe webhooks Evolution API |
| GET    | /api/whatsapp/status    | JWT  | Estado conexión WhatsApp       |
| GET    | /api/notes              | JWT  | Listar notas (paginado, filtros) |
| GET    | /api/notes/:id          | JWT  | Nota con attachments           |
| PUT    | /api/notes/:id          | JWT  | Actualizar nota                |
| DELETE | /api/notes/:id          | JWT  | Eliminar nota                  |
| GET    | /api/notes/search?q=    | JWT  | Búsqueda full-text             |
| GET    | /api/folders            | JWT  | Listar carpetas                |
| POST   | /api/folders            | JWT  | Crear carpeta                  |
| PUT    | /api/folders/:id        | JWT  | Actualizar carpeta             |
| DELETE | /api/folders/:id        | JWT  | Eliminar carpeta               |
| GET    | /api/vault              | JWT  | Listar items (solo metadata)   |
| GET    | /api/vault/:id          | JWT+re-auth | Desencriptar item       |
| POST   | /api/vault              | JWT  | Crear vault item               |
| DELETE | /api/vault/:id          | JWT  | Eliminar vault item            |
| POST   | /api/upload             | JWT  | Upload manual → cola           |
| GET    | /health                 | -    | Health check                   |

---

## Decisiones Técnicas Clave

- **Fastify** sobre Express (performance 2-3x, schema validation, TS nativo)
- **AI Provider-Agnostic**: Interface IAIProvider, routing por costo/tarea
- **Evolution API webhooks HTTP** (stateless, escalable, compatible Render)
- **BullMQ** para procesamiento async (retries, DLQ, backoff exponencial)
- **AES-256-GCM** para vault (authenticated encryption, IV único, PBKDF2)
- **Deduplicación**: `original_wa_id` como idempotency key
- **Límite archivos**: 25MB (límite WhatsApp)
- **Costos AI**: Gemini para docs grandes, Whisper para audio
- **Second Brain (PARA)**: Organización en Projects/Areas/Resources/Archive. IA auto-clasifica. Carpetas con máximo 1 nivel de sub-carpetas dentro de cada categoría.
- **Reminders**: Campo `reminder_at` en notes preparado para futura integración con Google Calendar API
