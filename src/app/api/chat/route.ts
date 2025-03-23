import { type CoreMessage, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  ContextType,
  ContextData,
  SelectedOption,
} from "@/contexts/ai-pane-context";

// Generate system prompt based on context and selected option
function generateSystemPrompt(
  contextType?: ContextType,
  contextData?: ContextData,
  selectedOption?: SelectedOption
): string {
  const basePrompt = "You are a helpful assistant.";

  // If we have a selected option, use that to generate a more specific prompt
  if (selectedOption) {
    const currentContent = contextData?.currentContent || "";
    const relatedContent = formatRelatedContent(contextData?.relatedContent);

    switch (selectedOption.id) {
      // Training options
      case "generateTrainingTitle":
        return `You are an expert at creating engaging and descriptive titles for training programs.
Please generate a concise, catchy title for this training:
${relatedContent}
Current title: "${currentContent}"
Your response should be a single, clear title. It should be concise not more than few words but descriptive. Do not include any other text. Do not wrap the title in quotes.`;

      case "generateTrainingTagline":
        return `You are an expert at creating catchy marketing taglines for training programs.
Please generate a short, impactful tagline for this training:
${relatedContent}
Current tagline: "${currentContent}"
Your response should be a single catchy tagline, ideally under 10 words. Do not include any other text.`;

      case "generateTrainingDescription":
        return `You are an expert at creating engaging, informative descriptions for training programs.
Please generate a comprehensive description for this training:
${relatedContent}
Current description: "${currentContent}"
Your response should be 2-3 paragraphs describing the value and content of the training program.`;

      // Module options
      case "generateModuleTitle":
        return `You are an expert at creating descriptive and engaging module titles.
Please generate a concise, descriptive title for this training module:
${relatedContent}
Current title: "${currentContent}"
Your response should be a single, clear title that indicates what the module covers.`;

      case "generateModuleInstructions":
        return `You are an expert at creating clear, user-friendly instructions for training modules.
Please generate instructions that will guide users through this module:
${relatedContent}
Current instructions: "${currentContent}"
Your response should be concise, clear instructions that help users understand what to do.`;

      case "generateScenario":
        return `You are an expert at creating immersive, realistic training scenarios.
Please generate a detailed scenario for this training module:
${relatedContent}
Current scenario: "${currentContent}"
Your response should describe a realistic situation that requires the skills being taught.`;

      case "generateAssessment":
        return `You are an expert at creating effective assessment criteria for training modules.
Please generate assessment instructions for this module:
${relatedContent}
Current assessment instructions: "${currentContent}"
Your response should provide clear criteria for evaluating performance in the scenario.`;

      case "generateCharacterPrompt":
        return `You are an expert at creating detailed character descriptions for AI-driven characters in training scenarios.
Please generate a character prompt for this character:
${relatedContent}
Current character prompt: "${currentContent}"
Your response should describe the character's personality, background, knowledge, and communication style.`;

      default:
        return basePrompt;
    }
  }

  // Fallback to context-type based prompt if no option selected
  if (!contextType) return basePrompt;

  switch (contextType) {
    case "scenario":
      return `You are a helpful assistant specialized in creating engaging training scenarios.
Current content being edited: Scenario
${contextData?.currentContent ? `Current text: "${contextData.currentContent}"` : ""}
${formatRelatedContent(contextData?.relatedContent)}
Please help create a detailed, realistic scenario that will effectively train users.`;

    case "assessment":
      return `You are a helpful assistant specialized in creating effective assessments.
Current content being edited: Assessment
${contextData?.currentContent ? `Current text: "${contextData.currentContent}"` : ""}
${formatRelatedContent(contextData?.relatedContent)}
Please help create assessment criteria that measures user performance and provides meaningful feedback.`;

    case "module":
      return `You are a helpful assistant specialized in training module creation.
Current content being edited: Module
${contextData?.currentContent ? `Current text: "${contextData.currentContent}"` : ""}
${formatRelatedContent(contextData?.relatedContent)}
Please help create training module content that is educational and engaging.`;

    case "character":
      return `You are a helpful assistant specialized in character creation.
Current content being edited: Character description
${contextData?.currentContent ? `Current text: "${contextData.currentContent}"` : ""}
${formatRelatedContent(contextData?.relatedContent)}
Please help create a detailed and consistent character description.`;

    case "training":
      return `You are a helpful assistant specialized in training design.
Current content being edited: Training information
${contextData?.currentContent ? `Current text: "${contextData.currentContent}"` : ""}
${formatRelatedContent(contextData?.relatedContent)}
Please help create engaging and informative training content.`;

    default:
      return basePrompt;
  }
}

// Format related content for inclusion in the prompt
function formatRelatedContent(
  relatedContent?: Record<string, string | undefined>
): string {
  if (!relatedContent) return "";

  let result = "Related content:\n";
  for (const [key, value] of Object.entries(relatedContent)) {
    // Skip undefined values
    if (value === undefined) continue;
    result += `${key}: "${value}"\n`;
  }
  return result;
}

export async function POST(req: Request) {
  const {
    messages,
    contextType,
    contextData,
    additionalData,
  }: {
    messages: CoreMessage[];
    contextType?: ContextType;
    contextData?: ContextData;
    additionalData?: { selectedOption?: SelectedOption };
  } = await req.json();

  // Extract the selected option if present
  const selectedOption = additionalData?.selectedOption;

  // Add the selected option to the user message data for retrieval later
  if (
    selectedOption &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user"
  ) {
    // Type cast to add data property to the message
    type UserMessageWithData = CoreMessage & {
      data?: { selectedOption: SelectedOption };
    };
    (messages[messages.length - 1] as UserMessageWithData).data = {
      selectedOption,
    };
  }

  const systemPrompt = generateSystemPrompt(
    contextType,
    contextData,
    selectedOption
  );

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
