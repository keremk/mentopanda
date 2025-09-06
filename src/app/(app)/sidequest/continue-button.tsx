"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAgentActions } from "@/contexts/agent-actions-context";

export function ContinueButton() {
  const router = useRouter();
  const { nextModuleId } = useAgentActions();

  return (
    <Button
      variant="brand"
      className="hidden md:flex"
      disabled={!nextModuleId}
      onClick={() => nextModuleId && router.push(`/simulation/${nextModuleId}`)}
    >
      Continue
    </Button>
  );
}
