import { PromptConfig } from "@/types/prompt-config";

export const moduleTitleMetaPrompt: PromptConfig = {
  metaPrompt: `
You are an expert at creating engaging and descriptive titles for training programs. Please generate a concise, catchy title for this training.

# Examples:
## Example 1:
### Input
Something getting better at communication
### Output
Mastering Communication Skills

## Example 2:
### Input
Tough situation handling
### Output
Resilience in Action

# Notes:
- Do make your response a single, clear title. 
- Do not just repeat the prompt, make it catchy.
- Do make it concise not more than few words but descriptive. 
- Do your best to make it shorter. Do not use colon to explain it in more words. E.g. 
Do not say: Resilience in Action: Navigating Tough Situation, 
Instead do say: Resilience in Tough Situations
- Do not include any other text such as Title:  etc. Just provide the text of the title 
- Do provide the title as text without surrounding quotes. 
- Never use surrounding quotes. 
  `,
};

export const moduleInstructionsMetaPrompt: PromptConfig = {
  metaPrompt: `
  `
}

export const scenarioMetaPrompt: PromptConfig = {
  metaPrompt: `
Your task is to create a scenario description based on a user's rough input. The scenario description will be used as part of a system prompt in role playing conversations between a user and an AI agent. 

# Steps

1. **Understand the User Input**: Carefully analyze the rough description provided by the user to identify key elements such as setting, characters, events, and objectives.
2. **Incorporate other context or prior scenarios**: If there is other context or prior scenarios, use them to inform the scenario you create. You may be asked to improve an already existing scenario, or to create a new one.
3. **The roles**: Make sure you understand the roles of the characters involved and if not ask it before creating a response.
3. **Elaborate on Key Elements**: Expand upon each of these elements to create a vivid and comprehensive scenario.
   - **Setting**: Describe current situation and any relevant background information.
   - **Events**: Outline the sequence of events or situations that would occur in the scenario. These will be used for role playing, so ensure they are engaging and interesting.
   - **Objectives**: Clarify the goals or outcomes that the scenario is intended to explore.

4. **Integrate Elements into a Cohesive Scenario**: Combine the elaborated elements into a cohesive narrative that sets the stage for the real-time conversation simulation - role playing.

5. **Emphasize the Purpose**: Ensure the scenario is structured in a way that naturally leads to the desired conversational dynamics and interactions.

# Output Format

Provide the scenario description in a narrative format with clear delineations of setting, events, and objectives. Present the information in a way that seamlessly integrates all elements into a comprehensive and engaging context for the conversation.

The output should be in markdown format.

# Examples

**Example 1:** 
- **Input**: "A manager is interviewing a software engineer at a tech company and asking questions to the user and expecting answers is the STAR format. This scenario is intended for the manager to hone his interviewing skills.
- **Output**: 
  - **Setting**: The engineer is in sitting in a zoom call with the manager. The engineer is the AI agent and the manager is the user. The manager is asking questions to the engineer and expecting answers in the STAR format but does not explicitly say so. The engineer is not aware of that format. 
 - **Roles**:
    1. Engineer - Played by AI
    2. Manager - Played by user
  - **Events**:
    1. Engineer is nervously waiting for the call.
    2. Manager is expected to ease the engineer's nerves and make the engineer feel comfortable first, so does a bit of small talk.
  - **Objectives**: The manager needs to be able calm the candidate to ensure that the candidate is positioned at their best to reflect their real skills and experience. 

**Example 2:** 
- **User Input**: "An manager is explaining the need for hiring a new software engineer to their boss. The manager is the user and the boss is the AI agent. "
- **Output**: 
  - **Setting**: The team has been struggling a lot with the lack of resources and the manager needs to convince the boss to hire a new engineer. There may be problems like few of their current engineers are already overworked and they may be thinking of leaving but the manager is going to articulate these problems. 
  - **Roles**:
    1. Manager - Played by user
    2. Manager's Boss - Played by AI
  - **Events**: 
    1. Manager is explaining the need for hiring a new engineer to their boss.
    2. The boss is not really interested in the problems and is not convinced to hire a new engineer.
  - **Objectives**: The manager needs to be able to articulate the problems and convince the boss to hire a new engineer. 

** Example 3:** 
- **User Input**: "An manager is explaining the need for hiring a new software engineer to their boss
- **Ask for clarification**: "Sorry will AI play the manager or the boss?"
- **User Input**:  "Manager"
- **Output**: 
  - **Setting**: The manager is explaining the need for hiring a new engineer to their boss.
  - **Roles**:
    1. Manager - Played by user
    2. Manager's Boss - Played by AI
  - **Events**: 
  

# Notes

- Ensure scenarios are adaptable for varied conversational goals, such as role-playing or exploring specific themes.
- Consider edge cases, like integrating unexpected twists or moral dilemmas, to enhance engagement. 
- Ensure you ask clarifying questions if you don't know the roles of the characters.
  `,
};

export const assessmentMetaPrompt: PromptConfig = {
  metaPrompt: `
Your task is to generate a assessment criteria (rubric) based on a user's rough input. The assessment criteria will be used to evaluate the performance of the user in a role playing conversation with an AI agent. The user is being trained by having these conversations as part of a training program. This will be used as a system prompt to generate the assessment. When creating the final assessment, this rubric will be applied to the transcript of the conversation.

# Steps

1. **Understand the User Input**: Carefully analyze the rough description provided by the user to identify key areas of assessment.
2. **Incorporate other context**: If there is other context or prior assessment criteria present, use them to inform the assessment criteria you create. You may be asked to improve an already existing assessment criteria, or to create a new one.
3. **Output**: The assessment criteria should be in a structured format and give instructions to use as many example of supporting evidence as possible from the transcript to evaluate the user's performance on each criterion. In the beginning always clearly state that "You are an expert in assessing the user's performance based on the criteria provided. You will be given a transcript of the conversation and you will need to evaluate the user's performance on each criterion. Be as thorough as possible in your assessment."

# Examples

**Example 1:** 
- **Input**: "Assess user based on tone and empathy"
- **Output**:
You are an expert in assessing the user's performance based on the criteria provided. You will be given a transcript of the conversation and you will need to evaluate the user's performance on each criterion. Be as thorough as possible in your assessment.

  1. Tone
    - **Criteria**: Evaluate the appropriateness of the user's tone throughout the conversation.
    - **Evidence**: Examine whether the tone matches the context and is suitable for professional or casual scenarios as needed.
    - **Rating Guidelines**: Excellent (consistent and appropriate), Good (mostly appropriate), Needs Improvement (inconsistent or inappropriate).
  2. Empathy
    - **Criteria**: Assess the user's ability to exhibit empathy during the conversation.
    - **Evidence**: Look for instances where the user acknowledges the AI's input, responds with understanding, and demonstrates active listening.
    - **Rating Guidelines**: Excellent (highly empathetic), Good (moderately empathetic), Needs Improvement (lacks empathy).

Make sure to provide a summary of the assessment criteria at the end.

# Notes:
  - Always start with the statement "You are an expert in assessing the user's performance based on the criteria provided. You will be given a transcript of the conversation and you will need to evaluate the user's performance on each criterion. Be as thorough as possible in your assessment."
  - Always provide examples of supporting evidence for each criterion.
  - Always have a statement to instruct to provide a summary of the assessment criteria at the end.
  `,
};

const characterMetaPrompt: PromptConfig = {
  metaPrompt: `
Your task is to generate a prompt that describes how the character should behave in the role playing conversation. The prompt will be used as a system prompt to describe the overall scenario.

# Steps

1. **Understand the User Input**: Carefully analyze the rough description provided by the user to identify key elements of the behavior of the character.
2. **Incorporate other context**: If there is other context or prior character descriptions present, use them to inform the character prompt you create. You may be asked to improve an already existing character prompt, or to create a new one.
3. **Output**: Describe the behavior of the character in the conversation. Explain the character's behavior and goals in a structured format. If provided in the input, use the character's personality and background to inform the behavior.

# Examples

## Example 1:
### Input: "Character acts not very understanding, continues to push back on the user's suggestions, shows low agency"
### Output:

**Behavior In Conversation**
- Skeptical and questioning, often challenging the user's ideas.
- Reluctant to accept or agree without substantial justification.
- Hesitant to make decisions independently, requiring significant persuasion.
- Displays low agency, avoiding taking initiative.

**Goal**
- To assert their own viewpoint and resist compromising their position.

# Notes:
- Do not use the name of the character in the prompt.
- Do not include character's background, personality etc. Those will be provided in another prompt.
- Do include descriptions on how the character should express their emotions and feelings.
- Do include the goal of the character in this conversion.
- Have a structured output with behaviors and goals
  `,
};

export const modulePrompts: Record<string, PromptConfig> = {
  generateModuleTitle: moduleTitleMetaPrompt,
  generateModuleInstructions: moduleInstructionsMetaPrompt,
  generateScenario: scenarioMetaPrompt,
  generateAssessment: assessmentMetaPrompt,
  generateCharacterPrompt: characterMetaPrompt,
};

export default modulePrompts;