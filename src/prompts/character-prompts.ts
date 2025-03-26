import { PromptConfig } from "@/types/prompt-config";

export const characterNameMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

export const characterDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

export const characterAIDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

const characterPrompts: Record<string, PromptConfig>  = {
  generateCharacterName: characterNameMetaPrompt,
  generateCharacterDescription: characterDescriptionMetaPrompt,
  generateCharacterAIDescription: characterAIDescriptionMetaPrompt,
}

export default characterPrompts;