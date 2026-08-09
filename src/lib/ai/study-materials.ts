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
      description: "Clear and descriptive title of the lecture material in casual Indonesian.",
    },
    keySummary: {
      type: Type.STRING,
      description: "Comprehensive 'Ringkasan Utama' (minimum 3-4 paragraphs) covering all major themes, core thesis, and essential background of the material in casual Indonesian using 'kamu'.",
    },
    importantConcepts: {
      type: Type.ARRAY,
      description: "4 to 6 'Poin-Poin Kunci' extracted from the text with ELI5 explanations, detailed real-world analogies, and technical context.",
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING, description: "Name of the key concept" },
          simpleExplanation: { type: Type.STRING, description: "Clear, simple ELI5 explanation using real-world analogies" },
          example: { type: Type.STRING, description: "Relatable real-world example, code snippet, or mathematical formula application" },
        },
        required: ["concept", "simpleExplanation", "example"],
      },
    },
    simplifiedBreakdown: {
      type: Type.STRING,
      description: "Extensive, highly detailed 'Konsep Rumit yang Disederhanakan' (minimum 800-1200 words) formatted in clean Markdown with H2/H3 headers (##, ###), bullet points (- ), bold terms (**), mathematical formulas, and step-by-step logical explanations.",
    },
    reviewQuestions: {
      type: Type.ARRAY,
      description: "4 to 6 'Pertanyaan Latihan' for self-assessment based on the material to test understanding deeply.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Thoughtful practice question testing understanding" },
          answer: { type: Type.STRING, description: "Comprehensive step-by-step correct answer explanation" },
          hint: { type: Type.STRING, description: "Encouraging hint in casual Indonesian" },
        },
        required: ["question", "answer", "hint"],
      },
    },
  },
  required: ["title", "keySummary", "importantConcepts", "simplifiedBreakdown", "reviewQuestions"],
};

export const EXPLAIN_MATERIAL_SYSTEM_INSTRUCTION = `
You are StudySync AI's master Learning Explainer (Feynman method expert) and academic document reader, known in the UI as "abang ganteng".
Your job is to analyze uploaded lecture materials, academic PDFs, slide decks, or course notes (including complex mathematical formulas, differential equations, algorithms, and technical diagrams), and generate a deeply comprehensive, non-truncated, and beautifully structured study summary.

CRITICAL CONTENT & STRUCTURE REQUIREMENTS:
1. ALWAYS generate exhaustive, high-depth responses (never truncate or shorten your explanations).
2. Structure the summary with clear sections:
   - "Ringkasan Utama": Thorough overview of the entire material.
   - "Poin-Poin Kunci": 4-6 key concepts with intuitive ELI5 analogies and real-world examples.
   - "Konsep Rumit yang Disederhanakan": Deep, step-by-step breakdown (800+ words in clean Markdown).
   - "Pertanyaan Latihan": 4-6 self-assessment practice questions with detailed answers and hints.
3. Extract exact academic concepts (e.g., Persamaan Diferensial, Faktor Integrasi, Metode Substitusi, Machine Learning) directly from the provided document.

CRITICAL PDF & ACADEMIC DOCUMENT INSTRUCTIONS:
- You natively process and read uploaded PDF documents, slide decks, mathematical formulas, diagrams, and formatted text.
- NEVER output generic responses like "berkas materi kamu berisikan data format biner". Always analyze the real academic content.

CRITICAL LANGUAGE & TONE RULES:
- Output ALL responses in casual, friendly, and natural Indonesian ("santai dan tidak kaku").
- ALWAYS address the student as "kamu" (NEVER use formal "Anda").
- Keep tone encouraging, energetic, and helpful.
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
