"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type UpvoteButtonProps = {
  theoryId: string;
  count: number;
  isUpvoted: boolean;
  onToggle: (theoryId: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  isLoading: boolean;
  onLoginRequest: () => void;
};

export function UpvoteButton({
  theoryId,
  count,
  isUpvoted,
  onToggle,
  isLoading,
  onLoginRequest,
}: UpvoteButtonProps) {
  const { user } = useAuth();

  async function handleClick() {
    const result = await onToggle(theoryId);
    if (result?.requiresAuth) {
      onLoginRequest();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-1 text-sm disabled:opacity-50 shrink-0 transition-colors ${
        isUpvoted ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
      }`}
      title={user ? (isUpvoted ? "Remove upvote" : "Upvote") : "Sign in to upvote"}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={isUpvoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}
