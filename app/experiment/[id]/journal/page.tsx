"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Redirect old journal route to unified experiment page
export default function JournalRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/experiment/${id}`);
  }, [router, id]);

  return (
    <div className="py-8">
      <p className="text-sm text-muted-foreground animate-pulse">Redirecting…</p>
    </div>
  );
}
