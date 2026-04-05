"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TheoryBlock, PubMedArticle, GenerateResult, EvaluateResult } from "@/types/theory-block";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const UNPUBLISHED_STORAGE_KEY = "unpublished_create_result";

const TIER_CONFIG = {
  Strong:      { dot: "bg-emerald-600/70", variant: "strong"      as const },
  Emerging:    { dot: "bg-amber-500/70",   variant: "emerging"    as const },
  Theoretical: { dot: "bg-blue-400/70",    variant: "theoretical" as const },
  Unsupported: { dot: "bg-rose-400/70",    variant: "unsupported" as const },
} as const;

const GOAL_CATEGORIES = ["Cognitive", "Metabolic", "Mood", "Physical", "Recovery", "Sleep"];

// ── References ────────────────────────────────────────────────────────────────

function References({ pmids, articles }: { pmids: string[]; articles: PubMedArticle[] }) {
  const cited = pmids.map((id) => articles.find((a) => a.pmid === id)).filter((a): a is PubMedArticle => !!a);
  if (cited.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
      <ul className="space-y-1.5">
        {cited.map((a) => (
          <li key={a.pmid} className="flex items-start gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">↗</span>
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 hover:underline leading-snug">
              {a.title}
              <span className="text-muted-foreground ml-1">— {a.authors} ({a.year}, {a.source})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Action Steps ──────────────────────────────────────────────────────────────

function ActionSteps({ steps }: { steps: string[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-4 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
      <p className="text-xs font-semibold text-emerald-400 mb-2">Act on this today</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-xs text-foreground/80 leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── AI Generated block ────────────────────────────────────────────────────────

function GeneratedBlock({
  block, articles, isSelected, onToggleSelect, isPublished,
}: {
  block: TheoryBlock; articles: PubMedArticle[];
  isSelected: boolean; onToggleSelect: (b: TheoryBlock) => void; isPublished: boolean;
}) {
  const cfg = TIER_CONFIG[block.evidenceTier];
  const [showInterventions, setShowInterventions] = useState(false);

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isPublished && "border-emerald-500/40",
      isSelected && !isPublished && "border-primary/50 ring-1 ring-primary/20",
    )}>
      <CardHeader className="p-5 pb-3 flex-row items-center justify-between gap-2 space-y-0 bg-card">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
          <Badge variant={cfg.variant}>{block.evidenceTier}</Badge>
        </div>
        {isPublished ? (
          <Link href="/community">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">Published ✓</Badge>
          </Link>
        ) : (
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onToggleSelect(block)}
          >
            {isSelected ? "✓ Added" : "+ Add"}
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-base leading-normal">{block.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{block.goalStatement}</p>
        </div>
        {block.keyInsight && (
          <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg">
            <p className="text-xs font-semibold text-primary mb-0.5">Key insight</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{block.keyInsight}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">{block.mechanismSummary}</p>
        {block.actionSteps && block.actionSteps.length > 0 && (
          <ActionSteps steps={block.actionSteps} />
        )}
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>{block.goalCategory}</span><span>·</span>
          <span>Risk {block.riskLevel}</span><span>·</span>
          <span>{block.reversibility} reversibility</span>
        </div>
        {block.interventions.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowInterventions((v) => !v)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              {showInterventions ? "▲ Hide intervention" : "▼ Show intervention"}
            </button>
            {showInterventions && (
              <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground">{block.interventions[0].name}</p>
                <p className="text-xs text-muted-foreground mt-1">{block.interventions[0].mechanism}</p>
                <ol className="mt-2 space-y-1">
                  {block.interventions[0].steps.map((step, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                      <span className="text-muted-foreground shrink-0">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ol>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>{block.interventions[0].durationDays} days</span>
                  <span>·</span>
                  <span>{block.interventions[0].expectedMagnitude} expected effect</span>
                </div>
                {block.interventions[0].contraindications.length > 0 && (
                  <p className="mt-1 text-xs text-red-400">⚠ {block.interventions[0].contraindications.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        )}
        {block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        )}
        {block.references && block.references.length > 0 && (
          <References pmids={block.references} articles={articles} />
        )}
      </CardContent>
    </Card>
  );
}

// ── Evaluated user theory block ───────────────────────────────────────────────

function EvaluatedBlock({
  block, articles, onPublish, isPublished, isPublishing,
}: {
  block: TheoryBlock; articles: PubMedArticle[];
  onPublish: () => void; isPublished: boolean; isPublishing: boolean;
}) {
  const cfg = TIER_CONFIG[block.evidenceTier];
  const [showInterventions, setShowInterventions] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-5 pb-3 flex-row items-center justify-between gap-2 space-y-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
          <Badge variant={cfg.variant}>{block.evidenceTier}</Badge>
          <Badge variant="default" className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">Your theory</Badge>
        </div>
        {isPublished ? (
          <Link href="/community">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">Published ✓</Badge>
          </Link>
        ) : (
          <Button size="sm" onClick={onPublish} disabled={isPublishing}>
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-base leading-normal">{block.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{block.goalStatement}</p>
        </div>

        {block.aiOverview && (
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

        {block.keyInsight && (
          <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg">
            <p className="text-xs font-semibold text-primary mb-0.5">Key insight</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{block.keyInsight}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mechanism</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{block.mechanismSummary}</p>
        </div>

        {block.actionSteps && block.actionSteps.length > 0 && (
          <ActionSteps steps={block.actionSteps} />
        )}

        <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          <span>{block.goalCategory}</span><span>·</span>
          <span>Risk <span className={
            block.riskLevel === "High" ? "text-red-400"
            : block.riskLevel === "Moderate" ? "text-amber-400"
            : "text-emerald-400"
          }>{block.riskLevel}</span></span>
          <span>·</span><span>{block.reversibility} reversibility</span>
        </div>

        {block.interventions.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowInterventions((v) => !v)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              {showInterventions ? "▲ Hide protocol" : "▼ Show protocol"}
            </button>
            {showInterventions && (
              <div className="mt-2 space-y-2">
                {block.interventions.map((iv, i) => (
                  <div key={i} className="p-3 bg-muted/40 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground">{iv.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{iv.mechanism}</p>
                    <ol className="mt-2 space-y-1">
                      {iv.steps.map((step, si) => (
                        <li key={si} className="text-xs text-foreground/80 flex items-start gap-1.5">
                          <span className="text-muted-foreground shrink-0">{si + 1}.</span>{step}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span>{iv.durationDays} days</span><span>·</span>
                      <span>{iv.expectedMagnitude} expected</span>
                    </div>
                    {iv.contraindications.length > 0 && (
                      <p className="mt-1 text-xs text-red-400">⚠ {iv.contraindications.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        )}

        {block.references && block.references.length > 0 && (
          <References pmids={block.references} articles={articles} />
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function CreatePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState<string | undefined>();

  // ── AI Generate state ──
  const [aiGoal, setAiGoal] = useState("");
  const [aiResult, setAiResult] = useState<GenerateResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [publishingAll, setPublishingAll] = useState(false);
  const [pendingSelectedIds, setPendingSelectedIds] = useState<string[]>([]);

  // ── Write Your Own state ──
  const [ownTitle, setOwnTitle] = useState("");
  const [ownGoal, setOwnGoal] = useState("");
  const [ownTheory, setOwnTheory] = useState("");
  const [ownProtocol, setOwnProtocol] = useState("");
  const [ownCategory, setOwnCategory] = useState("Physical");
  const [ownResult, setOwnResult] = useState<EvaluateResult | null>(null);
  const [ownLoading, setOwnLoading] = useState(false);
  const [ownError, setOwnError] = useState<string | null>(null);
  const [ownPublished, setOwnPublished] = useState(false);
  const [ownPublishing, setOwnPublishing] = useState(false);
  const [pendingOwnPublish, setPendingOwnPublish] = useState(false);

  const TIERS: TheoryBlock["evidenceTier"][] = ["Strong", "Emerging", "Theoretical", "Unsupported"];
  const TIER_ORDER = ["Strong", "Emerging", "Theoretical", "Unsupported"] as const;

  function combineSelectedBlocks(blocks: TheoryBlock[]): TheoryBlock {
    if (blocks.length === 1) return blocks[0];
    const sorted = [...blocks].sort(
      (a, b) => TIER_ORDER.indexOf(a.evidenceTier) - TIER_ORDER.indexOf(b.evidenceTier)
    );
    const primary = sorted[0];
    const tierTags = blocks.map((b) => b.evidenceTier);
    const allTags = Array.from(new Set(blocks.flatMap((b) => b.tags).concat(tierTags)));
    const allInterventions = blocks.flatMap((b) => b.interventions);
    const allRefs = Array.from(new Set(blocks.flatMap((b) => b.references ?? [])));
    const allActionSteps = Array.from(new Set(blocks.flatMap((b) => b.actionSteps ?? [])));
    return {
      ...primary,
      tags: allTags,
      interventions: allInterventions,
      references: allRefs,
      actionSteps: allActionSteps.length > 0 ? allActionSteps : undefined,
      combinedTiers: blocks.map((b) => b.evidenceTier),
      createdType: "ai_generated",
    };
  }

  // Restore after auth redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const publish = searchParams.get("publish");
    if (publish === "1") {
      try {
        const stored = sessionStorage.getItem(UNPUBLISHED_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            mode: "ai" | "own";
            aiResult?: GenerateResult;
            selectedIds?: string[];
            ownResult?: EvaluateResult;
          };
          if (parsed.mode === "ai" && parsed.aiResult) {
            setAiResult(parsed.aiResult);
            setSelectedIds(new Set(parsed.selectedIds ?? []));
            setPendingSelectedIds(parsed.selectedIds ?? []);
          } else if (parsed.mode === "own" && parsed.ownResult) {
            setOwnResult(parsed.ownResult);
            setPendingOwnPublish(true);
          }
          sessionStorage.removeItem(UNPUBLISHED_STORAGE_KEY);
        }
      } catch { /* ignore */ }
      window.history.replaceState({}, "", "/create");
    }
  }, [searchParams]);

  useEffect(() => {
    if (pendingSelectedIds.length > 0 && user && aiResult) {
      const blocks = aiResult.blocks.filter((b) => pendingSelectedIds.includes(b.id));
      setPendingSelectedIds([]);
      void doPublishAiBlocks(blocks);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSelectedIds, user, aiResult]);

  useEffect(() => {
    if (pendingOwnPublish && user && ownResult) {
      setPendingOwnPublish(false);
      void doPublishOwn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOwnPublish, user, ownResult]);

  function toggleSelectAi(block: TheoryBlock) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(block.id)) { next.delete(block.id); } else { next.add(block.id); }
      return next;
    });
  }

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aiGoal.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setSelectedIds(new Set());
    setPublishedIds(new Set());
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: aiGoal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Generation failed"); return; }
      setAiResult(data as GenerateResult);
    } catch { setAiError("Network error"); }
    finally { setAiLoading(false); }
  }

  async function doPublishAiBlocks(blocks: TheoryBlock[]) {
    setPublishingAll(true);
    setAiError(null);
    const blockToPublish = combineSelectedBlocks(blocks);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...blockToPublish, createdType: "ai_generated" }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({
          mode: "ai", aiResult, selectedIds: blocks.map((b) => b.id),
        }));
        setLoginRedirect("/create?publish=1");
        setLoginModalOpen(true);
        setPublishingAll(false);
        return;
      }
      const data = await res.json();
      setAiError(data.error || "Publish failed");
      setPublishingAll(false);
      return;
    }
    setPublishedIds((prev) => new Set(Array.from(prev).concat(blocks.map((b) => b.id))));
    setSelectedIds(new Set());
    setPublishingAll(false);
  }

  function handlePublishAiSelected() {
    if (!aiResult) return;
    const blocks = aiResult.blocks.filter((b) => selectedIds.has(b.id));
    if (!user) {
      sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({
        mode: "ai", aiResult, selectedIds: Array.from(selectedIds),
      }));
      setLoginRedirect("/create?publish=1");
      setLoginModalOpen(true);
      return;
    }
    void doPublishAiBlocks(blocks);
  }

  async function handleOwnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownTitle.trim() || !ownGoal.trim() || !ownTheory.trim()) return;
    setOwnLoading(true);
    setOwnError(null);
    setOwnResult(null);
    setOwnPublished(false);
    try {
      const res = await fetch("/api/evaluate-theory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ownTitle.trim(), goal: ownGoal.trim(),
          theory: ownTheory.trim(), protocol: ownProtocol.trim(), category: ownCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setOwnError(data.error || "Evaluation failed"); return; }
      setOwnResult(data as EvaluateResult);
    } catch { setOwnError("Network error"); }
    finally { setOwnLoading(false); }
  }

  async function doPublishOwn() {
    if (!ownResult) return;
    setOwnPublishing(true);
    setOwnError(null);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ownResult.block),
    });
    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({ mode: "own", ownResult }));
        setLoginRedirect("/create?publish=1");
        setLoginModalOpen(true);
      } else {
        const data = await res.json();
        setOwnError(data.error || "Publish failed");
      }
      setOwnPublishing(false);
      return;
    }
    setOwnPublished(true);
    setOwnPublishing(false);
  }

  function handlePublishOwn() {
    if (!user) {
      sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({ mode: "own", ownResult }));
      setLoginRedirect("/create?publish=1");
      setLoginModalOpen(true);
      return;
    }
    void doPublishOwn();
  }

  const unpublishedSelected = aiResult
    ? aiResult.blocks.filter((b) => selectedIds.has(b.id) && !publishedIds.has(b.id))
    : [];

  return (
    <div className="pb-24">
      <h1 className="text-xl font-semibold text-foreground mb-1">Create</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Generate a theory with AI, or write your own and have it cross-referenced with research.
      </p>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
          <TabsTrigger value="own">Write Your Own</TabsTrigger>
        </TabsList>

        {/* ── AI Generate ── */}
        <TabsContent value="ai">
          <form onSubmit={handleAiSubmit} className="space-y-3 max-w-lg">
            <Textarea
              value={aiGoal}
              onChange={(e) => setAiGoal(e.target.value)}
              placeholder="e.g. Improve focus and energy with better sleep and morning light"
              rows={3}
              required
            />
            <Button type="submit" disabled={aiLoading}>
              {aiLoading ? "Searching PubMed & generating…" : "Generate theory blocks"}
            </Button>
          </form>

          {aiError && <p className="mt-4 text-sm text-destructive">{aiError}</p>}

          {aiResult && (
            <div className="mt-8">
              {aiResult.articles.length > 0 && (
                <div className="mb-4 p-3 bg-primary/8 border border-primary/20 rounded-lg space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-primary text-sm shrink-0">📚</span>
                    <p className="text-xs text-foreground/80">
                      Found <strong>{aiResult.articles.length} PubMed articles</strong> across targeted searches.
                    </p>
                  </div>
                  {aiResult.searchQuery && (
                    <p className="text-xs text-muted-foreground pl-5 italic">{aiResult.searchQuery}</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-4">
                Click <span className="text-foreground font-medium">+ Add</span> on the blocks you want, then publish them individually or together.
              </p>
              <div className="space-y-8">
                {TIERS.map((tier) => {
                  const tierBlocks = aiResult.blocks.filter((b) => b.evidenceTier === tier);
                  if (tierBlocks.length === 0) return null;
                  const tierDot = TIER_CONFIG[tier].dot;
                  return (
                    <div key={tier}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", tierDot)} />
                        <h3 className="text-sm font-semibold text-foreground">{tier}</h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          {tierBlocks.length} {tierBlocks.length === 1 ? "theory" : "theories"}
                        </span>
                      </div>
                      <Separator className="mb-4" />
                      <div className="space-y-4">
                        {tierBlocks.map((block) => (
                          <GeneratedBlock
                            key={block.id}
                            block={block}
                            articles={aiResult.articles}
                            isSelected={selectedIds.has(block.id)}
                            onToggleSelect={toggleSelectAi}
                            isPublished={publishedIds.has(block.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Write Your Own ── */}
        <TabsContent value="own">
          {!ownResult ? (
            <form onSubmit={handleOwnSubmit} className="space-y-5 max-w-lg">
              <div className="space-y-1.5">
                <Label htmlFor="theory-name">Theory name</Label>
                <Input
                  id="theory-name"
                  value={ownTitle}
                  onChange={(e) => setOwnTitle(e.target.value)}
                  placeholder="e.g. Melanin preservation through PTH suppression"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="health-goal">Health goal</Label>
                <Input
                  id="health-goal"
                  value={ownGoal}
                  onChange={(e) => setOwnGoal(e.target.value)}
                  placeholder="What outcome are you trying to achieve?"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="theory-body">Your theory</Label>
                <p className="text-xs text-muted-foreground">Explain what you believe is happening biologically. The more specific the better.</p>
                <Textarea
                  id="theory-body"
                  value={ownTheory}
                  onChange={(e) => setOwnTheory(e.target.value)}
                  placeholder="e.g. I believe that keeping PTH levels low by supplementing calcium, magnesium, and boron tells the body it has sufficient vitamin D, reducing the enzymatic breakdown of melanin..."
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="protocol">Proposed protocol <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="protocol"
                  value={ownProtocol}
                  onChange={(e) => setOwnProtocol(e.target.value)}
                  placeholder="e.g. 1000mg calcium, 400mg magnesium glycinate, 3mg boron daily…"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={ownCategory}
                  onChange={(e) => setOwnCategory(e.target.value)}
                >
                  {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              {ownError && <p className="text-sm text-destructive">{ownError}</p>}
              <Button type="submit" disabled={ownLoading}>
                {ownLoading ? "Cross-referencing with research…" : "Evaluate my theory →"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your original theory</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{ownResult.block.userTheoryText}</p>
                </CardContent>
              </Card>

              {ownResult.articles.length > 0 && (
                <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-primary text-sm shrink-0">📚</span>
                    <p className="text-xs text-foreground/80">
                      Found <strong>{ownResult.articles.length} PubMed articles</strong> to cross-reference your theory.
                    </p>
                  </div>
                  {ownResult.searchQuery && (
                    <p className="text-xs text-muted-foreground pl-5 italic mt-0.5">{ownResult.searchQuery}</p>
                  )}
                </div>
              )}

              <EvaluatedBlock
                block={ownResult.block}
                articles={ownResult.articles}
                onPublish={handlePublishOwn}
                isPublished={ownPublished}
                isPublishing={ownPublishing}
              />

              {ownError && <p className="text-sm text-destructive">{ownError}</p>}

              <button type="button" onClick={() => { setOwnResult(null); setOwnPublished(false); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Revise my theory
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky publish bar */}
      {unpublishedSelected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pb-6 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 shadow-2xl">
            <div className="flex -space-x-1">
              {unpublishedSelected.map((b) => (
                <span key={b.id}
                  className={cn("w-2.5 h-2.5 rounded-full border-2 border-card", TIER_CONFIG[b.evidenceTier].dot)}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{unpublishedSelected.length}</span>{" "}
              {unpublishedSelected.length === 1 ? "block" : "blocks"} selected
            </span>
            <Button size="sm" onClick={handlePublishAiSelected} disabled={publishingAll}>
              {publishingAll ? "Publishing…" : "Publish →"}
            </Button>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => { setLoginModalOpen(false); setLoginRedirect(undefined); }}
        redirectAfterLogin={loginRedirect}
      />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm py-8">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}
