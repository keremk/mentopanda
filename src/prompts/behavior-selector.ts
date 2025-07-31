import { PromptConfig } from "@/types/prompt-config";
import { Skills, Traits } from "@/types/character-attributes";
import { getCombinedTraitPrompt } from "./traits-prompts";
import { getCombinedSkillsPrompt } from "./skills-prompts";

// Combined Behavior State - using the single source of truth types
export interface BehaviorState {
  traits: Traits;
  skills: Skills;
}

/**
 * Gets the complete behavioral prompt for a given state
 */
export function getCompleteBehaviorPrompt(behaviorState: BehaviorState): PromptConfig {
  const traitPrompt = getCombinedTraitPrompt(behaviorState.traits);
  const skillsPrompt = getCombinedSkillsPrompt(behaviorState.skills);

  const combinedPrompt = `
Integrate these trait and skill characteristics seamlessly to create a natural, coherent personality.
${traitPrompt.metaPrompt}

${skillsPrompt.metaPrompt}
  `.trim();

  return { metaPrompt: combinedPrompt };
}