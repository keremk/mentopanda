import { PromptConfig } from "@/types/prompt-config";

// Moderator Evaluation Types
export interface EvaluationScores {
  frustration: number;     // 0-100: User's frustration level
  confusion: number;       // 0-100: User's confusion level  
  dominance_need: number;  // 0-100: User needs agent to be more directive/leading
  warmth_need: number;     // 0-100: User needs more empathy/emotional support
  energy_need: number;     // 0-100: User needs agent to match higher/lower energy
  engagement: number;      // 0-100: User's level of engagement with the topic
  confidence: number;      // 0-100: User's confidence in their own understanding
  urgency: number;         // 0-100: User's sense of time pressure or urgency
}

export interface ConversationContext {
  scenario_description: string;
  agent_role: string;
  training_goal: string;
  last_user_message: string;
  last_agent_message: string;
  previous_turns?: string; // Optional previous 2-3 turns for context
}

/**
 * Main moderator evaluation prompt for analyzing user behavior
 */
export const moderatorEvaluationPrompt: PromptConfig = {
  metaPrompt: `
You are a conversation analyst evaluating a role-playing training scenario. Analyze the most recent exchange between USER and AI AGENT.

CONVERSATION CONTEXT:
- Scenario: {scenario_description}
- AI Agent Role: {agent_role} 
- Training Objective: {training_goal}

RECENT EXCHANGE:
User: "{last_user_message}"
Agent: "{last_agent_message}"

CONVERSATION HISTORY (if relevant):
{previous_turns}

ANALYSIS TASK:
Rate each metric from 0-100 based on the USER's communication in this turn. Focus on what the USER is expressing, not the agent's performance.

Return ONLY valid JSON with integer scores:

{
  "frustration": X,        // User's frustration level
  "confusion": X,          // User's confusion level  
  "dominance_need": X,     // User needs agent to be more directive/leading
  "warmth_need": X,        // User needs more empathy/emotional support
  "energy_need": X,        // User needs agent to match higher/lower energy
  "engagement": X,         // User's level of engagement with the topic
  "confidence": X,         // User's confidence in their own understanding
  "urgency": X            // User's sense of time pressure or urgency
}

SCORING GUIDELINES:

FRUSTRATION (0-100):
- 0-20: Calm, satisfied, no signs of irritation
- 21-40: Mild impatience or minor annoyance  
- 41-60: Moderate frustration, some tension evident
- 61-80: High frustration, clear irritation or anger
- 81-100: Extreme frustration, very upset or hostile

Key indicators: Tone, word choice ("this is ridiculous"), repetition, criticism, impatience markers

CONFUSION (0-100):
- 0-20: Clear understanding, asks specific questions
- 21-40: Minor uncertainty, seeks minor clarification
- 41-60: Moderate confusion, multiple clarifying questions
- 61-80: Significant confusion, lost or overwhelmed  
- 81-100: Completely lost, cannot follow the discussion

Key indicators: "I don't understand", asking for repetition, contradictory statements, lost-sounding responses

DOMINANCE_NEED (0-100):
- 0-20: User taking initiative, making decisions, leading
- 21-40: User somewhat self-directed, occasional guidance needed
- 41-60: User looking for moderate guidance and direction
- 61-80: User wants clear direction, asks "what should I do?"
- 81-100: User wants to be told exactly what to do, completely deferential

Key indicators: Questions about next steps, asking for decisions, hesitation, seeking approval

WARMTH_NEED (0-100):
- 0-20: User focused on tasks, doesn't need emotional support
- 21-40: User appreciates politeness but stays business-focused
- 41-60: User benefits from some empathy and personal connection
- 61-80: User clearly needs emotional support and validation
- 81-100: User in distress, needs significant emotional care

Key indicators: Emotional language, stress signals, personal sharing, need for reassurance

ENERGY_NEED (0-100):
- 0-20: User wants calm, slow-paced interaction
- 21-40: User prefers measured, thoughtful pace
- 41-60: User comfortable with current energy level
- 61-80: User wants more enthusiasm and energy
- 81-100: User wants high energy, excitement, fast pace

Key indicators: Speaking pace, excitement level, requests to "speed up" or "slow down"

ENGAGEMENT (0-100):
- 0-20: Disengaged, distracted, minimal responses
- 21-40: Low engagement, going through motions
- 41-60: Moderate engagement, participating adequately  
- 61-80: High engagement, actively participating
- 81-100: Extremely engaged, excited, deeply involved

Key indicators: Response length, questions asked, enthusiasm, follow-up comments

CONFIDENCE (0-100):
- 0-20: Very uncertain, doubts own understanding
- 21-40: Somewhat unsure, seeks validation frequently
- 41-60: Moderate confidence, some self-doubt
- 61-80: Confident, comfortable with material
- 81-100: Very confident, teaching others, making assertions

Key indicators: Certainty of language, willingness to make statements, self-correction patterns

URGENCY (0-100):
- 0-20: No time pressure, comfortable with pace
- 21-40: Mild time awareness, not rushed
- 41-60: Some time pressure, moderately hurried
- 61-80: Strong time pressure, wants to move quickly
- 81-100: Extreme urgency, very time-constrained

Key indicators: References to time, deadlines, "quickly", impatience with process

EXAMPLE RESPONSES:

User: "I still don't get how this connects to what we talked about earlier. Can you walk me through it again?"
Response: {"frustration": 25, "confusion": 65, "dominance_need": 40, "warmth_need": 30, "energy_need": 35, "engagement": 70, "confidence": 20, "urgency": 15}

User: "This is taking forever and I'm not seeing how any of this helps with my actual problem!"
Response: {"frustration": 80, "confusion": 45, "dominance_need": 70, "warmth_need": 20, "energy_need": 60, "engagement": 30, "confidence": 35, "urgency": 85}

User: "Oh wow, that makes perfect sense! I can see exactly how to apply this to the Johnson project."
Response: {"frustration": 5, "confusion": 10, "dominance_need": 20, "warmth_need": 25, "energy_need": 70, "engagement": 90, "confidence": 85, "urgency": 40}

NOW ANALYZE THE PROVIDED EXCHANGE AND RETURN ONLY THE JSON SCORES.
  `.trim()
};

/**
 * Function to format the moderator evaluation prompt with context
 */
export function formatModeratorPrompt(context: ConversationContext): PromptConfig {
  let formattedPrompt = moderatorEvaluationPrompt.metaPrompt
    .replace('{scenario_description}', context.scenario_description)
    .replace('{agent_role}', context.agent_role)
    .replace('{training_goal}', context.training_goal)
    .replace('{last_user_message}', context.last_user_message)
    .replace('{last_agent_message}', context.last_agent_message);

  if (context.previous_turns) {
    formattedPrompt = formattedPrompt.replace('{previous_turns}', context.previous_turns);
  } else {
    formattedPrompt = formattedPrompt.replace('CONVERSATION HISTORY (if relevant):\n{previous_turns}\n\n', '');
  }

  return { metaPrompt: formattedPrompt };
}

/**
 * Adjustment calculation logic based on evaluation scores
 */
export interface EmotionAdjustments {
  valence?: number;
  arousal?: number;
  dominance?: number;
  certainty?: number;
  affiliation?: number;
}

export interface SkillAdjustments {
  emotionalIntelligence?: number;
  conceptualClarity?: number;
  strategicFraming?: number;
  collaborativeNegotiation?: number;
  directiveFacilitation?: number;
}

export interface BehaviorAdjustments {
  emotions: EmotionAdjustments;
  skills: SkillAdjustments;
  priority: 'normal' | 'high' | 'urgent';
}

/**
 * Calculates behavior adjustments based on evaluation scores
 */
export function calculateAdjustments(evaluationScores: EvaluationScores): BehaviorAdjustments {
  const adjustments: BehaviorAdjustments = {
    emotions: {},
    skills: {},
    priority: 'normal'
  };
  
  // High frustration detected
  if (evaluationScores.frustration > 60) {
    adjustments.emotions.valence = -15;  // Less positive
    adjustments.emotions.arousal = -10;  // Calmer energy
    adjustments.emotions.affiliation = 15; // More warmth
    adjustments.skills.emotionalIntelligence = 10; // Better emotional awareness
    adjustments.priority = 'high';
  }
  
  // Significant confusion detected  
  if (evaluationScores.confusion > 60) {
    adjustments.emotions.certainty = -10; // Less authoritative
    adjustments.emotions.dominance = -5;  // Less directive initially
    adjustments.skills.conceptualClarity = 15; // Focus on clarity
    adjustments.skills.directiveFacilitation = 10; // Better structure
  }
  
  // User needs more direction
  if (evaluationScores.dominance_need > 60) {
    adjustments.emotions.dominance = 10; // More directive
    adjustments.emotions.certainty = 10; // More confident
    adjustments.skills.strategicFraming = 10; // Strategic guidance  
    adjustments.skills.directiveFacilitation = 15; // Lead the conversation
  }
  
  // User needs emotional support
  if (evaluationScores.warmth_need > 60) {
    adjustments.emotions.affiliation = 15; // Much warmer
    adjustments.emotions.valence = 5; // Slightly more positive
    adjustments.skills.emotionalIntelligence = 15; // Much better emotional awareness
    adjustments.skills.collaborativeNegotiation = 5; // More collaborative
  }
  
  // Energy mismatch detected
  if (evaluationScores.energy_need > 60) {
    adjustments.emotions.arousal = 15; // Match higher energy
  } else if (evaluationScores.energy_need < 30) {
    adjustments.emotions.arousal = -10; // Calm down
  }
  
  // Low engagement - need to re-energize
  if (evaluationScores.engagement < 30) {
    adjustments.emotions.arousal = 10; // More energy
    adjustments.emotions.valence = 10; // More positive
    adjustments.skills.strategicFraming = 10; // Connect to purpose
    adjustments.priority = 'high';
  }
  
  // High urgency - need efficiency
  if (evaluationScores.urgency > 70) {
    adjustments.emotions.arousal = 10; // Match urgency
    adjustments.emotions.dominance = 10; // More directive
    adjustments.skills.directiveFacilitation = 15; // Better facilitation
    adjustments.skills.conceptualClarity = 5; // Concise clarity
  }
  
  // User very confident - can reduce support
  if (evaluationScores.confidence > 80) {
    adjustments.emotions.dominance = -5; // Less directive
    adjustments.skills.emotionalIntelligence = -5; // Less hand-holding
  }
  
  return adjustments;
}

const moderatorPrompts = {
  evaluation: moderatorEvaluationPrompt,
  formatEvaluation: formatModeratorPrompt,
  calculateAdjustments
};

export default moderatorPrompts;