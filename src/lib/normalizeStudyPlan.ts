import { StudyPlanTask } from "./types";

/**
 * Safely generates a unique UUID or fallback hash ID.
 */
function generateTaskId(existingId?: any): string {
  if (existingId && typeof existingId === "string" && existingId.trim().length > 0) {
    return existingId.trim();
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
}

/**
 * Parses day number from various potential types or strings (e.g., "Hari ke-1", 1, "Day 2").
 */
function parseDayNumber(val: any, fallbackDay: number = 1): number {
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    return Math.floor(val);
  }
  if (typeof val === "string") {
    const match = val.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return fallbackDay;
}

/**
 * Extracts title string from various potential keys.
 */
function extractTitle(obj: any): string {
  if (typeof obj === "string") {
    return obj.trim();
  }
  if (!obj || typeof obj !== "object") {
    return "";
  }
  const possible =
    obj.title ||
    obj.name ||
    obj.topic ||
    obj.taskTitle ||
    obj.moduleTitle ||
    obj.goal ||
    obj.description ||
    "";

  return typeof possible === "string" ? possible.trim() : "";
}

/**
 * Boundary Normalizer Utility
 * Normalizes raw LLM output or corrupted/legacy Firestore documents
 * into a flat, canonical StudyPlanTask[] array.
 */
export function normalizeStudyPlanData(rawPlanData: any): StudyPlanTask[] {
  if (!rawPlanData) return [];

  let data = rawPlanData;

  // Step a: Strip markdown code fences (```json) and parse stringified JSON blobs safely
  if (typeof data === "string") {
    const trimmed = data.trim();
    const cleanJson = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    try {
      data = JSON.parse(cleanJson);
    } catch {
      return [];
    }
  }

  if (!data || typeof data !== "object") return [];

  // Unwrap target if inside wrapper properties
  if (data.studyPlan && typeof data.studyPlan === "object") {
    data = data.studyPlan;
  } else if (data.result && typeof data.result === "object") {
    data = data.result;
  }

  const rawTasks: StudyPlanTask[] = [];

  const addIndividualTask = (tObj: any, defaultDay: number = 1) => {
    if (!tObj) return;
    const title = extractTitle(tObj);
    if (!title) return;

    const dayNum = parseDayNumber(tObj.day ?? tObj.dayNumber ?? defaultDay, defaultDay);
    const id = generateTaskId(tObj.id);
    const completed = Boolean(tObj.completed);

    rawTasks.push({
      id,
      day: dayNum,
      title,
      completed,
    });
  };

  const processContainer = (container: any[], parentDay?: number) => {
    if (!Array.isArray(container)) return;

    container.forEach((item, index) => {
      if (!item) return;

      if (typeof item === "string") {
        addIndividualTask({ title: item }, parentDay || index + 1);
        return;
      }

      if (typeof item === "object") {
        const itemDay = parseDayNumber(
          item.day ?? item.dayNumber ?? item.day_number ?? parentDay,
          parentDay || index + 1
        );

        // Check if item contains nested sub-task arrays (modules/days structure)
        const subTasksContainer =
          (Array.isArray(item.tasks) && item.tasks) ||
          (Array.isArray(item.dailyTasks) && item.dailyTasks) ||
          (Array.isArray(item.items) && item.items) ||
          (Array.isArray(item.activities) && item.activities) ||
          (Array.isArray(item.schedule) && item.schedule) ||
          (Array.isArray(item.subtasks) && item.subtasks) ||
          (Array.isArray(item.lessons) && item.lessons) ||
          (Array.isArray(item.topics) && item.topics);

        if (subTasksContainer && subTasksContainer.length > 0) {
          subTasksContainer.forEach((subItem: any) => {
            if (typeof subItem === "string") {
              addIndividualTask({ title: subItem }, itemDay);
            } else if (subItem && typeof subItem === "object") {
              addIndividualTask(subItem, itemDay);
            }
          });
        } else {
          // If item itself is a task
          addIndividualTask(item, itemDay);
        }
      }
    });
  };

  // Step b: Search for task containers across known keys (tasks, modules, dailyTasks, dailyModules, days, schedule, items)
  if (Array.isArray(data)) {
    processContainer(data);
  } else {
    const knownKeys = [
      "tasks",
      "modules",
      "dailyTasks",
      "dailyModules",
      "days",
      "schedule",
      "items",
      "activities",
    ];

    for (const key of knownKeys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        processContainer(data[key]);
      }
    }
  }

  // Deduplicate exact duplicate IDs if any exist
  const seenIds = new Set<string>();
  const uniqueTasks: StudyPlanTask[] = [];

  for (const task of rawTasks) {
    let finalId = task.id;
    while (seenIds.has(finalId)) {
      finalId = generateTaskId();
    }
    seenIds.add(finalId);

    uniqueTasks.push({
      ...task,
      id: finalId,
    });
  }

  // Step f: Return a clean, sorted array of StudyPlanTask[] ordered by day.
  return uniqueTasks.sort((a, b) => a.day - b.day);
}
