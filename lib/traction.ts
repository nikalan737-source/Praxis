import type { ExperimentLog } from "@/types/experiment-log";

export type TractionMetrics = {
  experimentLogs: number;
  avgOutcome: number;
  avgAdherence: number;
  avgDurationDays: number;
};

export function computeTraction(
  theoryId: string,
  logs: ExperimentLog[]
): TractionMetrics {
  const theoryLogs = logs.filter((l) => l.theoryId === theoryId);
  const count = theoryLogs.length;

  if (count === 0) {
    return {
      experimentLogs: 0,
      avgOutcome: 0,
      avgAdherence: 0,
      avgDurationDays: 0,
    };
  }

  const avgOutcome =
    Math.round(
      (theoryLogs.reduce((sum, l) => sum + l.outcomeRating, 0) / count) * 10
    ) / 10;

  const avgAdherence =
    theoryLogs.reduce((sum, l) => sum + l.adherencePercent, 0) / count;

  const durations = theoryLogs
    .filter((l) => l.startedAt && l.endedAt)
    .map((l) => {
      const start = new Date(l.startedAt).getTime();
      const end = new Date(l.endedAt!).getTime();
      return (end - start) / (1000 * 60 * 60 * 24);
    });

  const avgDurationDays =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    experimentLogs: count,
    avgOutcome,
    avgAdherence: Math.round(avgAdherence * 10) / 10,
    avgDurationDays: Math.round(avgDurationDays * 1) / 1,
  };
}
