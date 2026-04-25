"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Target,
  Lightbulb,
  Search,
  ListChecks,
  ClipboardCheck,
  Users,
  Check,
  FileText,
  Star,
} from "lucide-react";

/* ------------------------------ Visuals ------------------------------ */

const GOAL_TAGS = [
  "Appearance",
  "Mood",
  "Recovery",
  "Performance",
  "Sleep",
  "Energy",
  "Dopamine",
];

const Step0Visual = ({ active }: { active: boolean }) => (
  <div className="relative flex h-full w-full flex-wrap items-center justify-center gap-3 p-8">
    {GOAL_TAGS.map((tag, i) => (
      <motion.span
        key={tag}
        initial={{ opacity: 0, y: 16, scale: 0.85 }}
        animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.3, y: 8, scale: 0.95 }}
        transition={{ duration: 0.5, delay: active ? i * 0.08 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.1)]"
      >
        {tag}
      </motion.span>
    ))}
  </div>
);

const Step1Visual = ({ active }: { active: boolean }) => {
  const fullText = "I want to improve my sleep quality through light exposure and supplementation";
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!active) {
      setTyped("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.08)]">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
          <Lightbulb className="h-3.5 w-3.5" />
          Your theory
        </div>
        <div className="mt-4 min-h-[6rem] text-base leading-relaxed text-white/90">
          {typed}
          <span className="ml-0.5 inline-block h-5 w-[2px] -translate-y-0.5 animate-pulse bg-emerald-400 align-middle" />
        </div>
      </div>
    </div>
  );
};

const PAPERS = [
  "Effects of morning bright light on circadian phase and sleep onset",
  "Melatonin supplementation and sleep architecture: a meta-analysis",
  "Magnesium glycinate for sleep quality in adults with insomnia",
  "Blue light blocking glasses and evening melatonin secretion",
  "Light exposure timing and cortisol awakening response",
];

const Step2Visual = ({ active }: { active: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCount(i);
      if (i >= PAPERS.length) clearInterval(id);
    }, 450);
    return () => clearInterval(id);
  }, [active]);

  const progress = (count / PAPERS.length) * 100;

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            <Search className="h-3.5 w-3.5" />
            Searching PubMed
          </div>
          <span className="text-xs text-white/50">{count}/{PAPERS.length}</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <ul className="mt-4 space-y-2">
          <AnimatePresence>
            {PAPERS.slice(0, count).map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-white/80"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/70" />
                <span className="truncate">{p}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
};

const TIERS = [
  { label: "Strong", desc: "Multiple RCTs, consistent effect", color: "bg-emerald-400", ring: "ring-emerald-400/30" },
  { label: "Emerging", desc: "Promising but limited evidence", color: "bg-amber-400", ring: "ring-amber-400/30" },
  { label: "Theoretical", desc: "Mechanism plausible, untested", color: "bg-sky-400", ring: "ring-sky-400/30" },
];

const Step3Visual = ({ active }: { active: boolean }) => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <div className="w-full max-w-md space-y-3">
      {TIERS.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 12 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 6 }}
          transition={{ duration: 0.45, delay: active ? i * 0.12 : 0 }}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <span className={`h-3 w-3 shrink-0 rounded-full ${t.color} ring-4 ${t.ring}`} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{t.label}</div>
            <div className="text-xs text-white/60">{t.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const HABITS = [
  "Morning sunlight, 10 min within 30 min of waking",
  "Magnesium glycinate, 300mg, 1h before bed",
  "Blue light blockers from 9pm",
  "Lights out by 10:30pm, no screens in bed",
];

const Step4Visual = ({ active }: { active: boolean }) => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.3, y: 8, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.08)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">Protocol</div>
          <div className="mt-1 font-display text-lg font-semibold text-white">Sleep Quality v1</div>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          56 days
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {HABITS.map((h, i) => (
          <motion.li
            key={h}
            initial={{ opacity: 0, x: -8 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0.3, x: 0 }}
            transition={{ duration: 0.35, delay: active ? 0.2 + i * 0.1 : 0 }}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-sm text-white/85">{h}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  </div>
);

const RESULTS = [
  { rating: 8.4, days: 56, quote: "Falling asleep in under 15 min now. Game changer." },
  { rating: 7.9, days: 42, quote: "Energy in the morning is night and day different." },
  { rating: 9.1, days: 56, quote: "Best sleep I've had in years. Sticking with it." },
];

const Step5Visual = ({ active }: { active: boolean }) => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <div className="w-full max-w-md space-y-3">
      {RESULTS.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.25, y: 6 }}
          transition={{ duration: 0.5, delay: active ? i * 0.12 : 0 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Star className="h-4 w-4 fill-emerald-300" />
              <span className="font-display text-base font-semibold text-white">{r.rating}</span>
              <span className="text-xs text-white/50">/ 10</span>
            </div>
            <span className="text-xs text-white/50">{r.days} days completed</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/75">"{r.quote}"</p>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ------------------------------ Steps ------------------------------ */

type Step = {
  n: string;
  icon: typeof Target;
  eyebrow: string;
  title: string;
  body: string;
  Visual: (props: { active: boolean }) => JSX.Element;
};

const STEPS: Step[] = [
  {
    n: "00",
    icon: Target,
    eyebrow: "Step 0",
    title: "What's your goal?",
    body: "Pick the area of your life you want to move. Praxis works across performance, mood, recovery, sleep, and more.",
    Visual: Step0Visual,
  },
  {
    n: "01",
    icon: Lightbulb,
    eyebrow: "Step 1",
    title: "You have a theory",
    body: "Tell Praxis what you think might work. Your hypothesis becomes the starting point for a real experiment.",
    Visual: Step1Visual,
  },
  {
    n: "02",
    icon: Search,
    eyebrow: "Step 2",
    title: "We search the science",
    body: "Praxis pulls from PubMed and ranked sources to find what the literature actually says about your theory.",
    Visual: Step2Visual,
  },
  {
    n: "03",
    icon: ListChecks,
    eyebrow: "Step 3",
    title: "Theories ranked by evidence",
    body: "Every approach gets a tier — strong, emerging, or theoretical — so you know what's backed and what's a bet.",
    Visual: Step3Visual,
  },
  {
    n: "04",
    icon: ClipboardCheck,
    eyebrow: "Step 4",
    title: "Your protocol is built",
    body: "Praxis turns the evidence into a clean, daily checklist you can actually follow. No fluff, just what matters.",
    Visual: Step4Visual,
  },
  {
    n: "05",
    icon: Users,
    eyebrow: "Step 5",
    title: "Real results from real people",
    body: "See what happened to others who ran the same protocol. Real ratings, real quotes, real proof.",
    Visual: Step5Visual,
  },
];

/* ------------------------------ Section ------------------------------ */

const StepRow = ({
  step,
  index,
  total,
  onActive,
}: {
  step: Step;
  index: number;
  total: number;
  onActive: (i: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 40%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.3, 1, 1, 0.3]);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      if (v > 0.15 && v < 0.95) onActive(index);
    });
  }, [scrollYProgress, index, onActive]);

  const { Visual, icon: Icon } = step;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="min-h-[70vh] py-16"
    >
      {/* Text */}
      <div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
          <span className="font-display text-emerald-300/60">{step.n}</span>
          <span>{step.eyebrow}</span>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_8px_24px_-12px_hsl(155_55%_50%/0.5)]">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {step.title}
          </h3>
        </div>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">{step.body}</p>
        <div className="mt-8 flex items-center gap-2 text-xs text-white/40">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="h-px w-12 bg-white/15" />
          <span>{String(total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Visual mobile (inline) */}
      <div className="md:hidden">
        <div className="relative mt-8 h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
          <Visual active />
        </div>
      </div>
    </motion.div>
  );
};

const HowItWorks = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="how" className="relative bg-[hsl(220_30%_8%)] text-white">
      {/* Ambient glow (clipped to section without breaking sticky) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(155 60% 40% / 0.18), transparent 70%)" }}
        />
        <div
          className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(200 60% 40% / 0.12), transparent 70%)" }}
        />
      </div>

      <div className="container relative px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            How it works
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            From a hunch to hard evidence
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Scroll through the journey. Every step is built on real science and real results.
          </p>
        </div>

        <div className="relative mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          {/* Left: scrolling text rows */}
          <div>
            {STEPS.map((s, i) => (
              <StepRow key={s.n} step={s} index={i} total={STEPS.length} onActive={setActive} />
            ))}
          </div>

          {/* Right: sticky visual (desktop only) */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <div className="relative h-[480px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.06),0_30px_80px_-30px_hsl(155_60%_30%/0.4)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    {(() => {
                      const V = STEPS[active].Visual;
                      return <V active />;
                    })()}
                  </motion.div>
                </AnimatePresence>

                {/* Step indicator */}
                <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === active ? "w-8 bg-emerald-300" : "w-4 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
