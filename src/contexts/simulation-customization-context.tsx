"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Skills, Emotions, createDefaultSkills, createDefaultEmotions } from "@/types/character-attributes";

type SimulationCustomizationState = {
  skillsOverride: Skills | null;
  emotionsOverride: Emotions | null;
};

type SimulationCustomizationContextType = {
  state: SimulationCustomizationState;
  setSkillsOverride: (skills: Skills | null) => void;
  setEmotionsOverride: (emotions: Emotions | null) => void;
  getEffectiveSkills: (originalSkills?: Skills) => Skills;
  getEffectiveEmotions: (originalEmotions?: Emotions) => Emotions;
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
    emotionsOverride: null,
  });

  const setSkillsOverride = (skills: Skills | null) => {
    setState(prev => ({ ...prev, skillsOverride: skills }));
  };

  const setEmotionsOverride = (emotions: Emotions | null) => {
    setState(prev => ({ ...prev, emotionsOverride: emotions }));
  };

  const getEffectiveSkills = (originalSkills?: Skills): Skills => {
    return state.skillsOverride || originalSkills || createDefaultSkills();
  };

  const getEffectiveEmotions = (originalEmotions?: Emotions): Emotions => {
    return state.emotionsOverride || originalEmotions || createDefaultEmotions();
  };

  const hasOverrides = (): boolean => {
    return state.skillsOverride !== null || state.emotionsOverride !== null;
  };

  const clearOverrides = () => {
    setState({
      skillsOverride: null,
      emotionsOverride: null,
    });
  };

  return (
    <SimulationCustomizationContext.Provider
      value={{
        state,
        setSkillsOverride,
        setEmotionsOverride,
        getEffectiveSkills,
        getEffectiveEmotions,
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