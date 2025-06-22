"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TrainingSummary } from "@/data/trainings";
import { useIsMobileWidth } from "@/hooks/use-is-mobile-width";

type DesktopRedirectorProps = {
  trainings: TrainingSummary[];
};

export function DesktopRedirector({ trainings }: DesktopRedirectorProps) {
  const router = useRouter();
  const isMobile = useIsMobileWidth();

  useEffect(() => {
    // Wait until we know for sure whether it's mobile or desktop
    if (isMobile === false && trainings && trainings.length > 0) {
      router.replace(`/enrollments/${trainings[0].id}`);
    }
  }, [isMobile, router, trainings]);

  return null;
}
