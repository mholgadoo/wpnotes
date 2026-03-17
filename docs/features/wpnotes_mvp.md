# WPNotes MVP — Plan General

## Descripción
Asistente personal inteligente vía WhatsApp con Web App. El usuario envía audios, fotos, archivos y texto por WhatsApp; el backend procesa con IA (transcripción, OCR, resúmenes); datos sensibles se detectan y cifran; todo se presenta en un dashboard web con bóveda segura.

## Flujo
Usuario → WhatsApp → Evolution API → Backend (Fastify/Node/TS) → IA (Gemini/OpenAI) → Supabase → Web App (Next.js)

---

## Estrategia de Implementación

**Frontend primero, backend después.** Se diseña y construye el frontend completo con datos mock / Supabase directo. Cuando el frontend esté listo, se arma el backend y se conecta. Backend se puede ir armando en paralelo sin conectar.

---

## Hito 1 — Infraestructura Base
> Monorepo, Supabase, Docker, CI. Ver `m1_infraestructura_base.md`

- [x] M1-T1: Inicializar monorepo (pnpm workspaces, TS strict)
- [x] M1-T2: Setup Supabase (migraciones SQL, RLS, Storage, Auth)
- [x] M1-T3: Config entorno con Zod (env.ts, .env.example)
- [x] M1-T4: Bootstrap Fastify (CORS, helmet, rate-limit, health, Pino)
- [x] M1-T5: Clientes Supabase (backend service-role, frontend browser+server)
- [x] M1-T6: Auth middleware (JWT verify, userId en request)
- [x] M1-T7: Docker Compose (Redis + Evolution API)
- [x] M1-T8: CI/CD pipeline (GitHub Actions)
- [x] M1-T9: Deploy Render.com (Dockerfiles)

## Hito 2 — Frontend
> Diseño, componentes, páginas completas con mocks. Ver `m2_frontend.md`

- [ ] M2-T1: Design system y setup shadcn/ui
- [ ] M2-T2: Auth pages (login/register con Supabase Auth)
- [ ] M2-T3: Dashboard layout (sidebar, header, responsive, dark mode)
- [ ] M2-T4: Lista y visor de notas (search, filtros, paginación, markdown)
- [ ] M2-T5: Gestión de carpetas (árbol, CRUD, filtro)
- [ ] M2-T6: Bóveda (lista, re-auth, auto-hide 30s)
- [ ] M2-T7: Upload manual (dropzone, progress, estado)
- [ ] M2-T8: Settings (perfil, WhatsApp status, uso)
- [ ] M2-T9: Realtime (Supabase Realtime, notas sin refresh)

## Hito 3 — Backend
> API, WhatsApp, AI, Seguridad. Ver `m3_backend.md`

- [ ] M3-T1: Endpoints CRUD notas (notes.controller + notes.service)
- [ ] M3-T2: Endpoints CRUD carpetas (folders.controller + folders.service)
- [ ] M3-T3: Endpoints vault (vault.controller — list, get+re-auth, create, delete)
- [ ] M3-T4: Endpoint upload manual (upload.controller → cola procesamiento)
- [ ] M3-T5: Integración WhatsApp — Evolution API (instancia, webhook, cola BullMQ)
- [ ] M3-T6: Servicio descarga media (Evolution API → Supabase Storage)
- [ ] M3-T7: Registro/vinculación usuario vía WhatsApp
- [ ] M3-T8: Respuestas WhatsApp (confirmaciones, errores)
- [ ] M3-T9: Capa abstracción AI (IAIProvider, OpenAI, Gemini, routing)
- [ ] M3-T10: Transcripción audio (Whisper/Gemini → nota)
- [ ] M3-T11: OCR imágenes (GPT-4o vision / Gemini → nota)
- [ ] M3-T12: Procesamiento documentos (PDF/DOCX → texto, resumen, nota)
- [ ] M3-T13: Auto-organización (AI sugiere carpeta, tags)
- [ ] M3-T14: Detección datos sensibles (regex + AI)
- [ ] M3-T15: Cifrado AES-256-GCM (encrypt/decrypt, IV único, PBKDF2)
- [ ] M3-T16: Hashing contraseñas (bcrypt + cifrado en vault)
- [ ] M3-T17: Flujo vault items (detección → cifrado → purge → confirmación WA)
- [ ] M3-T18: Asistencia estudio (!quiz, !flashcards, !review)

## Hito 4 — Integración y Testing
> Conectar frontend↔backend, testing E2E. Ver `m4_integracion_testing.md`

- [ ] M4-T1: Conectar frontend a API real (reemplazar mocks)
- [ ] M4-T2: Tests unitarios backend (encryption, hashing, detector, AI routing, webhook parsing, notes CRUD, vault, env)
- [ ] M4-T3: Tests integración backend (webhook→nota, auth flow, vault flow, upload flow)
- [ ] M4-T4: Tests precisión AI (transcripción WER, OCR accuracy, resúmenes ROUGE-L, detección recall/precision)
- [ ] M4-T5: Tests seguridad (JWT, RLS, vault encryption, rate limiting, XSS/SQLi, CORS)
- [ ] M4-T6: Tests manuales E2E (11 flujos críticos)
- [ ] M4-T7: Verificación end-to-end completa

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
