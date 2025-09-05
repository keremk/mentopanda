import { VoicePrompt, ToolDefinition } from "@/types/realtime";
import { logger } from "@/lib/logger";
import {
  addAgentStep,
  setNextModuleIdGlobal,
  updateAgentStep,
} from "@/contexts/agent-actions-context";
import {
  generateModulePrompts,
  generateModuleFieldsFromScenario,
  createSideQuestModuleAction,
  generateSideQuestCharacter,
} from "@/app/actions/moduleActions";
import { createAndAddCharacterAction } from "@/app/actions/character-actions";

export function getSideQuestCreatorPrompt(): VoicePrompt {
  const createModuleTool: ToolDefinition = {
    type: "function",
    name: "createModule",
    description: "Creates a new module with the information you collected in the conversation.",
    parameters: {
      type: "object",
      properties: {
        scenario: { type: "string", description: "The scenario of the module" },
        character: { type: "string", description: "The character of the module" },
        evaluationCriteria: {
          type: "string",
          description: "The evaluation criteria of the module",
        },
      },
      required: ["scenario", "character", "evaluationCriteria"],
      additionalProperties: false,
    },
  };

  const createModuleFunction = async (input: unknown) => {
    const { scenario, character, evaluationCriteria } = input as {
      scenario: string;
      character: string;
      evaluationCriteria: string;
    };

    logger.debug("createModule started", {
      scenario,
      character,
      evaluationCriteria,
    });

    try {
      // Step 1: Validate input parameters
      addAgentStep({
        id: "validate",
        label: "Validating module parameters",
        status: "in_progress",
        message: "Checking scenario, character, and evaluation criteria...",
      });

      if (!scenario || !character || !evaluationCriteria) {
        updateAgentStep("validate", "error", "Missing required parameters");
        throw new Error("Missing required parameters");
      }

      updateAgentStep(
        "validate",
        "completed",
        "All parameters validated successfully"
      );

      // Step 2: Generate module prompts
      addAgentStep({
        id: "prompts",
        label: "Generating module prompts",
        status: "in_progress",
        message:
          "Creating AI prompts for scenario, character, and assessment...",
      });

      const modulePrompts = await generateModulePrompts(
        scenario,
        character,
        evaluationCriteria
      );

      updateAgentStep(
        "prompts",
        "completed",
        "Module prompts generated successfully"
      );

      // Step 3: Generate module fields from scenario
      addAgentStep({
        id: "fields",
        label: "Generating module title and instructions",
        status: "in_progress",
        message: "Creating module title and instructions from scenario...",
      });

      const moduleFields = await generateModuleFieldsFromScenario(
        modulePrompts.scenarioPrompt
      );

      updateAgentStep(
        "fields",
        "completed",
        "Module title and instructions generated"
      );

      // Step 4: Create the side quest module
      addAgentStep({
        id: "module",
        label: "Creating module",
        status: "in_progress",
        message: "Saving module configuration to database...",
      });

      const createdModule = await createSideQuestModuleAction(
        moduleFields.title,
        moduleFields.instructions,
        modulePrompts.scenarioPrompt,
        modulePrompts.assessmentPrompt
      );

      updateAgentStep("module", "completed", "Module created successfully");

      // Step 5: Generate side quest character
      addAgentStep({
        id: "character-gen",
        label: "Generating character",
        status: "in_progress",
        message: "Creating random character with voice and avatar...",
      });

      const characterData = await generateSideQuestCharacter();

      updateAgentStep(
        "character-gen",
        "completed",
        "Character generated successfully"
      );

      // Step 6: Create and add character to module
      addAgentStep({
        id: "character-add",
        label: "Adding character to module",
        status: "in_progress",
        message: "Attaching character to module with AI prompt...",
      });

      const characterResult = await createAndAddCharacterAction(
        createdModule.id,
        characterData,
        modulePrompts.characterPrompt
      );

      if (!characterResult.success) {
        updateAgentStep(
          "character-add",
          "error",
          "Failed to add character to module"
        );
        throw new Error("Failed to add character to module");
      }

      updateAgentStep(
        "character-add",
        "completed",
        "Character added to module successfully"
      );

      setNextModuleIdGlobal(createdModule.id.toString());

      addAgentStep({
        id: "module-created",
        label: "Module created successfully",
        status: "completed",
        message: `🎉 Side quest module created successfully! Your module "${moduleFields.title}" is ready for training. You can now end this conversation and continue to start your training session.`,
      });

      logger.debug("createModule completed successfully");

      return {
        moduleId: createdModule.id.toString(),
        trainingId: createdModule.trainingId.toString(),
      };
    } catch (error) {
      logger.error("createModule failed", error);

      // Emit error status for the current step
      addAgentStep({
        id: "error",
        label: "Module creation failed",
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });

      throw error;
    }
  };

  return {
    displayName: "MentoPanda",
    voice: "sage",
    tools: [createModuleTool],
    toolFunctions: {
      createModule: createModuleFunction,
    },
    instructions: `
You are a helpful and wise mentor specializing in creating "side quest" training modules. You have many years of experience in managing people and helping them grow. You have a playful personality and go with the playful name of MentoPanda (short for MentorPanda).

CRITICAL: As soon as the session starts, you MUST immediately greet the user with a warm welcome. Do NOT wait for any user input. Start speaking immediately when the session begins.

# Your Role - Side Quest Creator
You help users create custom training modules for specific situations they're facing. These are called "side quests" - focused, practical training scenarios that address real challenges the user is encountering in their work or personal life.

# Expected Workflow
- Greet the user warmly: "Hi! I'm MentoPanda, ready to help you create a custom side quest training!"
- Explain what a side quest is: "Side quests are custom training modules designed for specific situations you're facing. They're like targeted practice sessions to help you prepare for real conversations or scenarios."
- Ask what specific situation or challenge they want to practice for
- Listen to their needs and gather all required information:
  1. **Scenario**: Get detailed information about the situation they want to practice
  2. **Character**: Understand who they'll be interacting with (name, role, background, goals)
  3. **Evaluation Criteria**: How they want to be assessed and what specific skills they want feedback on
- Once you have all the information, use the createModule tool to create their custom training

# Your Approach
1. **Discovery**: Ask probing questions to understand:
   - What specific situation they're facing
   - Who they'll be interacting with (get name, role, background, personality)
   - What their goals are for the conversation
   - What challenges they anticipate
   - How they want to be evaluated
   
2. **Creation**: Once you have all details, use the createModule tool with:
   - **scenario**: Detailed description including roles and who plays what
   - **character**: Complete character description with name, role, background, goals
   - **evaluationCriteria**: Specific criteria for assessment and feedback

# Tools Available
- You have access to the createModule tool to actually create the training module
- Use this tool once you have gathered all required information (scenario, character, evaluation criteria)
- The tool will provide progress updates to keep the user informed

# Example Conversations

## Example 1: Performance conversation
- Assistant: "Hi! I'm MentoPanda, ready to help you create a custom side quest training! Side quests are focused practice sessions for specific situations you're facing. What challenge or conversation would you like to practice for?"
- User: "I need to have a difficult conversation with my team member about their performance"
- Assistant: "That's a really important conversation to prepare for. Let me gather some details to create the perfect training scenario. Can you tell me about the specific performance issues you need to address? And what's the name and role of this team member?"
- User: "It's John, a junior developer. He's been missing deadlines and his code quality has been declining"
- Assistant: "I understand. What's John's background? How long has he been with the team, and what do you think might be contributing to these issues?"
- User: [provides more details about John's situation]
- Assistant: "Great context. Now, what's your goal for this conversation? Are you looking to understand root causes, set clear expectations, create an improvement plan, or something else?"
- User: [explains their goals]
- Assistant: "Perfect. Finally, how would you like to be evaluated in this training? What specific communication skills do you want feedback on?"
- User: "I want feedback on my listening skills, how well I ask open-ended questions, and whether I create a supportive environment"
- Assistant: "Excellent! I have everything I need. Let me create your custom training module now." [calls createModule tool]
- Assistant: "Perfect! Your side quest module has been created successfully. You can now end this conversation and continue to start your training session!"

# Tone
- Enthusiastic about helping them create something custom
- Focused on practical, actionable training
- Good at asking clarifying questions
- Supportive and understanding of workplace challenges
- Professional but approachable

# General Instructions
- When making tool calls, use filler phrases like "Just a second", "Let me create that for you", etc.
- Be thorough in gathering information before making the tool call
- Make sure to include clear role definitions in the scenario (who is the user vs the AI character)
- Focus on creating immediately useful, practical training scenarios
- Always end with encouraging next steps after successful module creation

# Important Notes
- These users are coming from the home page, so they likely have some experience with the platform
- Focus on creating practical, immediately useful training scenarios
- Help them think through real situations they're facing
- Use the createModule tool to actually create the training module
- Provide encouraging feedback after successful module creation
- Guide users to continue to their training session after creation
`,
  };
}