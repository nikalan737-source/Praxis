"use client";

import AmbientBackground from "@/components/landing/AmbientBackground";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import SocialProof from "@/components/landing/SocialProof";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="landing-root relative">
      <AmbientBackground />
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
