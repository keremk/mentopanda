import { HeroSection } from "@/app/hero-section";
import { Footer } from "@/app/footer";
import { Header } from "@/app/header";
import { ProblemSection } from "@/app/problem-section";
import { SolutionSection } from "@/app/solution-section";
import { FeaturesSection } from "@/app/features-section";
import { PricingSection } from "@/app/pricing-section";
import { FaqSection } from "@/app/faq-section";
import { Button } from "@/components/ui/button";

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
      <div className="flex gap-4 mt-8">
        <Button variant="ghost-danger">Ghost Danger Button</Button>
        <Button variant="ghost-brand">Ghost Brand Button</Button>
        <Button variant="danger">Danger Button</Button>
        <Button variant="brand">Brand Button</Button>
      </div>
      <Footer />
    </main>
  );
}
