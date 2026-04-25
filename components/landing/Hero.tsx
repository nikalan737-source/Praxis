"use client";

import Link from "next/link";
import { Button } from "@/components/landing/_ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const USE_CASES = [
  "appearance",
  "muscle gain",
  "better sleep",
  "mood regulation",
  "recovery",
  "dopamine balance",
  "energy",
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % USE_CASES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container relative mx-auto flex flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28 lg:pb-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-xl shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.8)] animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Science-backed. Personalized. Proven on real people.
        </span>
        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-fade-up [animation-delay:80ms]">
          Your Protocol. Your Results. Your Proof.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up [animation-delay:160ms]">
          Praxis builds you a science-backed protocol for{" "}
          <span className="relative inline-flex h-[1.3em] min-w-[8ch] items-center justify-center align-baseline">
            <AnimatePresence mode="wait">
              <motion.span
                key={USE_CASES[index]}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="font-semibold text-primary whitespace-nowrap"
              >
                {USE_CASES[index]}
              </motion.span>
            </AnimatePresence>
          </span>
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row animate-fade-up [animation-delay:240ms]">
          <Button asChild size="lg" variant="default" className="h-12 px-7 text-base font-semibold rounded-full">
            <Link href="/community">
              Try Praxis Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="glass" size="lg" className="h-12 px-7 text-base font-semibold rounded-full">
            <a href="#how">See how it works</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
