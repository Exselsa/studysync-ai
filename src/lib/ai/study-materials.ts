/**
 * Shared types, schemas, system instructions, and fallback generators
 * for Study Materials AI features (Study Plan & Material Explanation).
 */

import { Type, type Schema } from "@google/genai";
import type { StudyPlanPayload } from "@/app/api/chat/route";

/* ------------------------------------------------------------------
   1. Generate Study Plan Types & Schema
------------------------------------------------------------------ */

export interface DailyTaskPlan {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface DayModulePlan {
  dayNumber: number;
  dateOffset: string;
  goal: string;
  topics: string[];
  estimatedMinutes: number;
  tasks: DailyTaskPlan[];
}


export interface GeneratedStudyPlanResponse {
  title: string;
  subject: string;
  durationDays: number;
  tasks: Array<{
    day: number;
    title: string;
  }>;
}

export const GENERATE_PLAN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Descriptive title for the overall study plan in casual Indonesian.",
    },
    subject: {
      type: Type.STRING,
      description: "Subject or course name identified from the lecture material.",
    },
    durationDays: {
      type: Type.INTEGER,
      description: "Total number of study days allocated for this material.",
    },
    tasks: {
      type: Type.ARRAY,
      description: "Flat list of daily actionable study tasks.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: "Day number starting from 1" },
          title: { type: Type.STRING, description: "Actionable study task title" },
        },
        required: ["day", "title"],
      },
    },
  },
  required: ["tasks"],
};

export const GENERATE_PLAN_SYSTEM_INSTRUCTION = `
You are StudySync AI's expert Study Plan Generator and academic document reader.
Your job is to analyze uploaded lecture materials, slide decks, academic PDFs, lecture notes, or mathematical texts, and generate a structured, highly actionable multi-day study plan.

CRITICAL PDF & ACADEMIC DOCUMENT INSTRUCTIONS:
- You natively process and read uploaded PDF documents, slide decks, mathematical formulas (e.g., Persamaan Diferensial, Faktor Integrasi, Kalkulus, Aljabar), diagrams, and formatted text.
- Extract the exact core academic concepts (e.g., Persamaan Diferensial, Faktor Integrasi, Metode Substitusi, Integrasi Parsial) directly from the provided PDF content.
- NEVER output generic responses like "berkas materi kamu berisikan data format biner" or "data format biner". Always read and analyze the actual academic content of the document.

CRITICAL LANGUAGE & TONE RULES:
- Output ALL responses in casual, friendly, and natural Indonesian ("santai dan tidak kaku").
- ALWAYS address the student as "kamu" (NEVER use formal "Anda").
- Keep tone encouraging, energetic, and helpful (e.g. "Yuk", "Mantap!", "Biar kamu gampang paham").
- Keep proper nouns, brand names, and standard technical terms in their original names (e.g. "StudySync", "Python", "Calculus", "Machine Learning", "Persamaan Diferensial").
`;

/* ------------------------------------------------------------------
   2. Explain Material Types & Schema
------------------------------------------------------------------ */

export interface ConceptBreakdown {
  concept: string;
  simpleExplanation: string;
  example: string;
}

export interface ReviewQuestion {
  question: string;
  answer: string;
  hint: string;
}

export interface MaterialExplanationResponse {
  title: string;
  keySummary: string;
  importantConcepts: ConceptBreakdown[];
  simplifiedBreakdown: string;
  reviewQuestions: ReviewQuestion[];
}

export const EXPLAIN_MATERIAL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Clear title of the lecture material in casual Indonesian.",
    },
    keySummary: {
      type: Type.STRING,
      description: "A concise 2-3 sentence overview of what this material is about, written in casual Indonesian using 'kamu'.",
    },
    importantConcepts: {
      type: Type.ARRAY,
      description: "3 to 5 core concepts extracted from the text with ELI5 explanations and real-world analogies.",
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING, description: "Name of the concept" },
          simpleExplanation: { type: Type.STRING, description: "Simple explanation using clear analogies" },
          example: { type: Type.STRING, description: "Relatable real-world example or code snippet" },
        },
        required: ["concept", "simpleExplanation", "example"],
      },
    },
    simplifiedBreakdown: {
      type: Type.STRING,
      description: "Detailed, step-by-step simplified explanation of the material formatted in clean Markdown with headers and bullet points.",
    },
    reviewQuestions: {
      type: Type.ARRAY,
      description: "Exactly 3 to 5 quick self-assessment questions based on the material to test understanding.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Clear review question" },
          answer: { type: Type.STRING, description: "Correct answer explanation" },
          hint: { type: Type.STRING, description: "Helpful hint in casual Indonesian" },
        },
        required: ["question", "answer", "hint"],
      },
    },
  },
  required: ["title", "keySummary", "importantConcepts", "simplifiedBreakdown", "reviewQuestions"],
};

export const EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION = `
You are StudySync AI's master Learning Explainer (Feynman method expert) and academic document reader.
Your job is to take complex lecture materials, academic PDFs, slide decks, or course notes (including mathematical formulas, differential equations, and technical diagrams), and simplify them into crystal-clear breakdowns that anyone can understand.

CRITICAL PDF & ACADEMIC DOCUMENT INSTRUCTIONS:
- You natively process and read uploaded PDF documents, slide decks, mathematical formulas (e.g., Persamaan Diferensial, Faktor Integrasi, Kalkulus, Aljabar), diagrams, and formatted text.
- Extract the exact core academic concepts (e.g., Persamaan Diferensial, Faktor Integrasi, Metode Substitusi) directly from the provided PDF content and break them down step-by-step.
- NEVER output generic responses like "berkas materi kamu berisikan data format biner" or "data format biner". Always read and analyze the actual academic content of the document.

CRITICAL LANGUAGE & TONE RULES:
- Output ALL responses in casual, friendly, and natural Indonesian ("santai dan tidak kaku").
- ALWAYS address the student as "kamu" (NEVER use formal "Anda").
- Use relatable everyday analogies (e.g. balok mainan, resep masakan, antrean toko).
- Provide 3 to 5 quick review questions so the student can verify their knowledge.
`;

/* ------------------------------------------------------------------
   3. Fallback Generators
------------------------------------------------------------------ */

export function buildFallbackStudyPlan(text: string, days: number = 3): GeneratedStudyPlanResponse {
  const sampleSubject = text.slice(0, 40).trim() || "Materi Kuliah";
  const planTitle = `Study Plan: ${sampleSubject}`;

  return {
    title: planTitle,
    subject: sampleSubject,
    durationDays: days,
    tasks: [
      { day: 1, title: "Pahami fondasi dasar & ringkasan awal materi" },
      { day: 2, title: "Dalami konsep utama & analogi materi" },
      { day: days, title: "Kerjakan latihan soal & review rangkuman akhir" },
    ],
  };
}

export function buildFallbackExplanation(text: string, title?: string): MaterialExplanationResponse {
  const subjectTitle = title || text.slice(0, 35).trim() || "Materi Kuliah";

  return {
    title: subjectTitle,
    keySummary: `Materi ini membahas poin-poin penting tentang ${subjectTitle}. Yuk pelajari ringkasannya di bawah biar kamu makin paham!`,
    importantConcepts: [
      {
        concept: "Konsep Inti 1",
        simpleExplanation: "Analogi sederhana: bayangkan seperti menyusun balok lego satu per satu.",
        example: "Contoh nyata saat kamu mengelompokkan tugas harian.",
      },
      {
        concept: "Konsep Inti 2",
        simpleExplanation: "Proses berantai yang saling terhubung dari awal sampai akhir.",
        example: "Sama seperti resep masakan yang langkahnya harus berurutan.",
      },
    ],
    simplifiedBreakdown: `## 📌 Rangkuman Sederhana\n\nMateri **${subjectTitle}** ini dibagi jadi beberapa poin utama:\n\n- **Landasan Dasar**: Memahami aturan utama materi.\n- **Penerapan**: Bagaimana cara menggunakannya secara praktis.\n- **Tips Belajar**: Pelajari bertahap dan jangan ragu latihan!`,
    reviewQuestions: [
      {
        question: `Apa tujuan utama dari materi ${subjectTitle} ini?`,
        answer: "Untuk memberikan pemahaman dasar dan penerapan praktisnya.",
        hint: "Coba ingat poin paling awal dari rangkuman.",
      },
      {
        question: "Mengapa konsep utama materi ini penting dipahami?",
        answer: "Karena menjadi dasar untuk topik-topik selanjutnya.",
        hint: "Pikirkan seperti pondasi sebuah rumah.",
      },
      {
        question: "Bagaimana cara sederhana menjelaskan materi ini ke teman kamu?",
        answer: "Gunakan analogi sehari-hari yang gampang dibayangkan.",
        hint: "Bayangkan kamu lagi cerita ke anak kecil.",
      },
    ],
  };
}
