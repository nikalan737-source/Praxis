"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/community", label: "Community" },
  { href: "/create", label: "Create" },
  { href: "/profile", label: "Profile" },
];

export default function NavClient() {
  const { user, signOut, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-icon.png"
                alt="Praxis"
                width={48}
                height={28}
                className="select-none"
              />
              <span className="font-bold tracking-[0.2em] text-sm text-foreground uppercase">
                Praxis
              </span>
            </Link>
            <div className="flex gap-1">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-muted-foreground truncate max-w-[140px] text-xs">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setLoginOpen(true)}>
                  Sign in
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
