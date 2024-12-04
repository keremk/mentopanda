"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CollapsibleBlock({ children }: { children: React.ReactNode }) {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

  return (
    <Collapsible
      open={isInstructionsOpen}
      onOpenChange={setIsInstructionsOpen}
      className="mb-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Instructions</h2>
        <CollapsibleTrigger asChild>
          <Button variant="ghost">
            {isInstructionsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
