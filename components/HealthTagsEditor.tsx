"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { HEALTH_TAG_PRESETS, PRESET_LABEL_SET } from "@/lib/health-tag-presets";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const UPGRADE_COPY = "Unlock unlimited health tags with Praxis Pro.";

export type HealthTagsEditorProps = {
  selected: string[];
  onChange: (tags: string[]) => void;
  className?: string;
  /** When set, selecting beyond this many distinct tags is blocked for free users */
  maxTags?: number;
  onTagLimitReached?: () => void;
};

function dedupePreserveOrder(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const key = t.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t.trim());
  }
  return out;
}

export function HealthTagsEditor({
  selected,
  onChange,
  className,
  maxTags,
  onTagLimitReached,
}: HealthTagsEditorProps) {
  const [query, setQuery] = useState("");
  const [addingOwn, setAddingOwn] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [showLimitHint, setShowLimitHint] = useState(false);

  const selectedSet = useMemo(() => new Set(selected.map((t) => t.toLowerCase())), [selected]);
  const atLimit = maxTags !== undefined && selected.length >= maxTags;

  const q = query.trim().toLowerCase();

  const filteredPresets = useMemo(() => {
    if (!q) return HEALTH_TAG_PRESETS;
    return HEALTH_TAG_PRESETS.filter((p) => p.label.toLowerCase().includes(q));
  }, [q]);

  const customSelected = useMemo(
    () => selected.filter((t) => !PRESET_LABEL_SET.has(t)),
    [selected]
  );

  const filteredCustoms = useMemo(() => {
    if (!q) return customSelected;
    return customSelected.filter((t) => t.toLowerCase().includes(q));
  }, [customSelected, q]);

  function tryAdd(next: string[]): boolean {
    const deduped = dedupePreserveOrder(next);
    if (maxTags !== undefined && deduped.length > maxTags) {
      setShowLimitHint(true);
      onTagLimitReached?.();
      return false;
    }
    setShowLimitHint(false);
    onChange(deduped);
    return true;
  }

  function toggle(label: string) {
    const norm = label.trim();
    if (!norm) return;
    const key = norm.toLowerCase();
    if (selectedSet.has(key)) {
      setShowLimitHint(false);
      onChange(selected.filter((t) => t.toLowerCase() !== key));
    } else {
      tryAdd([...selected, norm]);
    }
  }

  function addCustom() {
    const v = customDraft.trim();
    if (!v) return;
    if (tryAdd([...selected, v])) {
      setCustomDraft("");
      setAddingOwn(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {maxTags !== undefined && (
        <p className="text-xs text-muted-foreground">
          {selected.length}/{maxTags} tags selected
          {atLimit ? " — remove one to pick another, or upgrade for unlimited." : ""}
        </p>
      )}

      {showLimitHint && (
        <div
          className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100/90"
          role="status"
        >
          {UPGRADE_COPY}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rounded-xl border-border bg-background/80"
          aria-label="Filter health topics"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filteredPresets.map(({ label, Icon }) => {
          const active = selectedSet.has(label.toLowerCase());
          const disabled = !active && atLimit;
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => toggle(label)}
              className={cn(
                "rounded-xl border text-left p-3 transition-all duration-200 flex flex-col gap-2 min-h-[92px]",
                "hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                disabled && "opacity-50 cursor-not-allowed hover:shadow-none",
                active
                  ? "border-primary bg-primary/12 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12)] ring-1 ring-primary/25"
                  : "border-border bg-card/90 hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                  active ? "bg-primary/20 text-primary" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span
                className={cn(
                  "text-xs font-medium leading-snug",
                  active ? "text-foreground" : "text-foreground/90"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}

        {filteredCustoms.map((label) => {
          const active = selectedSet.has(label.toLowerCase());
          const disabled = !active && atLimit;
          return (
            <button
              key={`custom-${label}`}
              type="button"
              disabled={disabled}
              onClick={() => toggle(label)}
              className={cn(
                "rounded-xl border text-left p-3 transition-all duration-200 flex flex-col gap-2 min-h-[92px]",
                "hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                disabled && "opacity-50 cursor-not-allowed",
                active
                  ? "border-primary bg-primary/12 ring-1 ring-primary/25"
                  : "border-dashed border-primary/30 bg-primary/[0.04]"
              )}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-medium leading-snug text-foreground">{label}</span>
            </button>
          );
        })}

        {!addingOwn ? (
          <button
            type="button"
            disabled={atLimit}
            onClick={() => {
              if (atLimit) {
                setShowLimitHint(true);
                onTagLimitReached?.();
                return;
              }
              setAddingOwn(true);
            }}
            className={cn(
              "rounded-xl border border-dashed border-border text-left p-3 transition-colors min-h-[92px]",
              "flex flex-col gap-2 justify-center items-center text-center",
              "hover:border-primary/35 hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              atLimit && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
            )}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">+ Add your own</span>
          </button>
        ) : (
          <div className="rounded-xl border border-primary/25 bg-muted/20 p-3 col-span-2 sm:col-span-3 flex flex-col gap-2">
            <label htmlFor="health-custom-tag" className="text-xs font-medium text-foreground">
              Your topic or condition
            </label>
            <Input
              id="health-custom-tag"
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              placeholder="e.g. mild scoliosis, desk job neck…"
              className="rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setAddingOwn(false);
                  setCustomDraft("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-primary"
                onClick={addCustom}
                disabled={atLimit}
              >
                Add tag
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
