import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemedImage } from "@/components/themed-image";

export function HeroSection() {
  // Define light and dark theme image URLs
  const lightImageUrl =
    "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/roleplay-light.png";
  const darkImageUrl =
    "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/roleplay.png";

  return (
    <section className="container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="flex flex-col items-center space-y-16 md:space-y-28">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center max-w-4xl leading-tight">
          <span className="gradient-text">
            Your AI mentor for communication skills
          </span>
        </h1>

        <div className="w-full max-w-4xl relative aspect-[17/11] image-container-enhanced group">
          <div className="image-inner">
            <ThemedImage
              lightSrc={lightImageUrl}
              darkSrc={darkImageUrl}
              alt="Simulation Picture"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
              quality={90}
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
