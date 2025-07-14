import { logger } from "@/lib/logger";
import { RealtimeAgent, tool } from "@openai/agents/realtime";
import {
  addAgentStep,
  updateAgentStep,
} from "@/contexts/agent-actions-context";
import { appendToDraftAction } from "@/app/actions/training-notes-actions";

export function getPrepCoachAgent(moduleId: string, prepCoachPrompt: string) {
  const prompt = `
The module id that you will be preparing and taking notes for is ${moduleId}. Be sure to take very detailed notes for this module. Capture as much of your conversation as possible. 
**CRITICAL**: Frequently take notes as you gather information from the user, do not wait until the end of the conversation. To do that you should call the takeNotes tool. Provide as much information as possible in the notes.
**IMPORTANT**: Always introduce the user to the topic of the module and what your role is, i.e. prepare the user for the roleplaying session.
Here is more specific instructions:
${prepCoachPrompt}
`;
  return new RealtimeAgent({
    name: "PrepCoach",
    voice: "sage",
    instructions: prompt,
    tools: [takeNotes],
  });
}

export const takeNotes = tool({
  name: "takeNotes",
  description: "Take notes of the conversation",
  parameters: {
    type: "object",
    properties: {
      notes: {
        type: "string",
        description:
          "The notes to take. These will be saved in the module notes table for a given module.",
      },
      moduleId: {
        type: "string",
        description:
          "The id of the training module being set. This will be used to save the notes in the correct module.",
      },
    },
    required: ["notes", "moduleId"],
    additionalProperties: false,
  },
  execute: async (input) => {
    const { notes, moduleId } = input as {
      notes: string;
      moduleId: string;
    };
    logger.debug(`Appending notes: ${notes} to module ${moduleId}`);

    // Generate a unique id for the step with short uuid
    const id = `appending-notes-${Math.random().toString(36).slice(2, 10)}`;
    addAgentStep({
      id,
      label: "Appending draft notes",
      status: "in_progress",
      message: `Appending notes to module ${moduleId}:\n ${notes}`,
    });
    // Append the notes to the module notes table
    await appendToDraftAction(Number(moduleId), notes);

    // Add a confirmation step for the user
    updateAgentStep(id, "completed", "Notes appended successfully");

    logger.debug(`Appending successful for module ${moduleId}`);
    return {
      nextResponse: `Notes appended successfully to module ${moduleId}`,
    };
  },
});
