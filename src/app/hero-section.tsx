import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="flex flex-col items-center space-y-16 md:space-y-28">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center max-w-4xl leading-tight">
          <span className="gradient-text">
            Your AI mentor for communication skills
          </span>
        </h1>

        <div className="w-full max-w-4xl relative aspect-[16/10] image-container-enhanced group">
          <div className="image-inner">
            <Image
              src="/simulation.png"
              alt="Simulation Picture"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            className="bg-brand hover:bg-brand-hover text-brand-foreground"
            size="lg"
          >
            <Link href="/login">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-brand/30 text-foreground hover:bg-brand/10"
          >
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
