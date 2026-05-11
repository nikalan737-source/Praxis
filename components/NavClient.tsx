"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/community", label: "Community" },
  { href: "/create", label: "Create" },
  { href: "/profile", label: "Profile" },
];

type ProfileSummary = { is_pro?: boolean } | null;

export default function NavClient() {
  const { user, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileSummary>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setProfile(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (pathname === "/") return null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-white/60 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg tracking-tight text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <Beaker className="h-4 w-4" />
              </span>
              Praxis
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-primary/15 text-primary",
                      profile?.is_pro && "ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {user.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  {profile?.is_pro && (
                    <span className="text-xs font-semibold text-primary">Pro</span>
                  )}
                </Link>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full px-5 font-semibold"
                  onClick={() => setLoginOpen(true)}
                >
                  Sign in
                </Button>
              )}
            </div>
          )}
        </div>
      </header>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
