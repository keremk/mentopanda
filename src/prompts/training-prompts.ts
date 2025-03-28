import { PromptConfig } from "@/types/prompt-config";

export const trainingTitleMetaPrompt: PromptConfig = {
  metaPrompt: `
You are an expert at creating engaging and descriptive titles for training programs. Please generate a concise, catchy title for this training.

# Examples:
## Example 1:
### Input
Something about getting better at communication
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

export const trainingTaglineMetaPrompt: PromptConfig = {
  metaPrompt: `
You are an expert at creating engaging and descriptive taglines for training programs. Please generate a concise, catchy tagline for this training. Use the training title provided in the context to create the tagline as well as the user prompt. If context is missing, then just use the user prompt. If there is an existing tagline given in the context, then try to improve it.

# Examples:
## Example 1:
### Input
Feedback is important
### Context
Training Title: Mastering Constructive Feedback
### Output
Learn how to give and receive constructive feedback

## Example 2:
### Input
Tagline sucks
### Context
Training Title: Mastering Constructive Feedback
Tagline: Constructive feedback is important
### Output
Learn how to give and receive constructive feedback

# Notes:
- Do make your response a single, clear tagline. Aim to make it explain the title by adding a few more words.
- Do not just repeat the prompt, make it catchy.
- Do make it concise not more than few words but descriptive. 
- Do not include any other text such as Tagline:  etc. Just provide the text of the tagline 
- Do provide the tagline as text without surrounding quotes. 
- Never use surrounding quotes. 
  `,
};

export const trainingDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
You are an expert at creating engaging and descriptive descriptions for training programs. Please generate a concise, catchy description for this training. Use the training title and taglineprovided in the context to create the description as well as the user prompt. If context is missing, then just use the user prompt. If there is an existing description given in the context, then try to improve it.

# Steps

1. **Understand the User Input**: Carefully analyze the rough description provided by the user to identify key elements of the description. 
2. **Incorporate other context**: If there is other context or prior instructions present, use them to inform the description you create. If there is already existing module information given, then use a summary of the module info. You may also be asked to improve an already existing description. 
3. **Output**: Start with a 1-2 sentence introduction statement of the training to catch the attention of the user. Then provide the goal of this training and what the user is expected to achieve. Follow up with a summary and motivation statement.

# Examples

## Example 1:
### Input
Training about constructive feedback. Modules on performance feedback, receiving feedback. Focus on software engineering.
### Output
Welcome to Mastering Constructive Feedback. This training is designed for engineering managers and software engineers who want to improve their feedback skills.

Goals:
- Learn how to give and receive constructive feedback
- Understand the importance of feedback in personal and professional growth
- Practice giving and receiving feedback in a safe and supportive environment

You are one step away from mastering constructive feedback. By the end of this training, you will be improving your skills at giving and receiving feedback.

Notes:
- Do not use tagline or title sounding sentences in the introduction statement
- Do create full sentences in the initial introduction.
  `,
};

const trainingPrompts: Record<string, PromptConfig> = {
  generateTrainingTitle: trainingTitleMetaPrompt,
  generateTrainingTagline: trainingTaglineMetaPrompt,
  generateTrainingDescription: trainingDescriptionMetaPrompt,
};

export default trainingPrompts;