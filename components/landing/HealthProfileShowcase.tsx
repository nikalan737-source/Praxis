"use client";

import { HEALTH_TAG_PRESETS } from "@/lib/health-tag-presets";
import { cn } from "@/lib/utils";

const LIFE_STAGE_CALLOUTS = [
  "Postpartum",
  "Perimenopause",
  "Menopause",
  "Andropause",
  "Busy career",
] as const;

/** Highlight three cards aligned with core ICP contexts */
const MOCK_SELECTED_LABELS = new Set(["Postpartum recovery", "Perimenopause", "Low energy"]);

const HealthProfileShowcase = () => {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Your context — not the average on a chart
          </h2>
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            aria-label="Life stages and situations Praxis supports"
          >
            {LIFE_STAGE_CALLOUTS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/70 bg-white/55 px-3.5 py-1.5 text-xs font-medium text-foreground/85 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.85)] backdrop-blur-md"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell Praxis what applies: life stage, injuries, sleep, stress, hormones. Every plan it suggests
            is filtered for the body and schedule you have now.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          <div className="glass-panel-strong p-5 sm:p-8 md:p-10">
            <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.9)] sm:justify-start">
              <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              <span className="text-left font-medium text-foreground/80">Your health profile</span>
              <span className="hidden text-muted-foreground sm:inline">— pick what applies</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3">
              {HEALTH_TAG_PRESETS.map(({ label, Icon }) => {
                const selected = MOCK_SELECTED_LABELS.has(label);
                return (
                  <div
                    key={label}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-xl border p-3 sm:p-3.5 transition-all duration-200",
                      "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.85)]",
                      selected
                        ? "border-primary/35 bg-primary/[0.11] ring-2 ring-primary/25 ring-offset-2 ring-offset-white"
                        : "border-white/55 bg-white/45 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/60"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.55)]" />
                    )}
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                        selected ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary/90"
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        "text-left text-xs font-semibold leading-snug sm:text-[13px]",
                        selected ? "text-foreground" : "text-foreground/90"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            Free users can add up to <span className="font-semibold text-foreground/80">3 tags</span>.
            Pro unlocks <span className="font-semibold text-primary">unlimited</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HealthProfileShowcase;
