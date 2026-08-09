/**
 * POST /api/study-materials/parse
 *
 * Accepts file upload (PDF, TXT, DOCX) via multipart/form-data
 * or JSON { fileBase64, fileName, mimeType }.
 *
 * Extracts text content from the file and returns:
 * { success: true, text: string, fileName: string, fileType: string, charCount: number }
 */

import { NextResponse, type NextRequest } from "next/server";
import { parseFileBuffer } from "@/lib/utils/file-parser";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer | null = null;
    let fileName = "study-material";
    let mimeType = "text/plain";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Tidak ada file yang diunggah. Mohon sertakan file ya." },
          { status: 400 }
        );
      }

      fileName = file.name || "study-material";
      mimeType = file.type || "application/octet-stream";
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      const { fileBase64, fileName: name, mimeType: type, text } = body;

      if (text && typeof text === "string") {
        return NextResponse.json({
          success: true,
          text: text.trim(),
          fileName: name || "study-material.txt",
          fileType: "text/plain",
          charCount: text.trim().length,
        });
      }

      if (!fileBase64 || typeof fileBase64 !== "string") {
        return NextResponse.json(
          { error: "Format data file tidak valid. Mohon sertakan fileBase64 atau text." },
          { status: 400 }
        );
      }

      fileName = name || "study-material";
      mimeType = type || "application/octet-stream";
      // Strip base64 prefix if present
      const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      return NextResponse.json(
        { error: "Content-Type tidak didukung. Gunakan multipart/form-data atau application/json." },
        { status: 400 }
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "File yang diunggah kosong." },
        { status: 400 }
      );
    }

    const parsed = await parseFileBuffer(buffer, fileName, mimeType);

    if (!parsed.text) {
      return NextResponse.json(
        { error: "Gagal mengekstrak teks dari file. Pastikan file tidak terenkripsi." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: parsed.text,
      fileName: parsed.fileName,
      fileType: parsed.fileType,
      charCount: parsed.charCount,
      fileBase64: parsed.fileBase64,
      isPdf: parsed.isPdf,
    });
  } catch (err: unknown) {
    console.error("[/api/study-materials/parse] Error:", err);
    return NextResponse.json(
      { error: "Gagal memproses file bahan ajar. Coba lagi ya." },
      { status: 500 }
    );
  }
}
