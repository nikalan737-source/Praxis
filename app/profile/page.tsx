"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedTheories } from "@/hooks/useSavedTheories";
import { useExperimentLogs } from "@/hooks/useExperimentLogs";
import { useUpvotes } from "@/hooks/useUpvotes";
import { useTheoryCounts } from "@/hooks/useTheoryCounts";
import { SaveButton } from "@/components/SaveButton";
import { UpvoteButton } from "@/components/UpvoteButton";
import { LoginModal } from "@/components/LoginModal";
import type { TheoryBlock } from "@/types/theory-block";
import type { ExperimentLog } from "@/types/experiment-log";
import type { PublicLog, LogComment } from "@/types/experiment-log";
import { ALL_DAYS, todayISO, weekDates, monthDates } from "@/lib/types";
import type { Habit, HabitCompletion } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExperimentSetupModal } from "@/components/ExperimentSetupModal";
import { cn } from "@/lib/utils";

// ── Shared helpers ─────────────────────────────────────────────────────────────

type LogUpdate = {
  id: string; logId: string; date: string; notes: string;
  adherencePercent: number | null; outcomeRating: number | null;
  sideEffects: string; createdAt: string;
};

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

const TIER_DOT: Record<TheoryBlock["evidenceTier"], string> = {
  Strong: "bg-emerald-600/70",
  Emerging: "bg-amber-500/70",
  Theoretical: "bg-blue-400/70",
  Unsupported: "bg-rose-400/70",
};
const TIER_VARIANT: Record<
  TheoryBlock["evidenceTier"],
  "strong" | "emerging" | "theoretical" | "unsupported"
> = {
  Strong: "strong",
  Emerging: "emerging",
  Theoretical: "theoretical",
  Unsupported: "unsupported",
};

function habitsForDayIdx(habits: Habit[], dayIdx: number): Habit[] {
  const day = ALL_DAYS[dayIdx];
  return habits.filter(
    (h) => h.frequency === "daily" || h.scheduledDays.includes(day)
  );
}

function isCompleted(
  completions: HabitCompletion[],
  habitId: string,
  date: string
): boolean {
  return completions.some(
    (c) => c.habitId === habitId && c.completedDate === date
  );
}

// ── HabitSchedulePicker ───────────────────────────────────────────────────────

interface PickerProps {
  actionText: string;
  goalCategory?: string;
  theoryId?: string;
  theoryTitle?: string;
  evidenceTier?: string;
  onSave: (habit: Habit) => void;
  onCancel: () => void;
}

function HabitSchedulePicker({
  actionText,
  goalCategory,
  theoryId,
  theoryTitle,
  evidenceTier,
  onSave,
  onCancel,
}: PickerProps) {
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function suggest() {
      try {
        const res = await fetch("/api/habits/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionText, goalCategory, evidenceTier }),
        });
        const data = res.ok ? await res.json() : null;
        if (!cancelled) {
          setFrequency(data?.frequency ?? "daily");
          setSelectedDays(data?.scheduledDays ?? Array.from(ALL_DAYS));
          setRationale(data?.rationale ?? "");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFrequency("daily");
          setSelectedDays(Array.from(ALL_DAYS));
          setLoading(false);
        }
      }
    }
    void suggest();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : prev.concat([day])
    );
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionText,
          goalCategory,
          evidenceTier,
          theoryId,
          theoryTitle,
          frequency,
          scheduledDays: selectedDays,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const habit: Habit = await res.json();
      onSave(habit);
    } catch {
      setSaveError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground animate-pulse">Suggesting schedule…</p>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-emerald-500/8 rounded-lg border border-emerald-500/20 space-y-3">
      <p className="text-xs font-semibold text-emerald-400">Add to Habits</p>
      {rationale && (
        <p className="text-xs text-muted-foreground italic">{rationale}</p>
      )}

      {/* Day chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Scheduled days</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                selectedDays.includes(day)
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-muted/40 text-muted-foreground border-border hover:border-emerald-500/40"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground shrink-0">Frequency:</p>
        <div className="flex gap-1">
          {(["daily", "weekly", "custom"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={cn(
                "px-2.5 py-1 rounded text-xs border transition-colors",
                frequency === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {saveError && <p className="text-xs text-red-400">{saveError}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || selectedDays.length === 0}>
          {saving ? "Saving…" : "Save to Habits"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── HabitsTab ─────────────────────────────────────────────────────────────────

function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [monthCompletions, setMonthCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = todayISO();
  const week = weekDates(today);
  const todayIdx = week.indexOf(today);
  const monthDays = monthDates(today);

  useEffect(() => {
    setSelectedDayIdx(todayIdx >= 0 ? todayIdx : 0);
  }, [todayIdx]);

  const weekFrom = week[0];
  const weekTo = week[6];

  const monthFrom = monthDays[0];
  const monthTo = monthDays[monthDays.length - 1];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, cRes, mRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/habits/completions?from=${weekFrom}&to=${weekTo}`),
        fetch(`/api/habits/completions?from=${monthFrom}&to=${monthTo}`),
      ]);
      if (hRes.ok) setHabits(await hRes.json());
      if (cRes.ok) setCompletions(await cRes.json());
      if (mRes.ok) setMonthCompletions(await mRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [weekFrom, weekTo, monthFrom, monthTo]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function toggleComplete(habit: Habit) {
    const date = week[selectedDayIdx];
    const done = isCompleted(completions, habit.id, date);
    const key = `${habit.id}::${date}`;
    setCompleting((prev) => new Set(Array.from(prev).concat([key])));
    try {
      if (done) {
        await fetch(`/api/habits/${habit.id}/complete?date=${date}`, { method: "DELETE" });
        setCompletions((prev) =>
          prev.filter((c) => !(c.habitId === habit.id && c.completedDate === date))
        );
      } else {
        const res = await fetch(`/api/habits/${habit.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        if (res.ok) {
          const comp: HabitCompletion = await res.json();
          setCompletions((prev) => prev.concat([comp]));
        }
      }
    } catch { /* silent */ }
    setCompleting((prev) => {
      const next = new Set(Array.from(prev));
      next.delete(key);
      return next;
    });
  }

  async function removeHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  const displayDate = week[selectedDayIdx];
  const isToday = selectedDayIdx === todayIdx;
  const dayHabits = habitsForDayIdx(habits, selectedDayIdx);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading habits…</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-muted-foreground">No habits yet.</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Switch to the <span className="text-foreground font-medium">Library</span> tab,
          expand a saved theory, and click{" "}
          <span className="text-emerald-400 font-medium">＋ Habit</span> on any action step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly strip */}
      <div className="grid grid-cols-7 gap-1">
        {ALL_DAYS.map((day, i) => {
          const date = week[i];
          const dayNum = date ? date.slice(-2).replace(/^0/, "") : "";
          const count = habitsForDayIdx(habits, i).length;
          const isActive = i === selectedDayIdx;
          const isTodayDay = i === todayIdx;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDayIdx(i)}
              className={cn(
                "flex flex-col items-center py-2.5 px-1 rounded-lg text-xs transition-colors border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isTodayDay
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              <span className="font-semibold text-[11px]">{day}</span>
              <span className={cn("text-[11px] mt-0.5", isActive && "opacity-75")}>
                {dayNum}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "mt-1 rounded-full px-1.5 text-[10px] font-bold leading-relaxed",
                    isActive ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day checklist */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {isToday ? "Today's protocols" : `${ALL_DAYS[selectedDayIdx]} protocols`}
          <span className="ml-2 font-normal normal-case opacity-60">{displayDate}</span>
        </p>

        {dayHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Nothing scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {dayHabits.map((habit) => {
              const done = isCompleted(completions, habit.id, displayDate);
              const busy = completing.has(`${habit.id}::${displayDate}`);
              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    done
                      ? "bg-emerald-500/8 border-emerald-500/20"
                      : "bg-muted/30 border-border"
                  )}
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleComplete(habit)}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                    className={cn(
                      "shrink-0 w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition-colors",
                      done ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-emerald-400",
                      busy && "opacity-40"
                    )}
                  >
                    {done && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm text-foreground leading-snug", done && "line-through opacity-50")}>
                      {habit.actionText}
                    </p>
                    {habit.theoryTitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{habit.theoryTitle}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {habit.evidenceTier && (
                        <span className={cn(
                          "text-[10px] rounded px-1.5 py-0.5 font-medium",
                          habit.evidenceTier === "Strong" ? "text-emerald-400 bg-emerald-500/10" :
                          habit.evidenceTier === "Emerging" ? "text-amber-400 bg-amber-500/10" :
                          habit.evidenceTier === "Theoretical" ? "text-blue-400 bg-blue-500/10" :
                          "text-rose-400 bg-rose-500/10"
                        )}>
                          {habit.evidenceTier}
                        </span>
                      )}
                      {habit.frequency === "daily" ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">daily</span>
                      ) : (
                        habit.scheduledDays.map((d) => (
                          <span key={d} className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">{d}</span>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void removeHabit(habit.id)}
                    aria-label="Remove habit"
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors text-xl leading-none mt-0.5"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly calendar (expandable) */}
      <div>
        <button
          type="button"
          onClick={() => setShowCalendar((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCalendar ? "▲ Hide calendar" : "▼ Monthly overview"}
        </button>

        {showCalendar && (
          <div className="mt-3">
            {(() => {
              const d = new Date(today + "T12:00:00");
              const monthLabel = d.toLocaleString("default", { month: "long", year: "numeric" });
              // What day of week does the 1st fall on? (0=Sun)
              const firstDow = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
              // Shift so Mon=0
              const startOffset = firstDow === 0 ? 6 : firstDow - 1;

              return (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{monthLabel}</p>
                  <div className="grid grid-cols-7 gap-1">
                    {ALL_DAYS.map((day) => (
                      <span key={day} className="text-[10px] text-muted-foreground text-center font-medium">{day.slice(0, 2)}</span>
                    ))}
                    {/* Empty cells before month starts */}
                    {Array.from({ length: startOffset }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {monthDays.map((date) => {
                      const dayNum = date.slice(-2).replace(/^0/, "");
                      const isDateToday = date === today;
                      const isPast = date <= today;
                      // Count completions for this date
                      const dayCompletions = monthCompletions.filter((c) => c.completedDate === date);
                      // Count total habits scheduled for this day's day-of-week
                      const dow = new Date(date + "T12:00:00").getDay();
                      const dayIdx = dow === 0 ? 6 : dow - 1;
                      const scheduled = habitsForDayIdx(habits, dayIdx);
                      const total = scheduled.length;
                      const completed = dayCompletions.length;

                      let dotColor = "bg-transparent";
                      if (isPast && total > 0) {
                        if (completed >= total) dotColor = "bg-emerald-500";
                        else if (completed > 0) dotColor = "bg-amber-500";
                        else dotColor = "bg-border";
                      }

                      return (
                        <div
                          key={date}
                          className={cn(
                            "flex flex-col items-center py-1 rounded text-[11px]",
                            isDateToday && "ring-1 ring-primary/50"
                          )}
                        >
                          <span className={cn(
                            "font-mono",
                            isDateToday ? "text-primary font-bold" : isPast ? "text-foreground/70" : "text-muted-foreground/50"
                          )}>
                            {dayNum}
                          </span>
                          {total > 0 && isPast && (
                            <span className={cn("w-1.5 h-1.5 rounded-full mt-0.5", dotColor)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All done</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Partial</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-border" /> None</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* All protocols (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAllHabits((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAllHabits ? "▲ Hide all protocols" : `▼ All protocols (${habits.length})`}
        </button>

        {showAllHabits && (
          <div className="mt-3 space-y-2">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{habit.actionText}</p>
                  {habit.theoryTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{habit.theoryTitle}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {habit.evidenceTier && (
                      <span className={cn(
                        "text-[10px] rounded px-1.5 py-0.5 font-medium",
                        habit.evidenceTier === "Strong" ? "text-emerald-400 bg-emerald-500/10" :
                        habit.evidenceTier === "Emerging" ? "text-amber-400 bg-amber-500/10" :
                        habit.evidenceTier === "Theoretical" ? "text-blue-400 bg-blue-500/10" :
                        "text-rose-400 bg-rose-500/10"
                      )}>
                        {habit.evidenceTier}
                      </span>
                    )}
                    {habit.frequency === "daily" ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">daily</span>
                    ) : (
                      habit.scheduledDays.map((d) => (
                        <span key={d} className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">{d}</span>
                      ))
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void removeHabit(habit.id)}
                  aria-label="Remove"
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SavedCard (expandable + action step ＋ Habit buttons) ─────────────────────

function SavedCard({
  block,
  activeExperimentId,
  onStartExperiment,
  onLoginRequest,
}: {
  block: TheoryBlock;
  activeExperimentId?: string;
  onStartExperiment: (block: TheoryBlock) => void;
  onLoginRequest: () => void;
}) {
  const [expandedPanel, setExpandedPanel] = useState<"theory" | "logs" | null>(null);
  const [addingStepIdx, setAddingStepIdx] = useState<number | null>(null);
  const [addedSteps, setAddedSteps] = useState<number[]>([]);
  const isCombined = block.combinedTiers && block.combinedTiers.length > 1;

  function togglePanel(panel: "theory" | "logs") {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }

  const expanded = expandedPanel === "theory";

  function handleHabitSaved(stepIdx: number) {
    setAddedSteps((prev) => prev.includes(stepIdx) ? prev : prev.concat([stepIdx]));
    setAddingStepIdx(null);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-5 pb-3 space-y-0">
        {/* Badge row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {isCombined ? (
            <>
              <div className="flex -space-x-0.5">
                {block.combinedTiers!.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "w-2 h-2 rounded-full border border-card",
                      TIER_DOT[t as TheoryBlock["evidenceTier"]] ?? "bg-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {block.combinedTiers!.join(" / ")}
              </Badge>
            </>
          ) : (
            <>
              <span className={cn("w-2 h-2 rounded-full shrink-0", TIER_DOT[block.evidenceTier])} />
              <Badge variant={TIER_VARIANT[block.evidenceTier]}>{block.evidenceTier}</Badge>
            </>
          )}
          {block.createdType === "user_created" ? (
            <Badge variant="secondary" className="text-[10px]">
              User theory
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          )}
          <span className="text-xs text-muted-foreground">{block.goalCategory}</span>
        </div>

        {/* Title + expand */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-base leading-normal">{block.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{block.goalStatement}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {activeExperimentId ? (
              <Link href={`/experiment/${activeExperimentId}`}>
                <Button variant="default" size="sm" className="h-7 text-xs px-3">
                  View Journal
                </Button>
              </Link>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => onStartExperiment(block)}
              >
                Start Experiment
              </Button>
            )}
            <Button
              variant={expandedPanel === "theory" ? "secondary" : "outline"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => togglePanel("theory")}
            >
              {expandedPanel === "theory" ? "▲" : "▼"} Theory
            </Button>
            <Button
              variant={expandedPanel === "logs" ? "secondary" : "secondary"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => togglePanel("logs")}
            >
              {expandedPanel === "logs" ? "▲" : "▼"} Updates
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <Separator />
          <CardContent className="p-4 space-y-4 bg-background/30">
            {/* AI analysis */}
            {block.createdType === "user_created" && block.aiOverview && (
              <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <p className="text-xs font-semibold text-indigo-400">AI Analysis</p>
                </div>
                <p className="text-sm text-indigo-200/90 leading-relaxed">{block.aiOverview}</p>
              </div>
            )}

            {/* Original theory */}
            {block.createdType === "user_created" && block.userTheoryText && (
              <div className="p-3 bg-muted/40 border border-border rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Original theory</p>
                <p className="text-sm text-foreground/80 leading-relaxed italic">"{block.userTheoryText}"</p>
              </div>
            )}

            {/* Key insight */}
            {block.keyInsight && (
              <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg">
                <p className="text-xs font-semibold text-primary mb-0.5">Key insight</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{block.keyInsight}</p>
              </div>
            )}

            {/* Mechanism */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mechanism</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{block.mechanismSummary}</p>
            </div>

            {/* Action steps with ＋ Habit buttons */}
            {block.actionSteps && block.actionSteps.length > 0 && (
              <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                <p className="text-xs font-semibold text-emerald-400 mb-2">Act on this today</p>
                <ol className="space-y-3">
                  {block.actionSteps.map((step, i) => (
                    <li key={i}>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground/80 leading-relaxed">{step}</p>

                          {addingStepIdx === i ? (
                            <HabitSchedulePicker
                              actionText={step}
                              goalCategory={block.goalCategory}
                              theoryId={block.id}
                              theoryTitle={block.title}
                              evidenceTier={block.evidenceTier}
                              onSave={() => handleHabitSaved(i)}
                              onCancel={() => setAddingStepIdx(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingStepIdx(i)}
                              className={cn(
                                "mt-1.5 text-[10px] font-medium rounded-md px-2 py-0.5 transition-colors border",
                                addedSteps.includes(i)
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                  : "text-muted-foreground border-border hover:text-emerald-400 hover:bg-emerald-500/8 hover:border-emerald-500/20"
                              )}
                            >
                              {addedSteps.includes(i) ? "✓ Added to Habits" : "＋ Habit"}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Interventions */}
            {block.interventions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {block.interventions.length === 1 ? "Intervention" : `Interventions (${block.interventions.length})`}
                </p>
                <div className="space-y-2">
                  {block.interventions.map((iv, i) => (
                    <div key={i} className="p-3 bg-muted/40 rounded-lg border border-border">
                      <p className="text-sm font-semibold text-foreground">{iv.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{iv.mechanism}</p>
                      {iv.steps.length > 0 && (
                        <ol className="mt-2 space-y-0.5">
                          {iv.steps.map((step, si) => (
                            <li key={si} className="text-xs text-foreground/80 flex items-start gap-1.5">
                              <span className="text-muted-foreground shrink-0 font-medium">{si + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground font-mono">
                        <span>{iv.durationDays} days</span>
                        <span>·</span>
                        <span>{iv.expectedMagnitude} expected effect</span>
                        <span>·</span>
                        <span>Risk {iv.riskLevel}</span>
                      </div>
                      {iv.contraindications.length > 0 && (
                        <p className="mt-1 text-xs text-red-400">⚠ {iv.contraindications.join(", ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {block.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {block.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground pt-1 font-mono">
              <span>Risk <span className={
                block.riskLevel === "High" ? "text-red-400"
                : block.riskLevel === "Moderate" ? "text-amber-400"
                : "text-emerald-400"
              }>{block.riskLevel}</span></span>
              <span>·</span>
              <span>{block.reversibility} reversibility</span>
            </div>
          </CardContent>
        </>
      )}

      {/* Logs panel */}
      {expandedPanel === "logs" && (
        <div className="border-t border-border p-4 bg-background/30">
          <PubLogsPanel theoryId={block.id} onLoginRequest={onLoginRequest} />
        </div>
      )}
    </Card>
  );
}

// ── LogEntry ──────────────────────────────────────────────────────────────────

function LogEntry({
  log,
  onDelete,
  onTogglePublic,
}: {
  log: ExperimentLog;
  onDelete: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => Promise<void>;
}) {
  const start = log.startedAt ?? "—";
  const end = log.endedAt ?? (log.status === "in_progress" ? "in progress" : "—");
  const [toggling, setToggling] = useState(false);
  const [updates, setUpdates] = useState<LogUpdate[]>([]);
  const [updatesLoaded, setUpdatesLoaded] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updateDate, setUpdateDate] = useState(todayStr());
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateAdherence, setUpdateAdherence] = useState<string>("");
  const [updateOutcome, setUpdateOutcome] = useState<string>("");
  const [updateSideEffects, setUpdateSideEffects] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleTogglePublic() {
    setToggling(true);
    await onTogglePublic(log.id, !log.isPublic);
    setToggling(false);
  }

  async function loadUpdates() {
    if (updatesLoaded) return;
    const res = await fetch(`/api/log-updates?logId=${log.id}`);
    if (res.ok) { const { updates: fetched } = await res.json(); setUpdates(fetched ?? []); }
    setUpdatesLoaded(true);
  }

  async function toggleUpdates() {
    if (!showUpdates && !updatesLoaded) await loadUpdates();
    setShowUpdates((v) => !v);
  }

  async function submitUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateNotes.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/log-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logId: log.id,
        date: updateDate,
        notes: updateNotes.trim(),
        adherencePercent: updateAdherence ? Number(updateAdherence) : null,
        outcomeRating: updateOutcome ? Number(updateOutcome) : null,
        sideEffects: updateSideEffects,
      }),
    });
    if (res.ok) {
      const newUpdate = await res.json();
      setUpdates((prev) => prev.concat([newUpdate]));
      setUpdateNotes(""); setUpdateAdherence(""); setUpdateOutcome("");
      setUpdateSideEffects(""); setUpdateDate(todayStr()); setShowAddUpdate(false);
      if (!showUpdates) setShowUpdates(true);
    }
    setPosting(false);
  }

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-foreground">{start} → {end}</p>
            {log.status === "in_progress" && (
              <Badge variant="default" className="text-[10px]">In progress</Badge>
            )}
            <Badge variant={log.isPublic ? "strong" : "secondary"} className="text-[10px]">
              {log.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {log.adherencePercent}% adherence · Outcome {log.outcomeRating}/10
          </p>
          {log.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-xs"
            onClick={handleTogglePublic} disabled={toggling}>
            {toggling ? "…" : log.isPublic ? "Make private" : "Publish"}
          </Button>
          <Link href={`/log/${log.theoryId}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs">New log</Button>
          </Link>
          <Button variant="ghost" size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => void onDelete(log.id)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={toggleUpdates}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {showUpdates ? "▲ Hide updates" : `▼ Updates${updatesLoaded ? ` (${updates.length})` : ""}`}
        </button>
        <button type="button"
          onClick={() => { setShowAddUpdate((v) => !v); if (!showUpdates) setShowUpdates(true); if (!updatesLoaded) void loadUpdates(); }}
          className="text-xs text-primary hover:opacity-80 font-medium transition-opacity">
          + Add update
        </button>
      </div>

      {showAddUpdate && (
        <form onSubmit={submitUpdate} className="mt-3 p-4 bg-muted/40 rounded-lg border border-border space-y-3">
          <p className="text-xs font-semibold text-foreground">Add a progress update</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Adherence (%)</Label>
              <Input type="number" min={0} max={100} value={updateAdherence}
                onChange={(e) => setUpdateAdherence(e.target.value)} placeholder="e.g. 80" className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes <span className="text-muted-foreground font-normal">(required)</span></Label>
            <Textarea rows={2} value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="What happened? How did it go?" className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Outcome so far (0–10)</Label>
              <Input type="number" min={0} max={10} step={0.5} value={updateOutcome}
                onChange={(e) => setUpdateOutcome(e.target.value)} placeholder="e.g. 7" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Side effects</Label>
              <Input type="text" value={updateSideEffects}
                onChange={(e) => setUpdateSideEffects(e.target.value)} placeholder="Any side effects" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={posting || !updateNotes.trim()}>
              {posting ? "Saving…" : "Save update"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddUpdate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showUpdates && updates.length > 0 && (
        <div className="mt-2 space-y-2 pl-3 border-l-2 border-border">
          {updates.map((u) => (
            <div key={u.id} className="py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{u.date}</span>
                {u.outcomeRating !== null && (
                  <span className="text-xs text-muted-foreground font-mono">{u.outcomeRating}/10</span>
                )}
                {u.adherencePercent !== null && (
                  <span className="text-xs text-muted-foreground font-mono">{u.adherencePercent}% adherence</span>
                )}
              </div>
              {u.notes && <p className="text-xs text-foreground/80 mt-0.5">{u.notes}</p>}
              {u.sideEffects && (
                <p className="text-xs text-muted-foreground mt-0.5">Side effects: {u.sideEffects}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {showUpdates && updatesLoaded && updates.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 pl-3">No updates yet.</p>
      )}
    </div>
  );
}

// ── Active Experiments ────────────────────────────────────────────────────────

interface ActiveExperiment {
  experimentId: string;
  theoryId: string;
  theoryTitle: string;
  startedAt: string;
  expectedDurationDays: number;
  primaryMetric: string;
  lastCheckinDate: string | null;
  adherencePercent: number | null;
  linkedHabitCount: number;
}

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

interface CompletedExperiment {
  id: string;
  theoryId: string;
  theoryTitle: string;
  startedAt: string;
  endedAt: string | null;
  outcomeRating: number | null;
}

function ExperimentsTab() {
  const [experiments, setExperiments] = useState<ActiveExperiment[]>([]);
  const [completed, setCompleted] = useState<CompletedExperiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/experiments/active")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("/api/experiment-logs")
        .then((res) => (res.ok ? res.json() : { logs: [] }))
        .catch(() => ({ logs: [] })),
    ]).then(([active, logsData]) => {
      setExperiments(active);
      // Filter to completed experiments from the logs endpoint
      const completedLogs = ((logsData.logs ?? []) as ExperimentLog[])
        .filter((l) => l.status === "completed")
        .map((l) => ({
          id: l.id,
          theoryId: l.theoryId,
          theoryTitle: "", // will be resolved below
          startedAt: l.startedAt,
          endedAt: l.endedAt,
          outcomeRating: l.outcomeRating,
        }));
      setCompleted(completedLogs);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading experiments…</p>
      </div>
    );
  }

  if (experiments.length === 0 && completed.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-muted-foreground">No experiments yet.</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Head to the <Link href="/community" className="text-primary font-medium hover:opacity-80">Community</Link> page
          and click <span className="text-foreground font-medium">Start Experiment</span> on any theory.
        </p>
      </div>
    );
  }

  const today = todayStr();

  return (
    <div className="space-y-4">
      {experiments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</h3>
          {experiments.map((exp) => {
            const daysElapsed = daysBetween(exp.startedAt, today);
            const progress = Math.min(100, Math.round((daysElapsed / exp.expectedDurationDays) * 100));
            const daysSinceCheckin = exp.lastCheckinDate ? daysBetween(exp.lastCheckinDate, today) : null;

            return (
              <Link key={exp.experimentId} href={`/experiment/${exp.experimentId}`}>
                <Card className="hover:bg-card/80 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm leading-normal truncate">
                          {exp.theoryTitle}
                        </h3>
                        {exp.primaryMetric && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic truncate">
                            {exp.primaryMetric}
                          </p>
                        )}
                      </div>
                      <Badge variant="default" className="text-[10px] shrink-0">Active</Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-mono">Day {daysElapsed + 1} / {exp.expectedDurationDays}</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Last check-in info + adherence */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono">Started {exp.startedAt}</span>
                      {daysSinceCheckin !== null ? (
                        <span className={cn(
                          "font-mono",
                          daysSinceCheckin > 7 ? "text-amber-500" : ""
                        )}>
                          Last check-in {daysSinceCheckin === 0 ? "today" : `${daysSinceCheckin}d ago`}
                        </span>
                      ) : (
                        <span className="text-amber-500 font-mono">No check-ins yet</span>
                      )}
                      {exp.adherencePercent !== null && (
                        <span className={cn(
                          "font-mono",
                          exp.adherencePercent >= 80 ? "text-emerald-500" : exp.adherencePercent >= 50 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {exp.adherencePercent}% adherence
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</h3>
          {completed.map((exp) => (
            <Link key={exp.id} href={`/experiment/${exp.id}`}>
              <Card className="hover:bg-card/80 transition-colors cursor-pointer opacity-80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-normal truncate">
                        {exp.theoryTitle || "Experiment"}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">Completed</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono">Started {exp.startedAt}</span>
                    {exp.endedAt && <span className="font-mono">Ended {exp.endedAt}</span>}
                    {exp.outcomeRating !== null && (
                      <span className="font-mono">{exp.outcomeRating}/10 outcome</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {experiments.length === 0 && completed.length > 0 && (
        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            No active experiments right now.{" "}
            <Link href="/community" className="text-primary font-medium hover:opacity-80">Start a new one</Link>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Published Theories ───────────────────────────────────────────────────────

const TIER_SECTION: Record<TheoryBlock["evidenceTier"], { bg: string; border: string; label: string }> = {
  Strong:      { bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "What the research confirms" },
  Emerging:    { bg: "bg-amber-500/10",   border: "border-amber-500/25",   label: "What shows promise" },
  Theoretical: { bg: "bg-muted/50",       border: "border-border",         label: "What we theorize" },
  Unsupported: { bg: "bg-red-500/10",     border: "border-red-500/25",     label: "Experimental territory" },
};
const TIER_ORDER: TheoryBlock["evidenceTier"][] = ["Strong", "Emerging", "Theoretical", "Unsupported"];

function groupInterventionsByTier(interventions: TheoryBlock["interventions"]) {
  const groups = new Map<TheoryBlock["evidenceTier"], TheoryBlock["interventions"]>();
  for (const iv of interventions) {
    const tier = iv.tier;
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier)!.push(iv);
  }
  return TIER_ORDER.filter((t) => groups.has(t)).map((t) => ({ tier: t, interventions: groups.get(t)! }));
}

const PAGE_SIZE = 5;

// ── Published comment ───────────────────────────────────────────────────────

function PubCommentItem({ comment, onLoginRequest }: { comment: LogComment; onLoginRequest: () => void }) {
  const { user } = useAuth();
  const [count, setCount] = useState(comment.endorsementCount);
  const [endorsed, setEndorsed] = useState(comment.userEndorsed);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) { onLoginRequest(); return; }
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/comment-endorsements", {
      method: endorsed ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: comment.id }),
    });
    if (res.ok) { const next = !endorsed; setEndorsed(next); setCount((c) => c + (next ? 1 : -1)); }
    setLoading(false);
  }

  return (
    <div className="flex items-start gap-2 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80">{comment.content}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{new Date(comment.createdAt).toLocaleDateString()}</p>
      </div>
      <button type="button" onClick={toggle} disabled={loading}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors shrink-0",
          endorsed
            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
            : "border-border text-muted-foreground hover:border-foreground/40",
        )}>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill={endorsed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
        {count}
      </button>
    </div>
  );
}

// ── Published log entry ─────────────────────────────────────────────────────

function PubLogEntry({ log, onLoginRequest }: { log: PublicLog; onLoginRequest: () => void }) {
  const { user } = useAuth();
  const [endorseCount, setEndorseCount] = useState(log.endorsementCount);
  const [endorsed, setEndorsed] = useState(log.userEndorsed);
  const [endorseLoading, setEndorseLoading] = useState(false);
  const [comments, setComments] = useState<LogComment[]>(log.comments ?? []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function toggleEndorse() {
    if (!user) { onLoginRequest(); return; }
    if (endorseLoading) return;
    setEndorseLoading(true);
    const res = await fetch("/api/log-endorsements", {
      method: endorsed ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId: log.id }),
    });
    if (res.ok) { const next = !endorsed; setEndorsed(next); setEndorseCount((c) => c + (next ? 1 : -1)); }
    setEndorseLoading(false);
  }

  async function loadComments() {
    if (commentsLoaded) return;
    const res = await fetch(`/api/log-comments?logId=${log.id}`);
    if (res.ok) { const { comments: fetched } = await res.json(); setComments(fetched ?? []); }
    setCommentsLoaded(true);
  }

  async function toggleComments() {
    if (!showComments && !commentsLoaded) await loadComments();
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { onLoginRequest(); return; }
    if (!commentText.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/log-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId: log.id, content: commentText.trim() }),
    });
    if (res.ok) { const newComment = await res.json(); setComments((prev) => [...prev, newComment]); setCommentText(""); }
    setPosting(false);
  }

  const dateRange = log.endedAt ? `${log.startedAt} → ${log.endedAt}` : `${log.startedAt} → ongoing`;

  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{dateRange}</span>
            {log.status === "in_progress" && <Badge variant="default" className="text-[10px]">In progress</Badge>}
            {log.outcomeRating !== null && <span className="text-xs font-semibold text-foreground">{log.outcomeRating}/10</span>}
            {log.adherencePercent !== null && <span className="text-xs text-muted-foreground">{log.adherencePercent}% adherence</span>}
          </div>
          {log.notes && <p className={cn("text-sm text-foreground/80 mt-1", !expanded && "line-clamp-2")}>{log.notes}</p>}
        </div>
        <button type="button" onClick={toggleEndorse} disabled={endorseLoading}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full border shrink-0 transition-colors",
            endorsed ? "border-amber-400/50 bg-amber-400/10 text-amber-400" : "border-border text-muted-foreground hover:border-foreground/40",
          )}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill={endorsed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          {endorseCount}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border space-y-2">
          {log.followedInterventions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Followed interventions</p>
              <div className="flex flex-wrap gap-1">
                {log.followedInterventions.map((iv) => (
                  <span key={iv} className="text-xs bg-emerald-500/10 text-emerald-600 rounded-full px-2 py-0.5 border border-emerald-500/20">{iv}</span>
                ))}
              </div>
            </div>
          )}
          {log.skippedInterventions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Skipped interventions</p>
              <div className="flex flex-wrap gap-1">
                {log.skippedInterventions.map((iv) => (
                  <span key={iv} className="text-xs bg-muted/40 text-muted-foreground rounded-full px-2 py-0.5 border border-border">{iv}</span>
                ))}
              </div>
            </div>
          )}
          {log.sideEffects && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-xs text-rose-700"><span className="font-medium">Side effects:</span> {log.sideEffects}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? "▲ less" : "▼ details"}
        </button>
        <button type="button" onClick={toggleComments}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          {showComments ? "▲ hide comments" : `▼ comments${commentsLoaded ? ` (${comments.length})` : ""}`}
        </button>
      </div>
      {showComments && (
        <div className="mt-2 border-t border-border pt-2 space-y-1">
          {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
          {comments.map((c) => <PubCommentItem key={c.id} comment={c} onLoginRequest={onLoginRequest} />)}
          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            <Input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…" className="flex-1 min-w-0 text-xs h-8" />
            <Button type="submit" size="sm" disabled={posting || !commentText.trim()}>{posting ? "…" : "Post"}</Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Published logs panel ────────────────────────────────────────────────────

function PubLogsPanel({ theoryId, onLoginRequest }: { theoryId: string; onLoginRequest: () => void }) {
  const [logs, setLogs] = useState<PublicLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async (off: number) => {
    setLoading(true);
    const res = await fetch(`/api/experiment-logs/public?theoryId=${theoryId}&limit=${PAGE_SIZE + 1}&offset=${off}`);
    if (res.ok) {
      const { logs: fetched } = await res.json();
      const chunk = (fetched as PublicLog[]).slice(0, PAGE_SIZE);
      setHasMore(fetched.length > PAGE_SIZE);
      if (off === 0) { setLogs(chunk); } else { setLogs((prev) => [...prev, ...chunk]); }
      setOffset(off + PAGE_SIZE);
    }
    setLoading(false);
  }, [theoryId]);

  useEffect(() => { fetchLogs(0); }, [fetchLogs]);

  if (loading && logs.length === 0) return <p className="text-xs text-muted-foreground py-2">Loading logs…</p>;

  if (logs.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-muted-foreground">No public logs yet.</p>
        <Link href={`/log/${theoryId}`} className="mt-1 inline-block text-sm font-medium text-primary hover:opacity-80">
          Be the first →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => <PubLogEntry key={log.id} log={log} onLoginRequest={onLoginRequest} />)}
      {hasMore && (
        <Button variant="outline" size="sm" onClick={() => fetchLogs(offset)} disabled={loading} className="w-full">
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

// ── Published theory card ───────────────────────────────────────────────────

function PublishedTheoryCard({
  block,
  isSaved,
  onToggleSave,
  saveCount,
  upvoteCount,
  isUpvoted,
  onToggleUpvote,
  upvoteLoading,
  logCount,
  avgOutcome,
  activeExperimentId,
  onStartExperiment,
  onLoginRequest,
}: {
  block: TheoryBlock & { createdAt?: string };
  isSaved: boolean;
  onToggleSave: (id: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  saveCount: number;
  upvoteCount: number;
  isUpvoted: boolean;
  onToggleUpvote: (theoryId: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  upvoteLoading: boolean;
  logCount: number;
  avgOutcome: number;
  activeExperimentId?: string;
  onStartExperiment: (block: TheoryBlock) => void;
  onLoginRequest: () => void;
}) {
  const [expandedPanel, setExpandedPanel] = useState<"theory" | "logs" | null>(null);

  function togglePanel(panel: "theory" | "logs") {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }

  const isCombined = block.combinedTiers && block.combinedTiers.length > 1;

  return (
    <Card className="overflow-hidden bg-card hover:bg-card/80 transition-colors">
      <CardHeader className="p-5 pb-3">
        {/* Badge row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          {isCombined ? (
            <>
              <div className="flex -space-x-0.5">
                {block.combinedTiers!.map((t) => (
                  <span key={t} className={cn("w-2 h-2 rounded-full border border-card", TIER_DOT[t as TheoryBlock["evidenceTier"]] ?? "bg-muted-foreground")} />
                ))}
              </div>
              <Badge variant="secondary" className="text-[10px]">{block.combinedTiers!.join(" / ")}</Badge>
            </>
          ) : (
            <>
              <span className={cn("w-2 h-2 rounded-full shrink-0", TIER_DOT[block.evidenceTier])} />
              <Badge variant={TIER_VARIANT[block.evidenceTier]}>{block.evidenceTier}</Badge>
            </>
          )}
          {block.createdType === "user_created" ? (
            <Badge variant="secondary" className="text-[10px]">User theory</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          )}
          <span className="text-xs text-muted-foreground font-mono">{block.goalCategory}</span>
          {block.createdAt && (
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {new Date(block.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Title + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-base leading-normal">{block.title}</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{block.goalStatement}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <SaveButton id={block.id} isSaved={isSaved} onToggle={onToggleSave} onLoginRequest={onLoginRequest} />
            <UpvoteButton theoryId={block.id} count={upvoteCount} isUpvoted={isUpvoted}
              onToggle={onToggleUpvote} isLoading={upvoteLoading} onLoginRequest={onLoginRequest} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0">
        <Separator className="mb-3" />
        {/* Stats + expand buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono">
            <span className="font-medium text-foreground">{saveCount}</span> saved
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            <span className="font-medium text-foreground">{logCount}</span> {logCount === 1 ? "log" : "logs"}
            {logCount > 0 && <span> · {avgOutcome}/10 avg</span>}
          </span>
          <span className="text-xs text-muted-foreground font-mono">Risk {block.riskLevel}</span>

          <div className="ml-auto flex items-center gap-2">
            {activeExperimentId ? (
              <Link href={`/experiment/${activeExperimentId}`}>
                <Button variant="default" size="sm" className="h-7 text-xs px-3">View Journal</Button>
              </Link>
            ) : (
              <Button variant="default" size="sm" className="h-7 text-xs px-3"
                onClick={() => onStartExperiment(block)}>
                Start Experiment
              </Button>
            )}
            <Link href={`/log/${block.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary hover:text-primary">+ Log</Button>
            </Link>
            <Button
              variant={expandedPanel === "theory" ? "secondary" : "outline"}
              size="sm" className="h-7 text-xs px-3"
              onClick={() => togglePanel("theory")}
            >
              {expandedPanel === "theory" ? "▲" : "▼"} Theory
            </Button>
            <Button
              variant={expandedPanel === "logs" ? "secondary" : "secondary"}
              size="sm" className="h-7 text-xs px-3"
              onClick={() => togglePanel("logs")}
            >
              {expandedPanel === "logs" ? "▲" : "▼"} Updates
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Theory expansion */}
      {expandedPanel === "theory" && (
        <div className="border-t border-border p-4 bg-background/30 space-y-4">
          {block.createdType === "user_created" && block.aiOverview && (
            <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
                <p className="text-xs font-semibold text-indigo-400">AI Analysis</p>
              </div>
              <p className="text-sm text-indigo-200/90 leading-relaxed">{block.aiOverview}</p>
            </div>
          )}

          {block.createdType === "user_created" && block.userTheoryText && (
            <div className="p-3 bg-muted/40 border border-border rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Original theory</p>
              <p className="text-sm text-foreground/80 leading-relaxed italic">"{block.userTheoryText}"</p>
            </div>
          )}

          {block.keyInsight && (
            <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg">
              <p className="text-xs font-semibold text-primary mb-0.5">Key insight</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{block.keyInsight}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mechanism</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{block.mechanismSummary}</p>
          </div>

          {block.actionSteps && block.actionSteps.length > 0 && (
            <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
              <p className="text-xs font-semibold text-emerald-400 mb-2">Act on this today</p>
              <ol className="space-y-2">
                {block.actionSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-foreground/80 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {block.interventions.length > 0 && (() => {
            const groups = isCombined
              ? groupInterventionsByTier(block.interventions)
              : [{ tier: block.evidenceTier, interventions: block.interventions }];
            return (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {block.interventions.length === 1 ? "Intervention" : `Interventions (${block.interventions.length})`}
                </p>
                <div className="space-y-4">
                  {groups.map(({ tier, interventions }) => {
                    const section = TIER_SECTION[tier];
                    return (
                      <div key={String(tier)}>
                        {isCombined && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", TIER_DOT[tier])} />
                            <Badge variant={TIER_VARIANT[tier]}>{tier}</Badge>
                            <span className="text-xs text-muted-foreground">{section.label}</span>
                          </div>
                        )}
                        <div className={cn("space-y-3", isCombined && `p-3 rounded-lg ${section.bg} ${section.border} border`)}>
                          {interventions.map((iv, i) => (
                            <div key={i} className={cn("p-3 rounded-lg border", isCombined ? "bg-card/60 border-border/60" : "bg-muted/40 border-border")}>
                              <p className="text-sm font-semibold text-foreground">{iv.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{iv.mechanism}</p>
                              {iv.steps.length > 0 && (
                                <ol className="mt-2 space-y-0.5">
                                  {iv.steps.map((step, si) => (
                                    <li key={si} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                      <span className="text-muted-foreground shrink-0 font-medium">{si + 1}.</span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              )}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>{iv.durationDays} days</span><span>·</span>
                                <span>{iv.expectedMagnitude} expected effect</span><span>·</span>
                                <span>Risk {iv.riskLevel}</span>
                              </div>
                              {iv.contraindications.length > 0 && (
                                <p className="mt-1 text-xs text-red-400">⚠ {iv.contraindications.join(", ")}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {block.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {block.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs panel */}
      {expandedPanel === "logs" && (
        <div className="border-t border-border p-4 bg-background/30">
          <PubLogsPanel theoryId={block.id} onLoginRequest={onLoginRequest} />
        </div>
      )}
    </Card>
  );
}

// ── Published tab ───────────────────────────────────────────────────────────

function PublishedTab({
  activeExpByTheory,
  onStartExperiment,
}: {
  activeExpByTheory: Map<string, string>;
  onStartExperiment: (block: TheoryBlock) => void;
}) {
  const [theories, setTheories] = useState<(TheoryBlock & { createdAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedTheories();

  useEffect(() => {
    fetch("/api/theories/mine")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTheories(data))
      .catch(() => setTheories([]))
      .finally(() => setLoading(false));
  }, []);

  const theoryIds = useMemo(() => theories.map((t) => t.id), [theories]);
  const { counts } = useTheoryCounts(theoryIds);
  const { counts: upvoteCounts, userUpvoted, toggleUpvote, loading: upvoteLoading } = useUpvotes(theoryIds);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading published theories…</p>
      </div>
    );
  }

  if (theories.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-muted-foreground">You haven't published any theories yet.</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Head to the <Link href="/create" className="text-primary font-medium hover:opacity-80">Create</Link> page
          to generate or write your own theories.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {theories.map((block) => (
          <PublishedTheoryCard
            key={block.id}
            block={block}
            isSaved={isSaved(block.id)}
            onToggleSave={toggleSave}
            saveCount={counts[block.id]?.saveCount ?? 0}
            upvoteCount={upvoteCounts[block.id] ?? counts[block.id]?.upvoteCount ?? 0}
            isUpvoted={userUpvoted.has(block.id)}
            onToggleUpvote={toggleUpvote}
            upvoteLoading={upvoteLoading[block.id] ?? false}
            logCount={counts[block.id]?.logCount ?? 0}
            avgOutcome={counts[block.id]?.avgOutcome ?? 0}
            activeExperimentId={activeExpByTheory.get(block.id)}
            onStartExperiment={onStartExperiment}
            onLoginRequest={() => setLoginModalOpen(true)}
          />
        ))}
      </div>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}

// ── ProfilePage ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { savedIds } = useSavedTheories();
  const { logs, deleteLog, togglePublic } = useExperimentLogs();
  const [savedBlocks, setSavedBlocks] = useState<TheoryBlock[]>([]);
  const [theoryTitles, setTheoryTitles] = useState<Record<string, string>>({});
  const [activeExperiments, setActiveExperiments] = useState<ActiveExperiment[]>([]);
  const [setupTheory, setSetupTheory] = useState<TheoryBlock | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/community");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (savedIds.length === 0) { setSavedBlocks([]); return; }
    Promise.all(
      savedIds.map((id) =>
        fetch(`/api/theories/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setSavedBlocks(
        results
          .filter((b): b is TheoryBlock => b !== null)
          .map((b) => ({
            ...b,
            traction: { saves: 0, experimentLogs: 0, avgOutcome: 0 },
          }))
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.join(",")]);

  const logsGroupedByTheory = logs.reduce<Record<string, ExperimentLog[]>>(
    (acc, log) => {
      if (!acc[log.theoryId]) acc[log.theoryId] = [];
      acc[log.theoryId].push(log);
      return acc;
    },
    {}
  );
  const theoryIds = Object.keys(logsGroupedByTheory);

  useEffect(() => {
    theoryIds.forEach((id) => {
      fetch(`/api/theories/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTheoryTitles((prev) => ({ ...prev, [id]: data.title }));
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theoryIds.join(",")]);

  // Fetch active experiments to map theoryId → experimentId
  useEffect(() => {
    if (!user) return;
    fetch("/api/experiments/active")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setActiveExperiments(data))
      .catch(() => setActiveExperiments([]));
  }, [user]);

  const activeExpByTheory = useMemo(() => {
    const map = new Map<string, string>();
    for (const exp of activeExperiments) {
      map.set(exp.theoryId, exp.experimentId);
    }
    return map;
  }, [activeExperiments]);

  if (isLoading || !user) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-6">Profile</h1>

      <Tabs defaultValue="habits">
        <TabsList className="mb-2">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        {/* ── Habits tab ── */}
        <TabsContent value="habits">
          <HabitsTab />
        </TabsContent>

        {/* ── Experiments tab ── */}
        <TabsContent value="experiments">
          <ExperimentsTab />
        </TabsContent>

        {/* ── Published tab ── */}
        <TabsContent value="published">
          <PublishedTab
            activeExpByTheory={activeExpByTheory}
            onStartExperiment={(b) => setSetupTheory(b)}
          />
        </TabsContent>

        {/* ── Library tab (saved theories + experiment logs) ── */}
        <TabsContent value="library">
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Saved Theories
            </h2>
            {savedBlocks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No saved theories yet.</p>
            ) : (
              <div className="space-y-3">
                {savedBlocks.map((block) => (
                  <SavedCard
                    key={block.id}
                    block={block}
                    activeExperimentId={activeExpByTheory.get(block.id)}
                    onStartExperiment={(b) => setSetupTheory(b)}
                    onLoginRequest={() => setLoginModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              My Experiments
            </h2>
            {theoryIds.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No experiments yet.</p>
            ) : (
              <div className="space-y-4">
                {theoryIds.map((theoryId) => (
                  <Card key={theoryId}>
                    <CardHeader className="p-4 pb-2">
                      <p className="text-sm font-semibold text-foreground">
                        {theoryTitles[theoryId] ?? theoryId}
                      </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      {logsGroupedByTheory[theoryId].map((log) => (
                        <LogEntry
                          key={log.id}
                          log={log}
                          onDelete={deleteLog}
                          onTogglePublic={togglePublic}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {setupTheory && (
        <ExperimentSetupModal
          isOpen={true}
          onClose={() => setSetupTheory(null)}
          theory={{
            theoryId: setupTheory.id,
            title: setupTheory.title,
            evidenceTier: setupTheory.evidenceTier,
            interventions: setupTheory.interventions.map((iv) => ({ name: iv.name })),
          }}
        />
      )}
    </div>
  );
}
