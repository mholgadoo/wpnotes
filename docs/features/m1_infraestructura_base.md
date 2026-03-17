# Hito 1 — Infraestructura Base

## Objetivo
Establecer la base técnica del proyecto: monorepo, base de datos, servidor, auth, Docker y CI/CD.

---

## M1-T1: Inicializar monorepo

### Descripción
Crear estructura de carpetas completa. Backend con Fastify/TypeScript strict. Frontend con Next.js App Router + Tailwind + shadcn/ui. pnpm workspaces para gestión de dependencias.

### Archivos a crear

```
wpnotes/
├── pnpm-workspace.yaml
├── package.json              # root workspace
├── .nvmrc                    # node 20
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json         # strict: true, ES2022, NodeNext
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   └── modules/
│   │       ├── whatsapp/
│   │       ├── ai/
│   │       │   └── providers/
│   │       ├── security/
│   │       ├── storage/
│   │       ├── notes/
│   │       ├── folders/
│   │       └── auth/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── notes/[id]/page.tsx
│   │       ├── folders/page.tsx
│   │       ├── vault/page.tsx
│   │       ├── upload/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui
│   │   ├── dashboard/
│   │   ├── notes/
│   │   └── vault/
│   └── lib/
│       ├── supabase-browser.ts
│       ├── supabase-server.ts
│       └── api-client.ts
├── supabase/
│   └── migrations/
└── docs/
    ├── features/
    └── adr/
```

### Dependencias backend (package.json)

```json
{
  "name": "@wpnotes/backend",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "test": "vitest",
    "test:unit": "vitest run tests/unit/",
    "test:integration": "vitest run tests/integration/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^9.x",
    "@fastify/helmet": "^11.x",
    "@fastify/rate-limit": "^9.x",
    "@supabase/supabase-js": "^2.x",
    "bullmq": "^5.x",
    "ioredis": "^5.x",
    "zod": "^3.x",
    "pino": "^9.x",
    "pino-pretty": "^11.x",
    "dotenv": "^16.x",
    "bcrypt": "^5.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "vitest": "^2.x",
    "@types/node": "^20.x",
    "@types/bcrypt": "^5.x",
    "eslint": "^9.x",
    "@typescript-eslint/eslint-plugin": "^7.x",
    "@typescript-eslint/parser": "^7.x",
    "prettier": "^3.x",
    "supertest": "^7.x"
  }
}
```

### Dependencias frontend (package.json)

```json
{
  "name": "@wpnotes/frontend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.10.x",
    "react-markdown": "^9.x",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### tsconfig.json backend

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "backend"
  - "frontend"
```

### Criterio de aceptación
- `pnpm install` sin errores desde la raíz
- `pnpm --filter @wpnotes/backend typecheck` pasa
- `pnpm --filter @wpnotes/frontend build` compila
- TS strict mode activo en ambos

---

## M1-T2: Setup Supabase

### Descripción
Escribir migraciones SQL para todas las tablas del MVP. Habilitar RLS con policies. Configurar Storage buckets.

### Migraciones

#### `supabase/migrations/001_profiles.sql`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone_number TEXT UNIQUE,
  whatsapp_linked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger para crear profile al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `supabase/migrations/002_folders.sql`

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '📁',
  is_auto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name, parent_id)
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own folders"
  ON folders FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `supabase/migrations/003_notes.sql`

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'audio', 'image', 'document')),
  original_wa_id TEXT,
  tags TEXT[] DEFAULT '{}',
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes"
  ON notes FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_source_type ON notes(user_id, source_type);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE UNIQUE INDEX idx_notes_wa_id ON notes(original_wa_id) WHERE original_wa_id IS NOT NULL;

-- Full-text search
ALTER TABLE notes ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'C')
  ) STORED;

CREATE INDEX idx_notes_fts ON notes USING GIN(fts);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `supabase/migrations/004_attachments.sql`

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own attachments"
  ON attachments FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attachments_note_id ON attachments(note_id);
```

#### `supabase/migrations/005_vault_items.sql`

```sql
CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('password', 'id_photo', 'card', 'other')),
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own vault items"
  ON vault_items FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### `supabase/migrations/006_processing_jobs.sql`

```sql
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  job_type TEXT NOT NULL CHECK (job_type IN ('transcription', 'ocr', 'summarization', 'detection')),
  input_ref TEXT NOT NULL,
  output_ref UUID,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON processing_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage jobs"
  ON processing_jobs FOR ALL USING (true)
  WITH CHECK (true);
-- Nota: La policy de service se restringe via service_role key, no via RLS.
-- En producción, ajustar para que solo service_role pueda INSERT/UPDATE.

CREATE INDEX idx_jobs_user_status ON processing_jobs(user_id, status);
```

#### `supabase/migrations/007_storage_buckets.sql`

```sql
-- Ejecutar via Supabase Dashboard o API, no SQL directo.
-- Documentado aquí como referencia.

-- Bucket: attachments (privado)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Bucket: vault-files (privado, restringido)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vault-files', 'vault-files', false);

-- RLS para storage.objects:
-- CREATE POLICY "Users can upload own attachments"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own attachments"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own attachments"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Criterio de aceptación
- `supabase db push` sin errores
- Todas las tablas con RLS activo
- Trigger de profile creation funcional
- Full-text search en notes funcional
- Índices creados

---

## M1-T3: Configuración de entorno con validación Zod

### Descripción
Validar todas las variables de entorno al iniciar el servidor. Si falta alguna, el servidor no arranca y muestra un mensaje claro.

### Archivo: `backend/src/config/env.ts`

```typescript
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Evolution API
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_INSTANCE_NAME: z.string().default("wpnotes"),

  // AI Providers
  OPENAI_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),

  // Security
  ENCRYPTION_MASTER_KEY: z.string().min(32, "Master key must be at least 32 characters"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // CORS
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
```

### Archivo: `.env.example`

```env
# Server
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE_NAME=wpnotes

# AI Providers
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

# Security
ENCRYPTION_MASTER_KEY=at-least-32-characters-long-key-here!!

# Redis
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:3000
```

### Criterio de aceptación
- Server no arranca si falta SUPABASE_URL → mensaje claro indicando cuál falta
- Server arranca con todas las variables presentes
- Defaults funcionan (PORT, NODE_ENV, REDIS_URL, etc.)

---

## M1-T4: Bootstrap servidor Fastify

### Descripción
Configurar Fastify con todos los plugins necesarios, health check, logging estructurado y error handler global.

### Archivo: `backend/src/server.ts`

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      ...(env.NODE_ENV === "development" && {
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
    },
  });

  // Plugins
  await app.register(cors, { origin: env.FRONTEND_URL, credentials: true });
  await app.register(helmet);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Middleware
  app.addHook("onRequest", requestLogger);
  app.setErrorHandler(errorHandler);

  // Health check
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // TODO: Registrar rutas de módulos aquí
  // await app.register(whatsappRoutes, { prefix: "/webhook" });
  // await app.register(notesRoutes, { prefix: "/api/notes" });
  // await app.register(foldersRoutes, { prefix: "/api/folders" });
  // await app.register(vaultRoutes, { prefix: "/api/vault" });
  // await app.register(uploadRoutes, { prefix: "/api/upload" });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { buildServer };
```

### Archivo: `backend/src/middleware/error-handler.ts`

```typescript
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  reply.status(statusCode).send({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}
```

### Archivo: `backend/src/middleware/request-logger.ts`

```typescript
import { FastifyRequest, FastifyReply } from "fastify";

export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  request.log.info({ method: request.method, url: request.url }, "incoming request");
}
```

### Archivo: `backend/src/middleware/rate-limiter.ts`

```typescript
// Rate limiting se configura como plugin de Fastify en server.ts.
// Este archivo es para configuraciones custom por ruta.

export const webhookRateLimit = {
  max: 1000,       // WhatsApp puede enviar muchos webhooks
  timeWindow: "1 minute",
};

export const apiRateLimit = {
  max: 100,
  timeWindow: "1 minute",
};

export const authRateLimit = {
  max: 10,          // Brute-force protection
  timeWindow: "1 minute",
};
```

### Criterio de aceptación
- `GET /health` retorna `{ status: "ok", timestamp: "..." }`
- Logs en JSON estructurado (producción) o pretty (desarrollo)
- CORS configurado para frontend URL
- Rate limiting activo
- Errores no exponen stack en producción

---

## M1-T5: Cliente Supabase

### Descripción
Crear clientes Supabase para backend (service-role) y frontend (browser + server).

### Archivo: `backend/src/config/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Service role client — bypasses RLS, usar solo en backend
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anon client — respeta RLS, para operaciones en contexto de usuario
export function createUserClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
```

### Archivo: `frontend/lib/supabase-browser.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Archivo: `frontend/lib/supabase-server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

### Archivo: `frontend/lib/api-client.ts`

```typescript
import { createSupabaseBrowserClient } from "./supabase-browser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Criterio de aceptación
- Backend puede consultar tabla `profiles` con supabaseAdmin
- Frontend puede autenticar usuario y hacer requests al backend con token
- Service-role client bypassa RLS
- User client respeta RLS

---

## M1-T6: Auth middleware

### Descripción
Middleware de Fastify que extrae JWT del header Authorization, verifica con Supabase, y adjunta userId al request.

### Archivo: `backend/src/modules/auth/auth.middleware.ts`

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { supabaseAdmin } from "../../config/supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userEmail?: string;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: true, message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return reply.status(403).send({ error: true, message: "Invalid or expired token" });
  }

  request.userId = user.id;
  request.userEmail = user.email;
}
```

### Archivo: `backend/src/modules/auth/auth.types.ts`

```typescript
export interface AuthenticatedUser {
  userId: string;
  email?: string;
}
```

### Uso en rutas

```typescript
// En cualquier ruta protegida:
app.get("/api/notes", { preHandler: [requireAuth] }, async (request, reply) => {
  const userId = request.userId;
  // ...
});
```

### Criterio de aceptación
- Request sin header Authorization → 401
- Request con token inválido/expirado → 403
- Request con token válido → pasa, request.userId disponible
- No hay crash si el header tiene formato inesperado

---

## M1-T7: Docker Compose local

### Descripción
Docker Compose para levantar Redis (BullMQ) y Evolution API en desarrollo local.

### Archivo: `docker-compose.yml`

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  evolution-api:
    image: atendai/evolution-api:v2.1.1
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY:-your-api-key}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DATABASE_ENABLED=false
      - DATABASE_PROVIDER=postgresql
      - LOG_LEVEL=WARN
      - DEL_INSTANCE=false
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_URL=
    volumes:
      - evolution_data:/evolution/instances
    depends_on:
      redis:
        condition: service_healthy

volumes:
  redis_data:
  evolution_data:
```

### Criterio de aceptación
- `docker compose up` inicia Redis y Evolution API sin errores
- Redis accesible en localhost:6379
- Evolution API accesible en localhost:8080
- Backend se conecta a ambos

---

## M1-T8: CI/CD pipeline

### Descripción
GitHub Actions para lint, type-check y tests en cada PR.

### Archivo: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  backend:
    name: Backend checks
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @wpnotes/backend lint
      - run: pnpm --filter @wpnotes/backend typecheck
      - run: pnpm --filter @wpnotes/backend test:unit
        env:
          NODE_ENV: test
          REDIS_URL: redis://localhost:6379

  frontend:
    name: Frontend checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @wpnotes/frontend lint
      - run: pnpm --filter @wpnotes/frontend typecheck
```

### Criterio de aceptación
- Checks visibles en PRs
- Backend: lint + typecheck + unit tests
- Frontend: lint + typecheck
- CI falla si cualquier check falla

---

## M1-T9: Deploy en Render.com

### Descripción
Dockerfiles para backend y frontend. Configuración para Render.com.

### Archivo: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter @wpnotes/backend
COPY backend/ backend/
RUN pnpm --filter @wpnotes/backend build

FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend_modules
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Archivo: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter @wpnotes/frontend
COPY frontend/ frontend/
RUN pnpm --filter @wpnotes/frontend build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

### Render.com config (render.yaml — opcional)

```yaml
services:
  - type: web
    name: wpnotes-backend
    runtime: docker
    dockerfilePath: backend/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      # ... resto de env vars via Render dashboard

  - type: web
    name: wpnotes-frontend
    runtime: docker
    dockerfilePath: frontend/Dockerfile
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: NEXT_PUBLIC_API_URL
        sync: false
```

### Criterio de aceptación
- Docker build sin errores para ambos
- Health check responde en Render
- Ambos accesibles via HTTPS
