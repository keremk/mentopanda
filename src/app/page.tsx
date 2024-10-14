import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection } from "@/components/hero-section";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="/logo.svg"
            alt="TinkerBox Logo"
            width={60}
            height={60}
            className="dark:invert"
          />
          <span className="text-2xl font-bold">MentoPanda</span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" asChild>
            <Link href="/login?mode=signin">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/login?mode=signup">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <HeroSection />
      </main>

      <Footer />
    </div>
  );
}
