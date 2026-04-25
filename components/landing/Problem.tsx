import { Users, Search, Layers } from "lucide-react";

const points = [
  {
    icon: Users,
    title: "Same advice, different results",
    body: "Bodies respond differently to the same protocol.",
  },
  {
    icon: Search,
    title: "No way to know if it's working",
    body: "Weeks later, you're still guessing what moved the needle.",
  },
  {
    icon: Layers,
    title: "Information overload, zero structure",
    body: "Endless advice, no system to test what's right for you.",
  },
];

const Problem = () => {
  return (
    <section id="problem" className="py-24 md:py-32">
      <div className="container px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Most health advice is generic. Your body isn't.
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {points.map(({ icon: Icon, title, body }) => (
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

export default Problem;