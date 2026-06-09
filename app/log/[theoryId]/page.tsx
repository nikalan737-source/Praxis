"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect legacy log submission URLs to create
export default function LogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/create");
  }, [router]);

  return (
    <div className="py-8">
      <p className="text-sm text-muted-foreground animate-pulse">Redirecting…</p>
    </div>
  );
}
