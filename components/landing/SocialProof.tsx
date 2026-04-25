import { Dumbbell, Apple, Trophy, Atom } from "lucide-react";

const roles = [
  { icon: Dumbbell, label: "Personal trainers" },
  { icon: Apple, label: "Nutritionists" },
  { icon: Trophy, label: "Athletes" },
  { icon: Atom, label: "Biohackers" },
];

const SocialProof = () => {
  return (
    <section className="py-12">
      <div className="container px-6">
        <div className="glass-panel mx-auto max-w-5xl px-8 py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Trusted by trainers, nutritionists, athletes, biohackers.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {roles.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;