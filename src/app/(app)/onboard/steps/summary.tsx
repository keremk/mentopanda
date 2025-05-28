import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { CheckCircle2, User, FolderKanban, Package } from "lucide-react";
import type { OnboardingData } from "../onboarding-flow";

type SummaryProps = {
  data: OnboardingData;
};

export function Summary({ data }: SummaryProps) {
  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-summary.jpg"
          alt="Setup summary visualization"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute top-4 right-4 text-4xl">🐼</div>
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">Ready to Go!</CardTitle>
        <CardDescription className="text-lg mt-2">
          Here&apos;s a summary of your setup
        </CardDescription>
      </CardHeader>

      <div className="px-6 pb-8">
        <div className="bg-card/30 rounded-xl border border-border/40 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-border/40">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Your Configuration
            </h3>
          </div>

          <div className="divide-y divide-border/40">
            {/* Profile Section */}
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={data.avatarUrl} alt={data.displayName} />
                  <AvatarFallback>
                    {getInitials(data.displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Profile</h4>
                </div>
                <p className="text-base">
                  {data.displayName
                    ? data.displayName
                    : "No display name provided"}
                </p>
              </div>
            </div>

            {/* Project Name Section */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Project Name</h4>
              </div>
              <p className="text-base">{data.projectName}</p>
            </div>

            {/* Starter Content Section */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Starter Content</h4>
              </div>
              <p className="text-base">
                {data.copyStarterContent
                  ? "Including starter trainings and templates"
                  : "Starting with a clean project"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-primary/5 rounded-lg p-4 flex items-center gap-3 border border-primary/20">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm">
            Click <span className="font-medium">&quot;Start Setup&quot;</span>{" "}
            below to create your project and get started!
          </p>
        </div>
      </div>
    </>
  );
}
