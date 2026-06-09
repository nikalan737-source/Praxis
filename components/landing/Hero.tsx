"use client";

import Link from "next/link";
import { Button } from "@/components/landing/_ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container relative mx-auto flex flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28 lg:pb-32">
        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-fade-up">
          Your body changed. Your health approach should too.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up [animation-delay:80ms]">
          Praxis turns research into a simple daily plan for the body you have today. Not the one you had ten
          years ago.
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground/90 sm:text-base animate-fade-up [animation-delay:140ms]">
          Pick what to try. Check in on how you feel. Adjust when something shifts.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row animate-fade-up [animation-delay:200ms]">
          <Button asChild size="lg" variant="default" className="h-12 px-7 text-base font-semibold rounded-full">
            <Link href="/create">
              Build my plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="glass" size="lg" className="h-12 px-7 text-base font-semibold rounded-full">
            <a href="#solution">See how Praxis fits you</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
