import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI, MediaResolution } from "@google/genai";
import { parseFileBuffer } from "@/lib/utils/file-parser";
import { normalizeStudyPlanData } from "@/lib/normalizeStudyPlan";
import { uploadPdfToGemini, generateStudyPlanFromPdfUri } from "@/lib/gemini-pdf";
import {
  GENERATE_PLAN_SCHEMA,
  GENERATE_PLAN_SYSTEM_INSTRUCTION,
} from "@/lib/ai/study-materials";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let materialText = "";
    let fileBase64: string | undefined = undefined;
    let geminiFileUri: string | undefined = undefined;
    let mimeType = "text/plain";
    let isPdf = false;
    let days = 7;
    let pdfBuffer: Buffer | null = null;
    let pdfFileName = "materi.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const daysInput = formData.get("days") as string | null;
      const existingUri = formData.get("geminiFileUri") as string | null;

      if (existingUri) geminiFileUri = existingUri;

      if (daysInput && !isNaN(parseInt(daysInput, 10))) {
        days = Math.max(1, Math.min(30, parseInt(daysInput, 10)));
      }

      if (file) {
        pdfFileName = file.name || "materi.pdf";
        const arrayBuffer = await file.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        isPdf = ext === "pdf" || Boolean(file.type && file.type.includes("pdf"));

        if (!isPdf) {
          const parsed = await parseFileBuffer(pdfBuffer, pdfFileName, file.type || "");
          materialText = parsed.text;
        }
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.geminiFileUri && typeof body.geminiFileUri === "string") {
        geminiFileUri = body.geminiFileUri;
      }
      if (body.text && typeof body.text === "string") {
        materialText = body.text.trim();
      }
      if (body.fileBase64 && typeof body.fileBase64 === "string") {
        fileBase64 = body.fileBase64;
      }
      if (body.mimeType && typeof body.mimeType === "string") {
        mimeType = body.mimeType;
      }
      if (body.isPdf || (mimeType && mimeType.includes("pdf"))) {
        isPdf = true;
      }
      if (body.days && typeof body.days === "number") {
        days = Math.max(1, Math.min(30, body.days));
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di environment." },
        { status: 500 }
      );
    }

    // 1. If PDF is available, use native multimodal PDF study plan generation
    if (geminiFileUri || isPdf || pdfBuffer || (fileBase64 && mimeType.includes("pdf"))) {
      if (!geminiFileUri) {
        let bufferToUpload = pdfBuffer;
        if (!bufferToUpload && fileBase64) {
          const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
          bufferToUpload = Buffer.from(cleanBase64, "base64");
        }

        if (!bufferToUpload || bufferToUpload.length === 0) {
          return NextResponse.json(
            { error: "File PDF tidak ditemukan atau kosong." },
            { status: 400 }
          );
        }

        const uploaded = await uploadPdfToGemini(bufferToUpload, pdfFileName);
        geminiFileUri = uploaded.fileUri;
      }

      const planResult = await generateStudyPlanFromPdfUri(geminiFileUri, days);
      const normalizedTasks = normalizeStudyPlanData(planResult.tasks);

      return NextResponse.json({
        success: true,
        geminiFileUri,
        result: {
          title: planResult.title,
          subject: planResult.subject,
          durationDays: planResult.durationDays,
          tasks: normalizedTasks,
        },
      });
    }

    // 2. Text-only fallback generation
    if (!materialText) {
      return NextResponse.json(
        { error: "Teks materi pelajaran tidak boleh kosong. Sertakan teks atau file PDF ya." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const promptText = `
Berikut adalah berkas materi pelajaran/kuliah dari siswa:

Teks Materi:
---
${materialText.slice(0, 40000)}
---

Buatkan structured study plan untuk target durasi: ${days} hari.
Pastikan output memenuhi schema JSON dan seluruh teks ditulis dalam Bahasa Indonesia yang santai, ramah, dan tidak kaku (selalu gunakan 'kamu').
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [promptText],
      config: {
        systemInstruction: GENERATE_PLAN_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: GENERATE_PLAN_SCHEMA,
        // temperature & top_p omitted (deprecated in 3.6-flash)
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI returned an empty response.");
    }

    const cleanJson = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const parsedResult = JSON.parse(cleanJson);
    const normalizedTasks = normalizeStudyPlanData(parsedResult);

    return NextResponse.json({
      success: true,
      result: {
        title: parsedResult.title || `Study Plan: ${materialText.slice(0, 30)}`,
        subject: parsedResult.subject || "Materi Kuliah",
        durationDays: parsedResult.durationDays || days,
        tasks: normalizedTasks,
      },
    });
  } catch (err: unknown) {
    console.error("[/api/study-materials/generate-plan] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Gagal membuat study plan.";
    return NextResponse.json(
      { error: `Gagal membuat study plan: ${errorMessage}` },
      { status: 500 }
    );
  }
}
