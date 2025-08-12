import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

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

        <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
          <p className="text-base mb-3 font-medium text-brand">
            In the next few steps, we&apos;ll help you:
          </p>

          <ul className="space-y-2 ml-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
              <span className="text-sm">
                Set up your profile with a name and avatar
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
              <span className="text-sm">
                Set up your basic project information
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
              <span className="text-sm">
                Set up your first project
              </span>
            </li>
          </ul>
        </div>

        <p className="text-muted-foreground pt-2">
          Let&apos;s get started by clicking the Next button below!
        </p>
      </div>
    </>
  );
}
