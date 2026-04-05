"use client";

import { useCallback, useEffect, useState } from "react";

export type TheoryCounts = {
  saveCount: number;
  upvoteCount: number;
  logCount: number;
  avgOutcome: number;
};

export function useTheoryCounts(theoryIds: string[]) {
  const [counts, setCounts] = useState<Record<string, TheoryCounts>>({});

  const fetchCounts = useCallback(async () => {
    if (theoryIds.length === 0) {
      setCounts({});
      return;
    }
    const ids = theoryIds.join(",");
    const [savesRes, upvotesRes, statsRes] = await Promise.all([
      fetch(`/api/save-counts?ids=${ids}`),
      fetch(`/api/upvote-counts?ids=${ids}`),
      fetch(`/api/experiment-log-stats?ids=${ids}`),
    ]);
    const saves = await savesRes.json();
    const upvotes = await upvotesRes.json();
    const stats = await statsRes.json();

    const next: Record<string, TheoryCounts> = {};
    for (const id of theoryIds) {
      next[id] = {
        saveCount: saves[id] ?? 0,
        upvoteCount: upvotes[id] ?? 0,
        logCount: stats[id]?.logCount ?? 0,
        avgOutcome: stats[id]?.avgOutcome ?? 0,
      };
    }
    setCounts(next);
  }, [theoryIds.join(",")]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return { counts, fetchCounts };
}
