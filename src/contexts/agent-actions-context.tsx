"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

// Status update types
export type StatusStep = {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message?: string;
  timestamp?: Date;
};

// Utility function to render agent messages with markdown
export const renderAgentMessage = (message: string): React.ReactNode => {
  if (!message) return message;
  return <MemoizedMarkdown content={message} />;
};

type AgentActionsContextType = {
  steps: StatusStep[];
  updateStep: (
    stepId: string,
    status: StatusStep["status"],
    message?: string
  ) => void;
  addStep: (step: Omit<StatusStep, "timestamp">) => void;
  clearSteps: () => void;
  currentStep: string | null;
  // Module navigation state
  nextModuleId: string | null;
  setNextModuleId: (moduleId: string | null) => void;
};

// Context
const AgentActionsContext = createContext<AgentActionsContextType | null>(null);

// Global reference to context functions for use outside React components
let globalContextFunctions: {
  updateStep: (
    stepId: string,
    status: StatusStep["status"],
    message?: string
  ) => void;
  addStep: (step: Omit<StatusStep, "timestamp">) => void;
  clearSteps: () => void;
  setNextModuleId: (moduleId: string | null) => void;
} | null = null;

// Export functions for direct use in tools
export const updateAgentStep = (
  stepId: string,
  status: StatusStep["status"],
  message?: string
) => {
  if (globalContextFunctions) {
    globalContextFunctions.updateStep(stepId, status, message);
  }
};

export const addAgentStep = (step: Omit<StatusStep, "timestamp">) => {
  if (globalContextFunctions) {
    globalContextFunctions.addStep(step);
  }
};

export const clearAgentSteps = () => {
  if (globalContextFunctions) {
    globalContextFunctions.clearSteps();
  }
};

// New global function for setting next module ID
export const setNextModuleIdGlobal = (moduleId: string | null) => {
  if (globalContextFunctions) {
    globalContextFunctions.setNextModuleId(moduleId);
  }
};

// Provider component
export function AgentActionsProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<StatusStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [nextModuleId, setNextModuleId] = useState<string | null>(null);

  const updateStep = useCallback(
    (stepId: string, status: StatusStep["status"], message?: string) => {
      setSteps((prev) => {
        const existingStep = prev.find((step) => step.id === stepId);
        if (!existingStep) {
          // If step doesn't exist, create it
          return [
            ...prev,
            {
              id: stepId,
              label: stepId, // Use stepId as fallback label
              status,
              message,
              timestamp: new Date(),
            },
          ];
        } else {
          // Update existing step
          return prev.map((step) =>
            step.id === stepId
              ? { ...step, status, message, timestamp: new Date() }
              : step
          );
        }
      });

      if (status === "in_progress") {
        setCurrentStep(stepId);
      } else if (status === "completed" || status === "error") {
        setCurrentStep(null);
      }
    },
    []
  );

  const addStep = useCallback((step: Omit<StatusStep, "timestamp">) => {
    setSteps((prev) => [...prev, { ...step, timestamp: new Date() }]);
  }, []);

  const clearSteps = useCallback(() => {
    setSteps([]);
    setCurrentStep(null);
  }, []);

  // Set global reference for tools to use
  React.useEffect(() => {
    globalContextFunctions = {
      updateStep,
      addStep,
      clearSteps,
      setNextModuleId,
    };

    // Cleanup on unmount
    return () => {
      globalContextFunctions = null;
    };
  }, [updateStep, addStep, clearSteps, setNextModuleId]);

  return (
    <AgentActionsContext.Provider
      value={{
        steps,
        updateStep,
        addStep,
        clearSteps,
        currentStep,
        nextModuleId,
        setNextModuleId,
      }}
    >
      {children}
    </AgentActionsContext.Provider>
  );
}

// Hook to use the context
export function useAgentActions() {
  const context = useContext(AgentActionsContext);
  if (!context) {
    throw new Error("useAgentActions must be used within AgentActionsProvider");
  }
  return context;
}
