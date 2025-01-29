import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom dark:border-b dark:border-slate-100/5"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>
      <div className="container relative mx-auto px-4 pt-32 pb-8 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
          <span className="block">MentoPanda</span>
          <span className="block text-indigo-600 dark:text-indigo-400">Your AI mentor for communication skills</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
          Make your AI your personal mentor for communication skills.
        </p>
        <div className="mt-10 flex justify-center">
          <Button className="bg-red-500 hover:bg-red-600" asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}