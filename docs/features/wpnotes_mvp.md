# WPNotes MVP

## Descripción
Asistente personal inteligente vía WhatsApp con Web App. El usuario envía audios, fotos, archivos y texto por WhatsApp; el backend procesa con IA; datos sensibles se cifran; todo se presenta en un dashboard web con bóveda segura.

## Flujo
Usuario → WhatsApp → Evolution API → Backend (Fastify/Node/TS) → IA (Gemini/OpenAI) → Supabase → Web App (Next.js)

---

## Hito 1 — Infraestructura Base

- [ ] **M1-T1: Inicializar monorepo** — pnpm workspaces, backend (Fastify/TS strict), frontend (Next.js App Router/Tailwind)
- [ ] **M1-T2: Setup Supabase** — Migraciones SQL 001-007, RLS, Storage buckets, Auth email
- [ ] **M1-T3: Config entorno con Zod** — env.ts validando todas las variables, .env.example
- [ ] **M1-T4: Bootstrap Fastify** — CORS, helmet, rate-limit, health check, Pino logger, error handler
- [ ] **M1-T5: Cliente Supabase** — service-role (backend), browser + server (frontend)
- [ ] **M1-T6: Auth middleware** — JWT verify con Supabase, adjunta userId al request
- [ ] **M1-T7: Docker Compose** — Redis (BullMQ) + Evolution API local
- [ ] **M1-T8: CI/CD pipeline** — GitHub Actions: lint, type-check, tests en PR
- [ ] **M1-T9: Deploy Render.com** — Dos Web Services + Redis

## Hito 2 — Integración WhatsApp

- [ ] **M2-T1: Configurar Evolution API** — Instancia Docker, webhook URL, eventos
- [ ] **M2-T2: Endpoint webhook** — POST /webhook/whatsapp, parseo, encolado BullMQ
- [ ] **M2-T3: Cola BullMQ** — Queue + Worker, retry 3x backoff, DLQ
- [ ] **M2-T4: Descarga media** — Download via Evolution API → Supabase Storage
- [ ] **M2-T5: Registro/vinculación usuario** — Número → profile, bienvenida
- [ ] **M2-T6: Respuesta WhatsApp** — Enviar mensajes de vuelta via Evolution API

## Hito 3 — IA y Seguridad

- [ ] **M3-T1: Abstracción AI** — IAIProvider interface, OpenAI + Gemini providers, routing
- [ ] **M3-T2: Transcripción audio** — Whisper/Gemini, OGG/MP3/WAV/M4A → nota
- [ ] **M3-T3: OCR** — GPT-4o vision / Gemini Pro Vision → nota
- [ ] **M3-T4: Procesamiento documentos** — PDF/DOCX/PPT → texto, resumen, nota
- [ ] **M3-T5: Auto-organización** — AI sugiere carpeta, tags, categorización
- [ ] **M3-T6: Detección datos sensibles** — Regex + AI, flag is_sensitive
- [ ] **M3-T7: Cifrado AES-256-GCM** — encrypt/decrypt, IV único, PBKDF2
- [ ] **M3-T8: Hashing contraseñas** — bcrypt + cifrado AES en vault
- [ ] **M3-T9: Flujo vault items** — Detección → cifrado → nota sin dato → confirmación WA
- [ ] **M3-T10: Asistencia estudio** — !quiz, !flashcards, !review desde notas

## Hito 4 — Web Frontend

- [ ] **M4-T1: Auth pages** — Login/register con Supabase Auth
- [ ] **M4-T2: Dashboard layout** — Sidebar, responsive, shadcn/ui, dark mode
- [ ] **M4-T3: Lista/visor notas** — Search, filtros, paginación, markdown, attachments
- [ ] **M4-T4: Gestión carpetas** — Árbol, CRUD, filtro de notas
- [ ] **M4-T5: Bóveda** — Re-auth, auto-hide 30s, sin plaintext en cache
- [ ] **M4-T6: Upload manual** — Dropzone, misma pipeline que WhatsApp
- [ ] **M4-T7: Settings** — Vincular WA, perfil, uso/cuotas
- [ ] **M4-T8: Realtime** — Supabase Realtime, notas aparecen sin refresh

---

## Database Schema

### profiles
id UUID PK (→ auth.users), display_name TEXT, phone_number TEXT UNIQUE, whatsapp_linked BOOLEAN DEFAULT false, created_at/updated_at TIMESTAMPTZ

### folders
id UUID PK, user_id UUID FK→profiles, name TEXT, parent_id UUID FK→folders NULLABLE, icon TEXT, is_auto BOOLEAN DEFAULT false, created_at/updated_at TIMESTAMPTZ. UNIQUE(user_id, name, parent_id)

### notes
id UUID PK, user_id UUID FK→profiles, folder_id UUID FK→folders NULLABLE, title TEXT, content TEXT, summary TEXT, source_type TEXT CHECK(text,audio,image,document), original_wa_id TEXT, tags TEXT[], is_sensitive BOOLEAN DEFAULT false, created_at/updated_at TIMESTAMPTZ

### attachments
id UUID PK, note_id UUID FK→notes ON DELETE CASCADE, user_id UUID FK→profiles, file_name TEXT, file_type TEXT, file_size INTEGER, storage_path TEXT, created_at TIMESTAMPTZ

### vault_items
id UUID PK, user_id UUID FK→profiles, label TEXT, type TEXT CHECK(password,id_photo,card,other), encrypted_data TEXT, iv TEXT, auth_tag TEXT, metadata JSONB, created_at/updated_at TIMESTAMPTZ

### processing_jobs
id UUID PK, user_id UUID FK→profiles, status TEXT CHECK(queued,processing,completed,failed), job_type TEXT CHECK(transcription,ocr,summarization,detection), input_ref TEXT, output_ref UUID, error TEXT, created_at/completed_at TIMESTAMPTZ

RLS: Todas las tablas con user_id = auth.uid(). Vault requiere re-auth a nivel app.

---

## Decisiones Técnicas

- Fastify sobre Express (performance 2-3x, TS nativo)
- AI Provider-Agnostic (IAIProvider interface, routing por costo/tarea)
- Evolution API Webhook HTTP (stateless, escalable)
- BullMQ para cola (async, retries, DLQ)
- AES-256-GCM para vault (authenticated encryption, IV único, PBKDF2)
- Deduplicación: original_wa_id como idempotency key
- Límite archivos: 25MB (límite WhatsApp)
- Gemini default para docs grandes, Whisper para audio
