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
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">Ready to Go!</CardTitle>
        <CardDescription className="text-lg mt-2">
          Here&apos;s a summary of your setup
        </CardDescription>
      </CardHeader>

      <div className="px-6 pb-8">
        <div className="bg-card/30 rounded-xl border border-border/40 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/40">
            {/* Profile Section */}
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <Avatar className="h-14 w-14 border-2 border-brand/20 shadow-sm">
                  <AvatarImage src={data.avatarUrl} alt={data.displayName} />
                  <AvatarFallback className="bg-brand/10 text-brand">
                    {getInitials(data.displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-brand" />
                  <h4 className="font-medium text-brand">Profile</h4>
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
                <FolderKanban className="h-4 w-4 text-brand" />
                <h4 className="font-medium text-brand">Project Name</h4>
              </div>
              <p className="text-base">{data.projectName}</p>
            </div>

            {/* Starter Content Section */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-brand" />
                <h4 className="font-medium text-brand">Starter Content</h4>
              </div>
              <p className="text-base">
                {data.copyStarterContent
                  ? "Including starter trainings"
                  : "Starting with a clean project"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-brand/10 rounded-lg p-4 flex items-center gap-3 border border-brand/30">
          <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0" />
          <p className="text-sm">
            Click{" "}
            <span className="font-medium text-brand">
              &quot;Start Setup&quot;
            </span>{" "}
            below to create your project and get started!
          </p>
        </div>
      </div>
    </>
  );
}
