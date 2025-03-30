import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export function Welcome() {
  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-welcome.jpg"
          alt="AI training visualization"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute top-4 right-4 text-4xl">🐼</div>
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">
          Welcome to MentoPanda!
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          We&apos;re excited to help you get started with your training journey.
        </CardDescription>
      </CardHeader>

      <div className="space-y-5 px-6 pb-6">
        <p className="text-base">
          MentoPanda is your AI training companion that helps you improve your
          communication skills. You will be able to practice those in various
          scenarios. You will also be able to create your own scenarios and AI
          characters to practice with.
        </p>

        <div>
          <p className="text-base mb-2 font-medium">
            In the next few steps, we&apos;ll help you:
          </p>

          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Set up your profile with a name and avatar</li>
            <li>Set up your basic project information</li>
            <li>Set up your first project with pre-built training sessions</li>
          </ul>
        </div>

        <p className="text-muted-foreground pt-2">
          Let&apos;s get started by clicking the Next button below!
        </p>
      </div>
    </>
  );
}
