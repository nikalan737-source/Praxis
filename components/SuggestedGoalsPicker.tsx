"use client";

import { SUGGESTED_GOALS } from "@/lib/suggested-goals";
import { cn } from "@/lib/utils";

type SuggestedGoalsPickerProps = {
  value: string;
  onSelect: (goal: string) => void;
  className?: string;
};

export function SuggestedGoalsPicker({ value, onSelect, className }: SuggestedGoalsPickerProps) {
  const activeGoal = value.trim();

  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-sm font-semibold text-foreground">Suggested goals</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Tap one to fill in your goal — you can tweak it or submit as-is.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SUGGESTED_GOALS.map((goal) => {
          const selected = activeGoal === goal;
          return (
            <button
              key={goal}
              type="button"
              onClick={() => onSelect(goal)}
              className={cn(
                "min-h-[3.25rem] rounded-xl border px-4 py-3.5 text-left text-sm font-medium leading-snug transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                selected
                  ? "border-primary bg-primary/12 text-foreground ring-1 ring-primary/25 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.1)]"
                  : "border-border bg-card/90 text-foreground/90 hover:border-primary/30 hover:bg-primary/[0.06]"
              )}
            >
              {goal}
            </button>
          );
        })}
      </div>
    </section>
  );
}
