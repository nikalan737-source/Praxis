import Link from "next/link";
import { Button } from "@/components/landing/_ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-6">
        <div className="glass-panel mx-auto max-w-4xl p-10 text-center md:p-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
              Start your first protocol today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Generate a plan. See what works.
            </p>
            <Button
              asChild
              size="lg"
              variant="default"
              className="mt-8 h-12 px-7 text-base font-semibold rounded-full"
            >
              <Link href="/community">
                Try Praxis Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
