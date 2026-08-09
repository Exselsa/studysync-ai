import { NextResponse, type NextRequest } from "next/server";
import { uploadPdfToGemini, analyzePdfDocument } from "@/lib/gemini-pdf";

export const maxDuration = 60; // Allow longer execution for multi-page PDF processing

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data with a PDF file." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const daysParam = formData.get("days") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file PDF yang diunggah. Mohon unggah file PDF ya." },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || "";
    const fileName = file.name || "document.pdf";
    const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "Format file harus berupa PDF (application/pdf)." },
        { status: 400 }
      );
    }

    // Validate File Size (Max 50MB)
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file PDF terlalu besar. Maksimal 50MB ya." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Gemini Files API
    const { fileUri } = await uploadPdfToGemini(buffer, fileName);

    // 2. Perform Multimodal PDF Analysis
    const days = daysParam && !isNaN(parseInt(daysParam, 10)) ? parseInt(daysParam, 10) : 7;
    const analysis = await analyzePdfDocument(fileUri, days);

    // 3. Handle Extraction Failures (422 Unprocessable Entity)
    if (analysis.extractionStatus === "failed") {
      return NextResponse.json(
        {
          error: "Gagal mengekstrak materi dari PDF.",
          extractionStatus: analysis.extractionStatus,
          confidenceNote: analysis.confidenceNote || "Dokumen PDF tidak dapat dibaca atau rusak.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      geminiFileUri: fileUri,
      fileName,
      result: analysis,
    });
  } catch (err: unknown) {
    console.error("[/api/documents/analyze] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Gagal memproses dokumen PDF.";
    return NextResponse.json(
      { error: `Terjadi kesalahan saat menganalisis PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}
