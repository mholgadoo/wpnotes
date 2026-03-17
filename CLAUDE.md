# CLAUDE.md — Memoria Permanente del Proyecto Café

Este archivo es la fuente de verdad para el asistente IA. Debe consultarse al inicio de cada sesión y actualizarse cuando cambie algo estructural.

---

## Stack Tecnológico

| Capa       | Tecnología                                                      |
|------------|-----------------------------------------------------------------|
| Frontend   | Next.js (App Router), Tailwind CSS, shadcn/ui, next-intl (i18n)|
| Backend    | Flask (Python), blueprints por recurso                          |
| Base datos | Supabase (PostgreSQL)                                           |
| Auth       | Supabase Auth + middleware Flask (`require_auth`, `require_roles`) |
| Pagos      | MercadoPago                                                     |
| Hosting    | (definir si aplica)                                             |

---

## Arquitectura General

```
cafe/
├── backend/
│   ├── app/
│   │   ├── controllers/     # Blueprints Flask (un archivo por recurso)
│   │   ├── services/        # Lógica de negocio (un archivo por dominio)
│   │   ├── middleware/      # require_auth, require_roles
│   │   └── routes.py        # Registro de todos los blueprints
│   └── migrations/          # Archivos SQL numerados (ej: 014_*.sql)
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/
│   │   ├── admin/           # Componentes del panel admin
│   │   └── cajero/          # Componentes del panel cajero
│   ├── lib/
│   │   ├── fetcher.ts       # getClientAuthHeaderAsync()
│   │   └── apiClient.ts     # getTenantApiBase()
│   └── messages/
│       ├── en.json          # Strings (EN y ES usan el mismo contenido en español)
│       └── es.json
├── docs/
│   └── features/            # Especificaciones de features (ver _template.md)
└── supabase/
```

---

## Convenciones de Código

### Backend (Python/Flask)
- Un blueprint por recurso en `controllers/`, registrado en `routes.py`.
- Lógica de negocio exclusivamente en `services/`. Los controllers solo llaman services.
- Siempre usar `require_auth` + `require_roles(["admin"])` (o el rol que corresponda) en endpoints protegidos.
- `restaurant_id` se resuelve desde `user_id` usando `metrics_access_service.py`.
- Migraciones SQL numeradas secuencialmente: `NNN_descripcion.sql`.
- CSV exportado con encoding `utf-8-sig` (BOM para compatibilidad Excel).

### Frontend (Next.js/TypeScript)
- Auth header: `getClientAuthHeaderAsync()` from `@/lib/fetcher`.
- API base: `getTenantApiBase()` from `@/lib/apiClient`.
- i18n: `useTranslations("seccion.subseccion")` — ambos JSON deben tener las mismas keys.
- Componentes de admin en `components/admin/`, de cajero en `components/cajero/`.
- No hardcodear valores de negocio (ej: umbrales de stock). Vienen del backend.
- Patrón CSV download: `fetch` autenticado → `blob()` → `anchor.click()`.

---

## Reglas de Nombrado

| Elemento              | Convención                              | Ejemplo                              |
|-----------------------|-----------------------------------------|--------------------------------------|
| Archivos Python       | snake_case                              | `cash_service.py`                    |
| Clases Python         | PascalCase                              | `CashService`                        |
| Funciones Python      | snake_case                              | `open_session()`                     |
| Archivos TS/TSX       | kebab-case                              | `cash-monitor.tsx`                   |
| Componentes React     | PascalCase                              | `CashMonitor`                        |
| Keys i18n             | dot.notation anidada                    | `admin.cash.title`                   |
| Tablas Supabase       | snake_case, plural                      | `cash_sessions`                      |
| Archivos de features  | snake_case en `docs/features/`          | `cash_single_register.md`            |

---

## Flujo de Trabajo Obligatorio (Spec-Driven)

**Para cualquier tarea que no sea un fix trivial de 1-2 líneas, el asistente DEBE seguir estos pasos sin excepción:**

### PASO 1 — Plan
1. Analizar el pedido y explorar el código relevante.
2. Crear o actualizar `docs/features/<nombre_feature>.md` usando el template en `docs/features/_template.md`.
3. Presentar el plan al usuario con un resumen de los cambios propuestos.

### PASO 2 — Validación (STOP)
- **El asistente NO escribe ni modifica código de la aplicación hasta recibir aprobación explícita.**
- El usuario debe responder "Plan aprobado" (o similar) para continuar.
- Si el usuario pide cambios al plan, actualizar el `.md` y volver al PASO 2.

### PASO 3 — Ejecución
- Ejecutar los cambios tarea por tarea, siguiendo el orden del archivo de feature.
- Después de cada tarea completada, marcar el checkbox `[ ]` → `[x]` en el archivo de feature.
- **Regla de Errores:** Si durante la ejecución te encuentras con un error y tu primer intento de fix no funciona,**DETENTE**. Explica el error al usuario y propón una solución antes de seguir modificando código a ciegas.

### PASO 4 — Cierre
- Verificar que todos los checkboxes estén marcados.
- Actualizar `MEMORY.md` si hubo cambios arquitecturales o de convención relevantes.
- Informar al usuario que la feature está completa.

---

## Estado Actual del Proyecto

Ver `memory/MEMORY.md` para el historial de features implementadas.

Archivos de features activas: `docs/features/` (cada `.md` es una feature con su estado).
