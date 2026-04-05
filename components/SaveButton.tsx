"use client";

import { useState } from "react";

type SaveButtonProps = {
  id: string;
  isSaved: boolean;
  onToggle: (id: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  onLoginRequest?: () => void;
};

export function SaveButton({
  id,
  isSaved,
  onToggle,
  onLoginRequest,
}: SaveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await onToggle(id);
      if (result?.requiresAuth && onLoginRequest) {
        onLoginRequest();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors text-zinc-400 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 disabled:opacity-50 data-[saved=true]:text-amber-500"
      aria-label={isSaved ? "Unsave" : "Save"}
    >
      {isSaved ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
    </button>
  );
}
