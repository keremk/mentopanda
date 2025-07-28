export type Skills = {
  EQ: number; // Emotional Intelligence (0-1)
  Clarity: number; // Conceptual clarity (0-1)
  Strategy: number; // Strategic framing (0-1)
  Negotiation: number; // Collaborative negotiation (0-1)
  Facilitation: number; // Directive facilitation (0-1)
};

export type Emotions = {
  Pleasure: number; // Valence: Positive/optimistic vs negative/critical (0-1)
  Energy: number; // Arousal: Lively/animated vs calm/measured (0-1)
  Control: number; // Dominance: Assertive/directive vs deferential/yielding (0-1)
  Confidence: number; // Certainty: Decisive/sure vs tentative/exploratory (0-1)
  Warmth: number; // Affiliation: Person-focused/friendly vs task-only/detached (0-1)
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
    Pleasure: 0.5,
    Energy: 0.5,
    Control: 0.5,
    Confidence: 0.5,
    Warmth: 0.5,
  };
}

// Helper function to validate and parse Skills from database JSONB
export function parseSkillsFromDb(data: unknown): Skills {
  if (!data || typeof data !== 'object') return createDefaultSkills();
  
  const obj = data as Record<string, unknown>;
  const requiredKeys = ['EQ', 'Clarity', 'Strategy', 'Negotiation', 'Facilitation'];
  
  // Check if all required keys exist and are numbers
  for (const key of requiredKeys) {
    if (!(key in obj) || typeof obj[key] !== 'number') {
      return createDefaultSkills();
    }
  }
  
  return {
    EQ: obj.EQ as number,
    Clarity: obj.Clarity as number,
    Strategy: obj.Strategy as number,
    Negotiation: obj.Negotiation as number,
    Facilitation: obj.Facilitation as number,
  };
}

// Helper function to validate and parse Emotions from database JSONB
export function parseEmotionsFromDb(data: unknown): Emotions {
  if (!data || typeof data !== 'object') return createDefaultEmotions();
  
  const obj = data as Record<string, unknown>;
  const requiredKeys = ['Pleasure', 'Energy', 'Control', 'Confidence', 'Warmth'];
  
  // Check if all required keys exist and are numbers
  for (const key of requiredKeys) {
    if (!(key in obj) || typeof obj[key] !== 'number') {
      return createDefaultEmotions();
    }
  }
  
  return {
    Pleasure: obj.Pleasure as number,
    Energy: obj.Energy as number,
    Control: obj.Control as number,
    Confidence: obj.Confidence as number,
    Warmth: obj.Warmth as number,
  };
}