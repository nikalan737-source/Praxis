"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useUpvotes(theoryIds: string[]) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userUpvoted, setUserUpvoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchCounts = useCallback(async () => {
    if (theoryIds.length === 0) {
      setCounts({});
      return;
    }
    const res = await fetch(
      `/api/upvote-counts?ids=${theoryIds.join(",")}`
    );
    const data = await res.json();
    setCounts(data);
  }, [theoryIds.join(",")]);

  const fetchUserUpvotes = useCallback(async () => {
    if (!user) {
      setUserUpvoted(new Set());
      return;
    }
    const res = await fetch("/api/user-upvotes");
    const data = await res.json();
    setUserUpvoted(new Set(data.theoryIds ?? []));
  }, [user?.id]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchUserUpvotes();
  }, [fetchUserUpvotes]);

  const toggleUpvote = useCallback(
    async (theoryId: string) => {
      setLoading((prev) => ({ ...prev, [theoryId]: true }));
      try {
        const res = await fetch("/api/upvote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theoryId }),
        });
        const data = await res.json();
        if (res.status === 401) {
          return { requiresAuth: true };
        }
        if (!res.ok) {
          return { requiresAuth: false };
        }
        const upvoted = data.upvoted as boolean;
        setUserUpvoted((prev) => {
          const next = new Set(prev);
          if (upvoted) next.add(theoryId);
          else next.delete(theoryId);
          return next;
        });
        setCounts((prev) => ({
          ...prev,
          [theoryId]: (prev[theoryId] ?? 0) + (upvoted ? 1 : -1),
        }));
        return { requiresAuth: false };
      } finally {
        setLoading((prev) => ({ ...prev, [theoryId]: false }));
      }
    },
    []
  );

  return {
    counts,
    userUpvoted,
    loading,
    toggleUpvote,
  };
}
