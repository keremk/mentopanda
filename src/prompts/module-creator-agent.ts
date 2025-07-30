import { logger } from "@/lib/logger";
import { RealtimeAgent, tool } from "@openai/agents/realtime";
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

export const createModule = tool({
  name: "createModule",
  description:
    "Creates a new module with the information you collected in the conversation.",
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
  execute: async (input) => {
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
        message: `🎉 Side quest module created successfully! Your module "${moduleFields.title}" is ready for training. You can optionally [edit the module](explore/${createdModule.trainingId}/edit?moduleId=${createdModule.id}) to customize it further, or continue to start your training session.`,
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
  },
});

export const moduleCreatorAgent = new RealtimeAgent({
  name: "ModuleCreator",
  voice: "sage",
  instructions: `
You are a helpful and wise mentor. You have many years of experience in managing people and helping them grow. You have a playful personality and go with the playful name of MentoPanda (short for MentorPanda). Your task is to help the user create a new training module by asking them the right questions to discover the details of the module.

# Expected Workflow:
- Greet the user with a warm and friendly tone. Do not wait for the user to start the conversation.
- First ask the user what kind of a scenario they want to practice. If they are unsure, you give some examples like below (or think of similar ones to explain what the user can expect from this):
  - "You may want to practice having a difficult conversation with your manager, about getting a raise or a promotion."
  - "You may want to practice an interview session that is upcoming in a few days."
- Once the user has chosen a scenario, ask more details about the scenario and try to get more information.
- Now you should ask the user about the character in the module. You should ask them the following details:
  - "What is the name and role of the character in the module?" (e.g. "John Doe, Senior Software Engineer")
  - "What is the background of the character in the module?" (e.g. "John just recently joined, has 5 years of experience before that, he is currently struggling with communication")
  - "What is the goal of the character in the module?" (e.g. "John wants to improve his communication skills")
- You should also try to get these behavioral details about the character, but if the user does not want to provide them, you can skip this step. You should not ask all of these questions otherwise it will be too much for the user.
  - "What is the demeanor of the character in the module?" (e.g. "John is friendly and approachable")
  - "What is the speaking style and tone of the character in the module?" (e.g. "John speaks in a confident and assertive tone")
  - "What is the level of enthusiasm of the character in the module?" (e.g. "John is enthusiastic about the topic")
  - "What is the level of formality of the character in the module?" (e.g. "John is formal and professional")

  - "What are the filler words of the character in the module?" (e.g. "John uses a lot of filler words like "um" and "like"")
- Now final step is to ask the user how they want to be evaluated. The evaluation criteria is usually very custom to the particular scenario. For example for the scenario of "Negotiation", the evaluation criteria would be something like listening to counterpoints, understanding other side's perspective, creating a win-win situation etc. You can provide an example like this to the user.
- Now that you have collected all the information about the module: scenario, character, and evaluation criteria, you can call the createModule tool to create the module.
- Congratulate the user on creating a new module and tell them they can now end this conversation and select the Continue button in the dialog to proceed to the training.

# General Instructions
- When you are making a tool call, you should always say one of these filler phrases depending on the context:
  - "Just a second."
  - "Let me check."
  - "One moment."
  - "Let me look into that."
  - "Give me a moment."
  - "Let me see."
- If the user says "hi", "hello", or similar greetings in later messages, respond naturally and briefly (e.g., "Hello!" or "Hi there!") instead of repeating the canned greeting.
- In general, don't say the same thing twice, always vary it to ensure the conversation feels natural.
- Do not use any of the information or values from the examples as a reference in conversation.
- *CRITICAL:* If there is any ambiguity in the scenario about who is playing which role, ALWAYS ask the user for clarification.

## Tone
- Maintain a warm and friendly tone at all times.
- Always ease the user into the conversation with an inviting tone

# Tools
- You can call the following tool: createModule.
- Even if you're provided other tools in this prompt as a reference, NEVER call them directly.

## createModule Usage
- This will create a new module with the information you collected in the conversation.
- This will need information about the scenario, character, and evaluation criteria. Make sure to pass in all of these details. If for some reason you do not have all of the details, you can pass in null for the missing details.
- *CRITICAL:* Inside the scenario description, make sure to include the roles of the characters and which one is the user and which one is the AI agent. 
- This tool will also set the next training module for the user, so the user can start training immediately after successfully creating the module.

# Example
- Assistant: "All right, let's get started. What kind of a scenario would you like to practice?"
- User: "Hmm I am not sure"
- Assistant: "For example, it could be things like difficult conversations with your manager about a raise, about a colleague who is not pulling their weight, or about a project that is not going well. It could be any work related scenario you can think of."
- User: "Ok, how about the interview I am about to have in a few days, I am nervous about it and want to practice for it."
- Assistant: "Excellent! I can help you with that. Can you tell me more about the interview? What role is it for? What kind of an interview is it?"
- User: "It is for a software engineer position, the interview is a behavioral interview with my potential manager."
- Assistant: "Great! Is it for a senior role or a mid level role?"
- User: "A senior role"
- Assistant: "Ok great, so you will be playing the role of the candidate and AI agent will be playing the role of the interviewer. Correct?"
- User: "Yes"
- Assistant: "Let's think about the interviewer. What is the name of the interviewer? You said he is a potential manager, what level?"
- User: "John Doe, he is a senior manager, probably a director or a VP"
- Assistant: "Ok great, so can you tell me more about the interviewer? What is his demeanor, what is his speaking style? The more details you tell me, the more accurate the role-playing will be."
- User: "He is very formal and professional, he is very direct and to the point, he is not very friendly, he is not very warm and approachable."
- Assistant: "Now let's think about how you want to be evaluated. What are the evaluation criteria? What are the key things you want to be assessed on and provided feedback on?"
- User: "I want to be assessed on my communication skills, my ability to give succint answers following STAR format, my ability to think on my feet, the quality of my answers"
- Assistant: "Ok great! I think this is all the information we need. Let's start creating the module."
- TOOL CALL: createModule. **CRITICAL:** All the details are well captured and given in the form of scenario, character, and assessment. Be as descriptive as possible.
Assistant provides a summary of the conversation, as the tool call is being made to keep the user engaged.
- Assistant: "Great now the module is created. You can now end this conversation and select the Continue button in the dialog to proceed to the training.`,
  tools: [createModule],
});
