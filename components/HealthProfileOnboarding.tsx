"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { HealthTagsEditor } from "@/components/HealthTagsEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FREE_HEALTH_TAGS_MAX } from "@/lib/health-tags-limits";

type HealthProfileOnboardingProps = {
  open: boolean;
  onFinished: () => void;
  isPro: boolean;
};

async function saveHealthProfile(tags: string[], complete: boolean): Promise<void> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      health_tags: tags,
      ...(complete ? { complete_health_onboarding: true } : {}),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.error === "health_tag_limit" && typeof data.message === "string") {
      throw new Error(data.message);
    }
    throw new Error(typeof data.error === "string" ? data.error : "Could not save profile");
  }
}

export function HealthProfileOnboarding({ open, onFinished, isPro }: HealthProfileOnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep(1);
      setTags([]);
      setError("");
      setBusy(false);
    }
  }, [open]);

  async function handleSkip() {
    setBusy(true);
    setError("");
    try {
      await saveHealthProfile([], true);
      onFinished();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError("");
    try {
      await saveHealthProfile(tags, true);
      onFinished();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        className="relative w-full max-w-lg max-h-[min(640px,90vh)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-onboarding-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 min-h-9">
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={() => setStep(1)}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex gap-1.5">
              {[1, 2].map((s) => (
                <span
                  key={s}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    step === s ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25"
                  )}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={busy}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          >
            Skip for now
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {step === 1 && (
            <>
              <h2
                id="health-onboarding-title"
                className="text-lg font-semibold text-foreground tracking-tight text-balance"
              >
                What should we know about your body?
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">
                Select anything that applies. This helps Praxis tailor theories and protocols — no wrong answers.
              </p>
              <HealthTagsEditor
                selected={tags}
                onChange={setTags}
                maxTags={isPro ? undefined : FREE_HEALTH_TAGS_MAX}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-foreground tracking-tight text-balance">
                Review your selections
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 mb-4 leading-relaxed">
                Remove anything that doesn&apos;t fit, or go back to add more.
              </p>

              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  You haven&apos;t selected any topics yet — that&apos;s okay. You can always add them later from your profile.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag}>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 text-primary pl-3 pr-1 py-1 text-xs font-medium">
                        {tag}
                        <button
                          type="button"
                          className="rounded-full p-1 text-primary hover:bg-primary/15 transition-colors"
                          aria-label={`Remove ${tag}`}
                          onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4 flex justify-end gap-2 bg-muted/10">
          {step === 1 ? (
            <Button
              type="button"
              className="bg-primary text-primary-foreground min-w-[120px]"
              onClick={() => setStep(2)}
              disabled={busy}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-primary text-primary-foreground min-w-[132px]"
              onClick={() => void handleComplete()}
              disabled={busy}
            >
              {busy ? "Saving…" : "Looks good"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
