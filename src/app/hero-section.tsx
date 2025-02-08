import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 pt-24 pb-12">
      <div className="flex flex-col items-center space-y-8">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center max-w-4xl">
          <span className="text-indigo-900 dark:text-indigo-300">
            Your AI mentor for communication skills
          </span>
        </h1>

        <div className="w-full max-w-3xl relative aspect-[16/10]">
          <Image
            src="/simulation.png"
            alt="Simulation Picture"
            fill
            className="object-contain"
            priority
          />
        </div>

        <Button className="bg-red-500 hover:bg-red-600" asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </section>
  );
}
