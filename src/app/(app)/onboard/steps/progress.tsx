"use client";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProgressProps = {
  status: string | null;
};

export function Progress({ status }: ProgressProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Setting Up Your Workspace</CardTitle>
        <CardDescription>
          Please wait while we prepare everything for you
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 px-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    </>
  );
}
