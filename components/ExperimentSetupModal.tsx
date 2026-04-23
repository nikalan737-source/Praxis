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
  goalCategory?: string;
  actionSteps?: string[];
  interventions: { name: string }[];
}

interface ExperimentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  theory: TheoryContext;
}

interface ExistingHabit {
  id: string;
  actionText: string;
  frequency: string;
  scheduledDays: string[];
  theoryTitle: string | null;
  goalCategory: string | null;
}

// Each candidate habit derived from the theory (actionSteps + interventions)
interface CandidateHabit {
  key: string;
  actionText: string;
  frequency: "daily" | "weekly" | "custom";
  scheduledDays: string[];
  source: "intervention" | "action_step";
  matchedExisting?: ExistingHabit;
}

// ── Habit similarity (mirrors praxis-mobile/app/theory/[id].tsx) ──────────────

const HABIT_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "with", "on", "at",
  "by", "from", "is", "are", "be", "your", "you", "this", "that", "it", "its",
  "per", "min", "before", "after", "during", "between", "each", "every", "no",
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !HABIT_STOP_WORDS.has(w))
  );
}

function computeSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  Array.from(a).forEach((w) => {
    if (b.has(w)) overlap++;
  });
  return overlap / Math.min(a.size, b.size);
}

function findSimilarHabit(
  newName: string,
  existing: ExistingHabit[]
): ExistingHabit | undefined {
  const kw = extractKeywords(newName);
  if (kw.size === 0) return undefined;
  let best: ExistingHabit | undefined;
  let bestScore = 0;
  for (const h of existing) {
    const score = computeSimilarity(kw, extractKeywords(h.actionText));
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      best = h;
    }
  }
  return best;
}

function labelForFrequency(c: CandidateHabit): string {
  if (c.frequency === "daily" || c.scheduledDays.length === 7) return "Daily";
  if (c.scheduledDays.length === 1) return `Weekly · ${c.scheduledDays[0]}`;
  if (c.scheduledDays.length > 0) return c.scheduledDays.join(" · ");
  return c.frequency;
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

const ALL_DAY_ABBRS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

  // Step 3 — Habit selection (theory-derived candidates with merge detection)
  const [candidates, setCandidates] = useState<CandidateHabit[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [mergeMap, setMergeMap] = useState<Map<string, ExistingHabit>>(new Map());
  const [existingHabits, setExistingHabits] = useState<ExistingHabit[]>([]);
  const [changeMergeFor, setChangeMergeFor] = useState<string | null>(null);

  // Step 4
  const [checkinTypes, setCheckinTypes] = useState<string[]>(["Text updates"]);
  const [checkinFreq, setCheckinFreq] = useState("weekly");

  // Build candidate list from theory + fetch suggestions + find similar existing habits
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function load() {
      setCandidatesLoading(true);

      // Candidates: interventions first, then actionSteps that don't dupe intervention text
      const seen = new Set<string>();
      const raw: { key: string; actionText: string; source: "intervention" | "action_step" }[] = [];

      for (const iv of theory.interventions ?? []) {
        const key = iv.name.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        raw.push({ key: `iv::${key}`, actionText: iv.name, source: "intervention" });
      }
      for (const step of theory.actionSteps ?? []) {
        const key = step.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        raw.push({ key: `as::${key}`, actionText: step, source: "action_step" });
      }

      // Pre-seed with defaults so the UI renders immediately
      const seeded: CandidateHabit[] = raw.map((c) => ({
        key: c.key,
        actionText: c.actionText,
        frequency: "daily",
        scheduledDays: Array.from(ALL_DAY_ABBRS),
        source: c.source,
      }));

      if (!cancelled) {
        setCandidates(seeded);
        setSelectedKeys(new Set(seeded.map((c) => c.key)));
      }

      // Load existing habits for merge detection
      const existing: ExistingHabit[] = await fetch("/api/habits")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) =>
          (data ?? []).map((h: Record<string, unknown>) => ({
            id: h.id as string,
            actionText: h.actionText as string,
            frequency: h.frequency as string,
            scheduledDays: (h.scheduledDays as string[]) ?? [],
            theoryTitle: (h.theoryTitle as string) ?? null,
            goalCategory: (h.goalCategory as string) ?? null,
          }))
        )
        .catch(() => [] as ExistingHabit[]);

      if (cancelled) return;
      setExistingHabits(existing);

      // Fetch frequency suggestions in parallel and run merge detection
      const enriched = await Promise.all(
        seeded.map(async (c) => {
          let freq: "daily" | "weekly" | "custom" = "daily";
          let days: string[] = Array.from(ALL_DAY_ABBRS);
          try {
            const res = await fetch("/api/habits/suggest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                actionText: c.actionText,
                goalCategory: theory.goalCategory,
                evidenceTier: theory.evidenceTier,
              }),
            });
            if (res.ok) {
              const data = (await res.json()) as {
                frequency?: "daily" | "weekly" | "custom";
                scheduledDays?: string[];
              };
              freq = data.frequency ?? "daily";
              days = Array.isArray(data.scheduledDays) && data.scheduledDays.length > 0
                ? data.scheduledDays
                : Array.from(ALL_DAY_ABBRS);
            }
          } catch {
            // keep defaults
          }
          const match = findSimilarHabit(c.actionText, existing);
          return { ...c, frequency: freq, scheduledDays: days, matchedExisting: match };
        })
      );

      if (cancelled) return;
      setCandidates(enriched);

      // Auto-seed merges for matched items
      const autoMerge = new Map<string, ExistingHabit>();
      for (const c of enriched) {
        if (c.matchedExisting) autoMerge.set(c.key, c.matchedExisting);
      }
      setMergeMap(autoMerge);
      setCandidatesLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [isOpen, theory.actionSteps, theory.interventions, theory.goalCategory, theory.evidenceTier]);

  const TOTAL_STEPS = 5;
  const ls = step; // direct mapping now — no optional step skipping

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

  function toggleCandidate(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllCandidates() {
    if (selectedKeys.size === candidates.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(candidates.map((c) => c.key)));
    }
  }

  function applyMerge(key: string, existing: ExistingHabit) {
    setMergeMap((prev) => {
      const next = new Map(prev);
      next.set(key, existing);
      return next;
    });
    setChangeMergeFor(null);
  }

  function removeMerge(key: string) {
    setMergeMap((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  const selectedCandidates = candidates.filter((c) => selectedKeys.has(c.key));
  const mergedCount = selectedCandidates.filter((c) => mergeMap.has(c.key)).length;
  const newCount = selectedCandidates.length - mergedCount;

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
      if (!res.ok) throw new Error("Failed to create protocol");
      const data = await res.json();

      // Resolve selected candidates → habit ids.
      //  - Merged candidates reuse the existing habit id.
      //  - New candidates POST to /api/habits and capture the new id.
      const habitIds: string[] = [];
      for (const c of selectedCandidates) {
        const merged = mergeMap.get(c.key);
        if (merged) {
          habitIds.push(merged.id);
          continue;
        }
        try {
          const hRes = await fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionText: c.actionText,
              goalCategory: theory.goalCategory,
              evidenceTier: theory.evidenceTier,
              theoryId: theory.theoryId,
              theoryTitle: theory.title,
              frequency: c.frequency,
              scheduledDays: c.scheduledDays,
            }),
          });
          if (hRes.ok) {
            const habit = (await hRes.json()) as { id: string };
            if (habit?.id) habitIds.push(habit.id);
          }
        } catch {
          // skip — we'll still link what we have
        }
      }

      // Link all resolved habits to the new protocol
      if (habitIds.length > 0) {
        await fetch("/api/experiment-habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experimentId: data.experimentId,
            habitIds,
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
            <h2 className="font-semibold text-foreground text-lg">Start Protocol</h2>
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

          {/* ── Step 3: Select Habits from this theory ── */}
          {ls === 3 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Select habits</Label>
                  {candidates.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllCandidates}
                      className="text-[11px] text-primary font-medium hover:opacity-80"
                    >
                      {selectedKeys.size === candidates.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Habits similar to ones you already track will merge automatically — one check-off counts for all protocols.
                </p>
              </div>

              {candidatesLoading && candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground animate-pulse py-3">Building habit list…</p>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">
                  This theory doesn&apos;t include specific action steps. You can still start the protocol and add habits later.
                </p>
              ) : changeMergeFor !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">Merge with existing</p>
                    <button
                      type="button"
                      onClick={() => setChangeMergeFor(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {existingHabits.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">You have no existing habits to merge with.</p>
                    ) : (
                      existingHabits.map((eh) => (
                        <button
                          key={eh.id}
                          type="button"
                          onClick={() => applyMerge(changeMergeFor, eh)}
                          className="w-full text-left p-2.5 rounded-lg border border-border bg-secondary/30 hover:border-primary/40 transition-colors"
                        >
                          <p className="text-sm text-foreground leading-snug line-clamp-2">{eh.actionText}</p>
                          {eh.theoryTitle && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{eh.theoryTitle}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {candidates.map((c) => {
                    const isSelected = selectedKeys.has(c.key);
                    const merged = mergeMap.get(c.key);
                    const willMerge = !!merged;
                    return (
                      <div
                        key={c.key}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-secondary/40 border-border"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCandidate(c.key)}
                          className="w-full flex items-start gap-2.5 text-left"
                        >
                          <div className={cn(
                            "shrink-0 w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-border"
                          )}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm text-foreground leading-snug">{c.actionText}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 font-medium border border-emerald-500/20">
                                {labelForFrequency(c)}
                              </span>
                              {willMerge ? (
                                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  ↗ Will Merge
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-muted/50 text-muted-foreground border border-border">
                                  + New
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {willMerge && merged && (
                          <div className="mt-2 ml-6 flex items-start gap-2 text-[11px] text-muted-foreground">
                            <span className="flex-1 truncate">Merging with: <span className="text-foreground">{merged.actionText}</span></span>
                            <button
                              type="button"
                              onClick={() => removeMerge(c.key)}
                              className="text-muted-foreground hover:text-foreground font-medium"
                            >
                              Undo
                            </button>
                            <button
                              type="button"
                              onClick={() => setChangeMergeFor(c.key)}
                              className="text-primary hover:opacity-80 font-medium"
                            >
                              Change…
                            </button>
                          </div>
                        )}

                        {!willMerge && existingHabits.length > 0 && (
                          <div className="mt-2 ml-6">
                            <button
                              type="button"
                              onClick={() => setChangeMergeFor(c.key)}
                              className="text-[11px] text-primary hover:opacity-80 font-medium"
                            >
                              Merge with existing habit…
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCandidates.length > 0 && changeMergeFor === null && (
                <div className="pt-1 space-y-0.5 text-xs">
                  {mergedCount > 0 && (
                    <p className="text-emerald-400">↗ {mergedCount} habit{mergedCount !== 1 ? "s" : ""} merging with existing</p>
                  )}
                  {newCount > 0 && (
                    <p className="text-muted-foreground">+ {newCount} new habit{newCount !== 1 ? "s" : ""} will be created</p>
                  )}
                </div>
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
                {selectedCandidates.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Habits</span>
                    <span className="text-foreground font-mono text-right">
                      {mergedCount > 0 && <span className="text-emerald-400">↗ {mergedCount} merging</span>}
                      {mergedCount > 0 && newCount > 0 && <span className="text-muted-foreground"> · </span>}
                      {newCount > 0 && <span>+ {newCount} new</span>}
                    </span>
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
              {saving ? "Starting…" : "Start Protocol"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
