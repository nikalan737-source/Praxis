"use client";

import type { ExperimentTemplate } from "@/lib/experiment-templates";
import { EXPERIMENT_TEMPLATES } from "@/lib/experiment-templates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BatteryLow, Moon, Baby, Wind, Scale, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "energy-hormonal-transition": BatteryLow,
  "sleep-after-40": Moon,
  "postpartum-rebuild": Baby,
  "stress-cortisol": Wind,
  "metabolism-weight-shift": Scale,
  "strength-recovery-40": Dumbbell,
};

type ExperimentTemplatePickerProps = {
  selectedId: string | null;
  onSelect: (template: ExperimentTemplate) => void;
  onStartFromScratch: () => void;
  className?: string;
};

export function ExperimentTemplatePicker({
  selectedId,
  onSelect,
  onStartFromScratch,
  className,
}: ExperimentTemplatePickerProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Start from a template</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick a starting point for your situation. You can edit everything before saving.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartFromScratch}
          className="text-xs font-medium text-primary hover:text-primary/80 underline-offset-2 hover:underline shrink-0"
        >
          Start from scratch
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPERIMENT_TEMPLATES.map((template) => {
          const Icon = TEMPLATE_ICONS[template.id] ?? BatteryLow;
          const selected = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                "rounded-xl border text-left p-4 transition-all",
                "hover:border-primary/35 hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                selected
                  ? "border-primary bg-primary/8 ring-1 ring-primary/25"
                  : "border-border bg-card/80"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground leading-snug">{template.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{template.summary}</p>
                  <p className="mt-2 text-xs text-foreground/80">
                    <span className="font-medium">Goal:</span> {template.goal}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {template.trackingMetrics.map((metric) => (
                      <Badge key={metric} variant="secondary" className="text-[10px] font-normal">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
