"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

type ProgressProps = {
  status: string | null;
};

export function Progress({ status }: ProgressProps) {
  return (
    <>
      <div className="relative w-full h-56 overflow-hidden rounded-t-lg">
        <Image
          src="https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/onboarding//onboarding-progress.jpg"
          alt="Setup progress visualization"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-background/50 to-background/90" />
      </div>

      <CardHeader className="relative pt-6">
        <CardTitle className="text-3xl font-bold">
          Setting Up Your Workspace
        </CardTitle>
        <CardDescription className="text-lg mt-2">
          Please wait while we prepare everything for you
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    </>
  );
}
