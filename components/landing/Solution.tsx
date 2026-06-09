import { Microscope, FlaskConical, Puzzle } from "lucide-react";

const features = [
  {
    icon: Microscope,
    title: "Research you can actually use",
    body: "We pull from solid medical studies and label how strong the support is. Filtered for your age, stage, and what you told us about your health.",
  },
  {
    icon: FlaskConical,
    title: "A simple way to test what works",
    body: "Set a goal, follow the daily steps, and log how you feel. You see what helps — not just whether you were busy.",
  },
  {
    icon: Puzzle,
    title: "Built for the messy middle",
    body: "Hormone shifts, injury, sleep, stress, performance — the spots where generic advice stops fitting and your story matters.",
  },
];

const Solution = () => {
  return (
    <section id="solution" className="py-24 md:py-32">
      <div className="container px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            A system built around where your body actually is.
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-panel group p-7 transition-all hover:-translate-y-1 hover:bg-white/70"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solution;
