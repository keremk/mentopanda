import { PromptConfig } from "@/types/prompt-config";

export const trainingTitleMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

export const trainingTaglineMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

export const trainingDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

const trainingPrompts: Record<string, PromptConfig> = {
  generateTrainingTitle: trainingTitleMetaPrompt,
  generateTrainingTagline: trainingTaglineMetaPrompt,
  generateTrainingDescription: trainingDescriptionMetaPrompt,
};

export default trainingPrompts;