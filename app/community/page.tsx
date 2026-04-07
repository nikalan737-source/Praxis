"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { TheoryBlock } from "@/types/theory-block";
import type { PublicLog, LogComment } from "@/types/experiment-log";
import { useSavedTheories } from "@/hooks/useSavedTheories";
import { useUpvotes } from "@/hooks/useUpvotes";
import { useTheoryCounts } from "@/hooks/useTheoryCounts";
import { SaveButton } from "@/components/SaveButton";
import { UpvoteButton } from "@/components/UpvoteButton";
import { LoginModal } from "@/components/LoginModal";
import { ExperimentSetupModal } from "@/components/ExperimentSetupModal";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const EVIDENCE_TIERS: TheoryBlock["evidenceTier"][] = ["Strong", "Emerging", "Theoretical", "Unsupported"];
const PAGE_SIZE = 5;

const TIER_DOT: Record<TheoryBlock["evidenceTier"], string> = {
  Strong:      "bg-emerald-600/70",
  Emerging:    "bg-amber-500/70",
  Theoretical: "bg-blue-400/70",
  Unsupported: "bg-rose-400/70",
};

const TIER_VARIANT: Record<TheoryBlock["evidenceTier"], "strong" | "emerging" | "theoretical" | "unsupported"> = {
  Strong:      "strong",
  Emerging:    "emerging",
  Theoretical: "theoretical",
  Unsupported: "unsupported",
};

// Section colors for combined-block intervention groups
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

// ── Comment ──────────────────────────────────────────────────────────────────

function CommentItem({ comment, onLoginRequest }: { comment: LogComment; onLoginRequest: () => void }) {
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

// ── Log entry ─────────────────────────────────────────────────────────────────

function LogEntry({ log, onLoginRequest }: { log: PublicLog; onLoginRequest: () => void }) {
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
            {log.status === "in_progress" && (
              <Badge variant="default" className="text-[10px]">In progress</Badge>
            )}
            {log.outcomeRating !== null && (
              <span className="text-xs font-semibold text-foreground">{log.outcomeRating}/10</span>
            )}
            {log.adherencePercent !== null && (
              <span className="text-xs text-muted-foreground">{log.adherencePercent}% adherence</span>
            )}
          </div>
          {log.notes && <p className={cn("text-sm text-foreground/80 mt-1", !expanded && "line-clamp-2")}>{log.notes}</p>}
        </div>
        <button type="button" onClick={toggleEndorse} disabled={endorseLoading}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full border shrink-0 transition-colors",
            endorsed
              ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
              : "border-border text-muted-foreground hover:border-foreground/40",
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
          {comments.map((c) => <CommentItem key={c.id} comment={c} onLoginRequest={onLoginRequest} />)}
          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            <Input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 min-w-0 text-xs h-8"
            />
            <Button type="submit" size="sm" disabled={posting || !commentText.trim()}>
              {posting ? "…" : "Post"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Logs panel ────────────────────────────────────────────────────────────────

function LogsPanel({ theoryId, onLoginRequest }: { theoryId: string; onLoginRequest: () => void }) {
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
      {logs.map((log) => <LogEntry key={log.id} log={log} onLoginRequest={onLoginRequest} />)}
      {hasMore && (
        <Button variant="outline" size="sm" onClick={() => fetchLogs(offset)} disabled={loading} className="w-full">
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

// ── Theory card ───────────────────────────────────────────────────────────────

function TheoryCard({
  block, isSaved, onToggleSave, saveCount, upvoteCount, isUpvoted,
  onToggleUpvote, upvoteLoading, logCount, avgOutcome, onLoginRequest, onStartExperiment,
}: {
  block: TheoryBlock; isSaved: boolean;
  onToggleSave: (id: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  saveCount: number; upvoteCount: number; isUpvoted: boolean;
  onToggleUpvote: (theoryId: string) => Promise<{ requiresAuth?: boolean } | undefined | void>;
  upvoteLoading: boolean; logCount: number; avgOutcome: number; onLoginRequest: () => void;
  onStartExperiment: (block: TheoryBlock) => void;
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
              <Badge variant="secondary" className="text-[10px]">
                {block.combinedTiers!.join(" / ")}
              </Badge>
            </>
          ) : (
            <>
              <span className={cn("w-2 h-2 rounded-full shrink-0", TIER_DOT[block.evidenceTier])} />
              <Badge variant={TIER_VARIANT[block.evidenceTier]}>
                {block.evidenceTier}
              </Badge>
            </>
          )}
          {block.createdType === "user_created" ? (
            <Badge variant="secondary" className="text-[10px]">
              User theory
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          )}
          <span className="text-xs text-muted-foreground font-mono">{block.goalCategory}</span>
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
            <span className="font-medium text-foreground">{logCount}</span> {logCount === 1 ? "experiment" : "experiments"}
            {logCount > 0 && <span> · {avgOutcome}/10 avg</span>}
          </span>
          <span className="text-xs text-muted-foreground font-mono">Risk {block.riskLevel}</span>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="default" size="sm" className="h-7 text-xs px-3"
              onClick={() => onStartExperiment(block)}>
              Start Experiment
            </Button>
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
      </CardContent>

      {/* Theory expansion */}
      {expandedPanel === "theory" && (
        <div className="border-t border-border p-4 bg-background/30 space-y-4">
          {/* AI overview for user theories */}
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

          {/* Original user theory text */}
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

          {/* Action steps */}
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

          {/* Interventions */}
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

          {/* Tags */}
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
          <LogsPanel theoryId={block.id} onLoginRequest={onLoginRequest} />
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type SortMode = "popular" | "recent" | "most_experiments" | "highest_rated";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "recent", label: "Recent" },
  { value: "most_experiments", label: "Most experiments" },
  { value: "highest_rated", label: "Highest rated" },
];

export default function CommunityPage() {
  const [blocks, setBlocks] = useState<TheoryBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TheoryBlock["evidenceTier"] | "">("");
  const [goalCategory, setGoalCategory] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [experimentTheory, setExperimentTheory] = useState<TheoryBlock | null>(null);
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedTheories();

  function handleStartExperiment(block: TheoryBlock) {
    if (!user) { setLoginModalOpen(true); return; }
    setExperimentTheory(block);
  }

  useEffect(() => {
    fetch("/api/theories")
      .then((res) => res.json())
      .then((data) => {
        setBlocks(data.map((row: Record<string, unknown>) => ({
          id: row.id,
          title: row.title,
          goalCategory: row.goalCategory,
          goalStatement: row.goalStatement,
          evidenceTier: row.evidenceTier,
          riskLevel: row.riskLevel,
          reversibility: row.reversibility,
          mechanismSummary: row.mechanismSummary,
          keyInsight: row.keyInsight,
          createdType: row.createdType,
          aiOverview: row.aiOverview,
          userTheoryText: row.userTheoryText,
          combinedTiers: row.combinedTiers,
          actionSteps: row.actionSteps,
          interventions: row.interventions ?? [],
          tags: row.tags ?? [],
          createdAt: row.createdAt,
          traction: { saves: 0, experimentLogs: 0, avgOutcome: 0 },
        })));
      })
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, []);

  const goalCategories = useMemo(
    () => Array.from(new Set(blocks.map((b) => b.goalCategory))).filter(Boolean).sort(),
    [blocks]
  );

  const filtered = useMemo(() => blocks.filter((block) => {
    const matchSearch = !search
      || block.title.toLowerCase().includes(search.toLowerCase())
      || block.goalStatement.toLowerCase().includes(search.toLowerCase())
      || block.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTier = !tier || block.evidenceTier === tier;
    const matchCategory = !goalCategory || block.goalCategory === goalCategory;
    return matchSearch && matchTier && matchCategory;
  }), [blocks, search, tier, goalCategory]);

  const theoryIds = useMemo(() => filtered.map((b) => b.id), [filtered]);
  const { counts } = useTheoryCounts(theoryIds);
  const { counts: upvoteCounts, userUpvoted, toggleUpvote, loading: upvoteLoading } = useUpvotes(theoryIds);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortMode) {
        case "recent":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "most_experiments":
          return (counts[b.id]?.logCount ?? 0) - (counts[a.id]?.logCount ?? 0);
        case "highest_rated":
          return (counts[b.id]?.avgOutcome ?? 0) - (counts[a.id]?.avgOutcome ?? 0);
        case "popular":
        default: {
          const scoreA = (counts[a.id]?.logCount ?? 0) * 3 + (counts[a.id]?.upvoteCount ?? 0) * 2 + (counts[a.id]?.saveCount ?? 0);
          const scoreB = (counts[b.id]?.logCount ?? 0) * 3 + (counts[b.id]?.upvoteCount ?? 0) * 2 + (counts[b.id]?.saveCount ?? 0);
          return scoreB - scoreA;
        }
      }
    });
  }, [filtered, counts, sortMode]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-6">Community</h1>

      {/* Search */}
      <div className="mb-3">
        <Input
          type="search"
          placeholder="Search theories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full font-mono placeholder:font-mono"
        />
      </div>

      {/* Sort pills */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSortMode(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
              sortMode === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tier + category filters */}
      <div className="flex gap-2 mb-6">
        <Select
          value={tier}
          onChange={(e) => setTier(e.target.value as TheoryBlock["evidenceTier"] | "")}
          className="w-auto"
        >
          <option value="">All tiers</option>
          {EVIDENCE_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select
          value={goalCategory}
          onChange={(e) => setGoalCategory(e.target.value)}
          className="w-auto"
        >
          <option value="">All categories</option>
          {goalCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm py-8">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8">No theories match your filters.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((block) => (
            <TheoryCard
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
              onLoginRequest={() => setLoginModalOpen(true)}
              onStartExperiment={handleStartExperiment}
            />
          ))}
        </div>
      )}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      {experimentTheory && (
        <ExperimentSetupModal
          isOpen={true}
          onClose={() => setExperimentTheory(null)}
          theory={{
            theoryId: experimentTheory.id,
            title: experimentTheory.title,
            evidenceTier: experimentTheory.evidenceTier,
            interventions: experimentTheory.interventions.map((iv) => ({ name: iv.name })),
          }}
        />
      )}
    </div>
  );
}
