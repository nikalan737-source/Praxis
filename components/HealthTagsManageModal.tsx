"use client";

import { useEffect, useState } from "react";
import { HealthTagsEditor } from "@/components/HealthTagsEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type HealthTagsManageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTags: string[];
  onSaved: (tags: string[]) => void;
};

export function HealthTagsManageModal({
  open,
  onOpenChange,
  initialTags,
  onSaved,
}: HealthTagsManageModalProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTags(initialTags);
      setError("");
      setBusy(false);
    }
  }, [open, initialTags]);

  async function handleSave() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ health_tags: tags }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save");
      }
      const data = await res.json();
      const next = Array.isArray(data.health_tags) ? data.health_tags : tags;
      onSaved(next);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !busy && onOpenChange(false)}
      />

      <div
        className="relative w-full max-w-lg max-h-[min(680px,92vh)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-tags-modal-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2 shrink-0">
          <div>
            <h2 id="health-tags-modal-title" className="text-lg font-semibold text-foreground">
              Update health profile
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Choose what applies — we&apos;ll personalize theories and protocols accordingly.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground"
            onClick={() => !busy && onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <HealthTagsEditor selected={tags} onChange={setTags} />
          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4 flex justify-end gap-2 bg-muted/10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground min-w-[100px]"
            onClick={() => void handleSave()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
