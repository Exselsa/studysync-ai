/**
 * Utility for parsing text from uploaded study material files (PDF, TXT, DOCX).
 */

export interface ParsedFileResult {
  text: string;
  fileName: string;
  fileType: string;
  charCount: number;
}

/**
 * Extracts plain text from TXT, MD, PDF, or DOCX file buffers.
 */
export async function parseFileBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFileResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  let extractedText = "";

  if (ext === "txt" || ext === "md" || mimeType.includes("text/")) {
    extractedText = buffer.toString("utf-8");
  } else if (ext === "docx" || mimeType.includes("officedocument.wordprocessingml")) {
    extractedText = extractTextFromDocx(buffer);
  } else if (ext === "pdf" || mimeType.includes("pdf")) {
    extractedText = extractTextFromPdf(buffer);
  } else {
    // Default fallback attempt as UTF-8
    extractedText = buffer.toString("utf-8");
  }

  // Clean up whitespace & control chars
  const sanitizedText = sanitizeText(extractedText);

  return {
    text: sanitizedText,
    fileName,
    fileType: mimeType || ext,
    charCount: sanitizedText.length,
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

  // Fallback: extract clean printable ASCII/UTF-8 strings
  return extractPrintableStrings(buffer);
}

/**
 * Text extraction helper for PDF buffer.
 * Extracts text stream objects (BT...ET) and clean readable character sequences.
 */
function extractTextFromPdf(buffer: Buffer): string {
  const contentStr = buffer.toString("latin1");
  const textBlocks: string[] = [];

  // Match PDF text object blocks (BT ... ET)
  const btMatches = contentStr.match(/BT[\s\S]*?ET/g) || [];

  for (const block of btMatches) {
    // Extract literal text strings inside parentheses e.g. (Hello World) Tj or [(Hello) -10 (World)] TJ
    const strMatches = block.match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g) || [];
    for (const strMatch of strMatches) {
      const cleanStr = strMatch
        .slice(1, -1)
        .replace(/\\([()\\])/g, "$1")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .trim();
      if (cleanStr.length > 1) {
        textBlocks.push(cleanStr);
      }
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join(" ");
  }

  // Fallback: extract readable strings if stream compression obscured text tags
  return extractPrintableStrings(buffer);
}

/**
 * Fallback helper to extract contiguous printable string segments from a binary buffer.
 */
function extractPrintableStrings(buffer: Buffer): string {
  const rawStr = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000));
  // Keep printable words/sentences (ASCII & Latin characters)
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
