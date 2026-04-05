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

interface HabitCheckin {
  id: string;
  habitId: string;
  journalEntryId: string;
  completed: boolean;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function calculateAdherence(
  linkedHabits: LinkedHabit[],
  checkins: HabitCheckin[],
  entries: TimelineEntry[]
): number | null {
  if (linkedHabits.length === 0 || entries.length === 0) return null;
  const total = entries.length * linkedHabits.length;
  if (total === 0) return null;
  const completed = checkins.filter((c) => c.completed).length;
  return Math.round((completed / total) * 100);
}

// ── New Entry Form ───────────────────────────────────────────────────────────

function NewEntryForm({
  experimentId,
  showPhotos,
  linkedHabits,
  onSaved,
  onCancel,
}: {
  experimentId: string;
  showPhotos: boolean;
  linkedHabits: LinkedHabit[];
  onSaved: (entry: TimelineEntry, newCheckins: HabitCheckin[]) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [habitChecks, setHabitChecks] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const h of linkedHabits) init[h.habitId] = false;
    return init;
  });

  function toggleHabitCheck(habitId: string) {
    setHabitChecks((prev) => ({ ...prev, [habitId]: !prev[habitId] }));
  }

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

      let newCheckins: HabitCheckin[] = [];
      if (linkedHabits.length > 0) {
        const checkins = linkedHabits.map((h) => ({
          habitId: h.habitId,
          completed: habitChecks[h.habitId] ?? false,
        }));
        const checkinRes = await fetch("/api/experiment-habit-checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experimentId, journalEntryId: entry.id, checkins }),
        });
        if (checkinRes.ok) {
          newCheckins = checkins.map((c) => ({
            id: "",
            habitId: c.habitId,
            journalEntryId: entry.id,
            completed: c.completed,
          }));
        }
      }
      onSaved(entry, newCheckins);
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
              <Label className="text-xs">How is it going?</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={10} value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className={cn(
                  "font-mono text-sm font-semibold w-8 text-center",
                  rating >= 7 ? "text-emerald-600" : rating >= 4 ? "text-amber-600" : "text-rose-600"
                )}>
                  {rating}/10
                </span>
              </div>
            </div>
          </div>

          {linkedHabits.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Habit check-in</Label>
              <div className="grid gap-1.5">
                {linkedHabits.map((habit) => {
                  const checked = habitChecks[habit.habitId] ?? false;
                  return (
                    <button
                      key={habit.habitId} type="button"
                      onClick={() => toggleHabitCheck(habit.habitId)}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors",
                        checked
                          ? "bg-emerald-500/8 border-emerald-500/20"
                          : "bg-muted/30 border-border hover:border-emerald-500/30"
                      )}
                    >
                      <div className={cn(
                        "shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                        checked ? "bg-emerald-500 border-emerald-500" : "border-border"
                      )}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs text-foreground leading-snug", checked && "line-through opacity-60")}>
                          {habit.actionText}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">What have you noticed?</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write your update…" />
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

          <div className="space-y-1.5">
            <Label className="text-xs">Side effects <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea rows={2} value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="Anything unexpected?" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || !notes.trim()}>
              {saving ? "Saving…" : "Post Update"}
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
  entry, onDelete, linkedHabits, checkins,
}: {
  entry: TimelineEntry;
  onDelete: (id: string) => void;
  linkedHabits: LinkedHabit[];
  checkins: HabitCheckin[];
}) {
  const [deleting, setDeleting] = useState(false);
  const entryCheckins = checkins.filter((c) => c.journalEntryId === entry.id);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/journal-entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) onDelete(entry.id);
    else setDeleting(false);
  }

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Timeline connector */}
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

        {entryCheckins.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {entryCheckins.map((checkin) => {
              const habit = linkedHabits.find((h) => h.habitId === checkin.habitId);
              return (
                <span key={checkin.habitId} className={cn(
                  "text-[11px] flex items-center gap-1",
                  checkin.completed ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {checkin.completed ? "✓" : "✗"} {habit?.actionText ?? "Habit"}
                </span>
              );
            })}
          </div>
        )}

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

// ── Publish / Complete Modal ─────────────────────────────────────────────────

function CompleteModal({
  experiment,
  onClose,
  onCompleted,
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
      onCompleted({
        status: "completed",
        endedAt: todayStr(),
        outcomeRating,
        notes: finalNotes.trim(),
        isPublic: makePublic,
      });
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="p-5 pb-3">
          <h3 className="font-semibold text-foreground">Wrap up experiment</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Rate your outcome and optionally share it with the community.</p>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Overall outcome</Label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={10} value={outcomeRating}
                onChange={(e) => setOutcomeRating(Number(e.target.value))}
                className="flex-1 accent-primary" />
              <span className="font-mono text-sm font-semibold w-8 text-center">{outcomeRating}/10</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Final thoughts <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea rows={3} value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} placeholder="How did it go? What did you learn?" />
          </div>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setMakePublic(!makePublic)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative",
                makePublic ? "bg-primary" : "bg-border"
              )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                makePublic ? "translate-x-4" : "translate-x-0.5"
              )} />
            </button>
            <div>
              <p className="text-xs text-foreground font-medium">Share with community</p>
              <p className="text-[10px] text-muted-foreground">Others can see your results and learn from your experience</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Complete Experiment"}
            </Button>
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
  const [allCheckins, setAllCheckins] = useState<HabitCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [publishToggling, setPublishToggling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!experimentId) return;
    setLoading(true);
    try {
      const [logRes, entriesRes, settingsRes, habitsRes, checkinsRes] = await Promise.all([
        fetch("/api/experiment-logs"),
        fetch(`/api/journal-entries?experimentId=${experimentId}`),
        fetch(`/api/experiment-settings?experimentId=${experimentId}`),
        fetch(`/api/experiment-habits?experimentId=${experimentId}`),
        fetch(`/api/experiment-habit-checkins?experimentId=${experimentId}`),
      ]);

      // Find this experiment from user's logs
      if (logRes.ok) {
        const logsData = await logRes.json();
        const logs = logsData.logs ?? logsData;
        const log = (Array.isArray(logs) ? logs : []).find(
          (l: { id: string }) => l.id === experimentId
        );
        if (log) {
          // Fetch theory title
          const theoryRes = await fetch(`/api/theories/${log.theoryId}`);
          const theory = theoryRes.ok ? await theoryRes.json() : null;
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
      if (habitsRes.ok) setLinkedHabits(await habitsRes.json());
      if (checkinsRes.ok) setAllCheckins(await checkinsRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [experimentId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/community");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) void fetchData();
  }, [user, fetchData]);

  function handleEntrySaved(entry: TimelineEntry, newCheckins: HabitCheckin[]) {
    setEntries((prev) => [entry, ...prev]);
    if (newCheckins.length > 0) setAllCheckins((prev) => [...prev, ...newCheckins]);
    setShowNewEntry(false);
  }

  function handleEntryDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setAllCheckins((prev) => prev.filter((c) => c.journalEntryId !== id));
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
    () => calculateAdherence(linkedHabits, allCheckins, entries),
    [linkedHabits, allCheckins, entries]
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
  const daysElapsed = daysBetween(experiment.startedAt, today);
  const expectedDays = settings?.expectedDurationDays ?? 30;
  const progress = Math.min(100, Math.round((daysElapsed / expectedDays) * 100));
  const showPhotos = settings?.trackingTypes?.includes("photos") ?? false;
  const isActive = experiment.status === "in_progress";

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

        {/* Status + meta */}
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

        {/* Progress bar (active only) */}
        {isActive && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-mono">
              <span>Day {daysElapsed + 1} / {expectedDays}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground font-mono flex-wrap">
          <span>Started {experiment.startedAt}</span>
          {experiment.endedAt && <span>Ended {experiment.endedAt}</span>}
          <span>{entries.length} update{entries.length !== 1 ? "s" : ""}</span>
          {adherence !== null && (
            <span className={cn(
              adherence >= 80 ? "text-emerald-600" : adherence >= 50 ? "text-amber-600" : "text-rose-600"
            )}>
              {adherence}% adherence
            </span>
          )}
          {experiment.outcomeRating !== null && (
            <span>{experiment.outcomeRating}/10 outcome</span>
          )}
        </div>

        {/* Categories */}
        {settings && settings.trackingCategories.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {settings.trackingCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>
            ))}
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
      </div>

      <Separator className="mb-5" />

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {isActive && (
          <>
            <Button size="sm" onClick={() => setShowNewEntry(!showNewEntry)}>
              {showNewEntry ? "Cancel" : "+ New Update"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCompleteModal(true)}>
              Complete Experiment
            </Button>
          </>
        )}
        <Button
          variant="ghost" size="sm"
          onClick={togglePublic}
          disabled={publishToggling}
          className="ml-auto text-xs"
        >
          {publishToggling ? "…" : experiment.isPublic ? "Make Private" : "Share Publicly"}
        </Button>
      </div>

      {/* ── New Entry Form ── */}
      {showNewEntry && (
        <div className="mb-6">
          <NewEntryForm
            experimentId={experimentId}
            showPhotos={showPhotos}
            linkedHabits={linkedHabits}
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
          Updates ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No updates yet.</p>
            {isActive && (
              <p className="text-xs text-muted-foreground mt-1">
                Click <span className="text-foreground font-medium">+ New Update</span> to log your first check-in.
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
                linkedHabits={linkedHabits}
                checkins={allCheckins}
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
