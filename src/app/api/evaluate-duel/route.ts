/**
 * POST /api/evaluate-duel
 *
 * Feynman 1v1 Multiplayer Duel — AI Evaluation Endpoint.
 *
 * Request body  : { topic: string, playerAExplanation: string, playerBExplanation: string, playerAName?: string, playerBName?: string }
 * Response body : DuelEvaluateResponse
 *
 * Compares two players' Feynman explanations for the same topic using abang ganteng (@google/genai)
 * and returns damage dealt by both, referee commentary, and winner of round.
 */

import type { NextRequest } from "next/server";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

export interface DuelEvaluateResponse {
  playerADamageDealt: number;
  playerBDamageDealt: number;
  refereeCommentary: string;
  winnerOfRound: "playerA" | "playerB" | "draw";
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    playerADamageDealt: {
      type: Type.NUMBER,
      description:
        "Integer damage (0 to 35) dealt BY Player A TO Player B based on how clear, simple, and jargon-free Player A's explanation is.",
    },
    playerBDamageDealt: {
      type: Type.NUMBER,
      description:
        "Integer damage (0 to 35) dealt BY Player B TO Player A based on how clear, simple, and jargon-free Player B's explanation is.",
    },
    refereeCommentary: {
      type: Type.STRING,
      description:
        "A short 1-2 sentence referee commentary by abang ganteng comparing Player A vs Player B strictly in casual, friendly Indonesian using 'kamu'. NEVER output in English.",
    },
    winnerOfRound: {
      type: Type.STRING,
      description:
        "Must be 'playerA' if Player A's explanation was superior, 'playerB' if Player B's explanation was superior, or 'draw' if equal quality.",
    },
  },
  required: [
    "playerADamageDealt",
    "playerBDamageDealt",
    "refereeCommentary",
    "winnerOfRound",
  ],
};

const SYSTEM_INSTRUCTION = `You are abang ganteng, the Grand Arena Referee in a 1v1 Feynman Technique Duel between two students.
Two players are explaining the same technical topic to a 5-year-old child.

CRITICAL RESPONSE RULES:
1. Output ALL refereeCommentary strictly 100% in casual, friendly, and conversational Indonesian ("santai dan tidak kaku").
2. ALWAYS address the players as "kamu" and adopt the "abang ganteng" referee persona.
3. NEVER return any English sentences or phrases in refereeCommentary. Ban all English commentary in battle logs.

COMPARISON METHOD:
- Grade both explanations on simplicity (use of real-world analogies, zero unexplained jargon), accuracy, and clarity.
- Set playerADamageDealt (damage Player A deals to Player B, 0–35).
- Set playerBDamageDealt (damage Player B deals to Player A, 0–35).
- Declare winnerOfRound ('playerA', 'playerB', or 'draw').
- Provide refereeCommentary (1–2 punchy sentences as abang ganteng comparing both answers in casual Indonesian).`;

function buildFallback(
  topic: string,
  playerAExplanation: string,
  playerBExplanation: string,
  playerAName: string = "Player A",
  playerBName: string = "Player B"
): DuelEvaluateResponse {
  const lenA = playerAExplanation.trim().split(/\s+/).filter(Boolean).length;
  const lenB = playerBExplanation.trim().split(/\s+/).filter(Boolean).length;

  let winnerOfRound: "playerA" | "playerB" | "draw" = "draw";
  let playerADamageDealt = Math.min(Math.max(lenA * 2 + 8, 10), 30);
  let playerBDamageDealt = Math.min(Math.max(lenB * 2 + 8, 10), 30);

  if (lenA > lenB + 3) {
    winnerOfRound = "playerA";
    playerADamageDealt = Math.min(playerADamageDealt + 6, 35);
  } else if (lenB > lenA + 3) {
    winnerOfRound = "playerB";
    playerBDamageDealt = Math.min(playerBDamageDealt + 6, 35);
  }

  const commentary =
    winnerOfRound === "playerA"
      ? `Menurut abang ganteng, penjelasan Feynman ${playerAName} tentang '${topic}' lebih simpel dan jelas dibanding ${playerBName}!`
      : winnerOfRound === "playerB"
      ? `Menurut abang ganteng, penjelasan Feynman ${playerBName} tentang '${topic}' lebih gampang dipahami dibanding ${playerAName}!`
      : `Wah, ${playerAName} dan ${playerBName} sama-sama memberikan penjelasan yang super mantap buat konsep '${topic}'!`;

  return {
    playerADamageDealt,
    playerBDamageDealt,
    refereeCommentary: commentary,
    winnerOfRound,
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: {
    topic?: unknown;
    playerAExplanation?: unknown;
    playerBExplanation?: unknown;
    playerAName?: unknown;
    playerBName?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const topic =
    typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : "Computer Science";
  const playerAExplanation =
    typeof body.playerAExplanation === "string"
      ? body.playerAExplanation.trim()
      : "";
  const playerBExplanation =
    typeof body.playerBExplanation === "string"
      ? body.playerBExplanation.trim()
      : "";
  const playerAName =
    typeof body.playerAName === "string" && body.playerAName.trim()
      ? body.playerAName.trim()
      : "Player A";
  const playerBName =
    typeof body.playerBName === "string" && body.playerBName.trim()
      ? body.playerBName.trim()
      : "Player B";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[/api/evaluate-duel] GEMINI_API_KEY not set — using fallback evaluation."
    );
    return Response.json(
      buildFallback(
        topic,
        playerAExplanation,
        playerBExplanation,
        playerAName,
        playerBName
      ),
      { status: 200 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Topic to Explain: "${topic}"

[Player A: ${playerAName}] Explanation:
"${playerAExplanation || "(No explanation submitted)"}"

[Player B: ${playerBName}] Explanation:
"${playerBExplanation || "(No explanation submitted)"}"`;

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
    if (!rawText) throw new Error("Gemini returned empty response.");

    rawText = rawText
      .replace(/^```json\n?/g, "")
      .replace(/^```\n?/g, "")
      .replace(/```$/g, "")
      .trim();

    const parsed = JSON.parse(rawText) as Partial<DuelEvaluateResponse>;

    let winnerOfRound: "playerA" | "playerB" | "draw" = "draw";
    if (
      parsed.winnerOfRound === "playerA" ||
      parsed.winnerOfRound === "playerB" ||
      parsed.winnerOfRound === "draw"
    ) {
      winnerOfRound = parsed.winnerOfRound;
    }

    const response: DuelEvaluateResponse = {
      playerADamageDealt: Math.min(
        Math.max(Math.round(parsed.playerADamageDealt ?? 15), 0),
        35
      ),
      playerBDamageDealt: Math.min(
        Math.max(Math.round(parsed.playerBDamageDealt ?? 15), 0),
        35
      ),
      refereeCommentary:
        typeof parsed.refereeCommentary === "string" &&
        parsed.refereeCommentary.trim()
          ? parsed.refereeCommentary.trim()
          : "Both scholars clashed with great spirit in this round!",
      winnerOfRound,
    };

    return Response.json(response, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[/api/evaluate-duel] Gemini evaluation failed:", errMsg);
    return Response.json(
      {
        ...buildFallback(
          topic,
          playerAExplanation,
          playerBExplanation,
          playerAName,
          playerBName
        ),
        _debug_error: errMsg,
      },
      { status: 200 }
    );
  }
}
