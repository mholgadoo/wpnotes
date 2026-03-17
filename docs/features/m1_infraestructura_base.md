# Hito 1 — Infraestructura Base

## Objetivo
Monorepo funcional, base de datos lista, servidor básico, auth, Docker y CI/CD. Todo lo necesario para que M2 (frontend) y M3 (backend) puedan arrancar.

---

## M1-T1: Inicializar monorepo

### Descripción
pnpm workspaces con `@wpnotes/backend` (Fastify/TS strict) y `@wpnotes/frontend` (Next.js 14 App Router, Tailwind, shadcn/ui).

### Estructura

```
wpnotes/
├── pnpm-workspace.yaml
├── package.json           # root workspace
├── .nvmrc                 # node 20
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json      # strict: true, ES2022, NodeNext
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   └── modules/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── hooks/
├── supabase/migrations/
└── docs/
```

### Dependencias backend

```json
{
  "dependencies": {
    "fastify": "^4.x", "@fastify/cors": "^9.x", "@fastify/helmet": "^11.x",
    "@fastify/rate-limit": "^9.x", "@supabase/supabase-js": "^2.x",
    "bullmq": "^5.x", "ioredis": "^5.x", "zod": "^3.x",
    "pino": "^9.x", "pino-pretty": "^11.x", "dotenv": "^16.x", "bcrypt": "^5.x"
  },
  "devDependencies": {
    "typescript": "^5.x", "tsx": "^4.x", "vitest": "^2.x",
    "@types/node": "^20.x", "@types/bcrypt": "^5.x",
    "eslint": "^9.x", "prettier": "^3.x", "supertest": "^7.x"
  }
}
```

### Dependencias frontend

```json
{
  "dependencies": {
    "next": "^14.x", "react": "^18.x", "react-dom": "^18.x",
    "@supabase/supabase-js": "^2.x", "@supabase/ssr": "^0.5.x",
    "react-markdown": "^9.x", "next-themes": "^0.4.x",
    "tailwindcss": "^3.x", "class-variance-authority": "^0.7.x",
    "clsx": "^2.x", "tailwind-merge": "^2.x", "lucide-react": "^0.x"
  }
}
```

### Criterio de aceptación
- `pnpm install` sin errores
- `pnpm --filter @wpnotes/backend typecheck` pasa
- `pnpm --filter @wpnotes/frontend build` compila
- TS strict mode activo en ambos

---

## M1-T2: Setup Supabase

### Descripción
Migraciones SQL 001-007 con todas las tablas, RLS, triggers, FTS, Storage buckets.

### Migraciones

**001_profiles.sql** — Tabla profiles + trigger auto-create en auth + trigger updated_at

**002_folders.sql** — Tabla folders + RLS + UNIQUE(user_id, name, parent_id)

**003_notes.sql** — Tabla notes + RLS + índices (user_id, folder_id, source_type, tags GIN, wa_id unique) + FTS (spanish, weighted: title A, content B, summary C)

**004_attachments.sql** — Tabla attachments + RLS + índice note_id

**005_vault_items.sql** — Tabla vault_items + RLS + trigger updated_at

**006_processing_jobs.sql** — Tabla processing_jobs + RLS (SELECT user, ALL service) + índice user_status

**007_storage_buckets.sql** — Buckets: `attachments` (privado), `vault-files` (privado restringido) + RLS storage.objects

> SQL completo en los archivos de migración. Ver schema en CLAUDE.md.

### Criterio de aceptación
- `supabase db push` sin errores
- Todas las tablas con RLS activo
- Trigger profile creation funcional
- FTS en notes funcional
- Índices creados

---

## M1-T3: Config entorno con Zod

### Archivo: `backend/src/config/env.ts`
Zod schema validando: PORT, NODE_ENV, HOST, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME, OPENAI_API_KEY, GEMINI_API_KEY, ENCRYPTION_MASTER_KEY (min 32 chars), REDIS_URL, FRONTEND_URL.

### Archivo: `.env.example` (backend y frontend)

### Criterio de aceptación
- Server no arranca si falta variable → mensaje claro
- Defaults funcionan (PORT, NODE_ENV, REDIS_URL, etc.)

---

## M1-T4: Bootstrap Fastify

### Archivos
- `backend/src/server.ts` — Fastify + plugins + health check + route registration
- `backend/src/config/logger.ts` — Pino logger config
- `backend/src/middleware/error-handler.ts` — Error handler (no stack en prod)
- `backend/src/middleware/request-logger.ts` — Log de requests
- `backend/src/middleware/rate-limiter.ts` — Configs por ruta (webhook: 1000/min, api: 100/min, auth: 10/min)

### Criterio de aceptación
- `GET /health` → `{ status: "ok", timestamp: "..." }`
- Logs JSON en prod, pretty en dev
- CORS para frontend URL
- Rate limiting activo
- Errores no exponen stack en prod

---

## M1-T5: Clientes Supabase

### Archivos
- `backend/src/config/supabase.ts` — `supabaseAdmin` (service-role, bypassa RLS) + `createUserClient(token)` (respeta RLS)
- `frontend/lib/supabase-browser.ts` — Cliente browser con `@supabase/ssr`
- `frontend/lib/supabase-server.ts` — Cliente server con cookies
- `frontend/lib/api-client.ts` — `apiFetch(path, options)` con auth automática

### Criterio de aceptación
- Backend consulta profiles con supabaseAdmin
- Frontend autentica usuario
- Service-role bypassa RLS, user client la respeta

---

## M1-T6: Auth middleware

### Archivo: `backend/src/modules/auth/auth.middleware.ts`
`requireAuth` preHandler: extrae Bearer token → `supabaseAdmin.auth.getUser(token)` → adjunta `userId` y `userEmail` al request.

### Criterio de aceptación
- Sin header → 401
- Token inválido → 403
- Token válido → pasa, `request.userId` disponible

---

## M1-T7: Docker Compose

### Archivo: `docker-compose.yml`
Redis 7 alpine (port 6379, healthcheck) + Evolution API v2 (port 8080).

### Criterio de aceptación
- `docker compose up` sin errores
- Redis y Evolution API accesibles
- Backend se conecta a ambos

---

## M1-T8: CI/CD pipeline

### Archivo: `.github/workflows/ci.yml`
- Backend job: lint + typecheck + unit tests (con Redis service)
- Frontend job: lint + typecheck

### Criterio de aceptación
- Checks visibles en PRs
- CI falla si cualquier check falla

---

## M1-T9: Deploy Render.com

### Archivos
- `backend/Dockerfile` — Multi-stage build
- `frontend/Dockerfile` — Multi-stage build con standalone output
- `render.yaml` (opcional) — Config declarativa

### Criterio de aceptación
- Docker build sin errores para ambos
- Health check responde
- Ambos accesibles via HTTPS
