/**
 * POST /api/study-materials/generate-plan
 *
 * Generates a structured multi-day Study Plan from uploaded material or text using Gemini API.
 *
 * Request body:
 * - JSON: { text: string, days?: number, targetDeadline?: string }
 * - OR multipart/form-data with `file` and optional `days` field.
 *
 * All AI output is returned in casual, friendly Indonesian ("santai dan tidak kaku", using "kamu").
 */

import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseFileBuffer } from "@/lib/utils/file-parser";
import {
  GENERATE_PLAN_SCHEMA,
  GENERATE_PLAN_SYSTEM_INSTRUCTION,
  buildFallbackStudyPlan,
  type GeneratedStudyPlanResponse,
} from "@/lib/ai/study-materials";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let materialText = "";
    let days = 3;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const daysInput = formData.get("days") as string | null;

      if (daysInput && !isNaN(parseInt(daysInput, 10))) {
        days = Math.max(1, Math.min(30, parseInt(daysInput, 10)));
      }

      if (file) {
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
      if (body.days && typeof body.days === "number") {
        days = Math.max(1, Math.min(30, body.days));
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
      console.warn("[/api/study-materials/generate-plan] GEMINI_API_KEY missing — returning fallback plan.");
      const fallback = buildFallbackStudyPlan(materialText, days);
      return NextResponse.json({ success: true, result: fallback });
    }

    /* ── Call Gemini API ── */
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Berikut adalah teks materi pelajaran/kuliah dari siswa:

---
${materialText.slice(0, 30000)}
---

Buatkan structured study plan untuk target durasi: ${days} hari.
Pastikan output memenuhi schema JSON dan seluruh teks ditulis dalam Bahasa Indonesia yang santai, ramah, dan tidak kaku (gunakan 'kamu').
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: GENERATE_PLAN_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: GENERATE_PLAN_SCHEMA,
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

      const parsedResult = JSON.parse(cleanJson) as GeneratedStudyPlanResponse;

      return NextResponse.json({
        success: true,
        result: parsedResult,
      });
    } catch (aiErr) {
      console.error("[/api/study-materials/generate-plan] Gemini API Error:", aiErr);
      const fallback = buildFallbackStudyPlan(materialText, days);
      return NextResponse.json({ success: true, result: fallback });
    }
  } catch (err: unknown) {
    console.error("[/api/study-materials/generate-plan] Error:", err);
    return NextResponse.json(
      { error: "Gagal membuat study plan. Coba lagi ya." },
      { status: 500 }
    );
  }
}
