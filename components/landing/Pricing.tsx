import Link from "next/link";
import { Button } from "@/components/landing/_ui/button";
import { Check } from "lucide-react";

const UPGRADE_HREF = "/profile";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: ["10 personalized plans per month", "Save and track protocols"],
    cta: "Get started free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$9",
    cadence: "/month",
    features: ["Unlimited plans", "Advanced progress stats", "Personalized health profile"],
    cta: "Go Pro",
    featured: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="container px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Start free. Upgrade when you're ready.
          </h2>
          <p className="mt-4 text-muted-foreground">Simple, honest pricing. Cancel anytime.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`glass-panel relative flex flex-col p-8 transition-all hover:-translate-y-1 ${
                t.featured ? "ring-2 ring-primary/40 shadow-glow" : ""
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {t.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.cadence}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                variant={t.featured ? "default" : "glass"}
                className="mt-8 h-12 font-semibold rounded-full"
              >
                <Link href={UPGRADE_HREF}>{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
