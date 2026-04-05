"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect old log submission page to community
export default function LogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/community");
  }, [router]);

  return (
    <div className="py-8">
      <p className="text-sm text-muted-foreground animate-pulse">Redirecting…</p>
    </div>
  );
}
