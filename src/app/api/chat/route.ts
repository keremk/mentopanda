import { type CoreMessage, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  ContextType,
  ContextData,
  SelectedOption,
} from "@/contexts/ai-pane-context";
import characterPrompts from "@/prompts/character-prompts";
import modulePrompts from "@/prompts/module-prompts";
import trainingPrompts from "@/prompts/training-prompts";
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "@/app/actions/aicontext-actions";
import { TrainingContextData } from "@/data/ai-context";
import { CharacterContextForAI } from "@/data/characters";

const generateMetaCharacterPrompts = (
  selectedOption: SelectedOption,
  characterContext: CharacterContextForAI | null
) => {
  const basePrompt = "You are tasked with generating character information";

  const characterPrompt = `
# Instructions:
${characterPrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available character information:
Character Name: ${characterContext?.name}
Character Description: ${characterContext?.description}
Character AI Meta Prompt: ${characterContext?.aiDescription}
  `;

  console.log(characterPrompt);
  return characterPrompt;
};

const generateMetaModulePrompts = (
  selectedOption: SelectedOption,
  trainingContext: TrainingContextData | null
) => {
  const basePrompt = "You are tasked with generating module information";

  const modulePrompt = `
# Instructions:
${modulePrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available module information:
Training Title: ${trainingContext?.training.title}
Module Title: ${trainingContext?.module.title}
Module Instructions: ${trainingContext?.module.instructions}
Module Scenario: ${trainingContext?.module.scenario}
Module Assessment: ${trainingContext?.module.assessment}
Module Moderator: ${trainingContext?.module.moderator}
Module CharacterPrompts: ${trainingContext?.characters.map((character) => `Character Name: ${character.name}\nCharacter Description: ${character.description}\nCharacter AI Meta Prompt: ${character.aiDescription} \n`).join("\n")}  
  `;

  console.log(modulePrompt);
  return modulePrompt;
};

const generateMetaTrainingPrompts = (
  selectedOption: SelectedOption,
  trainingContext: TrainingContextData | null
) => {
  const basePrompt = "You are tasked with generating training information";

  const trainingPrompt = `
# Instructions:
${trainingPrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available training information:
Training Title: ${trainingContext?.training.title}
Training Tagline: ${trainingContext?.training.tagline}
Training Description: ${trainingContext?.training.description}

  `;

  console.log(trainingPrompt);
  return trainingPrompt;
};

// Generate system prompt based on context and selected option
async function generateSystemPrompt(
  characterContext: CharacterContextForAI | null,
  trainingContext: TrainingContextData | null,
  contextType?: ContextType,
  selectedOption?: SelectedOption
): Promise<string> {
  const basePrompt = "You are a helpful assistant.";
  console.log(`contextType: ${contextType}`);
  console.log(`selectedOption: ${selectedOption}`);
  console.log(`characterContext: ${characterContext}`);
  console.log(`trainingContext: ${trainingContext}`);

  if (!selectedOption) return basePrompt;

  switch (contextType) {
    case "character":
      return generateMetaCharacterPrompts(selectedOption, characterContext);
    case "module":
      return generateMetaModulePrompts(selectedOption, trainingContext);
    case "training":
      return generateMetaTrainingPrompts(selectedOption, trainingContext);
    default:
      return basePrompt;
  }
}

export async function POST(req: Request) {
  const {
    messages,
    contextType,
    contextData,
    selectedOption,
  }: {
    messages: CoreMessage[];
    contextType?: ContextType;
    contextData?: ContextData;
    selectedOption?: SelectedOption;
  } = await req.json();

  console.log(`selectedOption: ${JSON.stringify(selectedOption)}`);

  let characterContext: CharacterContextForAI | null = null;
  let trainingContext: TrainingContextData | null = null;

  if (contextType && contextType === "character") {
    const characterId = contextData?.characterId
      ? parseInt(contextData.characterId)
      : null;
    characterContext = characterId
      ? await getAIContextDataForCharacterAction(characterId)
      : null;
  } else {
    const trainingId = contextData?.trainingId
      ? parseInt(contextData.trainingId)
      : null;
    const moduleId = contextData?.moduleId
      ? parseInt(contextData.moduleId)
      : null;
    trainingContext =
      trainingId && moduleId
        ? await getAIContextDataForTrainingAction(trainingId, moduleId)
        : null;
  }

  const systemPrompt = await generateSystemPrompt(
    characterContext,
    trainingContext,
    contextType,
    selectedOption
  );

  console.log(systemPrompt);
  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
