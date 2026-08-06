/**
 * POST /api/chat
 *
 * Real Gemini AI integration using @google/genai SDK.
 *
 * Request body  : { message: string }
 * Response body : { reply: string; studyPlan: StudyPlanPayload | null }
 *
 * Structured output is enforced via responseSchema so the model
 * always returns valid, parseable JSON — no regex hacks needed.
 */

import type { NextRequest } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

/* ----------------------------------------------------------------
   Shared types — exported so the client can import them
---------------------------------------------------------------- */
export interface StudyTaskPayload {
  id: string;
  title: string;
  /** description explains what to do for the task */
  description: string;
  completed: boolean;
  /** "pending" | "in_progress" | "done" */
  status: string;
  dueDate?: string;
}

export interface StudyPlanPayload {
  title: string;
  subject: string;
  tasks: StudyTaskPayload[];
  progress: number;
}

interface ChatResponse {
  reply: string;
  studyPlan: StudyPlanPayload | null;
}

/* ----------------------------------------------------------------
   Gemini JSON response schema
   Forces the model to return exactly { reply, studyPlan } with
   every field fully typed — no hallucinated keys, no missing ones.
---------------------------------------------------------------- */
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        "A warm, encouraging conversational response explaining the plan to the student. Use markdown for headers and emphasis.",
    },
    studyPlan: {
      type: Type.OBJECT,
      description: "The structured study plan to save to the student's board.",
      properties: {
        title: {
          type: Type.STRING,
          description: "A concise, motivating title for the study plan.",
        },
        subject: {
          type: Type.STRING,
          description: "The academic subject or topic (e.g. 'Calculus', 'Machine Learning').",
        },
        tasks: {
          type: Type.ARRAY,
          description: "An ordered list of 3–6 actionable study tasks.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: {
                type: Type.STRING,
                description: "A unique UUID v4 string for this task.",
              },
              title: {
                type: Type.STRING,
                description: "A short task title (max 80 characters).",
              },
              description: {
                type: Type.STRING,
                description: "A one-sentence explanation of what the student should do.",
              },
              status: {
                type: Type.STRING,
                description: "Always set to exactly 'pending'.",
              },
            },
            required: ["id", "title", "description", "status"],
          },
        },
        progress: {
          type: Type.NUMBER,
          description: "Initial progress percentage — always 0 for a new plan.",
        },
      },
      required: ["title", "subject", "tasks", "progress"],
    },
  },
  required: ["reply", "studyPlan"],
};

/* ----------------------------------------------------------------
   System instruction — defines the AI tutor persona
---------------------------------------------------------------- */
const SYSTEM_INSTRUCTION = `You are an expert academic tutor named StudySync AI. Your role is to:
1. Understand what the student needs to study or prepare for.
2. Respond with encouragement and a clear, personalised study plan.
3. Generate 3–6 highly specific, actionable tasks with realistic descriptions.
4. Assign unique random UUID v4 strings for each task's 'id' field.
5. Keep the 'status' field of every task set to exactly "pending".
6. Keep the initial 'progress' value at 0.
7. Match the 'subject' field to the main academic discipline.
8. Use markdown (##, **, >) in the 'reply' field for visual structure.
9. ALWAYS generate a studyPlan — even for vague requests.`;

/* ----------------------------------------------------------------
   Fallback response — used when Gemini fails or key is missing
---------------------------------------------------------------- */
function buildFallbackResponse(message: string): ChatResponse {
  const lc = message.toLowerCase();
  const isCalc = lc.includes("calculus") || lc.includes("calc");
  const isML = lc.includes("machine learning") || lc.includes("ml");

  const subject = isCalc ? "Calculus" : isML ? "Machine Learning" : "General";
  const title = isCalc
    ? "Calculus Exam Prep — 5-Day Sprint"
    : isML
    ? "Machine Learning Mastery Plan"
    : "7-Day Adaptive Study Plan";

  return {
    reply: `## 📚 ${title}\n\nHere's your personalised study plan, saved to your board. Let's get started!\n\n> 💡 Tip: Click each task to mark it complete as you progress.`,
    studyPlan: {
      title,
      subject,
      progress: 0,
      tasks: [
        { id: crypto.randomUUID(), title: "Phase 1 — Foundation Review", description: "Identify key concepts and review prerequisites.", status: "pending", completed: false, dueDate: offsetDate(1) },
        { id: crypto.randomUUID(), title: "Phase 2 — Core Learning", description: "Study the main material using active note-taking and the Feynman technique.", status: "pending", completed: false, dueDate: offsetDate(3) },
        { id: crypto.randomUUID(), title: "Phase 3 — Practice Problems", description: "Solve 20 practice problems under timed conditions to build exam readiness.", status: "pending", completed: false, dueDate: offsetDate(5) },
        { id: crypto.randomUUID(), title: "Phase 4 — Mock Exam", description: "Complete a full timed mock exam and review all incorrect answers thoroughly.", status: "pending", completed: false, dueDate: offsetDate(7) },
      ],
    },
  };
}

/* Utility — ISO date string N days from today */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/* ----------------------------------------------------------------
   Route Handler
---------------------------------------------------------------- */
export async function POST(request: NextRequest): Promise<Response> {
  /* ── 1. Validate request ── */
  let body: { message?: unknown };
  try {
    body = (await request.json()) as { message?: unknown };
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return Response.json(
      { error: "Request body must contain a non-empty `message` string." },
      { status: 400 }
    );
  }

  const userMessage = body.message.trim();

  /* ── 2. Verify API key ── */
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[/api/chat] GEMINI_API_KEY is not set — using fallback response.");
    return Response.json(buildFallbackResponse(userMessage), { status: 200 });
  }

  /* ── 3. Call Gemini ── */
  try {
    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    /* ── 4. Extract & sanitise raw text ── */
    let rawText = result.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    // Strip markdown code fences the model might hallucinate despite
    // responseMimeType: "application/json" being set.
    rawText = rawText
      .replace(/^```json\n?/g, "")
      .replace(/^```\n?/g, "")
      .replace(/```$/g, "")
      .trim();

    /* ── 5. Parse JSON — isolated try/catch for visibility ── */
    let parsed: {
      reply: string;
      studyPlan: {
        title: string;
        subject: string;
        tasks: Array<{
          id: string;
          title: string;
          description: string;
          status: string;
        }>;
        progress: number;
      };
    };

    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("[/api/chat] JSON.parse failed. Raw model output:");
      console.error(rawText);
      throw new Error(
        `JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
      );
    }

    /* ── 6. Normalise tasks to match StudyTaskPayload ── */
    const today = new Date();
    const studyPlan: StudyPlanPayload = {
      title: parsed.studyPlan.title,
      subject: parsed.studyPlan.subject,
      progress: parsed.studyPlan.progress ?? 0,
      tasks: parsed.studyPlan.tasks.map((t, idx) => ({
        id: t.id || crypto.randomUUID(),
        title: t.title,
        description: t.description,
        status: t.status ?? "pending",
        completed: false,
        dueDate: (() => {
          const d = new Date(today);
          d.setDate(d.getDate() + (idx + 1) * 2);
          return d.toISOString().split("T")[0];
        })(),
      })),
    };

    const chatResponse: ChatResponse = {
      reply: parsed.reply,
      studyPlan,
    };

    return Response.json(chatResponse, { status: 200 });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/chat] Gemini generation failed:", errMsg);
    // Graceful degradation — return a fallback so the UI never breaks
    return Response.json(
      { ...buildFallbackResponse(userMessage), _debug_error: errMsg },
      { status: 200 }
    );
  }
}
