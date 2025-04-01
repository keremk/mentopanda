import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Header } from "@/app/header";
import { Footer } from "@/app/footer";

export const metadata: Metadata = {
  title: "Page Not Found | MentoPanda",
  description: "The page you're looking for couldn't be found.",
};

export default function NotFound() {
  return (
    <main className="bg-background min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="max-w-md mx-auto space-y-8">
          <div className="relative w-40 h-40 mx-auto">
            <Image
              src="/panda-light.svg"
              alt="MentoPanda Logo"
              fill
              className="opacity-20 dark:invert"
              priority
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tighter text-primary">
              404
            </h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground">
              Oops! The page you&apos;re looking for seems to have wandered off.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
