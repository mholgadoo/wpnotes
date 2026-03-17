# Hito 4 — Integración y Testing

## Objetivo
Conectar frontend al backend real, reemplazar mocks, y ejecutar el plan completo de testing.

---

## M4-T1: Conectar frontend a API real

### Descripción
Reemplazar datos mock / queries directas a Supabase con llamadas al backend via `api-client.ts`.

### Tareas
1. Actualizar `useNotes.ts` → usar `/api/notes` en vez de query directo
2. Actualizar `useFolders.ts` → usar `/api/folders`
3. Actualizar `useVault.ts` → usar `/api/vault`
4. Actualizar upload → usar `/api/upload` (multipart)
5. Actualizar settings → usar `/api/whatsapp/status`
6. Mantener Supabase Realtime (no pasa por API)
7. Verificar que todo funciona end-to-end

### Criterio de aceptación
- Todas las operaciones CRUD funcionan via API
- Auth headers enviados correctamente
- Errores del backend manejados en UI
- Realtime sigue funcionando

---

## M4-T2: Tests unitarios backend

### Framework: Vitest

| Suite                        | Módulo   | Qué testea                                                         |
|------------------------------|----------|--------------------------------------------------------------------|
| `encryption.service.test.ts` | Security | Encrypt/decrypt roundtrip, IVs únicos, key incorrecta falla        |
| `hashing.service.test.ts`    | Security | bcrypt hash/verify roundtrip                                       |
| `detector.service.test.ts`   | Security | Regex detecta tarjetas/contraseñas/teléfonos/emails, sin falsos positivos en texto normal |
| `ai.service.test.ts`         | AI       | Routing: archivo grande → Gemini, corto → OpenAI, audio → Whisper  |
| `whatsapp.service.test.ts`   | WhatsApp | Parsing webhooks por tipo de mensaje (text, audio, image, document) |
| `notes.service.test.ts`      | Notes    | CRUD, búsqueda FTS, filtros, paginación                            |
| `vault.service.test.ts`      | Security | Crear (encripta), obtener (desencripta), eliminar, purge de texto  |
| `env.test.ts`                | Config   | Zod rechaza vars faltantes, acepta set completo                    |
| `study.service.test.ts`      | AI       | Parsing de comandos !quiz, !flashcards, !review                    |

### Criterio de aceptación
- Todos los tests pasan
- Coverage > 80% en módulos de seguridad
- Sin dependencia de servicios externos (mocks para AI providers, Supabase)

---

## M4-T3: Tests integración backend

### Framework: Vitest + Supertest

| Suite                          | Qué testea                                                   |
|--------------------------------|--------------------------------------------------------------|
| `webhook.integration.test.ts`  | POST webhook → encolado → worker procesa → nota creada en DB |
| `auth.integration.test.ts`     | Registro → login → ruta protegida → 401 sin token           |
| `vault.integration.test.ts`    | Crear vault item → listar (sin data) → get con re-auth → eliminar |
| `upload.integration.test.ts`   | Upload → job creado → procesado → nota creada               |
| `notes.integration.test.ts`    | CRUD notas via API → verificar DB                            |
| `folders.integration.test.ts`  | CRUD carpetas via API → jerarquía correcta                   |

### Requisitos
- Redis real (del Docker Compose)
- Supabase test project (o local con `supabase start`)

### Criterio de aceptación
- Todos los flujos end-to-end pasan
- Datos creados y limpiados correctamente

---

## M4-T4: Tests precisión AI (semi-automatizados)

### Fixtures en `tests/fixtures/ai-precision/`

| Test                             | Métrica                 | Umbral |
|----------------------------------|-------------------------|--------|
| Transcripción (ES)               | Word Error Rate         | < 15%  |
| Transcripción (EN)               | Word Error Rate         | < 10%  |
| OCR texto impreso                | Precisión de caracteres | > 95%  |
| OCR manuscrito                   | Precisión de caracteres | > 70%  |
| Calidad de resúmenes             | ROUGE-L                 | > 0.4  |
| Detección sensible (recall)      | Recall                  | > 95%  |
| Detección sensible (precision)   | Precision               | > 90%  |
| Auto-folder accuracy             | Accuracy                | > 75%  |

### Criterio de aceptación
- Fixtures con inputs y outputs esperados creados
- Script de evaluación ejecutable
- Todos los umbrales cumplidos

---

## M4-T5: Tests seguridad

| Test               | Validación                                     |
|--------------------|------------------------------------------------|
| JWT validation     | Tokens expirados/malformados rechazados         |
| RLS enforcement    | User A no lee datos de User B                   |
| Vault encryption   | DB dump no contiene plaintext                   |
| Rate limiting      | Endpoints rate-limited correctamente            |
| Input sanitization | XSS/SQL injection fallan                        |
| CORS               | Solo orígenes permitidos                        |

### Criterio de aceptación
- Todos los tests pasan
- No hay bypasses de seguridad

---

## M4-T6: Tests manuales E2E

| ID    | Flujo                | Pasos                              | Resultado esperado                       |
|-------|----------------------|------------------------------------|------------------------------------------|
| MT-01 | Nota de texto        | Enviar texto por WhatsApp          | Nota aparece en dashboard en <10s        |
| MT-02 | Transcripción audio  | Enviar voice note                  | Nota transcrita con resumen              |
| MT-03 | OCR imagen           | Enviar foto de pizarrón            | Texto extraído como nota                 |
| MT-04 | Resumen documento    | Enviar PDF                         | Nota con resumen y puntos clave          |
| MT-05 | Detección sensible   | Enviar "mi clave es abc123"        | Flaggeado, vault item, purgado de nota   |
| MT-06 | Acceso vault         | Abrir vault, click item, re-auth   | Contenido desencriptado, auto-hide 30s   |
| MT-07 | Upload manual        | Subir PDF desde web                | Procesamiento inicia, nota aparece       |
| MT-08 | Auto-organización    | AI asigna carpeta a nota nueva     | Nota en carpeta correcta                 |
| MT-09 | Comandos estudio     | Enviar !quiz math por WhatsApp     | Preguntas generadas desde notas          |
| MT-10 | Sync tiempo real     | Enviar WhatsApp con dashboard abierto | Nota aparece sin refresh              |
| MT-11 | Onboarding           | Primer mensaje de número nuevo     | Profile creado, bienvenida recibida      |

---

## M4-T7: Verificación end-to-end completa

### Checklist final
1. Audio por WhatsApp → nota transcrita en dashboard
2. "mi clave es test123" → vault item cifrado, nota sin dato sensible
3. PDF desde web → resumen generado, carpeta auto-asignada
4. !quiz → preguntas generadas desde notas existentes
5. User A no accede datos de User B (RLS)
6. Re-auth en vault + auto-hide de contenido desencriptado
7. Dark mode funciona en todas las páginas
8. Mobile responsive en todas las páginas
9. Logout → redirect a login
10. Rate limiting activo en todos los endpoints
