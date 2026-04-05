export type ExperimentLogStatus = "in_progress" | "completed";

export type ExperimentLog = {
  id: string;
  theoryId: string;
  startedAt: string; // YYYY-MM-DD
  endedAt: string | null; // null when still in progress
  status: ExperimentLogStatus;
  isPublic: boolean;
  adherencePercent: number; // 0-100
  followedInterventions: string[];
  skippedInterventions: string[];
  outcomeRating: number; // 0-10
  notes: string;
  sideEffects: string;
  createdAt: string;
  updatedAt: string;
};

export type LogComment = {
  id: string;
  logId: string;
  userId: string;
  content: string;
  createdAt: string;
  endorsementCount: number;
  userEndorsed: boolean;
};

export type PublicLog = ExperimentLog & {
  endorsementCount: number;
  userEndorsed: boolean;
  comments: LogComment[];
};
