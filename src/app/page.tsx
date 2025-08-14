"use client";

import { HeroSection } from "@/app/hero-section";
import { Footer } from "@/app/footer";
import { Header } from "@/app/header";
import { ProblemSection } from "@/app/problem-section";
import { SolutionSection } from "@/app/solution-section";
import { FeaturesSection } from "@/app/features-section";
import { PricingSection } from "@/app/pricing-section";
import { FaqSection } from "@/app/faq-section";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    // Handle hash navigation from other pages
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);
  return (
    <main className="bg-background">
      <Header />
      <HeroSection />
      <div className="bg-muted/30">
        <ProblemSection />
      </div>
      <FeaturesSection />
      <div className="bg-muted/30">
        <SolutionSection />
      </div>
      <PricingSection />
      <div className="bg-muted/30">
        <FaqSection />
      </div>
      <Footer />
    </main>
  );
}
