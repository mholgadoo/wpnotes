# M1 — Infraestructura Base: Implementación

> Completado: 2026-03-17

Todas las tareas de M1 están implementadas y verificadas.

---

## M1-T1: Monorepo ✅

### Qué se hizo
- pnpm workspaces con dos packages: `@wpnotes/backend` y `@wpnotes/frontend`
- Node 20 (`.nvmrc`)
- TypeScript strict en ambos proyectos

### Archivos clave
- `pnpm-workspace.yaml` — define packages
- `package.json` (root) — scripts: `dev`, `build`, `lint`, `typecheck`, `test`
- `backend/package.json` — type: module, scripts: dev (tsx watch), build (tsc), lint, typecheck, test (vitest)
- `frontend/package.json` — scripts: dev (next dev), build (next build), lint (next lint), typecheck

### Dependencias backend
- **Runtime:** fastify, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @supabase/supabase-js, bullmq, ioredis, zod, pino, pino-pretty, dotenv, bcrypt
- **Dev:** typescript, tsx, vitest, eslint, prettier, supertest + @types

### Dependencias frontend
- **Runtime:** next 14, react 18, @supabase/supabase-js, @supabase/ssr, next-themes, react-markdown, class-variance-authority, clsx, tailwind-merge, lucide-react
- **Dev:** typescript, tailwindcss, autoprefixer, postcss, eslint, eslint-config-next + @types

### Configuración
- `backend/tsconfig.json` — target ES2022, module NodeNext, strict true
- `frontend/tsconfig.json` — strict true, bundler resolution, paths @/*
- `backend/.eslintrc.json` — @typescript-eslint/recommended
- `backend/.prettierrc` — semi, double quotes, trailing commas

---

## M1-T2: Supabase ✅

### Qué se hizo
7 migraciones SQL en `supabase/migrations/`:

| Archivo | Tabla | Highlights |
|---------|-------|-----------|
| 001_profiles.sql | profiles | PK→auth.users, trigger auto-create on signup, trigger updated_at, RLS |
| 002_folders.sql | folders | parent_id self-ref, UNIQUE(user_id,name,parent_id), RLS |
| 003_notes.sql | notes | source_type CHECK, FTS weighted (spanish: title A, content B, summary C), unique idx on original_wa_id, GIN idx on tags, RLS |
| 004_attachments.sql | attachments | FK→notes CASCADE, RLS |
| 005_vault_items.sql | vault_items | type CHECK, encrypted_data+iv+auth_tag, JSONB metadata, RLS |
| 006_processing_jobs.sql | processing_jobs | status CHECK, job_type CHECK, idx user+status, RLS |
| 007_storage_buckets.sql | (referencia) | Buckets attachments + vault-files (comentado, crear via Dashboard) |

### Función reutilizable
`update_updated_at()` — trigger function usada por profiles, folders, notes, vault_items.

### RLS
Todas las tablas tienen RLS habilitado con policy `auth.uid() = user_id` (o `= id` para profiles).

---

## M1-T3: Config entorno ✅

### Qué se hizo
- `backend/src/config/env.ts` — Schema Zod con 15 variables
- `backend/.env.example` — Template
- `frontend/.env.example` — Template (3 variables NEXT_PUBLIC)

### Variables validadas
| Variable | Default | Requerida |
|----------|---------|-----------|
| PORT | 3001 | No |
| NODE_ENV | development | No |
| HOST | 0.0.0.0 | No |
| SUPABASE_URL | — | Sí |
| SUPABASE_SERVICE_KEY | — | Sí |
| SUPABASE_ANON_KEY | — | Sí |
| EVOLUTION_API_URL | — | Sí |
| EVOLUTION_API_KEY | — | Sí |
| EVOLUTION_INSTANCE_NAME | wpnotes | No |
| OPENAI_API_KEY | — | Sí |
| GEMINI_API_KEY | — | Sí |
| ENCRYPTION_MASTER_KEY | — | Sí (min 32 chars) |
| REDIS_URL | redis://localhost:6379 | No |
| FRONTEND_URL | http://localhost:3000 | No |

Si falta una variable requerida, el server imprime el error y hace `process.exit(1)`.

---

## M1-T4: Bootstrap Fastify ✅

### Qué se hizo
- `backend/src/server.ts` — `buildServer()` exportado (para tests) + `start()`
- Plugins: CORS (origin: FRONTEND_URL), helmet, rate-limit (100/min global)
- Health check: `GET /health → { status: "ok", timestamp }`
- Error handler: no stack en prod
- Request logger: method + url en cada request

### Archivos
- `src/server.ts`
- `src/middleware/error-handler.ts`
- `src/middleware/request-logger.ts`
- `src/middleware/rate-limiter.ts` — Exporta configs: webhookRateLimit (1000/min), apiRateLimit (100/min), authRateLimit (10/min)
- `src/config/logger.ts` — Pino standalone logger (para uso fuera de Fastify)

---

## M1-T5: Clientes Supabase ✅

### Backend
- `src/config/supabase.ts`
  - `supabaseAdmin` — service-role client, bypassa RLS
  - `createUserClient(accessToken)` — anon client con JWT, respeta RLS

### Frontend
- `lib/supabase-browser.ts` — `createSupabaseBrowserClient()` usando @supabase/ssr
- `lib/supabase-server.ts` — `createSupabaseServerClient()` con cookies (Next.js server)
- `lib/api-client.ts` — `apiFetch<T>(path, options)` que automáticamente:
  1. Obtiene session de Supabase
  2. Agrega Authorization header
  3. Parsea JSON response
  4. Tira error con message del backend
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

---

## M1-T6: Auth middleware ✅

### Qué se hizo
- `src/modules/auth/auth.middleware.ts` — `requireAuth` Fastify preHandler
- Augmenta `FastifyRequest` con `userId: string` y `userEmail?: string`
- Flujo: Authorization header → Bearer token → `supabaseAdmin.auth.getUser()` → 401/403/pass

### Uso
```typescript
app.get("/api/notas", { preHandler: [requireAuth] }, async (request) => {
  const userId = request.userId; // disponible post-auth
});
```

---

## M1-T7: Docker Compose ✅

### Qué se hizo
- `docker-compose.yml` con dos servicios:
  - **redis** — redis:7-alpine, port 6379, healthcheck, volume persistente
  - **evolution-api** — atendai/evolution-api:v2.1.1, port 8080, depende de redis healthy

---

## M1-T8: CI/CD ✅

### Qué se hizo
- `.github/workflows/ci.yml` — Triggers: PR a main, push a main
- **Backend job:** checkout → pnpm → node 20 → install → lint → typecheck → test:unit (con Redis service)
- **Frontend job:** checkout → pnpm → node 20 → install → lint → typecheck

---

## M1-T9: Dockerfiles ✅

### Backend (`backend/Dockerfile`)
Multi-stage: builder (pnpm install + tsc build) → runner (dist/ + node_modules). Expone 3001.

### Frontend (`frontend/Dockerfile`)
Multi-stage: builder (pnpm install + next build) → runner (standalone output + static + public). Expone 3000.

---

## Notas de Implementación

### Fixes durante la implementación
1. **ioredis import** — `import IORedis from "ioredis"` no funciona con NodeNext modules. Fix: `import { Redis } from "ioredis"`.
2. **ESLint peer deps** — eslint v9 incompatible con @typescript-eslint v7. Fix: downgrade eslint a v8.
3. **supabase-server.ts types** — `setAll` callback necesita types explícitos con strict mode. Fix: agregar tipo `CookieOptions` de @supabase/ssr.
