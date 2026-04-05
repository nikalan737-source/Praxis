"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TheoryBlock, PubMedArticle, GenerateResult } from "@/types/theory-block";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";

const UNPUBLISHED_STORAGE_KEY = "unpublished_generate_result";

const TIER_CONFIG = {
  Strong: {
    label: "What the research confirms",
    description: "Interventions backed by robust clinical evidence",
    badge: "bg-emerald-500/15 text-emerald-400",
    border: "border-zinc-700",
    header: "bg-zinc-800/60",
    dot: "bg-emerald-500",
  },
  Emerging: {
    label: "What shows promise",
    description: "Supported by early or observational studies",
    badge: "bg-amber-500/15 text-amber-400",
    border: "border-zinc-700",
    header: "bg-zinc-800/60",
    dot: "bg-amber-400",
  },
  Theoretical: {
    label: "What we theorize",
    description: "Mechanistically plausible but not yet well studied",
    badge: "bg-zinc-500/20 text-zinc-400",
    border: "border-zinc-700",
    header: "bg-zinc-800/60",
    dot: "bg-zinc-500",
  },
  Unsupported: {
    label: "Experimental territory",
    description: "Speculative or anecdotal — proceed with caution",
    badge: "bg-red-500/15 text-red-400",
    border: "border-zinc-700",
    header: "bg-zinc-800/60",
    dot: "bg-red-400",
  },
} as const;

const TIER_ORDER: TheoryBlock["evidenceTier"][] = ["Strong", "Emerging", "Theoretical", "Unsupported"];

function groupInterventionsByTier(interventions: TheoryBlock["interventions"]) {
  const groups = new Map<TheoryBlock["evidenceTier"], TheoryBlock["interventions"]>();
  for (const iv of interventions) {
    if (!groups.has(iv.tier)) groups.set(iv.tier, []);
    groups.get(iv.tier)!.push(iv);
  }
  return TIER_ORDER.filter((t) => groups.has(t)).map((t) => ({ tier: t, interventions: groups.get(t)! }));
}

function References({ pmids, articles }: { pmids: string[]; articles: PubMedArticle[] }) {
  const cited = pmids
    .map((pmid) => articles.find((a) => a.pmid === pmid))
    .filter((a): a is PubMedArticle => !!a);

  if (cited.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-zinc-700/50">
      <p className="text-xs font-medium text-zinc-500 mb-2">Sources</p>
      <ul className="space-y-1.5">
        {cited.map((a) => (
          <li key={a.pmid} className="flex items-start gap-1.5">
            <span className="text-xs text-zinc-600 shrink-0 mt-0.5">↗</span>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline leading-snug"
            >
              {a.title}
              <span className="text-zinc-500 ml-1">— {a.authors} ({a.year}, {a.source})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierBlock({
  block,
  articles,
  isSelected,
  onToggleSelect,
  isPublished,
}: {
  block: TheoryBlock;
  articles: PubMedArticle[];
  isSelected: boolean;
  onToggleSelect: (block: TheoryBlock) => void;
  isPublished: boolean;
}) {
  const cfg = TIER_CONFIG[block.evidenceTier];
  const [showInterventions, setShowInterventions] = useState(false);

  return (
    <article className={`border rounded-2xl overflow-hidden transition-all ${
      isPublished ? "border-emerald-500/40 bg-zinc-900"
      : isSelected ? "border-white/30 bg-zinc-900 ring-1 ring-white/10"
      : `${cfg.border} bg-zinc-900`
    }`}>
      {/* Tier header */}
      <div className={`px-4 py-3 ${cfg.header} flex items-center justify-between gap-2 border-b border-zinc-700/50`}>
        <div className="flex items-center gap-2">
          {block.combinedTiers && block.combinedTiers.length > 1 ? (
            <>
              <div className="flex -space-x-0.5">
                {block.combinedTiers.map((t) => {
                  const dot = TIER_CONFIG[t as TheoryBlock["evidenceTier"]]?.dot ?? "bg-zinc-500";
                  return <span key={t} className={`w-2 h-2 rounded-full border border-zinc-900 ${dot}`} />;
                })}
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-200">
                {block.combinedTiers.join(" / ")}
              </span>
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {block.evidenceTier}
              </span>
            </>
          )}
          <span className="text-xs text-zinc-500">{cfg.label}</span>
        </div>
        {isPublished ? (
          <Link
            href="/community"
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-medium hover:bg-emerald-600/30 transition-colors"
          >
            Published ✓
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onToggleSelect(block)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              isSelected
                ? "bg-white text-zinc-900 hover:bg-zinc-200"
                : "border border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-white"
            }`}
          >
            {isSelected ? "✓ Added" : "+ Add"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base leading-snug">{block.title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{block.goalStatement}</p>

        {/* Key insight */}
        {block.keyInsight && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs font-semibold text-blue-400 mb-0.5">Key insight</p>
            <p className="text-sm text-blue-200 leading-relaxed">{block.keyInsight}</p>
          </div>
        )}

        {/* Mechanism */}
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{block.mechanismSummary}</p>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{block.goalCategory}</span>
          <span>·</span>
          <span>Risk {block.riskLevel}</span>
          <span>·</span>
          <span>{block.reversibility} reversibility</span>
        </div>

        {/* Interventions toggle */}
        {block.interventions.length > 0 && (() => {
          const isCombined = block.combinedTiers && block.combinedTiers.length > 1;
          const groups = isCombined
            ? groupInterventionsByTier(block.interventions)
            : [{ tier: block.evidenceTier, interventions: block.interventions }];

          return (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowInterventions((v) => !v)}
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {showInterventions
                  ? `▲ Hide ${block.interventions.length === 1 ? "intervention" : "interventions"}`
                  : `▼ Show ${block.interventions.length === 1 ? "intervention" : `interventions (${block.interventions.length})`}`}
              </button>
              {showInterventions && (
                <div className="mt-2 space-y-3">
                  {groups.map(({ tier, interventions }) => {
                    const tierCfg = TIER_CONFIG[tier];
                    return (
                      <div key={tier}>
                        {isCombined && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${tierCfg.dot}`} />
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierCfg.badge}`}>
                              {tier}
                            </span>
                            <span className="text-xs text-zinc-500">{tierCfg.label}</span>
                          </div>
                        )}
                        <div className={`space-y-2 ${isCombined ? `p-3 rounded-xl border ${tierCfg.border} bg-zinc-800/80` : ""}`}>
                          {interventions.map((iv, i) => (
                            <div key={i} className="p-3 bg-zinc-800 rounded-xl border border-zinc-700/50">
                              <p className="text-sm font-medium text-zinc-200">{iv.name}</p>
                              <p className="text-xs text-zinc-400 mt-1">{iv.mechanism}</p>
                              {iv.steps.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {iv.steps.map((step, si) => (
                                    <li key={si} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                      <span className="text-zinc-600 shrink-0">{si + 1}.</span>
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                                <span>{iv.durationDays} days</span>
                                <span>·</span>
                                <span>Expected: {iv.expectedMagnitude} effect</span>
                              </div>
                              {iv.contraindications.length > 0 && (
                                <p className="mt-1 text-xs text-red-400">
                                  ⚠ {iv.contraindications.join(", ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tags */}
        {block.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {block.tags.map((t) => (
              <span key={t} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* References */}
        {block.references && block.references.length > 0 && (
          <References pmids={block.references} articles={articles} />
        )}
      </div>
    </article>
  );
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [publishingAll, setPublishingAll] = useState(false);
  const [pendingSelectedIds, setPendingSelectedIds] = useState<string[]>([]);

  const TIERS: TheoryBlock["evidenceTier"][] = ["Strong", "Emerging", "Theoretical", "Unsupported"];

  // Restore after auth redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const publish = searchParams.get("publish");
    if (publish === "1") {
      try {
        const stored = sessionStorage.getItem(UNPUBLISHED_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { result: GenerateResult; selectedIds: string[] };
          setResult(parsed.result);
          setSelectedIds(new Set(parsed.selectedIds));
          setPendingSelectedIds(parsed.selectedIds);
          sessionStorage.removeItem(UNPUBLISHED_STORAGE_KEY);
        }
      } catch { /* ignore */ }
      window.history.replaceState({}, "", "/generate");
    }
  }, [searchParams]);

  // Auto-publish after login redirect
  useEffect(() => {
    if (pendingSelectedIds.length > 0 && user && result) {
      const blocks = result.blocks.filter((b) => pendingSelectedIds.includes(b.id));
      setPendingSelectedIds([]);
      void doPublishBlocks(blocks);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSelectedIds, user, result]);

  function toggleSelect(block: TheoryBlock) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(block.id)) { next.delete(block.id); } else { next.add(block.id); }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIds(new Set());
    setPublishedIds(new Set());
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Generation failed"); return; }
      setResult(data as GenerateResult);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function publishOne(block: TheoryBlock): Promise<boolean> {
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(block),
    });
    if (res.ok) {
      setPublishedIds((prev) => new Set(Array.from(prev).concat([block.id])));
      return true;
    }
    if (res.status === 401) return false; // needs auth
    const data = await res.json();
    setError(data.error || "Publish failed");
    return true; // don't retry on non-auth errors
  }

  async function doPublishBlocks(blocks: TheoryBlock[]) {
    setPublishingAll(true);
    setError(null);
    const tiers = blocks.length > 1
      ? blocks.map((b) => b.evidenceTier)
      : undefined;
    for (const block of blocks) {
      if (publishedIds.has(block.id)) continue;
      const enriched = tiers ? { ...block, combinedTiers: tiers } : block;
      const ok = await publishOne(enriched);
      if (!ok) {
        // 401 — save state and redirect to login
        sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({
          result,
          selectedIds: blocks.map((b) => b.id),
        }));
        setLoginRedirect("/generate?publish=1");
        setLoginModalOpen(true);
        setPublishingAll(false);
        return;
      }
    }
    setSelectedIds(new Set());
    setPublishingAll(false);
  }

  function handlePublishSelected() {
    if (!result) return;
    const blocks = result.blocks.filter((b) => selectedIds.has(b.id));
    if (!user) {
      sessionStorage.setItem(UNPUBLISHED_STORAGE_KEY, JSON.stringify({
        result,
        selectedIds: Array.from(selectedIds),
      }));
      setLoginRedirect("/generate?publish=1");
      setLoginModalOpen(true);
      return;
    }
    void doPublishBlocks(blocks);
  }

  const unpublishedSelected = result
    ? result.blocks.filter((b) => selectedIds.has(b.id) && !publishedIds.has(b.id))
    : [];

  return (
    <div className="pb-24">
      <h1 className="text-xl font-semibold text-white mb-2">Generate</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Enter your health goal and we'll search PubMed for relevant research, then generate theory blocks across all evidence tiers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
        <textarea
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Improve focus and energy with better sleep and morning light"
          rows={3}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching PubMed & generating…" : "Generate theory blocks"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-10">
          {/* PubMed search info */}
          {result.articles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-sm shrink-0">📚</span>
                <p className="text-xs text-blue-300">
                  Found <strong>{result.articles.length} PubMed articles</strong> across targeted biological searches. Relevant ones are cited below.
                </p>
              </div>
              {result.searchQuery && (
                <p className="text-xs text-blue-500 pl-5 italic">{result.searchQuery}</p>
              )}
            </div>
          )}

          {/* Selection hint */}
          <p className="text-xs text-zinc-500 mb-4">
            Click <span className="text-zinc-300 font-medium">+ Add</span> on any blocks you want to publish together, then publish them as a combined theory.
          </p>

          <div className="space-y-5">
            {TIERS.map((tier) => {
              const block = result.blocks.find((b) => b.evidenceTier === tier);
              if (!block) return null;
              return (
                <TierBlock
                  key={block.id}
                  block={block}
                  articles={result.articles}
                  isSelected={selectedIds.has(block.id)}
                  onToggleSelect={toggleSelect}
                  isPublished={publishedIds.has(block.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky publish bar */}
      {unpublishedSelected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pb-6 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="flex -space-x-1">
              {unpublishedSelected.map((b) => (
                <span
                  key={b.id}
                  className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${TIER_CONFIG[b.evidenceTier].dot}`}
                />
              ))}
            </div>
            <span className="text-sm text-zinc-300">
              <span className="font-semibold text-white">{unpublishedSelected.length}</span>{" "}
              {unpublishedSelected.length === 1 ? "block" : "blocks"} selected
            </span>
            <button
              type="button"
              onClick={handlePublishSelected}
              disabled={publishingAll}
              className="px-4 py-1.5 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {publishingAll ? "Publishing…" : "Publish →"}
            </button>
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

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-sm py-8">Loading...</div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
