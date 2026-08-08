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
