import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI, MediaResolution } from "@google/genai";
import { parseFileBuffer } from "@/lib/utils/file-parser";
import { uploadPdfToGemini } from "@/lib/gemini-pdf";
import {
  EXPLAIN_MATERIAL_SCHEMA,
  EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION,
  type MaterialExplanationResponse,
} from "@/lib/ai/study-materials";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let materialText = "";
    let materialTitle = "";
    let fileBase64: string | undefined = undefined;
    let geminiFileUri: string | undefined = undefined;
    let mimeType = "text/plain";
    let isPdf = false;
    let pdfBuffer: Buffer | null = null;
    let pdfFileName = "materi.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const titleInput = formData.get("title") as string | null;
      const existingUri = formData.get("geminiFileUri") as string | null;

      if (existingUri) geminiFileUri = existingUri;
      if (titleInput) materialTitle = titleInput.trim();

      if (file) {
        if (!materialTitle) materialTitle = file.name;
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
      if (body.title && typeof body.title === "string") {
        materialTitle = body.title.trim();
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
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di environment." },
        { status: 500 }
      );
    }

    // Prepare content parts for Gemini
    const contentsParts: any[] = [];
    const ai = new GoogleGenAI({ apiKey });

    // Handle PDF upload if not already uploaded
    if ((isPdf || pdfBuffer || (fileBase64 && mimeType.includes("pdf"))) && !geminiFileUri) {
      let bufferToUpload = pdfBuffer;
      if (!bufferToUpload && fileBase64) {
        const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
        bufferToUpload = Buffer.from(cleanBase64, "base64");
      }

      if (bufferToUpload && bufferToUpload.length > 0) {
        const uploaded = await uploadPdfToGemini(bufferToUpload, pdfFileName);
        geminiFileUri = uploaded.fileUri;
      }
    }

    if (geminiFileUri) {
      contentsParts.push({
        fileData: {
          fileUri: geminiFileUri,
          mimeType: "application/pdf",
        },
      });
    }

    const promptText = `
Berikut adalah berkas materi pelajaran/kuliah dari siswa:

Judul Materi (opsional): ${materialTitle || "Materi Pembelajaran"}
---
${materialText ? materialText.slice(0, 40000) : "Dokumen PDF terlampir"}
---

Buatkan rangkuman dan penjelasan materi ini secara mendalam, lengkap, dan terstruktur (Feynman style).
Pastikan kamu membaca seluruh berkas PDF (termasuk rumus matematika, Persamaan Diferensial, slide, dan grafik) secara lengkap dan mengekstrak konsep akademik utama secara spesifik.
NEVER output generic statements like 'berkas materi kamu berisikan data format biner'.

Sertakan secara lengkap dan mendalam:
1. Ringkasan Utama: Penjelasan menyeluruh mengenai tema & latar belakang materi.
2. Poin-Poin Kunci: 4-6 konsep utama dengan penjelasan ELI5 dan analogi real-world (hanya jika ada di materi).
3. Konsep Rumit yang Disederhanakan: Penjelasan mendalam step-by-step dalam format Markdown terstruktur dengan rumus LaTeX valid.
4. Pertanyaan Latihan: 4-6 pertanyaan review mendalam beserta jawaban dan petunjuk (hint).

Gunakan Bahasa Indonesia yang santai, ramah, dan tidak kaku (selalu pakai 'kamu').
`;

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contentsParts,
      config: {
        systemInstruction: EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: EXPLAIN_MATERIAL_SCHEMA,
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
        // temperature & top_p omitted (deprecated in 3.6-flash)
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
      geminiFileUri,
      result: parsedResult,
    });
  } catch (err: unknown) {
    console.error("[/api/study-materials/explain] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Gagal me-breakdown materi.";
    return NextResponse.json(
      { error: `Gagal me-breakdown materi: ${errorMessage}` },
      { status: 500 }
    );
  }
}
