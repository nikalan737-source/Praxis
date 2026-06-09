"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
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
  "Focus",
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
          Your goal
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
            Searching research papers
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
  { label: "Strong", desc: "Several solid studies, results line up", color: "bg-emerald-400", ring: "ring-emerald-400/30" },
  { label: "Emerging", desc: "Looks good, not much human data yet", color: "bg-amber-400", ring: "ring-amber-400/30" },
  { label: "Early idea", desc: "Makes sense on paper, not really tested", color: "bg-sky-400", ring: "ring-sky-400/30" },
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
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">Your plan</div>
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
    body: "Pick what you want to work on. Sleep, mood, energy, recovery — Praxis meets you where you are.",
    Visual: Step0Visual,
  },
  {
    n: "01",
    icon: Lightbulb,
    eyebrow: "Step 1",
    title: "Say it in your own words",
    body: "Tell Praxis what you want to try. Your goal is the starting point. We help you test what works.",
    Visual: Step1Visual,
  },
  {
    n: "02",
    icon: Search,
    eyebrow: "Step 2",
    title: "We dig into the research",
    body: "Praxis scans trusted medical research and summarizes what it says about your situation — in plain language.",
    Visual: Step2Visual,
  },
  {
    n: "03",
    icon: ListChecks,
    eyebrow: "Step 3",
    title: "Ideas ranked by how solid the science is",
    body: "Each approach gets a simple label: strong support, early promise, or still mostly an idea. You see the tradeoffs.",
    Visual: Step3Visual,
  },
  {
    n: "04",
    icon: ClipboardCheck,
    eyebrow: "Step 4",
    title: "You get a clear daily plan",
    body: "We turn what the research supports into a short daily checklist you can actually follow.",
    Visual: Step4Visual,
  },
  {
    n: "05",
    icon: Users,
    eyebrow: "Step 5",
    title: "Real people, real outcomes",
    body: "See how others with a similar plan rated how they felt. Honest numbers and short quotes — no hype.",
    Visual: Step5Visual,
  },
];

/* ------------------------------ Section ------------------------------ */

const STEP_COUNT = STEPS.length;

const StickyStepVisuals = ({ active }: { active: number }) => (
  <div className="relative h-full w-full">
    {STEPS.map((step, i) => {
      const V = step.Visual;
      const isActive = i === active;
      return (
        <div
          key={step.n}
          aria-hidden={!isActive}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ease-out ${
            isActive ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        >
          <V active={isActive} />
        </div>
      );
    })}
  </div>
);

const StepRow = ({
  step,
  index,
  total,
  registerStep,
}: {
  step: Step;
  index: number;
  total: number;
  registerStep: (index: number, el: HTMLElement | null) => void;
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      rowRef.current = node;
      registerStep(index, node);
    },
    [index, registerStep]
  );

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start 55%", "end 45%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.35, 1, 1, 0.35]);

  const { Visual, icon: Icon } = step;

  return (
    <div ref={setRowRef} data-step-index={index} className="min-h-[70vh] py-16">
      <motion.div style={{ opacity }}>
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
    </div>
  );
};

const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const stepElementsRef = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ratiosRef = useRef<number[]>(Array(STEP_COUNT).fill(0));

  const registerStep = useCallback((index: number, el: HTMLElement | null) => {
    const prev = stepElementsRef.current[index];
    stepElementsRef.current[index] = el;

    const observer = observerRef.current;
    if (!observer) return;
    if (prev && prev !== el) observer.unobserve(prev);
    if (el) observer.observe(el);
  }, []);

  useEffect(() => {
    const ratios = ratiosRef.current;

    const pickMostVisible = () => {
      let bestIdx = 0;
      let bestRatio = -1;
      for (let i = 0; i < STEP_COUNT; i++) {
        if (ratios[i] > bestRatio) {
          bestRatio = ratios[i];
          bestIdx = i;
        }
      }
      if (bestRatio > 0) {
        setActive((prev) => (prev === bestIdx ? prev : bestIdx));
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (Number.isNaN(idx) || idx < 0 || idx >= STEP_COUNT) continue;
          ratios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        pickMostVisible();
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    observerRef.current = observer;
    stepElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      observerRef.current = null;
      ratios.fill(0);
    };
  }, []);

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
            From real life to a plan you can test
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Scroll through the steps. Built for busy adults when generic advice stops matching how you feel.
          </p>
        </div>

        <div className="relative mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          {/* Left: scrolling text rows */}
          <div>
            {STEPS.map((s, i) => (
              <StepRow key={s.n} step={s} index={i} total={STEPS.length} registerStep={registerStep} />
            ))}
          </div>

          {/* Right: sticky visual (desktop only) */}
          <div className="hidden md:block">
            <div className="sticky top-24 h-fit">
              <div className="relative h-[480px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.06),0_30px_80px_-30px_hsl(155_60%_30%/0.4)]">
                <StickyStepVisuals active={active} />

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
