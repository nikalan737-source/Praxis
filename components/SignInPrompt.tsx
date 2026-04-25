"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignInPromptProps {
  message: string;
  onSignIn: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Defaults to 6000. */
  durationMs?: number;
}

/**
 * Inline toast/banner shown when a guest attempts a protected action.
 * Renders fixed bottom-center, above the sticky publish bar (z-30), with a
 * slide-up + fade animation. Auto-dismisses after `durationMs`.
 */
export function SignInPrompt({
  message,
  onSignIn,
  onDismiss,
  durationMs = 6000,
}: SignInPromptProps) {
  const [visible, setVisible] = useState(false);

  // Stable refs so the auto-dismiss timer doesn't restart on parent re-renders
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const showFrame = requestAnimationFrame(() => setVisible(true));
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => onDismissRef.current(), 200);
    }, durationMs);
    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(dismissTimer);
    };
  }, [durationMs]);

  function handleDismiss() {
    setVisible(false);
    window.setTimeout(onDismiss, 200);
  }

  function handleSignIn() {
    setVisible(false);
    window.setTimeout(onSignIn, 200);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-24 left-1/2 z-30 -translate-x-1/2",
        "flex items-center gap-3 rounded-2xl bg-foreground px-5 py-3 text-background shadow-xl",
        "transition-[transform,opacity] duration-200 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0",
      )}
    >
      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-sm">{message}</span>
      <Button
        size="sm"
        onClick={handleSignIn}
        className="ml-2 h-7 rounded-full px-4 font-semibold"
      >
        Sign in
      </Button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="text-background/70 transition-colors hover:text-background"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
