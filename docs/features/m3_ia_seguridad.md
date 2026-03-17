# Hito 3 — Lógica de IA y Seguridad

## Objetivo
Implementar procesamiento inteligente de contenido (transcripción, OCR, resúmenes, auto-organización) y seguridad (detección de datos sensibles, cifrado, vault).

---

## M3-T1: Capa de abstracción AI

### Descripción
Interface `IAIProvider` que permite routing por costo/tarea sin vendor lock-in. Implementaciones para OpenAI y Gemini.

### Archivo: `backend/src/modules/ai/providers/provider.interface.ts`

```typescript
export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export interface OCRResult {
  text: string;
  description?: string;    // Descripción de diagramas/imágenes
  confidence?: number;
}

export interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  suggestedTitle: string;
}

export interface OrganizationResult {
  suggestedFolder: string;
  tags: string[];
  category: string;        // académico, personal, trabajo, etc.
  isNewFolder: boolean;
}

export interface SensitiveDataResult {
  isSensitive: boolean;
  detectedItems: {
    type: "password" | "credit_card" | "id_photo" | "phone" | "email" | "other";
    value: string;
    label: string;
    confidence: number;
  }[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IAIProvider {
  name: string;

  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult>;

  extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult>;

  summarizeText(text: string, maxLength?: number): Promise<SummarizationResult>;

  chat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<string>;

  detectSensitiveData(text: string): Promise<SensitiveDataResult>;

  detectSensitiveImage(imageBuffer: Buffer, mimeType: string): Promise<SensitiveDataResult>;
}
```

### Archivo: `backend/src/modules/ai/providers/openai.provider.ts`

```typescript
import OpenAI from "openai";
import {
  IAIProvider, TranscriptionResult, OCRResult, SummarizationResult,
  ChatMessage, SensitiveDataResult,
} from "./provider.interface.js";
import { env } from "../../../config/env.js";

export class OpenAIProvider implements IAIProvider {
  name = "openai";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp3") ? "mp3" : "wav";
    const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType });

    const result = await this.client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "es",  // Default español, puede auto-detectar
      response_format: "verbose_json",
    });

    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
    };
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Extract all text from this image. If there are diagrams, describe them. Return JSON: { text: string, description: string }",
        },
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: dataUrl } }],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const parsed = JSON.parse(result.choices[0].message.content ?? "{}");
    return {
      text: parsed.text ?? "",
      description: parsed.description,
    };
  }

  async summarizeText(text: string, maxLength = 500): Promise<SummarizationResult> {
    const result = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Summarize the following text in Spanish. Return JSON: { summary: string (max ${maxLength} chars), keyPoints: string[] (3-5 points), suggestedTitle: string (concise) }`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(result.choices[0].message.content ?? "{}");
  }

  async chat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const result = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    });

    return result.choices[0].message.content ?? "";
  }

  async detectSensitiveData(text: string): Promise<SensitiveDataResult> {
    const result = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze this text for sensitive data (passwords, credit cards, IDs, personal info). Return JSON:
{ isSensitive: boolean, detectedItems: [{ type: "password"|"credit_card"|"id_photo"|"phone"|"email"|"other", value: string, label: string, confidence: number }] }
Only flag genuinely sensitive data, not casual mentions.`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(result.choices[0].message.content ?? '{"isSensitive":false,"detectedItems":[]}');
  }

  async detectSensitiveImage(imageBuffer: Buffer, mimeType: string): Promise<SensitiveDataResult> {
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze this image for sensitive data (ID cards, credit cards, documents with personal info). Return JSON:
{ isSensitive: boolean, detectedItems: [{ type: "id_photo"|"card"|"other", value: string, label: string, confidence: number }] }`,
        },
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: dataUrl } }],
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(result.choices[0].message.content ?? '{"isSensitive":false,"detectedItems":[]}');
  }
}
```

### Archivo: `backend/src/modules/ai/providers/gemini.provider.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IAIProvider, TranscriptionResult, OCRResult, SummarizationResult,
  ChatMessage, SensitiveDataResult,
} from "./provider.interface.js";
import { env } from "../../../config/env.js";

export class GeminiProvider implements IAIProvider {
  name = "gemini";
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-pro" });
    const base64 = audioBuffer.toString("base64");

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      "Transcribe this audio accurately. If in Spanish, transcribe in Spanish. Return only the transcription text, nothing else.",
    ]);

    return { text: result.response.text() };
  }

  async extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-pro" });
    const base64 = imageBuffer.toString("base64");

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      'Extract all text from this image. If there are diagrams, describe them. Return JSON: { "text": "...", "description": "..." }',
    ]);

    const parsed = JSON.parse(result.response.text());
    return { text: parsed.text ?? "", description: parsed.description };
  }

  async summarizeText(text: string, maxLength = 500): Promise<SummarizationResult> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Summarize in Spanish. Return JSON: { "summary": "(max ${maxLength} chars)", "keyPoints": ["..."], "suggestedTitle": "..." }\n\nText:\n${text}`
    );

    return JSON.parse(result.response.text());
  }

  async chat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
      },
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return result.response.text();
  }

  async detectSensitiveData(text: string): Promise<SensitiveDataResult> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Analyze for sensitive data. Return JSON: { "isSensitive": bool, "detectedItems": [{ "type": "password"|"credit_card"|"id_photo"|"phone"|"email"|"other", "value": "...", "label": "...", "confidence": 0.0-1.0 }] }\n\nText:\n${text}`
    );

    return JSON.parse(result.response.text());
  }

  async detectSensitiveImage(imageBuffer: Buffer, mimeType: string): Promise<SensitiveDataResult> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-pro" });
    const base64 = imageBuffer.toString("base64");

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      'Analyze for sensitive data (ID cards, credit cards, personal docs). Return JSON: { "isSensitive": bool, "detectedItems": [{ "type": "id_photo"|"card"|"other", "value": "...", "label": "...", "confidence": 0.0-1.0 }] }',
    ]);

    return JSON.parse(result.response.text());
  }
}
```

### Archivo: `backend/src/modules/ai/ai.service.ts`

```typescript
import { IAIProvider } from "./providers/provider.interface.js";
import { OpenAIProvider } from "./providers/openai.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { logger } from "../../config/logger.js";

class AIService {
  private openai: IAIProvider;
  private gemini: IAIProvider;

  constructor() {
    this.openai = new OpenAIProvider();
    this.gemini = new GeminiProvider();
  }

  /**
   * Routing por tarea:
   * - Audio → OpenAI Whisper (mejor para audio)
   * - Imágenes grandes → Gemini (costo-efectivo)
   * - Documentos grandes → Gemini 1.5 Pro (context window 1M tokens)
   * - Tareas cortas de texto → OpenAI GPT-4o-mini (rápido, barato)
   * - Visión → GPT-4o (mejor calidad) o Gemini (más barato)
   */
  getProvider(task: "transcription" | "ocr" | "summarization" | "chat" | "detection", sizeBytes?: number): IAIProvider {
    const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
    const isLarge = sizeBytes && sizeBytes > LARGE_FILE_THRESHOLD;

    switch (task) {
      case "transcription":
        return this.openai; // Whisper es superior para audio
      case "ocr":
        return isLarge ? this.gemini : this.openai;
      case "summarization":
        return isLarge ? this.gemini : this.openai;
      case "chat":
        return this.openai; // GPT-4o-mini para chat rápido
      case "detection":
        return this.openai; // GPT-4o para detección precisa
      default:
        return this.openai;
    }
  }

  get transcription() { return this.getProvider("transcription"); }
  get ocr() { return this.getProvider("ocr"); }
  get summarization() { return this.getProvider("summarization"); }
  get chat() { return this.getProvider("chat"); }
  get detection() { return this.getProvider("detection"); }
}

export const aiService = new AIService();
```

### Criterio de aceptación
- Ambos proveedores implementan `IAIProvider`
- Routing configurable por tarea y tamaño
- Archivos > 5MB → Gemini, archivos pequeños → OpenAI
- Audio siempre → Whisper

---

## M3-T2: Transcripción de audio

### Descripción
Recibir audio de WhatsApp, transcribirlo y crear nota.

### Archivo: `backend/src/modules/ai/transcription.service.ts`

```typescript
import { aiService } from "./ai.service.js";
import { storageService } from "../storage/storage.service.js";
import { notesService } from "../notes/notes.service.js";
import { logger } from "../../config/logger.js";

class TranscriptionService {
  async processAudio(
    userId: string,
    storagePath: string,
    mimeType: string,
    waMessageId?: string
  ): Promise<string> {
    // 1. Descargar audio de storage
    const audioBuffer = await storageService.downloadAsBuffer(storagePath);

    // 2. Transcribir
    const provider = aiService.getProvider("transcription", audioBuffer.length);
    const transcription = await provider.transcribeAudio(audioBuffer, mimeType);
    logger.info({ chars: transcription.text.length, language: transcription.language }, "Audio transcribed");

    // 3. Generar resumen
    const summarizer = aiService.getProvider("summarization", transcription.text.length);
    const summary = await summarizer.summarizeText(transcription.text);

    // 4. Crear nota
    const noteId = await notesService.create({
      userId,
      title: summary.suggestedTitle,
      content: transcription.text,
      summary: summary.summary,
      sourceType: "audio",
      originalWaId: waMessageId,
      tags: [],
    });

    // 5. Crear attachment
    await notesService.addAttachment({
      noteId,
      userId,
      fileName: `audio_${Date.now()}.ogg`,
      fileType: mimeType,
      fileSize: audioBuffer.length,
      storagePath,
    });

    return noteId;
  }
}

export const transcriptionService = new TranscriptionService();
```

### Criterio de aceptación
- Voice note de WhatsApp → nota transcrita con resumen
- Soporta OGG/OPUS, MP3, WAV, M4A
- Nota tiene `source_type = 'audio'`
- Audio original guardado como attachment

---

## M3-T3: OCR (fotos de pizarrón)

### Archivo: `backend/src/modules/ai/ocr.service.ts`

```typescript
import { aiService } from "./ai.service.js";
import { storageService } from "../storage/storage.service.js";
import { notesService } from "../notes/notes.service.js";
import { logger } from "../../config/logger.js";

class OCRService {
  async processImage(
    userId: string,
    storagePath: string,
    mimeType: string,
    caption?: string,
    waMessageId?: string
  ): Promise<string> {
    // 1. Descargar imagen
    const imageBuffer = await storageService.downloadAsBuffer(storagePath);

    // 2. OCR
    const provider = aiService.getProvider("ocr", imageBuffer.length);
    const ocrResult = await provider.extractTextFromImage(imageBuffer, mimeType);
    logger.info({ chars: ocrResult.text.length }, "Image text extracted");

    // 3. Combinar con caption si existe
    const fullContent = caption
      ? `**Caption:** ${caption}\n\n---\n\n${ocrResult.text}`
      : ocrResult.text;

    // 4. Generar resumen si hay suficiente texto
    let summary = ocrResult.description ?? "";
    let title = caption ?? "Imagen";
    if (ocrResult.text.length > 100) {
      const summarizer = aiService.getProvider("summarization");
      const summaryResult = await summarizer.summarizeText(fullContent);
      summary = summaryResult.summary;
      title = summaryResult.suggestedTitle;
    }

    // 5. Crear nota
    const noteId = await notesService.create({
      userId,
      title,
      content: fullContent,
      summary,
      sourceType: "image",
      originalWaId: waMessageId,
      tags: [],
    });

    // 6. Attachment
    await notesService.addAttachment({
      noteId,
      userId,
      fileName: `image_${Date.now()}.jpg`,
      fileType: mimeType,
      fileSize: imageBuffer.length,
      storagePath,
    });

    return noteId;
  }
}

export const ocrService = new OCRService();
```

### Criterio de aceptación
- Foto de pizarrón → nota con texto extraído
- Diagramas descritos en texto
- Caption de WhatsApp incluido
- Imagen original como attachment

---

## M3-T4: Procesamiento de documentos

### Archivo: `backend/src/modules/ai/document.service.ts`

```typescript
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { aiService } from "./ai.service.js";
import { storageService } from "../storage/storage.service.js";
import { notesService } from "../notes/notes.service.js";
import { logger } from "../../config/logger.js";

class DocumentService {
  async processDocument(
    userId: string,
    storagePath: string,
    mimeType: string,
    fileName: string,
    waMessageId?: string
  ): Promise<string> {
    // 1. Descargar documento
    const docBuffer = await storageService.downloadAsBuffer(storagePath);

    // 2. Extraer texto según tipo
    let extractedText: string;
    switch (mimeType) {
      case "application/pdf":
        extractedText = await this.extractPDF(docBuffer);
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
        extractedText = await this.extractDOCX(docBuffer);
        break;
      default:
        extractedText = docBuffer.toString("utf-8");
    }

    logger.info({ chars: extractedText.length, type: mimeType }, "Document text extracted");

    // 3. Chunking si es muy largo (>50K chars → Gemini)
    const provider = aiService.getProvider("summarization", docBuffer.length);
    const summary = await provider.summarizeText(
      extractedText.length > 50000
        ? extractedText.substring(0, 50000) + "\n...[truncated]"
        : extractedText
    );

    // 4. Crear nota
    const noteId = await notesService.create({
      userId,
      title: summary.suggestedTitle || fileName,
      content: extractedText,
      summary: `${summary.summary}\n\n**Puntos clave:**\n${summary.keyPoints.map((p) => `- ${p}`).join("\n")}`,
      sourceType: "document",
      originalWaId: waMessageId,
      tags: [],
    });

    // 5. Attachment
    await notesService.addAttachment({
      noteId,
      userId,
      fileName,
      fileType: mimeType,
      fileSize: docBuffer.length,
      storagePath,
    });

    return noteId;
  }

  private async extractPDF(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractDOCX(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

export const documentService = new DocumentService();
```

### Dependencias adicionales: `pdf-parse`, `mammoth`

### Criterio de aceptación
- PDF → texto extraído + resumen + puntos clave
- DOCX → texto extraído + resumen
- Documentos grandes → chunking antes de resumir
- Documento original como attachment

---

## M3-T5: Auto-organización

### Archivo: `backend/src/modules/ai/organizer.service.ts`

```typescript
import { aiService } from "./ai.service.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { OrganizationResult } from "./providers/provider.interface.js";
import { logger } from "../../config/logger.js";

class OrganizerService {
  async organize(userId: string, title: string, content: string, summary: string): Promise<OrganizationResult> {
    // 1. Obtener carpetas existentes del usuario
    const { data: folders } = await supabaseAdmin
      .from("folders")
      .select("id, name")
      .eq("user_id", userId);

    const folderNames = folders?.map((f) => f.name) ?? [];

    // 2. Pedir a AI que sugiera carpeta y tags
    const provider = aiService.getProvider("chat");
    const prompt = `Given these existing folders: [${folderNames.join(", ")}]
And this note:
Title: ${title}
Summary: ${summary}
Content (first 500 chars): ${content.substring(0, 500)}

Suggest organization. Return JSON:
{
  "suggestedFolder": "folder name (use existing if fits, or suggest new)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "académico|personal|trabajo|salud|finanzas|otro",
  "isNewFolder": true/false
}`;

    const result = await provider.chat([
      { role: "system", content: "You are an organizational assistant. Respond only with valid JSON." },
      { role: "user", content: prompt },
    ]);

    const parsed: OrganizationResult = JSON.parse(result);

    // 3. Crear carpeta si es nueva
    if (parsed.isNewFolder && parsed.suggestedFolder) {
      const { error } = await supabaseAdmin.from("folders").insert({
        user_id: userId,
        name: parsed.suggestedFolder,
        is_auto: true,
      });
      if (error && !error.message.includes("duplicate")) {
        logger.warn({ error: error.message }, "Failed to create auto folder");
      }
    }

    return parsed;
  }

  /**
   * Obtener folder_id por nombre para un usuario
   */
  async getFolderId(userId: string, folderName: string): Promise<string | null> {
    const { data } = await supabaseAdmin
      .from("folders")
      .select("id")
      .eq("user_id", userId)
      .eq("name", folderName)
      .single();
    return data?.id ?? null;
  }
}

export const organizerService = new OrganizerService();
```

### Criterio de aceptación
- AI sugiere carpeta existente cuando corresponde
- Crea carpeta nueva con `is_auto = true` si no existe
- Tags relevantes asignados (3-5)
- Categorización correcta

---

## M3-T6: Detección de datos sensibles

### Archivo: `backend/src/modules/security/detector.service.ts`

```typescript
import { SensitiveDataResult } from "../ai/providers/provider.interface.js";
import { aiService } from "../ai/ai.service.js";
import { logger } from "../../config/logger.js";

class DetectorService {
  // Regex patterns para detección rápida (Capa 1)
  private patterns = {
    credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    phone: /\b(?:\+?[1-9]\d{1,2}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /(?:(?:clave|contraseña|password|pass|pin|código|code|secret|token)[\s:=]+\S+)/gi,
    dni_arg: /\b\d{2}\.?\d{3}\.?\d{3}\b/g,
  };

  /**
   * Detección en texto: Capa 1 (regex) + Capa 2 (AI para edge cases)
   */
  async detectInText(text: string): Promise<SensitiveDataResult> {
    // Capa 1: Regex
    const regexResults = this.regexDetect(text);

    // Si regex detecta algo, es suficiente
    if (regexResults.isSensitive) {
      logger.info({ count: regexResults.detectedItems.length }, "Sensitive data detected via regex");
      return regexResults;
    }

    // Capa 2: AI para casos ambiguos (solo si el texto parece contener info personal)
    if (this.looksLikePersonalInfo(text)) {
      const provider = aiService.getProvider("detection");
      const aiResult = await provider.detectSensitiveData(text);
      return aiResult;
    }

    return { isSensitive: false, detectedItems: [] };
  }

  /**
   * Detección en imágenes (fotos de DNI, tarjetas, etc.)
   */
  async detectInImage(imageBuffer: Buffer, mimeType: string): Promise<SensitiveDataResult> {
    const provider = aiService.getProvider("detection");
    return provider.detectSensitiveImage(imageBuffer, mimeType);
  }

  /**
   * Detección solo con regex (para unit tests y detección rápida)
   */
  regexDetect(text: string): SensitiveDataResult {
    const items: SensitiveDataResult["detectedItems"] = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.matchAll(new RegExp(pattern));
      for (const match of matches) {
        items.push({
          type: type as any,
          value: match[0],
          label: `Detected ${type}`,
          confidence: 0.9,
        });
      }
    }

    return {
      isSensitive: items.length > 0,
      detectedItems: items,
    };
  }

  /**
   * Heurística simple para decidir si vale la pena la detección AI
   */
  private looksLikePersonalInfo(text: string): boolean {
    const keywords = [
      "clave", "contraseña", "password", "pin", "código", "tarjeta",
      "cuenta", "banco", "dni", "documento", "cbu", "alias", "token",
      "secret", "credential", "ssn", "social security",
    ];
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  }
}

export const detectorService = new DetectorService();
```

### Criterio de aceptación
- Regex detecta: tarjetas de crédito, contraseñas explícitas, teléfonos, emails
- AI detecta edge cases: "mi clave es abc123", fotos de DNI
- Sin falsos positivos en texto normal ("mi teléfono suena" no es dato sensible)
- Recall > 95%, Precision > 90%

---

## M3-T7: Servicio de cifrado AES-256-GCM

### Archivo: `backend/src/modules/security/encryption.service.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";
import { env } from "../../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;    // 128 bits
const TAG_LENGTH = 16;   // 128 bits
const KEY_LENGTH = 32;   // 256 bits
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100_000;

class EncryptionService {
  private deriveKey(salt: Buffer): Buffer {
    return pbkdf2Sync(env.ENCRYPTION_MASTER_KEY, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
  }

  /**
   * Cifrar datos con AES-256-GCM
   * Retorna: { encrypted, iv, authTag, salt } todos en base64
   */
  encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    const salt = randomBytes(SALT_LENGTH);
    const key = this.deriveKey(salt);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    return {
      encrypted: `${salt.toString("base64")}:${encrypted}`,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  }

  /**
   * Desencriptar datos
   */
  decrypt(encryptedData: string, ivBase64: string, authTagBase64: string): string {
    const [saltBase64, ciphertext] = encryptedData.split(":");
    const salt = Buffer.from(saltBase64, "base64");
    const key = this.deriveKey(salt);
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
```

### Criterio de aceptación
- Encrypt → decrypt roundtrip correcto
- IVs únicos (nunca reutilizados)
- Key incorrecta → falla con error claro
- Auth tag previene tampering

---

## M3-T8: Hashing de contraseñas

### Archivo: `backend/src/modules/security/hashing.service.ts`

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

class HashingService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const hashingService = new HashingService();
```

### Criterio de aceptación
- Hash/verify roundtrip correcto
- Salt rounds = 12

---

## M3-T9: Flujo de creación de vault items

### Archivo: `backend/src/modules/security/vault.service.ts`

```typescript
import { supabaseAdmin } from "../../config/supabase.js";
import { encryptionService } from "./encryption.service.js";
import { hashingService } from "./hashing.service.js";
import { SensitiveDataResult } from "../ai/providers/provider.interface.js";
import { logger } from "../../config/logger.js";

interface VaultItem {
  id: string;
  label: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

class VaultService {
  /**
   * Procesar datos sensibles detectados:
   * 1. Cifrar y guardar en vault
   * 2. Retornar labels para referencia en nota (sin datos reales)
   */
  async processDetectedItems(
    userId: string,
    detectedItems: SensitiveDataResult["detectedItems"]
  ): Promise<{ vaultItemIds: string[]; labels: string[] }> {
    const vaultItemIds: string[] = [];
    const labels: string[] = [];

    for (const item of detectedItems) {
      // Cifrar el valor
      const { encrypted, iv, authTag } = encryptionService.encrypt(item.value);

      // Si es contraseña, también hacer hash para verificación rápida
      let metadata: Record<string, unknown> = { originalType: item.type };
      if (item.type === "password") {
        metadata.hash = await hashingService.hash(item.value);
      }

      // Guardar en vault
      const { data, error } = await supabaseAdmin
        .from("vault_items")
        .insert({
          user_id: userId,
          label: item.label,
          type: this.mapType(item.type),
          encrypted_data: encrypted,
          iv,
          auth_tag: authTag,
          metadata,
        })
        .select("id")
        .single();

      if (error) {
        logger.error({ error: error.message }, "Failed to create vault item");
        continue;
      }

      vaultItemIds.push(data.id);
      labels.push(item.label);
    }

    return { vaultItemIds, labels };
  }

  /**
   * Listar vault items (solo metadata, sin datos cifrados)
   */
  async list(userId: string): Promise<VaultItem[]> {
    const { data, error } = await supabaseAdmin
      .from("vault_items")
      .select("id, label, type, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data.map((item) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      metadata: item.metadata,
      createdAt: item.created_at,
    }));
  }

  /**
   * Obtener y desencriptar vault item (requiere re-auth a nivel app)
   */
  async getDecrypted(userId: string, itemId: string): Promise<{ label: string; type: string; decryptedData: string }> {
    const { data, error } = await supabaseAdmin
      .from("vault_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", userId)
      .single();

    if (error || !data) throw new Error("Vault item not found");

    const decryptedData = encryptionService.decrypt(data.encrypted_data, data.iv, data.auth_tag);

    return {
      label: data.label,
      type: data.type,
      decryptedData,
    };
  }

  /**
   * Eliminar vault item
   */
  async delete(userId: string, itemId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("vault_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  /**
   * Purgar datos sensibles del contenido de una nota
   * Reemplaza los valores detectados con "[DATO PROTEGIDO - Ver Bóveda]"
   */
  purgeFromText(text: string, detectedItems: SensitiveDataResult["detectedItems"]): string {
    let purged = text;
    for (const item of detectedItems) {
      purged = purged.replaceAll(item.value, `[🔒 PROTEGIDO - Ver Bóveda: ${item.label}]`);
    }
    return purged;
  }

  private mapType(detectedType: string): string {
    switch (detectedType) {
      case "password": return "password";
      case "credit_card": return "card";
      case "id_photo": return "id_photo";
      default: return "other";
    }
  }
}

export const vaultService = new VaultService();
```

### Flujo completo (en el worker):

```typescript
// En whatsapp.worker.ts → processTextMessage:

// 1. Detectar datos sensibles
const detection = await detectorService.detectInText(text);

if (detection.isSensitive) {
  // 2. Cifrar y guardar en vault
  const { vaultItemIds, labels } = await vaultService.processDetectedItems(userId, detection.detectedItems);

  // 3. Purgar contenido sensible de la nota
  const purgedContent = vaultService.purgeFromText(text, detection.detectedItems);

  // 4. Crear nota con contenido purgado
  const noteId = await notesService.create({
    userId, title: "Dato sensible detectado",
    content: purgedContent,
    sourceType: "text",
    isSensitive: true,
    originalWaId: waMessageId,
  });

  // 5. Confirmar por WhatsApp
  for (const label of labels) {
    await whatsappService.sendSensitiveDataConfirmation(phoneNumber, label);
  }
} else {
  // Flujo normal: crear nota
}
```

### Criterio de aceptación
- Datos sensibles nunca en plaintext en tabla `notes`
- Solo accesibles via vault con re-auth
- Contraseñas tienen hash para verificación rápida + original cifrado
- Purge reemplaza todos los valores en el texto
- Confirmación enviada por WhatsApp

---

## M3-T10: Asistencia de estudio

### Archivo: `backend/src/modules/ai/study.service.ts`

```typescript
import { aiService } from "./ai.service.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { logger } from "../../config/logger.js";

class StudyService {
  /**
   * Parsear comando de estudio del texto del mensaje
   */
  parseCommand(text: string): { command: string; topic: string } | null {
    const match = text.match(/^!(quiz|flashcards|review)\s+(.+)/i);
    if (!match) return null;
    return { command: match[1].toLowerCase(), topic: match[2].trim() };
  }

  /**
   * Buscar notas del usuario por tema
   */
  private async findNotesByTopic(userId: string, topic: string): Promise<string[]> {
    const { data } = await supabaseAdmin
      .from("notes")
      .select("title, content, summary")
      .eq("user_id", userId)
      .textSearch("fts", topic, { type: "websearch" })
      .limit(10);

    return data?.map((n) => `## ${n.title}\n${n.summary ?? n.content?.substring(0, 500)}`) ?? [];
  }

  async generateQuiz(userId: string, topic: string): Promise<string> {
    const notes = await this.findNotesByTopic(userId, topic);
    if (notes.length === 0) return `No encontré notas sobre "${topic}". Enviame contenido primero.`;

    const provider = aiService.getProvider("chat");
    const result = await provider.chat([
      {
        role: "system",
        content: "Generate 5 quiz questions in Spanish based on the provided notes. Format: numbered questions with 4 options (A-D) and the correct answer at the end.",
      },
      { role: "user", content: `Topic: ${topic}\n\nNotes:\n${notes.join("\n\n")}` },
    ]);

    return `📝 *Quiz: ${topic}*\n\n${result}`;
  }

  async generateFlashcards(userId: string, topic: string): Promise<string> {
    const notes = await this.findNotesByTopic(userId, topic);
    if (notes.length === 0) return `No encontré notas sobre "${topic}".`;

    const provider = aiService.getProvider("chat");
    const result = await provider.chat([
      {
        role: "system",
        content: "Generate 5-8 flashcards in Spanish. Format: Q: question / A: answer, separated by blank lines.",
      },
      { role: "user", content: `Topic: ${topic}\n\nNotes:\n${notes.join("\n\n")}` },
    ]);

    return `🃏 *Flashcards: ${topic}*\n\n${result}`;
  }

  async generateReview(userId: string, topic: string): Promise<string> {
    const notes = await this.findNotesByTopic(userId, topic);
    if (notes.length === 0) return `No encontré notas sobre "${topic}".`;

    const provider = aiService.getProvider("chat");
    const result = await provider.chat([
      {
        role: "system",
        content: "Generate a comprehensive study review/summary in Spanish. Include key concepts, definitions, and relationships between ideas.",
      },
      { role: "user", content: `Topic: ${topic}\n\nNotes:\n${notes.join("\n\n")}` },
    ]);

    return `📚 *Review: ${topic}*\n\n${result}`;
  }
}

export const studyService = new StudyService();
```

### Criterio de aceptación
- `!quiz [tema]` → 5 preguntas con opciones desde notas del usuario
- `!flashcards [tema]` → Q&A cards
- `!review [tema]` → resumen comprehensivo
- Si no hay notas sobre el tema → mensaje informativo
