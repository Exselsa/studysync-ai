/**
 * POST /api/study-materials/explain
 *
 * Generates a simplified, easy-to-understand breakdown of lecture material
 * using the Gemini API.
 *
 * Request body:
 * - JSON: { text: string, title?: string }
 * - OR multipart/form-data with `file` and optional `title` field.
 *
 * Returns:
 * {
 *   success: true,
 *   result: {
 *     title: string,
 *     keySummary: string,
 *     importantConcepts: Array<{ concept, simpleExplanation, example }>,
 *     simplifiedBreakdown: string,
 *     reviewQuestions: Array<{ question, answer, hint }>
 *   }
 * }
 *
 * All AI output is returned in casual, friendly Indonesian ("santai dan tidak kaku", using "kamu").
 */

import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseFileBuffer } from "@/lib/utils/file-parser";
import {
  EXPLAIN_MATERIAL_SCHEMA,
  EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION,
  buildFallbackExplanation,
  type MaterialExplanationResponse,
} from "@/lib/ai/study-materials";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let materialText = "";
    let materialTitle = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const titleInput = formData.get("title") as string | null;

      if (titleInput) materialTitle = titleInput.trim();

      if (file) {
        if (!materialTitle) materialTitle = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await parseFileBuffer(
          Buffer.from(arrayBuffer),
          file.name || "study-material",
          file.type || ""
        );
        materialText = parsed.text;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.text && typeof body.text === "string") {
        materialText = body.text.trim();
      }
      if (body.title && typeof body.title === "string") {
        materialTitle = body.title.trim();
      }
    }

    if (!materialText || materialText.trim().length === 0) {
      return NextResponse.json(
        { error: "Teks materi pelajaran tidak boleh kosong. Sertakan teks atau file ya." },
        { status: 400 }
      );
    }

    /* ── Verify Gemini API Key ── */
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[/api/study-materials/explain] GEMINI_API_KEY missing — returning fallback explanation.");
      const fallback = buildFallbackExplanation(materialText, materialTitle);
      return NextResponse.json({ success: true, result: fallback });
    }

    /* ── Call Gemini API ── */
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Berikut adalah teks materi pelajaran/kuliah dari siswa:

Judul Materi (opsional): ${materialTitle || "Materi Pembelajaran"}
---
${materialText.slice(0, 30000)}
---

Jelaskan materi ini secara sederhana (Feynman style).
Sertakan:
1. Ringkasan Kunci (2-3 kalimat)
2. 3-5 Konsep Penting dengan analogi sehari-hari dan contoh nyata
3. Penjelasan Lengkap yang Disederhanakan (format Markdown)
4. 3-5 Pertanyaan Review Singkat beserta jawaban dan petunjuk (hint)

Gunakan Bahasa Indonesia yang santai, ramah, dan tidak kaku (selalu pakai 'kamu').
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: EXPLAIN_MATERIAL_SCHEMA,
          temperature: 0.6,
          maxOutputTokens: 8192,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Gemini returned an empty response.");
      }

      const cleanJson = rawText
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");

      const parsedResult = JSON.parse(cleanJson) as MaterialExplanationResponse;

      return NextResponse.json({
        success: true,
        result: parsedResult,
      });
    } catch (aiErr) {
      console.error("[/api/study-materials/explain] Gemini API Error:", aiErr);
      const fallback = buildFallbackExplanation(materialText, materialTitle);
      return NextResponse.json({ success: true, result: fallback });
    }
  } catch (err: unknown) {
    console.error("[/api/study-materials/explain] Error:", err);
    return NextResponse.json(
      { error: "Gagal me-breakdown materi pelajaran. Coba lagi ya." },
      { status: 500 }
    );
  }
}
