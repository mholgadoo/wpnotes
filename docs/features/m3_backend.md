# Hito 3 — Backend

## Objetivo
API REST completa, integración WhatsApp, procesamiento IA, y seguridad. Todas las APIs simples y entendibles.

**Principio:** APIs lo más simples posibles. Cada endpoint hace una cosa clara. Nombres obvios. Responses consistentes.

---

## Formato de respuesta estándar

```typescript
// Éxito
{ data: T }
{ data: T[], pagination: { page, pageSize, total } }

// Error
{ error: true, message: string, code?: string }
```

---

## M3-T1: Endpoints CRUD notas

### Archivos
- `backend/src/modules/notes/notes.controller.ts`
- `backend/src/modules/notes/notes.service.ts`

### Endpoints

| Método | Ruta               | Descripción                               |
|--------|--------------------|--------------------------------------------|
| GET    | /api/notes         | Listar notas (paginado, filtros)           |
| GET    | /api/notes/:id     | Nota con attachments                       |
| PUT    | /api/notes/:id     | Actualizar título, contenido, tags, folder |
| DELETE | /api/notes/:id     | Eliminar nota                              |
| GET    | /api/notes/search  | Búsqueda full-text (?q=término)            |

### Query params para GET /api/notes
- `page` (default 1)
- `pageSize` (default 20, max 100)
- `sourceType` (text, audio, image, document)
- `folderId` (UUID)
- `orderBy` (created_at, updated_at — default created_at desc)

### Service methods
- `list(userId, filters)` → notas paginadas
- `getById(userId, noteId)` → nota + attachments
- `update(userId, noteId, data)` → nota actualizada
- `delete(userId, noteId)` → void
- `search(userId, query)` → notas matching FTS
- `create(data)` → noteId (usado internamente por AI/WhatsApp)
- `addAttachment(data)` → attachmentId

### Criterio de aceptación
- CRUD funcional con auth
- Paginación correcta
- FTS funciona con español
- User A no ve notas de User B
- Attachments con signed URLs

---

## M3-T2: Endpoints CRUD carpetas

### Archivos
- `backend/src/modules/folders/folders.controller.ts`
- `backend/src/modules/folders/folders.service.ts`

### Endpoints

| Método | Ruta              | Descripción        |
|--------|-------------------|--------------------|
| GET    | /api/folders      | Listar carpetas    |
| POST   | /api/folders      | Crear carpeta      |
| PUT    | /api/folders/:id  | Actualizar carpeta |
| DELETE | /api/folders/:id  | Eliminar carpeta   |

### Service methods
- `list(userId)` → todas las carpetas del usuario (con count de notas)
- `create(userId, name, parentId?, icon?)` → folder
- `update(userId, folderId, data)` → folder
- `delete(userId, folderId)` → void

### Criterio de aceptación
- CRUD funcional
- Jerarquía (parent_id) correcta
- UNIQUE constraint funciona
- Count de notas por carpeta

---

## M3-T3: Endpoints vault

### Archivos
- `backend/src/modules/security/vault.controller.ts`
- `backend/src/modules/security/vault.service.ts` (ya especificado, contiene encrypt/decrypt logic)

### Endpoints

| Método | Ruta            | Auth        | Descripción                    |
|--------|-----------------|-------------|--------------------------------|
| GET    | /api/vault      | JWT         | Listar items (solo metadata)   |
| GET    | /api/vault/:id  | JWT+re-auth | Desencriptar y retornar item   |
| POST   | /api/vault      | JWT         | Crear vault item               |
| DELETE | /api/vault/:id  | JWT         | Eliminar item                  |

### Re-autenticación para GET /:id
El frontend envía `password` en el body (o header custom). El backend verifica la contraseña contra Supabase Auth antes de desencriptar.

### Criterio de aceptación
- Lista NO expone datos cifrados
- GET /:id requiere re-auth y retorna datos desencriptados
- Re-auth con contraseña incorrecta → 403
- Eliminar funciona

---

## M3-T4: Endpoint upload manual

### Archivos
- `backend/src/modules/upload/upload.controller.ts`

### Endpoint

| Método | Ruta         | Descripción                             |
|--------|--------------|-----------------------------------------|
| POST   | /api/upload  | Recibe archivo → encola procesamiento   |

### Flujo
1. Recibe multipart file
2. Valida tipo y tamaño (max 25MB)
3. Sube a Supabase Storage
4. Crea processing_job
5. Encola en BullMQ para procesamiento (misma cola que WhatsApp)
6. Retorna jobId para tracking

### Criterio de aceptación
- Upload funciona para audio, imagen, documento
- Validación de tamaño y tipo
- Job creado y encolado
- Response incluye jobId

---

## M3-T5: Integración WhatsApp — Evolution API

### Archivos
- `backend/src/modules/whatsapp/whatsapp.controller.ts` — POST /webhook/whatsapp + GET /api/whatsapp/status
- `backend/src/modules/whatsapp/whatsapp.service.ts` — Parsing, resolución de usuario, envío de mensajes
- `backend/src/modules/whatsapp/whatsapp.queue.ts` — Cola BullMQ
- `backend/src/modules/whatsapp/whatsapp.worker.ts` — Worker que procesa por tipo
- `backend/src/modules/whatsapp/whatsapp.types.ts` — Tipos de Evolution API
- `backend/src/config/redis.ts` — Conexión Redis

### Flujo
1. Evolution API → POST /webhook/whatsapp
2. Validar API key, parsear payload, verificar deduplicación
3. Encolar en BullMQ (jobId = waMessageId)
4. Worker consume: resolver usuario → procesar por tipo → crear nota → responder por WA
5. Retry 3x con backoff exponencial, DLQ para fallidos

### Criterio de aceptación
- Webhook responde < 200ms
- Mensajes encolados y procesados async
- Deduplicación funcional
- Retry y DLQ funcionan

---

## M3-T6: Servicio descarga media

### Archivo: `backend/src/modules/storage/storage.service.ts`

### Métodos
- `downloadAndStore(userId, mediaUrl, fileName, mimeType, bucket)` → { storagePath, fileSize }
- `getSignedUrl(storagePath, bucket, expiresIn)` → URL
- `deleteFile(storagePath, bucket)` → void
- `downloadAsBuffer(storagePath, bucket)` → Buffer

### Criterio de aceptación
- Media de Evolution API descargada y almacenada en Supabase Storage
- URLs firmadas para acceso temporal
- Path: `{userId}/{type}/{timestamp}_{fileName}`

---

## M3-T7: Registro/vinculación usuario vía WhatsApp

### En `whatsapp.service.ts`

**Flujo:**
- Número desconocido → crear usuario en Supabase Auth (email: `wa_{phone}@wpnotes.local`) → crear profile → enviar bienvenida
- Número conocido → actualizar `whatsapp_linked = true`

### Criterio de aceptación
- Primer mensaje crea profile
- Siguientes se vinculan
- Bienvenida enviada

---

## M3-T8: Respuestas WhatsApp

### En `whatsapp.service.ts`

Métodos para enviar mensajes de vuelta:
- `sendText(phone, text)` — Base
- `sendNoteConfirmation(phone, title, folder?)` — Confirmación de nota guardada
- `sendSensitiveDataConfirmation(phone, label)` — Dato sensible cifrado
- `sendProcessingError(phone, type)` — Error de procesamiento
- `sendStudyContent(phone, content)` — Resultado quiz/flashcards

---

## M3-T9: Capa abstracción AI

### Archivos
- `backend/src/modules/ai/providers/provider.interface.ts` — Interface IAIProvider
- `backend/src/modules/ai/providers/openai.provider.ts` — Implementación OpenAI
- `backend/src/modules/ai/providers/gemini.provider.ts` — Implementación Gemini
- `backend/src/modules/ai/ai.service.ts` — Routing por tarea/tamaño

### Interface IAIProvider
```
transcribeAudio(buffer, mimeType) → TranscriptionResult
extractTextFromImage(buffer, mimeType) → OCRResult
summarizeText(text, maxLength?) → SummarizationResult
chat(messages, options?) → string
detectSensitiveData(text) → SensitiveDataResult
detectSensitiveImage(buffer, mimeType) → SensitiveDataResult
```

### Routing
- Audio → OpenAI Whisper (mejor calidad)
- Archivos > 5MB → Gemini (costo-efectivo, context window 1M)
- Tareas cortas → OpenAI GPT-4o-mini (rápido, barato)
- Visión → GPT-4o (calidad) o Gemini (costo)

---

## M3-T10: Transcripción audio

### Archivo: `backend/src/modules/ai/transcription.service.ts`

**Flujo:** Descargar audio → transcribir (Whisper/Gemini) → generar resumen → crear nota (source_type=audio) → crear attachment

Soporta: OGG/OPUS, MP3, WAV, M4A

---

## M3-T11: OCR imágenes

### Archivo: `backend/src/modules/ai/ocr.service.ts`

**Flujo:** Descargar imagen → OCR (GPT-4o vision / Gemini) → combinar con caption → generar resumen → crear nota (source_type=image) → crear attachment

---

## M3-T12: Procesamiento documentos

### Archivo: `backend/src/modules/ai/document.service.ts`

**Flujo:** Descargar doc → extraer texto (pdf-parse, mammoth) → chunking si > 50K chars → generar resumen → crear nota (source_type=document) → crear attachment

Dependencias adicionales: `pdf-parse`, `mammoth`

---

## M3-T13: Auto-organización

### Archivo: `backend/src/modules/ai/organizer.service.ts`

**Flujo:** Obtener carpetas existentes → AI sugiere carpeta + tags + categoría → crear carpeta si nueva (is_auto=true) → asignar a nota

---

## M3-T14: Detección datos sensibles

### Archivo: `backend/src/modules/security/detector.service.ts`

**Capa 1 (regex):** tarjetas de crédito, teléfonos, emails, contraseñas explícitas ("clave:", "password:"), DNI argentino

**Capa 2 (AI):** Solo si heurística detecta keywords de info personal. Para edge cases y fotos de DNI/tarjetas.

---

## M3-T15: Cifrado AES-256-GCM

### Archivo: `backend/src/modules/security/encryption.service.ts`

- `encrypt(plaintext)` → { encrypted, iv, authTag } (salt incluido en encrypted)
- `decrypt(encrypted, iv, authTag)` → plaintext
- IV único por operación, key derivada con PBKDF2 (100K iterations, SHA-512)

---

## M3-T16: Hashing contraseñas

### Archivo: `backend/src/modules/security/hashing.service.ts`

bcrypt con 12 salt rounds. `hash(password)`, `verify(password, hash)`.

---

## M3-T17: Flujo vault items

### Flujo completo en el worker:
1. Detectar datos sensibles (detector.service)
2. Cifrar y guardar en vault (vault.service)
3. Purgar contenido sensible de la nota: reemplazar con `[🔒 PROTEGIDO - Ver Bóveda: {label}]`
4. Crear nota con contenido purgado (is_sensitive=true)
5. Confirmar por WhatsApp

---

## M3-T18: Asistencia estudio

### Archivo: `backend/src/modules/ai/study.service.ts`

**Comandos WhatsApp:**
- `!quiz [tema]` → 5 preguntas con opciones desde notas del usuario (FTS)
- `!flashcards [tema]` → Q&A cards
- `!review [tema]` → resumen comprehensivo

Si no hay notas → mensaje informativo
