import { GoogleGenAI, Type, MediaResolution, type Schema } from "@google/genai";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import os from "os";

/* ------------------------------------------------------------------
   1. Zod Validation Schemas & TypeScript Types
------------------------------------------------------------------ */

export const KeyConceptSchema = z.object({
  title: z.string(),
  explanation: z.string(),
});

export const EquationSchema = z.object({
  name: z.string(),
  latex: z.string(),
  explanation: z.string(),
});

export const DailyStudyPlanSchema = z.object({
  day: z.number(),
  topic: z.string(),
  tasks: z.array(z.string()),
});

export const PdfAnalysisSchema = z.object({
  extractionStatus: z.enum(["success", "partial", "failed"]),
  confidenceNote: z.string(),
  summary: z.string(),
  keyConcepts: z.array(KeyConceptSchema),
  equations: z.array(EquationSchema),
  studyPlan: z.array(DailyStudyPlanSchema),
});

export type PdfAnalysisResult = z.infer<typeof PdfAnalysisSchema>;

/* ------------------------------------------------------------------
   2. Gemini OpenAPI/JSON Response Schema
------------------------------------------------------------------ */

export const PDF_ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    extractionStatus: {
      type: Type.STRING,
      enum: ["success", "partial", "failed"],
      description: "Status of document extraction: success, partial, or failed.",
    },
    confidenceNote: {
      type: Type.STRING,
      description: "Explanation of extraction quality, readability, or reason for failure.",
    },
    summary: {
      type: Type.STRING,
      description: "Comprehensive summary of the document.",
    },
    keyConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of key concept" },
          explanation: { type: Type.STRING, description: "Detailed explanation of key concept" },
        },
        required: ["title", "explanation"],
      },
    },
    equations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Formula or equation name" },
          latex: { type: Type.STRING, description: "Valid LaTeX string: \\( ... \\) for inline, \\[ ... \\] for display block" },
          explanation: { type: Type.STRING, description: "Meaning and application of equation" },
        },
        required: ["name", "latex", "explanation"],
      },
    },
    studyPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: "Day number starting from 1" },
          topic: { type: Type.STRING, description: "Main topic of study for the day" },
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of specific study activities and practice goals",
          },
        },
        required: ["day", "topic", "tasks"],
      },
    },
  },
  required: [
    "extractionStatus",
    "confidenceNote",
    "summary",
    "keyConcepts",
    "equations",
    "studyPlan",
  ],
};

/* ------------------------------------------------------------------
   3. Strict System Instruction
------------------------------------------------------------------ */

export const GEMINI_PDF_SYSTEM_INSTRUCTION = `
You are StudySync AI's master academic PDF analyst and document understanding agent, known in the UI as "abang ganteng".

STRICT DOCUMENT FIDELITY RULES:
1. You MUST ONLY use the attached PDF document as your single source of truth. Ignore any inferences or assumptions based on filename alone.
2. DO NOT use generic analogies (e.g. Lego blocks, cooking recipes, building houses) UNLESS they are explicitly written in the provided document.
3. ALL mathematical notations, formulas, variables, and equations MUST be strictly formatted in valid LaTeX notation:
   - Use \\( ... \\) for inline formulas (e.g., \\( f(x) = x^2 \\)).
   - Use \\[ ... \\] for display block equations (e.g., \\[ \\int_0^1 x^2 \\, dx = \\frac{1}{3} \\]).
4. If the PDF document is unreadable, encrypted, corrupted, or contains no extractable academic content:
   - Set "extractionStatus" to "failed".
   - State the exact technical reason in "confidenceNote".
   - Do NOT invent or generate fake/hallucinated summary text or concepts.

LANGUAGE AND TONE RULES:
- Write all explanations in casual, friendly, and natural Indonesian ("santai dan tidak kaku", using "kamu").
- Address the user warmly as "kamu". Refer to yourself as "abang ganteng" if mentioning the AI assistant.
`;

/* ------------------------------------------------------------------
   4. Files API Helper: Upload PDF to Gemini
------------------------------------------------------------------ */

export async function uploadPdfToGemini(
  buffer: Buffer,
  fileName: string
): Promise<{ fileUri: string; fileName: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Save to temporary file in OS temp dir for reliable @google/genai upload
  const cleanName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const tempPath = path.join(os.tmpdir(), `studysync_${Date.now()}_${cleanName}`);

  try {
    await fs.writeFile(tempPath, buffer);

    const uploadedFile = await ai.files.upload({
      file: tempPath,
      config: {
        mimeType: "application/pdf",
        displayName: fileName,
      },
    });

    if (!uploadedFile.uri) {
      throw new Error("Failed to obtain fileUri from Gemini Files API.");
    }

    return {
      fileUri: uploadedFile.uri,
      fileName,
    };
  } finally {
    // Always clean up temp file
    await fs.unlink(tempPath).catch(() => {});
  }
}

/* ------------------------------------------------------------------
   5. Analyze PDF Document Helper
------------------------------------------------------------------ */

export async function analyzePdfDocument(
  fileUri: string,
  days: number = 7
): Promise<PdfAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = `
Analisis dokumen PDF terlampir secara mendalam.
Ekstrak ringkasan eksekutif, poin-poin konsep kunci, rumus matematika (dengan LaTeX valid \\( ... \\) dan \\[ ... \\]), serta susun study plan berdurasi ${days} hari.
Pastikan output sepenuhnya sesuai dengan JSON schema yang ditentukan.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        fileData: {
          fileUri,
          mimeType: "application/pdf",
        },
      },
      {
        text: promptText,
      },
    ],
    config: {
      systemInstruction: GEMINI_PDF_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: PDF_ANALYSIS_RESPONSE_SCHEMA,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
      // Note: temperature & top_p are omitted as they are deprecated in 3.6-flash
    },
  });

  const rawJsonText = response.text;
  if (!rawJsonText) {
    throw new Error("Gemini API returned an empty response.");
  }

  const cleanJson = rawJsonText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const unvalidated = JSON.parse(cleanJson);
  const validated = PdfAnalysisSchema.parse(unvalidated);

  return validated;
}

/* ------------------------------------------------------------------
   6. Generate Study Plan directly from Gemini File URI
------------------------------------------------------------------ */

export const STUDY_PLAN_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Descriptive title for the overall study plan in casual Indonesian.",
    },
    subject: {
      type: Type.STRING,
      description: "Subject or course name identified from the lecture material.",
    },
    durationDays: {
      type: Type.INTEGER,
      description: "Total number of study days allocated for this material.",
    },
    tasks: {
      type: Type.ARRAY,
      description: "Flat list of daily actionable study tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: "Day number starting from 1" },
          title: { type: Type.STRING, description: "Actionable study task title" },
        },
        required: ["day", "title"],
      },
    },
  },
  required: ["tasks"],
};

export async function generateStudyPlanFromPdfUri(
  fileUri: string,
  days: number = 7
): Promise<{
  title: string;
  subject: string;
  durationDays: number;
  tasks: Array<{ day: number; title: string }>;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = `
Analisis dokumen PDF terlampir secara lengkap dan buatkan structured study plan untuk target durasi ${days} hari.
Pastikan kamu membaca seluruh berkas PDF (termasuk rumus matematika, slide, dan grafik) secara lengkap dan mengekstrak konsep akademik utama secara spesifik.
NEVER output generic statements like 'berkas materi kamu berisikan data format biner'.
Output harus dalam Bahasa Indonesia yang santai, ramah, dan tidak kaku (selalu gunakan 'kamu').
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        fileData: {
          fileUri,
          mimeType: "application/pdf",
        },
      },
      {
        text: promptText,
      },
    ],
    config: {
      systemInstruction: GEMINI_PDF_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: STUDY_PLAN_RESPONSE_SCHEMA,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
    },
  });

  const rawJsonText = response.text;
  if (!rawJsonText) {
    throw new Error("Gemini API returned an empty response.");
  }

  const cleanJson = rawJsonText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleanJson);

  return {
    title: parsed.title || "Study Plan PDF",
    subject: parsed.subject || "Materi Pelajaran",
    durationDays: parsed.durationDays || days,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
  };
}

