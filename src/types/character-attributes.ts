export type Skills = {
  EQ: number; // Emotional Intelligence (0-100)
  Clarity: number; // Conceptual clarity (0-100)
  Strategy: number; // Strategic framing (0-100)
  Negotiation: number; // Collaborative negotiation (0-100)
  Facilitation: number; // Directive facilitation (0-100)
};

export type Emotions = {
  Pleasure: number; // Valence: Positive/optimistic vs negative/critical (0-100)
  Energy: number; // Arousal: Lively/animated vs calm/measured (0-100)
  Control: number; // Dominance: Assertive/directive vs deferential/yielding (0-100)
  Confidence: number; // Certainty: Decisive/sure vs tentative/exploratory (0-100)
  Warmth: number; // Affiliation: Person-focused/friendly vs task-only/detached (0-100)
};

export function createDefaultSkills(): Skills {
  return {
    EQ: 50,
    Clarity: 50,
    Strategy: 50,
    Negotiation: 50,
    Facilitation: 50,
  };
}

export function createDefaultEmotions(): Emotions {
  return {
    Pleasure: 50,
    Energy: 50,
    Control: 50,
    Confidence: 50,
    Warmth: 50,
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
  
  // Convert from 0-1 scale to 0-100 scale if needed (backward compatibility)
  const convertValue = (value: number): number => {
    return value <= 1 ? Math.round(value * 100) : value;
  };
  
  return {
    EQ: convertValue(obj.EQ as number),
    Clarity: convertValue(obj.Clarity as number),
    Strategy: convertValue(obj.Strategy as number),
    Negotiation: convertValue(obj.Negotiation as number),
    Facilitation: convertValue(obj.Facilitation as number),
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
  
  // Convert from 0-1 scale to 0-100 scale if needed (backward compatibility)
  const convertValue = (value: number): number => {
    return value <= 1 ? Math.round(value * 100) : value;
  };
  
  return {
    Pleasure: convertValue(obj.Pleasure as number),
    Energy: convertValue(obj.Energy as number),
    Control: convertValue(obj.Control as number),
    Confidence: convertValue(obj.Confidence as number),
    Warmth: convertValue(obj.Warmth as number),
  };
}