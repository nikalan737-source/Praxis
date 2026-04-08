"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  id: string;
  experimentId: string;
  entryDate: string;
  rating: number;
  notes: string;
  sideEffects?: string;
  photoUrls: string[];
  createdAt: string;
}

interface ExperimentSettings {
  trackingTypes: string[];
  checkinFrequency: string;
  trackingCategories: string[];
  primaryMetric: string;
  expectedDurationDays: number;
}

interface ExperimentRecord {
  id: string;
  theoryId: string;
  theoryTitle: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  isPublic: boolean;
  outcomeRating: number | null;
  notes: string;
  followedInterventions: string[];
}

interface LinkedHabit {
  linkId: string;
  habitId: string;
  actionText: string;
  frequency: string;
}

interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.floor(
    (new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  ));
}

function formatDuration(days: number): string {
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem > 0 ? `${weeks}w ${rem}d` : `${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? `${months}mo ${rem}d` : `${months} month${months !== 1 ? "s" : ""}`;
}

// Auto-adherence from habit_completions (habits tab is source of truth)
function computeAdherence(
  linkedHabits: LinkedHabit[],
  completions: HabitCompletion[],
  startedAt: string,
  endedAt: string | null,
): number | null {
  if (linkedHabits.length === 0) return null;
  const end = endedAt ?? todayStr();
  const daysElapsed = daysBetween(startedAt, end);
  if (daysElapsed === 0) return null;
  const linkedIds = new Set(linkedHabits.map((h) => h.habitId));
  const relevantCompletions = completions.filter(
    (c) => linkedIds.has(c.habitId) && c.completedDate >= startedAt && c.completedDate <= end
  );
  const possible = daysElapsed * linkedHabits.length;
  return Math.round((relevantCompletions.length / possible) * 100);
}

// Check-in suggestion: how many days since last entry (or since start)
function daysSinceLastEntry(entries: TimelineEntry[], startedAt: string): number {
  if (entries.length === 0) return daysBetween(startedAt, todayStr());
  const sorted = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  return daysBetween(sorted[0].entryDate, todayStr());
}

// ── Check-in Note Form (lightweight — habits tracked separately) ─────────────

function CheckInForm({
  experimentId,
  showPhotos,
  onSaved,
  onCancel,
}: {
  experimentId: string;
  showPhotos: boolean;
  onSaved: (entry: TimelineEntry) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of photoFiles) {
      const form = new FormData();
      form.append("file", file);
      form.append("experimentId", experimentId);
      const res = await fetch("/api/journal-photos", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !notes.trim()) return;
    setSaving(true);
    setError("");
    try {
      let photoUrls: string[] = [];
      if (photoFiles.length > 0) photoUrls = await uploadPhotos();

      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentId,
          entryDate,
          rating,
          notes: notes.trim(),
          sideEffects: sideEffects.trim() || undefined,
          photoUrls,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const entry: TimelineEntry = await res.json();
      onSaved(entry);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-40 font-mono" />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">How is it going? <span className="text-muted-foreground font-normal">({rating}/10)</span></Label>
              <input
                type="range" min={1} max={10} value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Habit tracking is automatic</span> — mark your habits done in the Habits tab and your adherence updates here automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">What have you noticed?</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How is your body responding? Any changes you've noticed?" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Side effects <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea rows={2} value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="Anything unexpected?" />
          </div>

          {showPhotos && (
            <div className="space-y-1.5">
              <Label className="text-xs">Photo <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="file" accept="image/*" multiple
                onChange={(e) => { if (e.target.files) setPhotoFiles(Array.from(e.target.files)); }}
                className="text-xs"
              />
              {photoFiles.length > 0 && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {photoFiles.length} file{photoFiles.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || !notes.trim()}>
              {saving ? "Saving…" : "Post Check-in"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Timeline Entry Card ─────────────────────────────────────────────────────

function EntryCard({
  entry, onDelete,
}: {
  entry: TimelineEntry;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/journal-entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) onDelete(entry.id);
    else setDeleting(false);
  }

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />
      <div className={cn(
        "absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 bg-background",
        entry.rating >= 7 ? "border-emerald-500" : entry.rating >= 4 ? "border-amber-500" : "border-rose-500"
      )} />

      <div className="ml-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{entry.entryDate}</span>
            <span className={cn(
              "font-mono text-xs font-semibold",
              entry.rating >= 7 ? "text-emerald-600" : entry.rating >= 4 ? "text-amber-600" : "text-rose-600"
            )}>
              {entry.rating}/10
            </span>
          </div>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="text-muted-foreground hover:text-destructive transition-colors text-[11px]">
            {deleting ? "…" : "delete"}
          </button>
        </div>

        <p className="text-sm text-foreground mt-1.5 leading-relaxed">{entry.notes}</p>

        {entry.sideEffects && (
          <div className="mt-2 px-2.5 py-1.5 bg-rose-500/5 border border-rose-500/15 rounded-md">
            <p className="text-[11px] text-rose-600">
              <span className="font-medium">Side effects:</span> {entry.sideEffects}
            </p>
          </div>
        )}

        {entry.photoUrls.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {entry.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-border" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Complete Modal ────────────────────────────────────────────────────────────

function CompleteModal({
  experiment, onClose, onCompleted,
}: {
  experiment: ExperimentRecord;
  onClose: () => void;
  onCompleted: (updated: Partial<ExperimentRecord>) => void;
}) {
  const [outcomeRating, setOutcomeRating] = useState(experiment.outcomeRating ?? 5);
  const [finalNotes, setFinalNotes] = useState(experiment.notes || "");
  const [makePublic, setMakePublic] = useState(experiment.isPublic);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/experiment-logs/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        endedAt: todayStr(),
        outcomeRating,
        notes: finalNotes.trim(),
        isPublic: makePublic,
      }),
    });
    if (res.ok) {
      onCompleted({ status: "completed", endedAt: todayStr(), outcomeRating, notes: finalNotes.trim(), isPublic: makePublic });
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="p-5 pb-3">
          <h3 className="font-semibold text-foreground">Wrap up experiment</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Rate your overall outcome and optionally share with the community.</p>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Overall outcome <span className="font-normal text-muted-foreground">({outcomeRating}/10)</span></Label>
            <input type="range" min={1} max={10} value={outcomeRating}
              onChange={(e) => setOutcomeRating(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Final thoughts <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea rows={3} value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} placeholder="How did it go? What did you learn?" />
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setMakePublic(!makePublic)}
              className={cn("w-9 h-5 rounded-full transition-colors relative", makePublic ? "bg-primary" : "bg-border")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", makePublic ? "translate-x-4" : "translate-x-0.5")} />
            </button>
            <div>
              <p className="text-xs text-foreground font-medium">Share with community</p>
              <p className="text-[10px] text-muted-foreground">Others can see your results and learn from your experience</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Complete Experiment"}</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ExperimentPage() {
  const router = useRouter();
  const { id: experimentId } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const [experiment, setExperiment] = useState<ExperimentRecord | null>(null);
  const [settings, setSettings] = useState<ExperimentSettings | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [linkedHabits, setLinkedHabits] = useState<LinkedHabit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [publishToggling, setPublishToggling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!experimentId) return;
    setLoading(true);
    try {
      const [logRes, entriesRes, settingsRes, habitsRes] = await Promise.all([
        fetch("/api/experiment-logs"),
        fetch(`/api/journal-entries?experimentId=${experimentId}`),
        fetch(`/api/experiment-settings?experimentId=${experimentId}`),
        fetch(`/api/experiment-habits?experimentId=${experimentId}`),
      ]);

      let startedAt = "";
      if (logRes.ok) {
        const logsData = await logRes.json();
        const logs = logsData.logs ?? logsData;
        const log = (Array.isArray(logs) ? logs : []).find((l: { id: string }) => l.id === experimentId);
        if (log) {
          const theoryRes = await fetch(`/api/theories/${log.theoryId}`);
          const theory = theoryRes.ok ? await theoryRes.json() : null;
          startedAt = log.startedAt;
          setExperiment({
            id: log.id,
            theoryId: log.theoryId,
            theoryTitle: theory?.title ?? "Unknown theory",
            startedAt: log.startedAt,
            endedAt: log.endedAt ?? null,
            status: log.status,
            isPublic: log.isPublic ?? false,
            outcomeRating: log.outcomeRating ?? null,
            notes: log.notes ?? "",
            followedInterventions: log.followedInterventions ?? [],
          });
        }
      }

      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s) setSettings(s);
      }

      if (habitsRes.ok) {
        const habits: LinkedHabit[] = await habitsRes.json();
        setLinkedHabits(habits);

        // Fetch habit completions from the habits tab (source of truth)
        if (habits.length > 0 && startedAt) {
          const today = todayStr();
          const compRes = await fetch(`/api/habits/completions?from=${startedAt}&to=${today}`);
          if (compRes.ok) {
            const comps = await compRes.json();
            const linkedIds = new Set(habits.map((h) => h.habitId));
            setHabitCompletions(comps.filter((c: HabitCompletion) => linkedIds.has(c.habitId)));
          }
        }
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [experimentId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/community");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) void fetchData();
  }, [user, fetchData]);

  function handleEntrySaved(entry: TimelineEntry) {
    setEntries((prev) => [entry, ...prev]);
    setShowNewEntry(false);
  }

  function handleEntryDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCompleted(updates: Partial<ExperimentRecord>) {
    setExperiment((prev) => prev ? { ...prev, ...updates } : prev);
  }

  async function togglePublic() {
    if (!experiment || publishToggling) return;
    setPublishToggling(true);
    const newVal = !experiment.isPublic;
    const res = await fetch(`/api/experiment-logs/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: newVal }),
    });
    if (res.ok) setExperiment((prev) => prev ? { ...prev, isPublic: newVal } : prev);
    setPublishToggling(false);
  }

  const adherence = useMemo(
    () => computeAdherence(linkedHabits, habitCompletions, experiment?.startedAt ?? "", experiment?.endedAt ?? null),
    [linkedHabits, habitCompletions, experiment]
  );

  const daysSinceLast = useMemo(
    () => experiment ? daysSinceLastEntry(entries, experiment.startedAt) : 0,
    [entries, experiment]
  );

  if (authLoading || loading) {
    return (
      <div className="py-8">
        <p className="text-sm text-muted-foreground animate-pulse">Loading experiment…</p>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-muted-foreground">Experiment not found.</p>
        <Link href="/profile" className="text-primary text-sm inline-block">← Back to profile</Link>
      </div>
    );
  }

  const today = todayStr();
  const daysElapsed = daysBetween(experiment.startedAt, experiment.endedAt ?? today);
  const showPhotos = settings?.trackingTypes?.includes("photos") ?? false;
  const isActive = experiment.status === "in_progress";

  // Suggest check-in if active and it's been 7+ days since last entry
  const showCheckinPrompt = isActive && !showNewEntry && daysSinceLast >= 7;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to profile
        </Link>

        <h1 className="text-lg font-semibold text-foreground mt-3 leading-normal">
          {experiment.theoryTitle}
        </h1>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
            {isActive ? "Active" : "Completed"}
          </Badge>
          {experiment.isPublic && (
            <Badge variant="secondary" className="text-[10px]">Public</Badge>
          )}
          {settings?.primaryMetric && (
            <span className="text-[11px] text-muted-foreground italic">
              Tracking: {settings.primaryMetric}
            </span>
          )}
        </div>

        {/* Auto duration display — no fixed length */}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground font-mono">
          <span className="text-foreground font-semibold text-sm">{formatDuration(daysElapsed)}</span>
          <span>running</span>
          <span>·</span>
          <span>started {experiment.startedAt}</span>
          {experiment.endedAt && <><span>·</span><span>ended {experiment.endedAt}</span></>}
        </div>

        {/* Adherence from habit completions */}
        {adherence !== null && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-muted-foreground">Habit adherence (from Habits tab)</span>
              <span className={cn(
                "font-semibold",
                adherence >= 80 ? "text-emerald-600" : adherence >= 50 ? "text-amber-600" : "text-rose-600"
              )}>{adherence}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className={cn(
                "h-full rounded-full transition-all",
                adherence >= 80 ? "bg-emerald-500" : adherence >= 50 ? "bg-amber-500" : "bg-rose-500"
              )} style={{ width: `${adherence}%` }} />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground font-mono flex-wrap">
          <span>{entries.length} check-in{entries.length !== 1 ? "s" : ""}</span>
          {linkedHabits.length > 0 && (
            <span>{linkedHabits.length} linked habit{linkedHabits.length !== 1 ? "s" : ""}</span>
          )}
          {experiment.outcomeRating !== null && (
            <span className="text-foreground font-semibold">{experiment.outcomeRating}/10 outcome</span>
          )}
        </div>

        {/* Linked habits list */}
        {linkedHabits.length > 0 && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Tracked habits <span className="font-normal normal-case opacity-70">— mark done in the Habits tab</span>
            </p>
            <div className="space-y-0.5">
              {linkedHabits.map((h) => (
                <p key={h.habitId} className="text-xs text-foreground">• {h.actionText}</p>
              ))}
            </div>
            <Link href="/profile" className="text-[11px] text-primary hover:opacity-80 mt-2 inline-block">
              → Go to Habits tab
            </Link>
          </div>
        )}

        {/* Interventions */}
        {experiment.followedInterventions.length > 0 && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">What you&apos;re trying</p>
            <div className="space-y-0.5">
              {experiment.followedInterventions.map((iv) => (
                <p key={iv} className="text-xs text-foreground">• {iv}</p>
              ))}
            </div>
          </div>
        )}

        {settings && settings.trackingCategories.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {settings.trackingCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-5" />

      {/* ── Check-in prompt ── */}
      {showCheckinPrompt && (
        <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {daysSinceLast >= 30
                  ? "It's been over a month — time for a check-in 🏁"
                  : daysSinceLast >= 14
                  ? "2+ weeks in — how's it going? 📊"
                  : "You're 1 week in — worth writing a check-in"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysSinceLast === daysElapsed
                  ? "You haven't logged a check-in yet."
                  : `Last check-in was ${daysSinceLast} day${daysSinceLast !== 1 ? "s" : ""} ago.`}
              </p>
            </div>
            <Button size="sm" onClick={() => setShowNewEntry(true)}>
              Check in
            </Button>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {isActive && (
          <>
            <Button size="sm" variant={showNewEntry ? "ghost" : "default"} onClick={() => setShowNewEntry(!showNewEntry)}>
              {showNewEntry ? "Cancel" : "+ Add Check-in"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCompleteModal(true)}>
              Complete Experiment
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={togglePublic} disabled={publishToggling} className="ml-auto text-xs">
          {publishToggling ? "…" : experiment.isPublic ? "Make Private" : "Share Publicly"}
        </Button>
      </div>

      {/* ── Check-in Form ── */}
      {showNewEntry && (
        <div className="mb-6">
          <CheckInForm
            experimentId={experimentId}
            showPhotos={showPhotos}
            onSaved={handleEntrySaved}
            onCancel={() => setShowNewEntry(false)}
          />
        </div>
      )}

      {/* ── Completed summary ── */}
      {!isActive && experiment.notes && (
        <Card className="mb-5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Final thoughts</p>
            <p className="text-sm text-foreground leading-relaxed">{experiment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Timeline ── */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Check-ins ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No check-ins yet.</p>
            {isActive && (
              <p className="text-xs text-muted-foreground mt-1">
                Your habit adherence is tracked automatically. Add a check-in when you have something to note.
              </p>
            )}
          </div>
        ) : (
          <div>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleEntryDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Complete Modal ── */}
      {showCompleteModal && experiment && (
        <CompleteModal
          experiment={experiment}
          onClose={() => setShowCompleteModal(false)}
          onCompleted={handleCompleted}
        />
      )}
    </div>
  );
}
