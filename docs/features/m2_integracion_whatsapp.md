# Hito 2 — Integración WhatsApp con Evolution API

## Objetivo
Conectar WhatsApp via Evolution API para recibir mensajes (texto, audio, imagen, documento), procesarlos async con BullMQ, y responder al usuario.

---

## M2-T1: Configurar instancia Evolution API

### Descripción
Configurar la instancia de Evolution API en Docker, crear instancia WhatsApp, configurar webhook URL.

### Pasos de configuración

1. La instancia Docker ya está en `docker-compose.yml` (M1-T7)
2. Crear instancia WhatsApp via API:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "wpnotes",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'
```

3. Configurar webhook:

```bash
curl -X PUT http://localhost:8080/webhook/set/wpnotes \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "http://host.docker.internal:3001/webhook/whatsapp",
      "webhookByEvents": false,
      "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
    }
  }'
```

4. Obtener QR para vincular:

```bash
curl http://localhost:8080/instance/connect/wpnotes \
  -H "apikey: ${EVOLUTION_API_KEY}"
```

### Archivo: `backend/src/modules/whatsapp/whatsapp.types.ts`

```typescript
// Tipos basados en Evolution API v2 webhook payloads

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: EvolutionMessageData | EvolutionConnectionData;
}

export interface EvolutionMessageData {
  key: {
    remoteJid: string;       // "5491112345678@s.whatsapp.net"
    fromMe: boolean;
    id: string;              // ID único del mensaje
  };
  pushName: string;           // Nombre del contacto
  message: {
    conversation?: string;    // Mensaje de texto
    extendedTextMessage?: { text: string };
    audioMessage?: {
      url: string;
      mimetype: string;       // "audio/ogg; codecs=opus"
      seconds: number;
      fileLength: string;
      mediaKey: string;
    };
    imageMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
      fileLength: string;
      mediaKey: string;
    };
    documentMessage?: {
      url: string;
      mimetype: string;
      title: string;
      fileLength: string;
      mediaKey: string;
    };
  };
  messageType: "conversation" | "extendedTextMessage" | "audioMessage" | "imageMessage" | "documentMessage";
  messageTimestamp: number;
}

export interface EvolutionConnectionData {
  state: "open" | "close" | "connecting";
}

export type MessageType = "text" | "audio" | "image" | "document";

export interface ParsedMessage {
  waMessageId: string;
  phoneNumber: string;       // Sin @s.whatsapp.net
  pushName: string;
  type: MessageType;
  content?: string;          // Solo para texto
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  caption?: string;
  timestamp: Date;
}
```

### Criterio de aceptación
- QR scan conecta WhatsApp
- Mensaje de prueba aparece en logs del backend
- Connection state se monitorea

---

## M2-T2: Endpoint receptor de webhooks

### Descripción
Endpoint POST que recibe webhooks de Evolution API, parsea el payload, valida, y encola el mensaje para procesamiento async.

### Archivo: `backend/src/modules/whatsapp/whatsapp.controller.ts`

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { whatsappService } from "./whatsapp.service.js";
import { messageQueue } from "./whatsapp.queue.js";
import { EvolutionWebhookPayload } from "./whatsapp.types.js";
import { env } from "../../config/env.js";

export async function whatsappRoutes(app: FastifyInstance) {
  // Webhook receptor — NO requiere auth (viene de Evolution API)
  app.post("/whatsapp", {
    config: {
      rateLimit: { max: 1000, timeWindow: "1 minute" },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers["apikey"] as string;

    // Validar API key de Evolution
    if (apiKey !== env.EVOLUTION_API_KEY) {
      request.log.warn("Invalid webhook API key");
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const payload = request.body as EvolutionWebhookPayload;

    // Ignorar eventos que no son mensajes
    if (payload.event !== "MESSAGES_UPSERT") {
      if (payload.event === "CONNECTION_UPDATE") {
        request.log.info({ data: payload.data }, "WhatsApp connection update");
      }
      return reply.status(200).send({ received: true });
    }

    try {
      const parsed = whatsappService.parseWebhookMessage(payload);

      if (!parsed) {
        return reply.status(200).send({ received: true, skipped: true });
      }

      // Verificar deduplicación
      const isDuplicate = await whatsappService.isDuplicate(parsed.waMessageId);
      if (isDuplicate) {
        request.log.info({ waId: parsed.waMessageId }, "Duplicate message, skipping");
        return reply.status(200).send({ received: true, duplicate: true });
      }

      // Encolar para procesamiento async
      await messageQueue.add("process-message", parsed, {
        jobId: parsed.waMessageId,  // Idempotency
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      });

      request.log.info({ waId: parsed.waMessageId, type: parsed.type }, "Message enqueued");
    } catch (err) {
      request.log.error(err, "Error processing webhook");
    }

    // Siempre retornar 200 rápido para no bloquear Evolution API
    return reply.status(200).send({ received: true });
  });

  // Status de conexión WhatsApp (requiere auth)
  app.get("/whatsapp/status", async (request, reply) => {
    const status = await whatsappService.getConnectionStatus();
    return reply.send(status);
  });
}
```

### Criterio de aceptación
- Webhook responde en < 200ms (no bloquea)
- API key inválida → 401
- Mensaje duplicado (mismo waMessageId) → skip
- Mensaje válido → encolado en BullMQ
- Eventos no-mensaje → 200 sin procesar

---

## M2-T3: Cola de procesamiento BullMQ

### Descripción
Cola BullMQ para procesamiento async de mensajes. Worker rutea por tipo al servicio correspondiente.

### Archivo: `backend/src/config/redis.ts`

```typescript
import IORedis from "ioredis";
import { env } from "./env.js";

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,  // Requerido por BullMQ
});
```

### Archivo: `backend/src/modules/whatsapp/whatsapp.queue.ts`

```typescript
import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis.js";

export const messageQueue = new Queue("whatsapp-messages", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
```

### Archivo: `backend/src/modules/whatsapp/whatsapp.worker.ts`

```typescript
import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { ParsedMessage } from "./whatsapp.types.js";
import { whatsappService } from "./whatsapp.service.js";
import { logger } from "../../config/logger.js";

// Importar cuando estén implementados:
// import { transcriptionService } from "../ai/transcription.service.js";
// import { ocrService } from "../ai/ocr.service.js";
// import { summarizationService } from "../ai/summarization.service.js";
// import { detectorService } from "../security/detector.service.js";

async function processMessage(job: Job<ParsedMessage>) {
  const message = job.data;
  logger.info({ jobId: job.id, type: message.type, phone: message.phoneNumber }, "Processing message");

  // 1. Resolver usuario (crear si no existe)
  const userId = await whatsappService.resolveUser(message.phoneNumber, message.pushName);

  // 2. Procesar según tipo
  switch (message.type) {
    case "text":
      await processTextMessage(userId, message);
      break;
    case "audio":
      await processAudioMessage(userId, message);
      break;
    case "image":
      await processImageMessage(userId, message);
      break;
    case "document":
      await processDocumentMessage(userId, message);
      break;
    default:
      logger.warn({ type: message.type }, "Unknown message type");
  }
}

async function processTextMessage(userId: string, message: ParsedMessage) {
  const text = message.content!;

  // Verificar si es un comando (!quiz, !flashcards, !review)
  if (text.startsWith("!")) {
    // TODO: M3-T10 - Command handler
    return;
  }

  // TODO: M3-T6 - Detección de datos sensibles
  // TODO: M3-T5 - Auto-organización (carpeta, tags)

  // Crear nota
  // TODO: Implementar con notes.service
}

async function processAudioMessage(userId: string, message: ParsedMessage) {
  // 1. Descargar media (M2-T4)
  // 2. Transcribir (M3-T2)
  // 3. Generar resumen (M3-T1)
  // 4. Detectar datos sensibles (M3-T6)
  // 5. Auto-organizar (M3-T5)
  // 6. Crear nota
}

async function processImageMessage(userId: string, message: ParsedMessage) {
  // 1. Descargar media (M2-T4)
  // 2. OCR (M3-T3)
  // 3. Detectar datos sensibles en imagen (M3-T6)
  // 4. Auto-organizar (M3-T5)
  // 5. Crear nota
}

async function processDocumentMessage(userId: string, message: ParsedMessage) {
  // 1. Descargar media (M2-T4)
  // 2. Extraer texto (M3-T4)
  // 3. Generar resumen (M3-T1)
  // 4. Auto-organizar (M3-T5)
  // 5. Crear nota
}

export const messageWorker = new Worker("whatsapp-messages", processMessage, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,  // Max 10 jobs/segundo
  },
});

messageWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed");
});

messageWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Job failed");
});
```

### Criterio de aceptación
- Mensajes encolados correctamente
- Worker consume y procesa async
- Retry 3x con backoff exponencial
- Jobs fallidos loggeados
- Concurrency = 5

---

## M2-T4: Servicio de descarga de media

### Descripción
Descargar archivos multimedia via Evolution API y subirlos a Supabase Storage.

### Archivo: `backend/src/modules/storage/storage.service.ts`

```typescript
import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

interface UploadResult {
  storagePath: string;
  fileSize: number;
}

class StorageService {
  /**
   * Descargar media de Evolution API y subir a Supabase Storage
   */
  async downloadAndStore(
    userId: string,
    mediaUrl: string,
    fileName: string,
    mimeType: string,
    bucket: "attachments" | "vault-files" = "attachments"
  ): Promise<UploadResult> {
    // 1. Descargar de Evolution API
    const response = await fetch(mediaUrl, {
      headers: { apikey: env.EVOLUTION_API_KEY },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const storagePath = `${userId}/${this.getSubfolder(mimeType)}/${Date.now()}_${fileName}`;

    // 2. Subir a Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }

    logger.info({ storagePath, size: buffer.length }, "Media stored");

    return { storagePath, fileSize: buffer.length };
  }

  /**
   * Obtener URL firmada para descarga temporal
   */
  async getSignedUrl(
    storagePath: string,
    bucket: "attachments" | "vault-files" = "attachments",
    expiresIn = 3600  // 1 hora
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
    return data.signedUrl;
  }

  /**
   * Eliminar archivo de storage
   */
  async deleteFile(storagePath: string, bucket: "attachments" | "vault-files" = "attachments") {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([storagePath]);
    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  }

  /**
   * Descargar archivo como Buffer (para procesamiento AI)
   */
  async downloadAsBuffer(storagePath: string, bucket: "attachments" | "vault-files" = "attachments"): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(storagePath);
    if (error) throw new Error(`Failed to download: ${error.message}`);
    return Buffer.from(await data.arrayBuffer());
  }

  private getSubfolder(mimeType: string): string {
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("image/")) return "images";
    if (mimeType.startsWith("video/")) return "video";
    return "documents";
  }
}

export const storageService = new StorageService();
```

### Criterio de aceptación
- Audio, imágenes y documentos descargados de Evolution API
- Subidos a Supabase Storage bajo `{user_id}/{type}/{filename}`
- URLs firmadas generadas para acceso temporal
- Archivos eliminables

---

## M2-T5: Registro/vinculación de usuario via WhatsApp

### Descripción
Cuando un número desconocido envía un mensaje, crear profile automáticamente. Si el número ya existe, vincular. Enviar mensaje de bienvenida.

### Lógica en `backend/src/modules/whatsapp/whatsapp.service.ts`

```typescript
import { supabaseAdmin } from "../../config/supabase.js";
import { EvolutionWebhookPayload, EvolutionMessageData, ParsedMessage, MessageType } from "./whatsapp.types.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";

class WhatsAppService {
  /**
   * Parsear webhook de Evolution API a formato interno
   */
  parseWebhookMessage(payload: EvolutionWebhookPayload): ParsedMessage | null {
    const data = payload.data as EvolutionMessageData;

    // Ignorar mensajes propios
    if (data.key.fromMe) return null;

    const phoneNumber = data.key.remoteJid.replace("@s.whatsapp.net", "");
    const type = this.resolveMessageType(data.messageType);

    const parsed: ParsedMessage = {
      waMessageId: data.key.id,
      phoneNumber,
      pushName: data.pushName,
      type,
      timestamp: new Date(data.messageTimestamp * 1000),
    };

    switch (type) {
      case "text":
        parsed.content = data.message.conversation ?? data.message.extendedTextMessage?.text;
        break;
      case "audio":
        parsed.mediaUrl = data.message.audioMessage?.url;
        parsed.mediaMimeType = data.message.audioMessage?.mimetype;
        parsed.mediaSize = Number(data.message.audioMessage?.fileLength);
        break;
      case "image":
        parsed.mediaUrl = data.message.imageMessage?.url;
        parsed.mediaMimeType = data.message.imageMessage?.mimetype;
        parsed.caption = data.message.imageMessage?.caption;
        parsed.mediaSize = Number(data.message.imageMessage?.fileLength);
        break;
      case "document":
        parsed.mediaUrl = data.message.documentMessage?.url;
        parsed.mediaMimeType = data.message.documentMessage?.mimetype;
        parsed.caption = data.message.documentMessage?.title;
        parsed.mediaSize = Number(data.message.documentMessage?.fileLength);
        break;
    }

    return parsed;
  }

  /**
   * Resolver o crear usuario por número de teléfono
   */
  async resolveUser(phoneNumber: string, pushName: string): Promise<string> {
    // Buscar profile existente por número
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone_number", phoneNumber)
      .single();

    if (existing) {
      // Asegurar que whatsapp_linked = true
      await supabaseAdmin
        .from("profiles")
        .update({ whatsapp_linked: true })
        .eq("id", existing.id);
      return existing.id;
    }

    // Crear nuevo usuario en Supabase Auth (sin password, vinculado por teléfono)
    const email = `wa_${phoneNumber}@wpnotes.local`;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: pushName, phone_number: phoneNumber },
    });

    if (authError) throw new Error(`Failed to create user: ${authError.message}`);

    // Actualizar profile con teléfono
    await supabaseAdmin
      .from("profiles")
      .update({
        phone_number: phoneNumber,
        display_name: pushName,
        whatsapp_linked: true,
      })
      .eq("id", authUser.user.id);

    // Enviar bienvenida
    await this.sendWelcomeMessage(phoneNumber, pushName);

    logger.info({ userId: authUser.user.id, phone: phoneNumber }, "New user created via WhatsApp");
    return authUser.user.id;
  }

  /**
   * Verificar si un mensaje ya fue procesado (deduplicación)
   */
  async isDuplicate(waMessageId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from("notes")
      .select("id")
      .eq("original_wa_id", waMessageId)
      .single();
    return !!data;
  }

  /**
   * Obtener estado de conexión de la instancia WhatsApp
   */
  async getConnectionStatus() {
    try {
      const response = await fetch(
        `${env.EVOLUTION_API_URL}/instance/connectionState/${env.EVOLUTION_INSTANCE_NAME}`,
        { headers: { apikey: env.EVOLUTION_API_KEY } }
      );
      return await response.json();
    } catch (err) {
      return { state: "unknown", error: (err as Error).message };
    }
  }

  /**
   * Enviar mensaje de bienvenida
   */
  private async sendWelcomeMessage(phoneNumber: string, name: string) {
    const message = `¡Hola ${name}! 👋\n\nSoy WPNotes, tu asistente personal. Puedo ayudarte con:\n\n📝 *Texto* → Lo guardo como nota\n🎤 *Audio* → Lo transcribo y resumo\n📸 *Fotos* → Extraigo el texto (OCR)\n📄 *Documentos* → Los resumo\n🔒 *Datos sensibles* → Los cifro y guardo en tu bóveda\n\n*Comandos especiales:*\n!quiz [tema] → Genera preguntas de estudio\n!flashcards [tema] → Genera tarjetas de estudio\n!review [tema] → Genera un resumen\n\n¡Envíame lo que necesites guardar!`;

    await this.sendText(phoneNumber, message);
  }

  /**
   * Enviar mensaje de texto via Evolution API
   */
  async sendText(phoneNumber: string, text: string) {
    const jid = phoneNumber.includes("@") ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;

    const response = await fetch(
      `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          apikey: env.EVOLUTION_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: jid,
          text,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to send WhatsApp message: ${err}`);
    }

    return response.json();
  }

  private resolveMessageType(type: string): MessageType {
    switch (type) {
      case "conversation":
      case "extendedTextMessage":
        return "text";
      case "audioMessage":
        return "audio";
      case "imageMessage":
        return "image";
      case "documentMessage":
        return "document";
      default:
        return "text";
    }
  }
}

export const whatsappService = new WhatsAppService();
```

### Criterio de aceptación
- Número desconocido → profile creado, `whatsapp_linked = true`
- Número conocido → profile existente vinculado
- Mensaje de bienvenida enviado al nuevo usuario
- Deduplicación funcional

---

## M2-T6: Servicio de respuesta WhatsApp

### Descripción
Servicio para enviar mensajes de vuelta al usuario: confirmaciones, errores, resultados.

### Lógica adicional en `whatsapp.service.ts`

```typescript
// Agregar a WhatsAppService:

/**
 * Enviar confirmación de nota creada
 */
async sendNoteConfirmation(phoneNumber: string, noteTitle: string, folder?: string) {
  let text = `✅ *Nota guardada:* ${noteTitle}`;
  if (folder) text += `\n📁 Carpeta: ${folder}`;
  await this.sendText(phoneNumber, text);
}

/**
 * Enviar confirmación de dato sensible detectado
 */
async sendSensitiveDataConfirmation(phoneNumber: string, label: string) {
  await this.sendText(
    phoneNumber,
    `🔒 *Dato sensible detectado y cifrado*\nLabel: ${label}\n\nAccedé a tu bóveda desde la web app para verlo.`
  );
}

/**
 * Enviar error de procesamiento
 */
async sendProcessingError(phoneNumber: string, type: string) {
  await this.sendText(
    phoneNumber,
    `❌ No pude procesar tu ${type}. Por favor intentá de nuevo. Si el problema persiste, contactá soporte.`
  );
}

/**
 * Enviar resultado de quiz/flashcards
 */
async sendStudyContent(phoneNumber: string, content: string) {
  await this.sendText(phoneNumber, content);
}
```

### Criterio de aceptación
- Confirmaciones llegan al usuario en WhatsApp
- Mensajes de error claros y accionables
- No se envían mensajes si el envío anterior falló (no spam loops)
