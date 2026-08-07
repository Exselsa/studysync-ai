/**
 * POST /api/evaluate
 *
 * Feynman Boss Fight — AI evaluation endpoint.
 *
 * Request body  : { explanation: string, currentConcept?: string }
 * Response body : EvaluateResponse
 *
 * Evaluates the student's Feynman explanation via abang ganteng (@google/genai)
 * and returns structured JSON with damage dealt, boss feedback, counter damage taken,
 * correctness boolean, and next concept question.
 */

import type { NextRequest } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

/* ----------------------------------------------------------------
   Response shape — exported for client consumption
---------------------------------------------------------------- */
export interface EvaluateResponse {
  damageDealt: number;
  bossFeedback: string;
  playerDamageTaken: number;
  isCorrect: boolean;
  nextConceptQuestion: string;
}

/* ----------------------------------------------------------------
   Structured JSON schema — forces Gemini to return typed fields
---------------------------------------------------------------- */
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    damageDealt: {
      type: Type.NUMBER,
      description:
        "Integer damage to boss between 0 and 35. High (20–35) for accurate, simple, jargon-free ELI5 explanations. Low (1–10) for vague or jargon-heavy explanations. 0 for completely wrong.",
    },
    bossFeedback: {
      type: Type.STRING,
      description:
        "A short 1-2 sentence reaction from abang ganteng strictly in casual, friendly Indonesian ('santai dan tidak kaku', using 'kamu'). NEVER output in English.",
    },
    playerDamageTaken: {
      type: Type.NUMBER,
      description:
        "Counterattack damage taken by the player between 0 and 30. Low (0–5) if explanation is clear and accurate. High (15–30) if explanation is incorrect or confusing.",
    },
    isCorrect: {
      type: Type.BOOLEAN,
      description:
        "True if the concept was explained accurately in simple terms (ELI5 style). False if inaccurate or misleading.",
    },
    nextConceptQuestion: {
      type: Type.STRING,
      description:
        "A fresh CS/tech concept title for the next round (e.g. 'Persamaan Diferensial', 'Dynamic Programming', 'Binary Search', 'Database Indexing').",
    },
  },
  required: [
    "damageDealt",
    "bossFeedback",
    "playerDamageTaken",
    "isCorrect",
    "nextConceptQuestion",
  ],
};

const SYSTEM_INSTRUCTION = `You are abang ganteng, the smart and encouraging AI Referee & Boss Evaluator in a Feynman Technique battle game.
Your task is to evaluate the player's explanation of a complex topic as if teaching a 5-year-old child (simple analogies, zero unexplained jargon).

CRITICAL RESPONSE RULES:
1. Output ALL bossFeedback reactions strictly 100% in casual, friendly, and conversational Indonesian ("santai dan tidak kaku").
2. ALWAYS address the player as "kamu" and act as "abang ganteng" (encouraging, energetic, witty, friendly).
3. NEVER return any English sentences or phrases in bossFeedback. Ban all English feedback in battle logs.

EVALUATION CRITERIA:
- Accurate & simple (great ELI5 analogy): high damageDealt (20-35), low playerDamageTaken (0-5), isCorrect = true. Give high praise as abang ganteng (e.g. "Mantap banget! Penjelasan kamu simpel dan bikin konsep ini gampang dipaham!").
- Partially correct or contains heavy jargon: medium damageDealt (5-15), medium playerDamageTaken (10-18), isCorrect = false. Give constructive advice as abang ganteng (e.g. "Hmm, penjelasannya udah lumayan tapi masih agak kaku nih. Coba pakai analogi sehari-hari ya!").
- Wrong or gibberish: damageDealt = 0, high playerDamageTaken (20-30), isCorrect = false. Give encouraging push as abang ganteng (e.g. "Aduh, penjelasannya masih belum pas nih. Yuk coba pelajari lagi dasar konsepnya!").`;

const FALLBACK_QUESTIONS = [
  "Binary Search Trees",
  "Gradient Descent in Machine Learning",
  "HTTP REST APIs",
  "Recursion & Call Stack",
  "Neural Networks & Backpropagation",
  "Database Indexing & B-Trees",
  "Event Loop in JavaScript",
  "Docker Containers vs Virtual Machines",
  "Big O Time Complexity",
  "Garbage Collection & Memory Management",
];

function buildFallback(explanation: string, currentConcept: string): EvaluateResponse {
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const isGood = wordCount >= 8;
  const damageDealt = isGood ? Math.min(Math.floor(wordCount * 0.8) + 14, 34) : 6;
  const playerDamageTaken = isGood ? 3 : 16;
  const nextQ =
    FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];

  return {
    damageDealt,
    bossFeedback: isGood
      ? `Mantap! Penjelasan kamu tentang '${currentConcept}' gampang banget dipahami sama abang ganteng!`
      : `Penjelasan kamu untuk '${currentConcept}' masih agak bingung nih. Coba pakai analogi yang lebih sederhana ya!`,
    playerDamageTaken,
    isCorrect: isGood,
    nextConceptQuestion: nextQ,
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: { explanation?: unknown; currentConcept?: unknown };
  try {
    body = (await request.json()) as { explanation?: unknown; currentConcept?: unknown };
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  if (typeof body.explanation !== "string" || !body.explanation.trim()) {
    return Response.json(
      { error: "Request body must contain a non-empty `explanation` string." },
      { status: 400 }
    );
  }

  const explanation = body.explanation.trim();
  const currentConcept =
    typeof body.currentConcept === "string" && body.currentConcept.trim()
      ? body.currentConcept.trim()
      : "Data Structures & Algorithms";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[/api/evaluate] GEMINI_API_KEY is not set — using fallback evaluation."
    );
    return Response.json(buildFallback(explanation, currentConcept), { status: 200 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Current Concept to Explain: "${currentConcept}"

Student's Explanation:
"${explanation}"`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    let rawText = result.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    rawText = rawText
      .replace(/^```json\n?/g, "")
      .replace(/^```\n?/g, "")
      .replace(/```$/g, "")
      .trim();

    const parsed = JSON.parse(rawText) as Partial<EvaluateResponse>;

    const response: EvaluateResponse = {
      damageDealt: Math.min(
        Math.max(Math.round(parsed.damageDealt ?? 0), 0),
        35
      ),
      bossFeedback:
        typeof parsed.bossFeedback === "string" && parsed.bossFeedback.trim()
          ? parsed.bossFeedback.trim()
          : "Your explanation… disturbs my core.",
      playerDamageTaken: Math.min(
        Math.max(Math.round(parsed.playerDamageTaken ?? 10), 0),
        30
      ),
      isCorrect: Boolean(parsed.isCorrect),
      nextConceptQuestion:
        typeof parsed.nextConceptQuestion === "string" &&
        parsed.nextConceptQuestion.trim()
          ? parsed.nextConceptQuestion.trim()
          : FALLBACK_QUESTIONS[
              Math.floor(Math.random() * FALLBACK_QUESTIONS.length)
            ],
    };

    return Response.json(response, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/evaluate] Gemini evaluation failed:", errMsg);
    return Response.json(
      { ...buildFallback(explanation, currentConcept), _debug_error: errMsg },
      { status: 200 }
    );
  }
}
