/**
 * POST /api/meet/explain
 *
 * Collaborative Study Meet — AI Explanation Endpoint by "abang ganteng".
 *
 * Request body  : { topic?: string; question: string }
 * Response body : { explanation: string; topic: string }
 *
 * Generates rich, structured markdown study explanations strictly under the
 * "abang ganteng" persona (casual Indonesian, friendly, clear analogies).
 */

import type { NextRequest } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

export interface MeetExplainResponse {
  explanation: string;
  topic: string;
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: {
      type: Type.STRING,
      description:
        "A clear, rich, and engaging explanation formatted in markdown (headers, bullet points, analogies). Output strictly 100% in casual, friendly Indonesian using 'kamu' and referring to self as 'abang ganteng'. NEVER output vendor AI names.",
    },
    topic: {
      type: Type.STRING,
      description: "The core concept title being explained.",
    },
  },
  required: ["explanation", "topic"],
};

const SYSTEM_INSTRUCTION = `You are "abang ganteng", the ultra-smart, encouraging, and friendly AI Study Companion in a live collaborative Study Meet session.
Your task is to provide clear, engaging, and comprehensive explanations to a group of students studying together in a shared room.

CRITICAL RULES:
1. Output ALL responses strictly 100% in casual, friendly, and conversational Indonesian ("santai dan tidak kaku").
2. ALWAYS address the students as "kamu" and refer to yourself as "abang ganteng".
3. NEVER use the terms "Gemini", "Gemini AI", or "Gemini 3.6 Flash" in any part of your output.
4. Format your explanation in beautiful markdown with section headers (##, ###), bullet points, bold key terms, and simple real-world analogies.`;

function buildFallbackExplanation(topic: string, question: string): MeetExplainResponse {
  const displayTopic = topic || question || "Materi Pembelajaran";
  return {
    topic: displayTopic,
    explanation: `## 💡 Penjelasan Abang Ganteng: "${displayTopic}"\n\nHalo teman-teman Study Meet! Abang ganteng bantu jelaskan konsep **${displayTopic}** secara simpel dan jelas ya!\n\n### 🔑 Poin Utama:\n- **Konsep Dasar**: ${question || "Konsep ini penting untuk dipahami secara menyeluruh bersama teman-teman room kamu."}\n- **Analogi Sederhana**: Bayangkan seperti menyusun balok lego, setiap bagian saling terhubung untuk membentuk struktur yang kuat.\n- **Aplikasi**: Selalu gunakan latihan soal bersama room Study Meet untuk memperdalam pemahaman!\n\n> 🎯 **Tips Belajar**: Cobalah jelaskan kembali poin di atas ke teman kamu di room untuk menguji tingkat ingatan kamu!`,
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: { topic?: unknown; question?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const question =
    typeof body.question === "string" && body.question.trim()
      ? body.question.trim()
      : typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : "Materi Pembelajaran";

  const topic =
    typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : question;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[/api/meet/explain] GEMINI_API_KEY not set — using fallback explanation."
    );
    return Response.json(buildFallbackExplanation(topic, question), {
      status: 200,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Topic/Question to Explain: "${question}" (Subject Topic: "${topic}")`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    let rawText = result.text;
    if (!rawText) throw new Error("Gemini returned empty response.");

    rawText = rawText
      .replace(/^```json\n?/g, "")
      .replace(/^```\n?/g, "")
      .replace(/```$/g, "")
      .trim();

    const parsed = JSON.parse(rawText) as Partial<MeetExplainResponse>;

    const response: MeetExplainResponse = {
      explanation:
        typeof parsed.explanation === "string" && parsed.explanation.trim()
          ? parsed.explanation.trim()
          : buildFallbackExplanation(topic, question).explanation,
      topic:
        typeof parsed.topic === "string" && parsed.topic.trim()
          ? parsed.topic.trim()
          : topic,
    };

    return Response.json(response, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/meet/explain] Gemini explanation failed:", errMsg);
    return Response.json(
      { ...buildFallbackExplanation(topic, question), _debug_error: errMsg },
      { status: 200 }
    );
  }
}
