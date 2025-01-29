import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection } from "@/app/hero-section";
import { Footer } from "@/components/footer";
import { Header } from "@/app/header";
import { ProblemSection } from "@/app/problem-section";
import { SolutionSection } from "@/app/solution-section";
import { FeaturesSection } from "@/app/features-section";
import { PricingSection } from "@/app/pricing-section";
import { FaqSection } from "@/app/faq-section";

export default function LandingPage() {
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
