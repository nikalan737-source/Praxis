import Link from "next/link";
import { Button } from "@/components/landing/_ui/button";
import { Beaker } from "lucide-react";

const Nav = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-white/60 backdrop-blur-2xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-semibold text-lg tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Beaker className="h-4 w-4" />
          </span>
          Praxis
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/community" className="transition-colors hover:text-foreground">Community</Link>
          <Link href="/create" className="transition-colors hover:text-foreground">Create</Link>
          <Link href="/profile" className="transition-colors hover:text-foreground">Profile</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-5 font-semibold">
            <Link href="/community">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5 font-semibold">
            <Link href="/community">Try Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Nav;
