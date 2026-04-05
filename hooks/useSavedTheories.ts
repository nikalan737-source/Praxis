"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useSavedTheories() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const fetchSaves = useCallback(async () => {
    const res = await fetch("/api/user-saves");
    const data = await res.json();
    setSavedIds(data.theoryIds ?? []);
  }, []);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves, user?.id]);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggleSave = useCallback(async (id: string): Promise<{ requiresAuth?: boolean }> => {
    const res = await fetch("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theoryId: id }),
    });
    if (res.status === 401) {
      return { requiresAuth: true };
    }
    if (!res.ok) return { requiresAuth: false };
    const data = await res.json();
    setSavedIds((prev) =>
      data.saved ? [...prev, id] : prev.filter((x) => x !== id)
    );
    return { requiresAuth: false };
  }, []);

  return { savedIds, isSaved, toggleSave, fetchSaves };
}
