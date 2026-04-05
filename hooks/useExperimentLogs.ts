"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExperimentLog } from "@/types/experiment-log";
import { useAuth } from "@/contexts/AuthContext";

export function useExperimentLogs(theoryId?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ExperimentLog[]>([]);

  const fetchLogs = useCallback(async () => {
    const url = theoryId
      ? `/api/experiment-logs?theoryId=${theoryId}`
      : "/api/experiment-logs";
    const res = await fetch(url);
    const data = await res.json();
    setLogs(data.logs ?? []);
  }, [theoryId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, user?.id]);

  const create = useCallback(
    async (log: Omit<ExperimentLog, "id" | "createdAt" | "updatedAt">) => {
      const res = await fetch("/api/experiment-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theoryId: log.theoryId,
          startedAt: log.startedAt,
          endedAt: log.endedAt,
          status: log.status,
          isPublic: log.isPublic,
          adherencePercent: log.adherencePercent,
          followedInterventions: log.followedInterventions,
          skippedInterventions: log.skippedInterventions,
          outcomeRating: log.outcomeRating,
          notes: log.notes,
          sideEffects: log.sideEffects,
        }),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      const newLog: ExperimentLog = {
        ...log,
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      setLogs((prev) => [newLog, ...prev]);
      return newLog;
    },
    []
  );

  const togglePublic = useCallback(async (id: string, isPublic: boolean) => {
    const res = await fetch(`/api/experiment-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) return;
    setLogs((prev) => prev.map((l) => l.id === id ? { ...l, isPublic } : l));
  }, []);

  const logsByTheory = useCallback(
    (tid: string) => logs.filter((l) => l.theoryId === tid),
    [logs]
  );

  const deleteLog = useCallback(async (id: string) => {
    const res = await fetch(`/api/experiment-logs/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { logs, create, logsByTheory, deleteLog, fetchLogs, togglePublic };
}
