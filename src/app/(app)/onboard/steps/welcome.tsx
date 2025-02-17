import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Welcome() {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to MentoPanda! 🐼</CardTitle>
        <CardDescription className="text-lg">
          We&apos;re excited to help you get started with your AI training
          journey.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4 px-6">
        <p>
          MentoPanda is your AI training companion that helps you create, manage,
          and improve your AI models through structured training sessions.
        </p>
        
        <p>
          In the next few steps, we&apos;ll help you:
        </p>
        
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Set up your first project</li>
          <li>Get started with pre-built training templates</li>
          <li>Invite your team members (if you&apos;d like)</li>
        </ul>

        <p className="text-muted-foreground">
          Let&apos;s get started by clicking the Next button below!
        </p>
      </div>
    </>
  );
} 