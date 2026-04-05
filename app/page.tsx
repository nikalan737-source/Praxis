"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";

function HomeContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { user, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user && redirect) {
      window.location.href = redirect;
    }
  }, [user, isLoading, redirect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Praxis"
        width={240}
        height={240}
        className="mx-auto select-none mb-6"
      />

      <p className="font-display text-foreground/70 text-lg mb-8 max-w-sm leading-relaxed">
        For those who know that better results require better systems.
      </p>

      {redirect && (
        <p className="text-amber-600 text-sm mb-6 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
          Sign in to access that page.
        </p>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/community">
          <span className="inline-flex items-center justify-center h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
            Browse community
          </span>
        </Link>
        <Link href="/create">
          <span className="inline-flex items-center justify-center h-11 px-7 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
            Create a theory
          </span>
        </Link>
        {redirect && (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex items-center justify-center h-11 px-7 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors"
          >
            Sign in
          </button>
        )}
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        redirectAfterLogin={redirect ?? undefined}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
