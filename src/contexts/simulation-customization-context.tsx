"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Traits, createDefaultTraits } from "@/types/character-attributes";

type SimulationCustomizationState = {
  traitsOverride: Traits | null;
};

type SimulationCustomizationContextType = {
  state: SimulationCustomizationState;
  setTraitsOverride: (traits: Traits | null) => void;
  getEffectiveTraits: (originalTraits?: Traits) => Traits;
  hasOverrides: () => boolean;
  clearOverrides: () => void;
};

const SimulationCustomizationContext = createContext<SimulationCustomizationContextType | undefined>(
  undefined
);

interface SimulationCustomizationProviderProps {
  children: ReactNode;
}

export function SimulationCustomizationProvider({ 
  children 
}: SimulationCustomizationProviderProps) {
  const [state, setState] = useState<SimulationCustomizationState>({
    traitsOverride: null,
  });

  const setTraitsOverride = (traits: Traits | null) => {
    setState(prev => ({ ...prev, traitsOverride: traits }));
  };

  const getEffectiveTraits = (originalTraits?: Traits): Traits => {
    return state.traitsOverride || originalTraits || createDefaultTraits();
  };

  const hasOverrides = (): boolean => {
    return state.traitsOverride !== null;
  };

  const clearOverrides = () => {
    setState({
      traitsOverride: null,
    });
  };

  return (
    <SimulationCustomizationContext.Provider
      value={{
        state,
        setTraitsOverride,
        getEffectiveTraits,
        hasOverrides,
        clearOverrides,
      }}
    >
      {children}
    </SimulationCustomizationContext.Provider>
  );
}

export function useSimulationCustomization() {
  const context = useContext(SimulationCustomizationContext);
  if (!context) {
    throw new Error(
      "useSimulationCustomization must be used within a SimulationCustomizationProvider"
    );
  }
  return context;
}