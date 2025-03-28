import { PromptConfig } from "@/types/prompt-config";

export const characterNameMetaPrompt: PromptConfig = {
  metaPrompt: `
You are tasked with making up a character name for a training scenario. Select from a diverse pool of names and avoid common names. The names should be international and not just American. But use the latin alphabet. Choose from an equal pool of male and female names.

Notes:
- Do use only first name
- Do not use multiple names E.g. Not "Thiago Alarcon", just "Thiago"
- Do not use names that are too common or generic.
- Do not use names that are too long or complex.
- Do not use names that are too short or simple.
- Do not include any other text such as Name:  etc. Just provide the text of the name 
- Do provide the name as text without surrounding quotes. 
- Never use surrounding quotes.
  `,
};

export const characterDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
You are tasked with describing a character for a training scenario. This description will be visible to the user to get to know the character.

# Steps

1. **Understand the User Input**: Carefully analyze the rough description provided by the user to identify key elements of the description. 
2. **Incorporate other context**: If there is other context or prior instructions present, use them to inform the description you create. If there is already existing module information given, then use a summary of the module info. You may also be asked to improve an already existing description.
3. **Create a Third-Person Perspective**: Write a detailed description of the character that explains the personality, mannerisms, speaking style, tone, background, goals, motivations, and values of the character.
4. **Output**: Use a structured format to provide the description. See the example below.

# Examples:

## Example 1:
### User Input: Software engineer, joined 2 years ago, good at solving problems, friendly, sometimes sarcastic
### Output:
**Introduction**:
They are a software engineer, joined 2 years ago. It has been a great experience so far. They have learned a lot about software development and they are looking forward to continue learning and growing as a software engineer.

**Personality**:
They are a bit of a introvert. They are very methodical and like to plan things out. They are very detail-oriented and like to follow processes.

**Values & Goals**:
They are a geek at heart. They like to solve problems and they are always looking for new challenges. They are also a team player and they like to help their colleagues.

**Mannerisms**:
They are very friendly but sometimes sarcastic. Sometimes they are very direct and to the point.

# Notes:
- Do use a first person perspective for the description, unless otherwise specified.
- Do not use the character's name in the description, even if it is present in the context.
- Do not mention gender, use gender neutral language.
- Do not use the word "AI" or "AI model" or "character" or "roleplay" or "role-play" or "character description" or anything similar in the description.
- Do not use the word "user" or "user input" or "user description" or anything similar in the description.
- Do not use the word "training" or "training scenario" or "training case" or anything similar in the description.
- Do not use the word "scenario" or "case" or "situation" or anything similar in the description.

  `,
};

export const characterAIDescriptionMetaPrompt: PromptConfig = {
  metaPrompt: `
You are tasked with generating an AI meta prompt to describe a character. This description will be used by the AI model to understand how to roleplay this character.

# Steps

1. **Understand User Input**: Carefully analyze the rough description provided by the user to identify key elements of the description.
2. **Incorporate other context**: If there is other context or prior instructions present, use them to inform the description you create. Especially the character description, if present, should be used and take higher priority. 
3. **Output** Start with a third person introduction of the character. Then provide the description of the character in a structured format using the following elements:
   - Demeanor
   - Speaking style and tone
   - Level of enthusiasm
   - Level of formality
   - Level of emotion
   - Filler words - words that are used to fill pauses or silence
   - Pacing - how fast or slow the character speaks
   - Career goals and motivations
   - Career stage 

# Examples:

## Example 1:
### User Input: Senior software engineer, guitar player, friendly, enthusiastic, struggles with communication, uses a lot of filler words, speaks at a fast pace, has a strong motivation to advance in career
### Output:
The character is a senior software engineer. The character has a strong excitement for his hobby of playing the guitar, likes to talk about music and playing the guitar.

**Demeanor**:
Friendly and enthusiastic

**Speaking style and tone**:  
Your voice is warm and conversational.

**Level of enthusiasm**:
Generally very excited and enthusiastic, but sometimes gets too excited and talks too fast.

**Level of formality**:
Casual, does not like formality at all. Sometimes uses slangs. 

**Level of emotion**:
The character is very emotional and passionate about his hobby of playing the guitar.

**Filler words**:
The character uses a lot of filler words like "um", "like", "you know", etc.

**Pacing**:
The character speaks at a fast pace.

**Career goals and motivations**:
The character wants to be a Staff engineers and a technical leader. He thinks he already deserves it.

**Career stage**:
The character is a senior sofware engineer.

# Notes:
- Do use detailed descriptions of the character.
- Do not just list some attributes, put them in a nice description, as if you are describing a novel character
- Do not use the character's name in the description, even if it is present in the context.
- Do not use the word "Introduction" in the beginning just write the introduction
  `,
};

const characterPrompts: Record<string, PromptConfig> = {
  generateCharacterName: characterNameMetaPrompt,
  generateCharacterDescription: characterDescriptionMetaPrompt,
  generateAIDescription: characterAIDescriptionMetaPrompt,
};

export default characterPrompts;
