"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Skills, Traits, createDefaultSkills, createDefaultTraits } from "@/types/character-attributes";

type SimulationCustomizationState = {
  skillsOverride: Skills | null;
  traitsOverride: Traits | null;
};

type SimulationCustomizationContextType = {
  state: SimulationCustomizationState;
  setSkillsOverride: (skills: Skills | null) => void;
  setTraitsOverride: (traits: Traits | null) => void;
  getEffectiveSkills: (originalSkills?: Skills) => Skills;
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
    skillsOverride: null,
    traitsOverride: null,
  });

  const setSkillsOverride = (skills: Skills | null) => {
    setState(prev => ({ ...prev, skillsOverride: skills }));
  };

  const setTraitsOverride = (traits: Traits | null) => {
    setState(prev => ({ ...prev, traitsOverride: traits }));
  };

  const getEffectiveSkills = (originalSkills?: Skills): Skills => {
    return state.skillsOverride || originalSkills || createDefaultSkills();
  };

  const getEffectiveTraits = (originalTraits?: Traits): Traits => {
    return state.traitsOverride || originalTraits || createDefaultTraits();
  };

  const hasOverrides = (): boolean => {
    return state.skillsOverride !== null || state.traitsOverride !== null;
  };

  const clearOverrides = () => {
    setState({
      skillsOverride: null,
      traitsOverride: null,
    });
  };

  return (
    <SimulationCustomizationContext.Provider
      value={{
        state,
        setSkillsOverride,
        setTraitsOverride,
        getEffectiveSkills,
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