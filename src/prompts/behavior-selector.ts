import { PromptConfig } from "@/types/prompt-config";
import { 
  EmotionState, 
  getCombinedEmotionPrompt, 
  getEmotionPrompt,
  EmotionAxis,
  scoreToRange as emotionScoreToRange 
} from "./emotions-prompts";
import { 
  SkillsState, 
  getCombinedSkillsPrompt, 
  getSkillPrompt,
  Skill,
  scoreToRange as skillScoreToRange 
} from "./skills-prompts";

// Combined Behavior State
export interface BehaviorState {
  emotions: EmotionState;
  skills: SkillsState;
}

// Behavior Change Detection
export interface BehaviorChange {
  emotionChanges: Partial<Record<EmotionAxis, { from: number; to: number; rangeChanged: boolean }>>;
  skillChanges: Partial<Record<Skill, { from: number; to: number; rangeChanged: boolean }>>;
  hasThresholdCrossings: boolean;
}

// System Prompt Generation Options
export interface SystemPromptOptions {
  priority: 'normal' | 'high' | 'urgent';
  context?: string;
  duration?: string;
  specificDirectives?: string[];
}

/**
 * Detects which behaviors have crossed range thresholds
 */
export function detectBehaviorChanges(
  currentState: BehaviorState, 
  newState: BehaviorState
): BehaviorChange {
  const changes: BehaviorChange = {
    emotionChanges: {},
    skillChanges: {},
    hasThresholdCrossings: false
  };

  // Check emotion changes
  const emotionAxes: EmotionAxis[] = ['valence', 'arousal', 'dominance', 'certainty', 'affiliation'];
  for (const axis of emotionAxes) {
    const fromScore = currentState.emotions[axis];
    const toScore = newState.emotions[axis];
    const fromRange = emotionScoreToRange(fromScore);
    const toRange = emotionScoreToRange(toScore);
    const rangeChanged = fromRange !== toRange;

    if (rangeChanged) {
      changes.emotionChanges[axis] = { from: fromScore, to: toScore, rangeChanged };
      changes.hasThresholdCrossings = true;
    }
  }

  // Check skill changes
  const skills: Skill[] = ['emotionalIntelligence', 'conceptualClarity', 'strategicFraming', 'collaborativeNegotiation', 'directiveFacilitation'];
  for (const skill of skills) {
    const fromScore = currentState.skills[skill];
    const toScore = newState.skills[skill];
    const fromRange = skillScoreToRange(fromScore);
    const toRange = skillScoreToRange(toScore);
    const rangeChanged = fromRange !== toRange;

    if (rangeChanged) {
      changes.skillChanges[skill] = { from: fromScore, to: toScore, rangeChanged };
      changes.hasThresholdCrossings = true;
    }
  }

  return changes;
}

/**
 * Generates a unified system prompt for behavior changes
 */
export function generateSystemPrompt(
  behaviorChanges: BehaviorChange,
  newState: BehaviorState,
  options: SystemPromptOptions = { priority: 'normal' }
): PromptConfig | null {
  if (!behaviorChanges.hasThresholdCrossings) {
    return null; // No prompt needed if no thresholds crossed
  }

  let prompt = `BEHAVIORAL ADJUSTMENT - PRIORITY: ${options.priority.toUpperCase()}\n\n`;

  // Add emotion adjustments
  const emotionChangesEntries = Object.entries(behaviorChanges.emotionChanges);
  if (emotionChangesEntries.length > 0) {
    prompt += `EMOTIONAL SLIDERS UPDATE:\n`;
    for (const [axis, change] of emotionChangesEntries) {
      if (change) {
        const newRange = emotionScoreToRange(change.to);
        const axisPrompt = getEmotionPrompt(axis as EmotionAxis, change.to);
        const rangeLabel = getRangeLabel(axis as EmotionAxis, newRange);
        prompt += `- ${formatAxisName(axis)}: Range ${newRange} (${change.from}→${change.to}) - ${rangeLabel}\n`;
      }
    }
    prompt += `\n`;
  }

  // Add skill adjustments
  const skillChangesEntries = Object.entries(behaviorChanges.skillChanges);
  if (skillChangesEntries.length > 0) {
    prompt += `SKILL ADJUSTMENTS:\n`;
    for (const [skill, change] of skillChangesEntries) {
      if (change) {
        const newRange = skillScoreToRange(change.to);
        const skillPrompt = getSkillPrompt(skill as Skill, change.to);
        const rangeLabel = getSkillRangeLabel(skill as Skill, newRange);
        prompt += `- ${formatSkillName(skill)}: Range ${newRange} (${change.from}→${change.to}) - ${rangeLabel}\n`;
      }
    }
    prompt += `\n`;
  }

  // Add specific directives if provided
  if (options.specificDirectives && options.specificDirectives.length > 0) {
    prompt += `SPECIFIC BEHAVIORAL DIRECTIVES:\n`;
    options.specificDirectives.forEach((directive, index) => {
      prompt += `${index + 1}. ${directive}\n`;
    });
    prompt += `\n`;
  }

  // Add context if provided
  if (options.context) {
    prompt += `CONTEXT: ${options.context}\n\n`;
  }

  // Add duration if provided
  const duration = options.duration || "Until next threshold crossing or decay returns to baseline";
  prompt += `DURATION: ${duration}`;

  return { metaPrompt: prompt.trim() };
}

/**
 * Gets the complete behavioral prompt for a given state
 */
export function getCompleteBehaviorPrompt(behaviorState: BehaviorState): PromptConfig {
  const emotionPrompt = getCombinedEmotionPrompt(behaviorState.emotions);
  const skillsPrompt = getCombinedSkillsPrompt(behaviorState.skills);

  const combinedPrompt = `
COMPLETE BEHAVIORAL CONFIGURATION:

${emotionPrompt.metaPrompt}

${skillsPrompt.metaPrompt}

Integrate these emotional and skill characteristics seamlessly to create a natural, coherent personality.
  `.trim();

  return { metaPrompt: combinedPrompt };
}

/**
 * Utility functions for formatting
 */
function formatAxisName(axis: string): string {
  const names: Record<string, string> = {
    'valence': 'Valence',
    'arousal': 'Arousal', 
    'dominance': 'Dominance',
    'certainty': 'Certainty',
    'affiliation': 'Affiliation'
  };
  return names[axis] || axis;
}

function formatSkillName(skill: string): string {
  const names: Record<string, string> = {
    'emotionalIntelligence': 'Emotional Intelligence',
    'conceptualClarity': 'Conceptual Clarity',
    'strategicFraming': 'Strategic Framing', 
    'collaborativeNegotiation': 'Collaborative Negotiation',
    'directiveFacilitation': 'Directive Facilitation'
  };
  return names[skill] || skill;
}

function getRangeLabel(axis: EmotionAxis, range: number): string {
  const labels: Record<EmotionAxis, Record<number, string>> = {
    valence: {
      1: "Express strong negativity and pessimism",
      2: "Express caution and concern", 
      3: "Use balanced, realistic language",
      4: "Express genuine optimism",
      5: "Express high enthusiasm and excitement"
    },
    arousal: {
      1: "Very slow, contemplative pace",
      2: "Calm, deliberate speaking",
      3: "Normal conversational pace", 
      4: "Clear energy and animation",
      5: "Rapid, highly animated speaking"
    },
    dominance: {
      1: "Extremely deferential and submissive",
      2: "Deferential, yield to others",
      3: "Balanced assertion when appropriate",
      4: "Assertive and directive", 
      5: "Take complete control"
    },
    certainty: {
      1: "Express deep uncertainty",
      2: "Use tentative, uncertain language",
      3: "Show moderate confidence",
      4: "Speak with confidence and conviction",
      5: "Absolute certainty and conviction"
    },
    affiliation: {
      1: "Cold, task-focused only",
      2: "Professional but distant",
      3: "Moderate warmth and friendliness", 
      4: "Warm, collaborative approach",
      5: "Deep personal care and investment"
    }
  };
  return labels[axis][range] || "Unknown range";
}

function getSkillRangeLabel(skill: Skill, range: number): string {
  const labels: Record<Skill, Record<number, string>> = {
    emotionalIntelligence: {
      1: "Emotionally oblivious responses",
      2: "Limited emotional awareness",
      3: "Moderate emotional intelligence",
      4: "High emotional intelligence", 
      5: "Exceptional emotional mastery"
    },
    conceptualClarity: {
      1: "Extremely unclear explanations",
      2: "Poor clarity in communication",
      3: "Adequate explanation ability",
      4: "Good clarity with audience adaptation",
      5: "Exceptional clarity with perfect analogies"
    },
    strategicFraming: {
      1: "No strategic awareness",
      2: "Limited strategic context",
      3: "Basic strategic understanding",
      4: "Strong strategic perspective",
      5: "Exceptional strategic vision"
    },
    collaborativeNegotiation: {
      1: "Adversarial, inflexible approach", 
      2: "Poor negotiation skills",
      3: "Basic negotiation ability",
      4: "Strong collaborative skills",
      5: "Master negotiator abilities"
    },
    directiveFacilitation: {
      1: "No facilitation skills",
      2: "Poor facilitation attempts",
      3: "Basic facilitation ability", 
      4: "Strong facilitation skills",
      5: "Master facilitator capabilities"
    }
  };
  return labels[skill][range] || "Unknown range";
}

// Example usage functions
export function createExampleBehaviorStates() {
  const baseline: BehaviorState = {
    emotions: {
      valence: 60,
      arousal: 50,
      dominance: 45,
      certainty: 55,
      affiliation: 65
    },
    skills: {
      emotionalIntelligence: 50,
      conceptualClarity: 70,
      strategicFraming: 40,
      collaborativeNegotiation: 60,
      directiveFacilitation: 45
    }
  };

  const frustrated: BehaviorState = {
    emotions: {
      valence: 35, // Range 3→2
      arousal: 40,  // Same range
      dominance: 45, // Same range
      certainty: 45, // Same range  
      affiliation: 80 // Range 4→5
    },
    skills: {
      emotionalIntelligence: 75, // Range 3→4
      conceptualClarity: 70, // Same range
      strategicFraming: 40, // Same range
      collaborativeNegotiation: 60, // Same range
      directiveFacilitation: 45 // Same range
    }
  };

  return { baseline, frustrated };
}

export default {
  detectBehaviorChanges,
  generateSystemPrompt,
  getCompleteBehaviorPrompt,
  createExampleBehaviorStates
};