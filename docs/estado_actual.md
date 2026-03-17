# WPNotes — Estado Actual del Repositorio

> Última actualización: 2026-03-17

## Resumen

**Hito 1 (Infraestructura Base): COMPLETO**
Hito 2 (Frontend): Pendiente
Hito 3 (Backend): Pendiente
Hito 4 (Integración + Testing): Pendiente

---

## Estructura del Repositorio

```
wpnotes/
├── backend/                      ← Fastify/Node/TypeScript
│   ├── src/
│   │   ├── server.ts             ✅ Bootstrap Fastify + plugins + health check
│   │   ├── config/
│   │   │   ├── env.ts            ✅ Zod-validated env vars (15 variables)
│   │   │   ├── logger.ts         ✅ Pino logger (JSON prod, pretty dev)
│   │   │   ├── redis.ts          ✅ ioredis connection (BullMQ-ready)
│   │   │   └── supabase.ts       ✅ supabaseAdmin + createUserClient
│   │   ├── middleware/
│   │   │   ├── error-handler.ts  ✅ Global error handler (no stack en prod)
│   │   │   ├── rate-limiter.ts   ✅ Configs: webhook 1000/min, api 100/min, auth 10/min
│   │   │   └── request-logger.ts ✅ Pino request logging
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.middleware.ts ✅ requireAuth (JWT → Supabase → userId)
│   │       │   └── auth.types.ts     ✅ AuthenticatedUser interface
│   │       ├── ai/providers/     📁 Vacío (M3)
│   │       ├── folders/          📁 Vacío (M3)
│   │       ├── notes/            📁 Vacío (M3)
│   │       ├── security/         📁 Vacío (M3)
│   │       ├── storage/          📁 Vacío (M3)
│   │       └── whatsapp/         📁 Vacío (M3)
│   ├── tests/
│   │   ├── unit/                 📁 Vacío (M4)
│   │   ├── integration/          📁 Vacío (M4)
│   │   └── fixtures/             📁 Vacío (M4)
│   ├── .env.example              ✅ Template con todas las variables
│   ├── .eslintrc.json            ✅ ESLint + @typescript-eslint
│   ├── .prettierrc               ✅ Prettier config
│   ├── Dockerfile                ✅ Multi-stage build (node:20-alpine)
│   ├── package.json              ✅ @wpnotes/backend, type: module
│   └── tsconfig.json             ✅ strict, ES2022, NodeNext
├── frontend/                     ← Next.js 14 / Tailwind / shadcn/ui
│   ├── app/
│   │   ├── globals.css           ✅ Tailwind directives
│   │   ├── layout.tsx            ✅ Root layout (html lang=es)
│   │   ├── page.tsx              ✅ Redirect → /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/            📁 Vacío (M2)
│   │   │   └── register/         📁 Vacío (M2)
│   │   └── dashboard/
│   │       ├── page.tsx          ✅ Placeholder
│   │       ├── notes/[id]/       📁 Vacío (M2)
│   │       ├── folders/          📁 Vacío (M2)
│   │       ├── vault/            📁 Vacío (M2)
│   │       ├── upload/           📁 Vacío (M2)
│   │       └── settings/         📁 Vacío (M2)
│   ├── components/
│   │   ├── ui/                   📁 Vacío (M2-T1 shadcn init)
│   │   ├── layout/               📁 Vacío (M2)
│   │   ├── notes/                📁 Vacío (M2)
│   │   ├── folders/              📁 Vacío (M2)
│   │   ├── vault/                📁 Vacío (M2)
│   │   ├── upload/               📁 Vacío (M2)
│   │   └── settings/             📁 Vacío (M2)
│   ├── hooks/                    📁 Vacío (M2)
│   ├── lib/
│   │   ├── api-client.ts         ✅ apiFetch con auth automática
│   │   ├── supabase-browser.ts   ✅ Cliente browser (@supabase/ssr)
│   │   ├── supabase-server.ts    ✅ Cliente server (cookies)
│   │   └── utils.ts              ✅ cn() helper (clsx + tailwind-merge)
│   ├── public/                   📁 Vacío
│   ├── .env.example              ✅ NEXT_PUBLIC_SUPABASE_URL/KEY, API_URL
│   ├── Dockerfile                ✅ Multi-stage build (standalone)
│   ├── next.config.ts            ✅ output: standalone
│   ├── package.json              ✅ @wpnotes/frontend
│   ├── postcss.config.js         ✅ tailwindcss + autoprefixer
│   ├── tailwind.config.ts        ✅ darkMode: class, content paths
│   └── tsconfig.json             ✅ strict, bundler resolution, paths @/*
├── supabase/migrations/
│   ├── 001_profiles.sql          ✅ profiles + trigger auto-create + RLS
│   ├── 002_folders.sql           ✅ folders + UNIQUE(user_id,name,parent_id) + RLS
│   ├── 003_notes.sql             ✅ notes + FTS (spanish weighted) + índices + RLS
│   ├── 004_attachments.sql       ✅ attachments + RLS
│   ├── 005_vault_items.sql       ✅ vault_items + RLS
│   ├── 006_processing_jobs.sql   ✅ processing_jobs + RLS
│   └── 007_storage_buckets.sql   ✅ Referencia para buckets (comentado)
├── docs/
│   ├── features/
│   │   ├── _template.md          ✅ Template para nuevas features
│   │   ├── wpnotes_mvp.md        ✅ Plan general con 4 hitos
│   │   ├── m1_infraestructura_base.md ✅ Spec M1 (completo)
│   │   ├── m2_frontend.md        ✅ Spec M2 (pendiente)
│   │   ├── m3_backend.md         ✅ Spec M3 (pendiente)
│   │   └── m4_integracion_testing.md ✅ Spec M4 (pendiente)
│   ├── adr/                      📁 Vacío
│   └── estado_actual.md          ✅ Este archivo
├── .github/workflows/
│   └── ci.yml                    ✅ Backend + Frontend checks
├── docker-compose.yml            ✅ Redis + Evolution API
├── pnpm-workspace.yaml           ✅ backend + frontend
├── package.json                  ✅ Root scripts (dev, build, lint, typecheck, test)
├── .nvmrc                        ✅ Node 20
├── .gitignore                    ✅ node_modules, dist, .next, .env, etc.
└── CLAUDE.md                     ✅ Instrucciones del proyecto (WPNotes)
```

---

## Verificaciones Pasadas

| Check                           | Estado |
|---------------------------------|--------|
| `pnpm install`                  | ✅ OK  |
| `pnpm --filter backend typecheck` | ✅ OK  |
| `pnpm --filter frontend typecheck` | ✅ OK  |
| `pnpm --filter backend lint`    | ✅ OK  |

---

## Próximo Paso

**M2 — Frontend** (`docs/features/m2_frontend.md`)

Tareas pendientes:
1. M2-T1: Design system y setup shadcn/ui
2. M2-T2: Auth pages (login/register)
3. M2-T3: Dashboard layout (sidebar, header, responsive, dark mode)
4. M2-T4: Lista y visor de notas
5. M2-T5: Gestión de carpetas
6. M2-T6: Bóveda (vault)
7. M2-T7: Upload manual
8. M2-T8: Settings
9. M2-T9: Realtime
