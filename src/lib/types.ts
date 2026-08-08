export interface StudyPlanTask {
  id: string;
  day: number;
  title: string;
  completed: boolean;
  description?: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  subject: string;
  durationDays: number;
  tasks: StudyPlanTask[];
  createdAt: any;
}

export interface UserStats {
  currentStreak: number;
  lastActiveDate: string; // ISO date format "YYYY-MM-DD"
  totalStudyMinutesThisMonth: number;
  lastResetMonth: number; // Current month index (0-11) for monthly resets
}
