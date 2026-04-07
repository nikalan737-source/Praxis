"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "praxis_onboarding_seen";

const STEPS = [
  {
    emoji: "🧪",
    title: "Welcome to Praxis",
    body: "Praxis is your personal health experimentation platform. Instead of guessing what works for your body, you turn your health ideas into structured experiments — track them, log progress, and find out what actually moves the needle.",
    hint: null,
  },
  {
    emoji: "💡",
    title: "Start with a Theory",
    body: "Got a health idea? Write it out as a theory — something like \"I think poor sleep is driving my afternoon energy crashes\" or \"Cold exposure might improve my recovery.\" Be as detailed as you want; include any protocols or habits you already have in mind.",
    hint: "Tip: The more detail you add, the better the AI can evaluate and organize your theory.",
  },
  {
    emoji: "🔬",
    title: "AI Evaluates the Evidence",
    body: "Once you submit your theory, our AI reviews the science and breaks it into blocks by evidence strength — Strong, Emerging, Theoretical, or Unsupported. Each block comes with suggested protocols and habits backed by research.",
    hint: "Tip: You can also browse AI-generated theories from the community.",
  },
  {
    emoji: "📋",
    title: "Run an Experiment",
    body: "Pick a theory block and turn it into an active experiment. You'll get a set of habits and interventions to follow. Your experiment has a start date and tracks your adherence over time.",
    hint: "Tip: Each habit shows an evidence strength marker so you know what's well-supported vs. exploratory.",
  },
  {
    emoji: "📅",
    title: "Log Updates & Track Habits",
    body: "Check in on your experiment regularly — rate how it's going, mark habits as done, note any side effects, and add observations. Your Habits tab shows a weekly and monthly calendar with completion dots so you can see patterns at a glance.",
    hint: "Tip: Consistency matters more than perfection. Even partial adherence gives useful data.",
  },
  {
    emoji: "🏁",
    title: "You're ready to go",
    body: "Head to the Community to browse what others are experimenting with, or jump straight into creating your first theory. Your profile tracks all your active and completed experiments in one place.",
    hint: null,
  },
];

interface OnboardingModalProps {
  /** If true, shows regardless of localStorage (e.g. triggered by "How it works" button) */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingModal({ forceOpen, onClose }: OnboardingModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    // Auto-show once for new users
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setOpen(true);
      }
    }
  }, [forceOpen]);

  function handleClose() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
    onClose?.();
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <span className="text-5xl select-none">{current.emoji}</span>
          <h2 className="text-xl font-semibold text-foreground">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
          {current.hint && (
            <p className="text-xs text-primary/80 bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 w-full">
              {current.hint}
            </p>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === step ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-border">
          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="h-9 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
