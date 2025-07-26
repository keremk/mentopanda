export type Skills = {
  EQ: number; // Emotional Intelligence (0-1)
  Clarity: number; // Conceptual clarity (0-1)
  Strategy: number; // Strategic framing (0-1)
  Negotiation: number; // Collaborative negotiation (0-1)
  Facilitation: number; // Directive facilitation (0-1)
};

export type Emotions = {
  Neutral: number; // (0-1)
  Supportive: number; // (0-1)
  Enthusiastic: number; // (0-1)
  Concerned: number; // (0-1)
  Frustrated: number; // (0-1)
};

export function createDefaultSkills(): Skills {
  return {
    EQ: 0.2,
    Clarity: 0.2,
    Strategy: 0.2,
    Negotiation: 0.2,
    Facilitation: 0.2,
  };
}

export function createDefaultEmotions(): Emotions {
  return {
    Neutral: 0.2,
    Supportive: 0.2,
    Enthusiastic: 0.2,
    Concerned: 0.2,
    Frustrated: 0.2,
  };
}