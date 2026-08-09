import { NextResponse, type NextRequest } from "next/server";
import { uploadPdfToGemini, generateStudyPlanFromPdfUri } from "@/lib/gemini-pdf";
import { normalizeStudyPlanData } from "@/lib/normalizeStudyPlan";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileUri = "";
    let days = 7;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const daysParam = formData.get("days") as string | null;
      const existingUri = formData.get("geminiFileUri") as string | null;

      if (daysParam && !isNaN(parseInt(daysParam, 10))) {
        days = Math.max(1, Math.min(30, parseInt(daysParam, 10)));
      }

      if (existingUri) {
        fileUri = existingUri;
      } else if (file) {
        if (file.size > 50 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Ukuran file PDF terlalu besar. Maksimal 50MB ya." },
            { status: 400 }
          );
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadRes = await uploadPdfToGemini(buffer, file.name || "materi.pdf");
        fileUri = uploadRes.fileUri;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.geminiFileUri && typeof body.geminiFileUri === "string") {
        fileUri = body.geminiFileUri;
      }
      if (body.days && typeof body.days === "number") {
        days = Math.max(1, Math.min(30, body.days));
      }
    }

    if (!fileUri) {
      return NextResponse.json(
        { error: "Diperlukan geminiFileUri atau file PDF untuk membuat study plan." },
        { status: 400 }
      );
    }

    // Generate study plan directly from native PDF understanding
    const rawPlan = await generateStudyPlanFromPdfUri(fileUri, days);
    const normalizedTasks = normalizeStudyPlanData(rawPlan.tasks);

    if (normalizedTasks.length === 0) {
      return NextResponse.json(
        { error: "Gagal mengekstrak tugas study plan dari dokumen PDF." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      geminiFileUri: fileUri,
      result: {
        title: rawPlan.title,
        subject: rawPlan.subject,
        durationDays: rawPlan.durationDays,
        tasks: normalizedTasks,
      },
    });
  } catch (err: unknown) {
    console.error("[/api/study-plan] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Gagal membuat study plan dari PDF.";
    return NextResponse.json(
      { error: `Gagal membuat study plan: ${errorMessage}` },
      { status: 500 }
    );
  }
}
