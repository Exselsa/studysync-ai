/**
 * Utility for parsing text from uploaded non-PDF study material files (TXT, MD, DOCX).
 * PDF processing is handled natively via @google/genai multimodal Files API.
 */

export interface ParsedFileResult {
  text: string;
  fileName: string;
  fileType: string;
  charCount: number;
  fileBase64?: string;
  isPdf?: boolean;
}

/**
 * Extracts plain text and base64 payloads from TXT, MD, PDF, or DOCX file buffers.
 */
export async function parseFileBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFileResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  let extractedText = "";
  let fileBase64: string | undefined = undefined;
  let isPdf = false;

  if (ext === "pdf" || mimeType.includes("pdf")) {
    isPdf = true;
    fileBase64 = buffer.toString("base64");
    extractedText = `[Dokumen PDF Slide Materi: ${fileName}]`;
  } else if (ext === "txt" || ext === "md" || mimeType.includes("text/")) {
    extractedText = buffer.toString("utf-8");
  } else if (ext === "docx" || mimeType.includes("officedocument.wordprocessingml")) {
    extractedText = extractTextFromDocx(buffer);
  } else {
    // Default fallback attempt as UTF-8
    extractedText = buffer.toString("utf-8");
  }

  // Clean up whitespace & control chars
  const sanitizedText = sanitizeText(extractedText);

  return {
    text: sanitizedText,
    fileName,
    fileType: mimeType || (isPdf ? "application/pdf" : ext),
    charCount: sanitizedText.length,
    fileBase64,
    isPdf,
  };
}

/**
 * Basic XML text extraction from DOCX buffer.
 * DOCX files are zip archives storing text in word/document.xml within <w:t> elements.
 */
function extractTextFromDocx(buffer: Buffer): string {
  const contentStr = buffer.toString("binary");
  const textMatches = contentStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];

  const textParts = textMatches
    .map((match) => match.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);

  if (textParts.length > 0) {
    return textParts.join(" ");
  }

  return extractPrintableStrings(buffer);
}

/**
 * Fallback helper to extract contiguous printable string segments from a binary buffer.
 */
function extractPrintableStrings(buffer: Buffer): string {
  const rawStr = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000));
  const matches = rawStr.match(/[A-Za-z0-9\s.,!?;:()'\"\-–—]{4,}/g) || [];
  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .join(" ");
}

/**
 * Cleans extracted text formatting and removes non-printable characters.
 */
function sanitizeText(raw: string): string {
  return raw
    .replace(/[\r\t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}
