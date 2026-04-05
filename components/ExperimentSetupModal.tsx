"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TheoryContext {
  theoryId: string;
  title: string;
  evidenceTier: string;
  interventions: { name: string }[];
}

interface ExperimentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  theory: TheoryContext;
}

interface HabitOption {
  id: string;
  actionText: string;
  frequency: string;
  theoryTitle: string | null;
  goalCategory: string | null;
}

const DURATION_OPTIONS = [
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "Custom", days: 0 },
];

const TRACKING_CATEGORIES = [
  "Energy", "Sleep", "Mood", "Physical appearance", "Performance", "Custom",
];

const CHECKIN_TYPES = ["Text updates", "Photos", "Measurements"];

const CHECKIN_FREQ = [
  { label: "Weekly", value: "weekly" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "No reminders", value: "none" },
];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExperimentSetupModal({ isOpen, onClose, theory }: ExperimentSetupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [startDate, setStartDate] = useState(todayISO());
  const [durationDays, setDurationDays] = useState(30);
  const [durationLabel, setDurationLabel] = useState("1 month");
  const [customDays, setCustomDays] = useState("");

  // Step 2
  const [categories, setCategories] = useState<string[]>([]);
  const [primaryMetric, setPrimaryMetric] = useState("");

  // Step 3 — Habit selection
  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());

  // Step 4
  const [checkinTypes, setCheckinTypes] = useState<string[]>(["Text updates"]);
  const [checkinFreq, setCheckinFreq] = useState("weekly");

  // Fetch habits on mount
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/habits")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const mapped: HabitOption[] = (data ?? []).map((h: Record<string, unknown>) => ({
          id: h.id as string,
          actionText: h.actionText as string,
          frequency: h.frequency as string,
          theoryTitle: (h.theoryTitle as string) ?? null,
          goalCategory: (h.goalCategory as string) ?? null,
        }));
        setHabits(mapped);
      })
      .catch(() => setHabits([]))
      .finally(() => setHabitsLoading(false));
  }, [isOpen]);

  // If no habits, skip step 3 automatically
  const hasHabits = habits.length > 0;
  const TOTAL_STEPS = hasHabits ? 5 : 4;

  // Map logical step to visual step (skip habits step if no habits)
  function logicalStep(): number {
    if (hasHabits) return step;
    // No habits: steps are 1,2,4,5 → map step 3→4, step 4→5
    if (step >= 3) return step + 1;
    return step;
  }

  const ls = logicalStep();

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.concat([cat])
    );
  }

  function toggleCheckinType(type: string) {
    setCheckinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : prev.concat([type])
    );
  }

  function toggleHabit(id: string) {
    setSelectedHabitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectDuration(label: string, days: number) {
    setDurationLabel(label);
    if (days > 0) {
      setDurationDays(days);
    }
  }

  const effectiveDays = durationLabel === "Custom" && customDays
    ? parseInt(customDays, 10) || 30
    : durationDays;

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/experiment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theoryId: theory.theoryId,
          startDate,
          expectedDurationDays: effectiveDays,
          trackingTypes: checkinTypes.map((t) =>
            t === "Text updates" ? "text" : t === "Photos" ? "photos" : "measurements"
          ),
          trackingCategories: categories,
          checkinFrequency: checkinFreq,
          primaryMetric,
          followedInterventions: theory.interventions.map((iv) => iv.name),
        }),
      });
      if (!res.ok) throw new Error("Failed to create experiment");
      const data = await res.json();

      // Link selected habits
      if (selectedHabitIds.size > 0) {
        await fetch("/api/experiment-habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experimentId: data.experimentId,
            habitIds: Array.from(selectedHabitIds),
          }),
        });
      }

      onClose();
      router.push(`/experiment/${data.experimentId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-xl border border-border shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-lg">Start Experiment</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i + 1 <= step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* ── Step 1: Theory context + dates ── */}
          {ls === 1 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono mb-2">Theory</p>
                <p className="font-semibold text-foreground leading-normal">{theory.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-[10px]">{theory.evidenceTier}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {theory.interventions.length} intervention{theory.interventions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {theory.interventions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {theory.interventions.map((iv) => (
                      <span key={iv.name} className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 border border-border">
                        {iv.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-mono" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Expected duration</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => selectDuration(opt.label, opt.days)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        durationLabel === opt.label
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {durationLabel === "Custom" && (
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Number of days"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="mt-2 w-40 font-mono"
                  />
                )}
              </div>
            </>
          )}

          {/* ── Step 2: What are you tracking + primary metric ── */}
          {ls === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">What are you tracking?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TRACKING_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        categories.includes(cat)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Primary metric</Label>
                <Input
                  type="text"
                  placeholder="How will you know if this worked?"
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  e.g. "I feel less fatigued in the afternoon" or "visible hair density change"
                </p>
              </div>
            </>
          )}

          {/* ── Step 3: Habit selection (only shown if user has habits) ── */}
          {ls === 3 && hasHabits && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Link habits to this experiment</Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Select habits you want to track alongside this experiment. They will appear as a checklist in each journal entry.
                </p>
              </div>

              {habitsLoading ? (
                <p className="text-xs text-muted-foreground animate-pulse py-3">Loading habits…</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {habits.map((habit) => {
                    const isSelected = selectedHabitIds.has(habit.id);
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => toggleHabit(habit.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          isSelected
                            ? "bg-primary/10 border-primary/40"
                            : "bg-secondary/50 border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            "shrink-0 w-4.5 h-4.5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-border"
                          )}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{habit.actionText}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">
                                {habit.frequency}
                              </span>
                              {habit.theoryTitle && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {habit.theoryTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedHabitIds.size > 0 && (
                <p className="text-xs text-primary font-mono">
                  {selectedHabitIds.size} habit{selectedHabitIds.size !== 1 ? "s" : ""} selected
                </p>
              )}
            </>
          )}

          {/* ── Step 4: Check-in preferences ── */}
          {ls === 4 && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Check-in type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CHECKIN_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCheckinType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        checkinTypes.includes(type)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Check-in frequency</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CHECKIN_FREQ.map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setCheckinFreq(freq.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        checkinFreq === freq.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed bg-secondary/50 border border-border rounded-lg p-3">
                Your journal is completely private. Nothing here is shared unless you choose to export it to a public log.
              </p>
            </>
          )}

          {/* ── Step 5: Confirmation ── */}
          {ls === 5 && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono mb-1">Summary</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Theory</span>
                  <span className="text-foreground font-medium text-right max-w-[60%] truncate">{theory.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start</span>
                  <span className="text-foreground font-mono">{startDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-mono">{effectiveDays} days</span>
                </div>
                {categories.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking</span>
                    <span className="text-foreground text-right">{categories.join(", ")}</span>
                  </div>
                )}
                {primaryMetric && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Metric</span>
                    <span className="text-foreground text-right max-w-[60%] italic">{primaryMetric}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-ins</span>
                  <span className="text-foreground">{checkinTypes.join(", ")} · {checkinFreq}</span>
                </div>
                {selectedHabitIds.size > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Linked habits</span>
                    <span className="text-foreground font-mono">{selectedHabitIds.size}</span>
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="sm" onClick={handleConfirm} disabled={saving}>
              {saving ? "Starting…" : "Start Experiment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
