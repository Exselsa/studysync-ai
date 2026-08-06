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
  totalDays: number;
  summary: string;
  modules: DayModulePlan[];
  studyPlan: StudyPlanPayload;
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
    totalDays: {
      type: Type.NUMBER,
      description: "Total number of study days allocated for this material.",
    },
    summary: {
      type: Type.STRING,
      description: "Friendly, encouraging summary explaining the plan to the student in casual Indonesian using 'kamu'.",
    },
    modules: {
      type: Type.ARRAY,
      description: "Day-by-day study modules breaking down the material into clear daily milestones.",
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.NUMBER, description: "Day index (1, 2, 3...)" },
          dateOffset: { type: Type.STRING, description: "Relative time e.g. 'Hari ke-1', 'Hari ke-2'" },
          goal: { type: Type.STRING, description: "Primary learning target for this day" },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key topics covered on this day",
          },
          estimatedMinutes: { type: Type.NUMBER, description: "Estimated total study time in minutes" },
          tasks: {
            type: Type.ARRAY,
            description: "Actionable study tasks for this day",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Actionable task title" },
                description: { type: Type.STRING, description: "Specific instructions on what to read or practice" },
                estimatedMinutes: { type: Type.NUMBER, description: "Estimated task completion time in minutes" },
              },
              required: ["title", "description", "estimatedMinutes"],
            },
          },
        },
        required: ["dayNumber", "dateOffset", "goal", "topics", "estimatedMinutes", "tasks"],
      },
    },
    studyPlan: {
      type: Type.OBJECT,
      description: "Standard StudyPlan format for saving to the user's board.",
      properties: {
        title: { type: Type.STRING },
        subject: { type: Type.STRING },
        progress: { type: Type.NUMBER, description: "Initial progress percentage (usually 0)" },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              status: { type: Type.STRING, description: "'pending' | 'in_progress' | 'done'" },
              dueDate: { type: Type.STRING },
            },
            required: ["id", "title", "description", "completed", "status"],
          },
        },
      },
      required: ["title", "subject", "progress", "tasks"],
    },
  },
  required: ["title", "subject", "totalDays", "summary", "modules", "studyPlan"],
};

export const GENERATE_PLAN_SYSTEM_INSTRUCTION = `
You are StudySync AI's expert Study Plan Generator.
Your job is to analyze uploaded lecture materials, lecture notes, or syllabus text, and generate a structured, highly actionable multi-day study plan.

CRITICAL LANGUAGE & TONE RULES:
- Output ALL responses in casual, friendly, and natural Indonesian ("santai dan tidak kaku").
- ALWAYS address the student as "kamu" (NEVER use formal "Anda").
- Keep tone encouraging, energetic, and helpful (e.g. "Yuk", "Mantap!", "Biar kamu gampang paham").
- Keep proper nouns, brand names, and standard technical terms in their original names (e.g. "StudySync", "Python", "Calculus", "Machine Learning").
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
You are StudySync AI's master Learning Explainer (Feynman method expert).
Your job is to take complex lecture materials, academic PDFs, or course notes, and simplify them into crystal-clear breakdowns that anyone can understand.

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

  const tasks = [
    {
      id: crypto.randomUUID(),
      title: "Pahami Konsep Dasar",
      description: "Baca ringkasan awal materi dan catat istilah-istilah penting.",
      completed: false,
      status: "pending",
      dueDate: "Hari ke-1",
    },
    {
      id: crypto.randomUUID(),
      title: "Dalami Poin Utama & Analogi",
      description: "Pelajari hubungan antar bab dan coba jelaskan ke diri sendiri.",
      completed: false,
      status: "pending",
      dueDate: "Hari ke-2",
    },
    {
      id: crypto.randomUUID(),
      title: "Latihan Soal & Review",
      description: "Uji pemahaman kamu lewat pertanyaan review dan rangkuman akhir.",
      completed: false,
      status: "pending",
      dueDate: `Hari ke-${days}`,
    },
  ];

  return {
    title: planTitle,
    subject: sampleSubject,
    totalDays: days,
    summary: `Nih, aku sudah buatkan study plan ${days} hari buat bantu kamu menguasai materi ini dengan santai dan efektif!`,
    modules: [
      {
        dayNumber: 1,
        dateOffset: "Hari ke-1",
        goal: "Fondasi dasar dan pengenalan istilah utama",
        topics: ["Poin Utama 1", "Istilah Kunci"],
        estimatedMinutes: 45,
        tasks: [
          {
            title: "Review Fondasi Dasar",
            description: "Baca bagian awal materi dan garis bawahi poin penting.",
            estimatedMinutes: 45,
          },
        ],
      },
      {
        dayNumber: 2,
        dateOffset: "Hari ke-2",
        goal: "Pendalaman konsep inti dan penerapan",
        topics: ["Konsep Lanjutan", "Studi Kasus"],
        estimatedMinutes: 60,
        tasks: [
          {
            title: "Bedah Analogi & Kasus",
            description: "Gunakan metode Feynman untuk menjelaskan bab 2 secara sederhana.",
            estimatedMinutes: 60,
          },
        ],
      },
    ],
    studyPlan: {
      title: planTitle,
      subject: sampleSubject,
      progress: 0,
      tasks,
    },
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
