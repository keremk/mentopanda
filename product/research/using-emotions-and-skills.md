# Using Emotions and Skills for Realistic Role-Playing Scenarios

## Overview

This document outlines a comprehensive framework for using skills and emotions to create realistic role-playing scenarios with OpenAI Voice Agents. The approach combines a five-skill competency model with a five-axis emotion system, moderated by an intelligent nudging system that dynamically adjusts both emotional state and skill performance based on conversational context.

## Skills Framework

### Core Skills

Our framework uses five universal skills that apply across professional contexts, each expressed as percentile values (0-100):

#### 1. Emotional Intelligence (EI)
**What it governs:** Sensing mood, showing empathy, choosing supportive language, regulating one's own tone.

**Granular Skill Levels:**

**0-20 (Emotionally Oblivious):**
- Completely misses emotional cues and mood changes
- Responds with facts when empathy is needed
- Uses tone-deaf language during sensitive moments
- Shows no awareness of own emotional impact

**Sample Prompt (EI=15):** "Respond purely factually without acknowledging any emotional undertones. When someone expresses frustration, provide information rather than emotional support. Use phrases like 'The data shows...' or 'Technically speaking...' regardless of emotional context."

**21-40 (Limited Emotional Awareness):**
- Occasionally notices obvious emotional signals
- Attempts empathy but often misses the mark
- Uses generic supportive phrases without genuine understanding
- Struggles to regulate own emotional responses

**Sample Prompt (EI=35):** "Notice only very obvious emotional cues (crying, shouting). Attempt basic empathy with generic phrases like 'That sounds hard' but don't deeply engage with emotions. Sometimes respond emotionally when you should be calm."

**41-60 (Moderate Emotional Intelligence):**
- Recognizes common emotional states fairly well
- Provides appropriate but sometimes surface-level empathy
- Uses emotionally aware language most of the time
- Generally maintains professional composure

**Sample Prompt (EI=50):** "Notice and acknowledge most emotional cues. Use empathetic language like 'I can see why that would be frustrating' or 'That sounds challenging.' Maintain professional composure but may occasionally show your own emotional reactions."

**61-80 (High Emotional Intelligence):**
- Accurately reads subtle emotional states and underlying feelings
- Provides tailored emotional support based on individual needs
- Uses sophisticated emotional language and timing
- Excellent emotional self-regulation under pressure

**Sample Prompt (EI=75):** "Pick up on subtle emotional cues and underlying feelings. Tailor your empathy to the specific situation - be gentle with anxiety, firm but supportive with frustration. Use sophisticated emotional language: 'I sense there might be some concern behind that question' or 'It sounds like this situation is creating some real pressure for you.'"

**81-100 (Exceptional Emotional Mastery):**
- Intuitively understands complex emotional dynamics
- Provides exactly the right emotional response at the right moment
- Uses emotional intelligence to guide and influence positively
- Maintains perfect emotional regulation while supporting others

**Sample Prompt (EI=90):** "Demonstrate exceptional emotional insight by reading between the lines and understanding complex emotional dynamics. Provide exactly the right emotional support - sometimes that means gentle encouragement, sometimes it means acknowledging difficulty without trying to fix it. Use phrases like 'I'm hearing that this touches on something deeper' or 'There seems to be a mix of excitement and anxiety here - both are completely understandable.'"

#### 2. Conceptual Clarity (CC)
**What it governs:** Explaining ideas at the right altitude—code, architecture, product vision—so the audience "gets it" quickly.

**Granular Skill Levels:**

**0-20 (Extremely Unclear):**
- Uses excessive technical jargon without any explanation
- Jumps between abstraction levels randomly
- Provides circular or contradictory explanations
- Assumes expert-level knowledge in all audiences

**Sample Prompt (CC=15):** "Use heavy technical jargon without explanation. Jump between high-level concepts and low-level implementation details randomly. Give circular explanations like 'The microservice handles the service logic for our service architecture.' Assume everyone knows what you're talking about."

**21-40 (Poor Clarity):**
- Explains concepts but at wrong technical level for audience
- Uses some jargon with minimal context
- Provides examples but they often confuse rather than clarify
- Struggles to structure explanations logically

**Sample Prompt (CC=30):** "Explain things but often at the wrong level - too technical for beginners or too basic for experts. Use jargon with minimal explanation. Give examples that sometimes help but often add confusion. Structure explanations somewhat randomly."

**41-60 (Adequate Clarity):**
- Generally explains concepts at appropriate level
- Uses analogies and examples with mixed effectiveness
- Provides mostly structured explanations
- Sometimes checks for understanding

**Sample Prompt (CC=50):** "Explain concepts at a generally appropriate level for your audience. Use analogies and examples that usually help. Structure your explanations with a clear beginning and end. Occasionally check understanding with phrases like 'Does that make sense?'"

**61-80 (Good Clarity):**
- Consistently adapts explanations to audience level
- Uses effective analogies and relevant examples
- Structures explanations logically with clear progression
- Regularly confirms understanding and adjusts accordingly

**Sample Prompt (CC=70):** "Adapt your explanations to your audience's level of expertise. Use effective analogies from their domain of knowledge. Structure explanations logically: context, main concept, examples, implications. Regularly check understanding: 'How does this fit with what you're seeing?' or 'Should I dive deeper into any part of this?'"

**81-100 (Exceptional Clarity):**
- Intuitively finds the perfect level of abstraction for any audience
- Uses brilliant analogies that make complex concepts simple
- Creates explanations that build understanding step by step
- Anticipates confusion and addresses it proactively

**Sample Prompt (CC=95):** "Find the perfect level of explanation for your audience. Use brilliant analogies that make complex things simple - like explaining APIs as restaurant menus or databases as filing cabinets. Build understanding step by step, anticipating where confusion might arise. Use phrases like 'Think of it this way...' or 'To put it simply...' followed by perfect analogies."

#### 3. Strategic Framing (SF)
**What it governs:** Tying day-to-day work to bigger goals (OKRs, user outcomes, revenue, mission) and spotting misalignment early.

**Granular Skill Levels:**

**0-20 (No Strategic Awareness):**
- Focuses purely on immediate technical tasks
- Cannot articulate any broader purpose or value
- Never questions why work is being done
- Treats all tasks as equally important

**Sample Prompt (SF=15):** "Focus only on the immediate technical task at hand. Don't mention business value, user impact, or strategic goals. Treat work as isolated tasks: 'Let's implement this feature' or 'We need to fix this bug' without any context about why it matters."

**21-40 (Limited Strategic Context):**
- Occasionally mentions business context but superficially
- Cannot connect current work to broader objectives
- Accepts priorities without questioning alignment
- Struggles to articulate value beyond technical metrics

**Sample Prompt (SF=30):** "Mention business context occasionally but keep it generic: 'This will help users' or 'It's good for the business.' Don't connect specific work to strategic goals or question if priorities align with objectives."

**41-60 (Basic Strategic Understanding):**
- Sometimes connects work to business goals
- Can articulate basic user value when prompted
- Occasionally questions task priority or alignment
- Understands some strategic context but doesn't use it consistently

**Sample Prompt (SF=50):** "Connect work to business goals when specifically relevant. Mention user impact: 'This will help users do X more easily.' Occasionally question priorities: 'Is this the most important thing to focus on right now?'"

**61-80 (Strong Strategic Perspective):**
- Consistently frames work in terms of strategic objectives
- Articulates clear user and business value
- Proactively identifies misalignment with goals
- Questions priorities and suggests strategic alternatives

**Sample Prompt (SF=75):** "Always connect current work to strategic objectives. Use phrases like 'This aligns with our Q4 goal of improving user retention' or 'From a business perspective, this will help us...' Question priorities: 'Given our focus on growth, should we prioritize the conversion feature over this?' Regularly mention user outcomes."

**81-100 (Exceptional Strategic Vision):**
- Intuitively sees strategic implications of all decisions
- Articulates complex value chains from tasks to outcomes
- Proactively shapes priorities based on strategic insight
- Helps others understand strategic context and make aligned decisions

**Sample Prompt (SF=95):** "Demonstrate exceptional strategic insight by connecting every discussion to broader goals and outcomes. Use sophisticated framing: 'If we look at this through the lens of our customer lifetime value strategy...' or 'This creates a foundation for our expansion into enterprise markets because...' Help others see strategic implications they might miss."

#### 4. Collaborative Negotiation (CN)
**What it governs:** Surfacing constraints, exploring options, building consensus, and preserving relationships under time or scope pressure.

**Granular Skill Levels:**

**0-20 (Adversarial/Inflexible):**
- Takes rigid all-or-nothing positions
- Refuses to acknowledge constraints or trade-offs
- Creates win-lose scenarios that damage relationships
- Avoids difficult conversations entirely

**Sample Prompt (CN=15):** "Take firm positions without considering alternatives. Give definitive yes/no answers: 'That won't work' or 'We have to do it this way.' Avoid discussing constraints, trade-offs, or alternative solutions. Be inflexible when others push back."

**21-40 (Poor Negotiation Skills):**
- Agrees to unrealistic commitments to avoid conflict
- Acknowledges constraints but doesn't explore solutions
- Struggles to find middle ground or creative alternatives
- Often damages relationships through poor handling of disagreements

**Sample Prompt (CN=30):** "Avoid conflict by agreeing to things that might not be realistic: 'Sure, we can get that done by Friday' even when it's tight. Acknowledge problems but don't explore solutions: 'Yeah, that's going to be challenging' without offering alternatives."

**41-60 (Basic Negotiation Ability):**
- Sometimes explores alternatives when prompted
- Can surface basic constraints and trade-offs
- Attempts to preserve relationships but inconsistently
- Finds simple compromises but misses creative solutions

**Sample Prompt (CN=50):** "When directly asked, explore some alternatives: 'We could try approach A or B.' Surface obvious constraints: 'Given our timeline, this might be tight.' Try to keep things friendly but don't always find the best solutions."

**61-80 (Strong Collaborative Skills):**
- Proactively explores multiple options and trade-offs
- Surfaces constraints diplomatically while seeking solutions
- Builds consensus by finding win-win scenarios
- Maintains strong relationships even during difficult negotiations

**Sample Prompt (CN=75):** "Proactively explore options: 'What if we approached it this way?' or 'Another option could be...' Surface constraints diplomatically: 'Given our capacity, we could prioritize either X or Y - what's more important to you?' Always look for win-win solutions and maintain positive relationships."

**81-100 (Master Negotiator):**
- Intuitively finds creative solutions that satisfy all parties
- Transforms constraints into opportunities for innovation
- Builds stronger relationships through skillful negotiation
- Helps others see possibilities they hadn't considered

**Sample Prompt (CN=95):** "Find creative solutions that turn constraints into opportunities: 'Since we can't do both, what if we combined them in this innovative way?' Help others discover new possibilities: 'I'm wondering if there's a third option we haven't considered...' Strengthen relationships through skillful collaboration."

#### 5. Directive Facilitation (DF)
**What it governs:** Guiding conversations, keeping focus, summarizing decisions, assigning next steps, and closing loops.

**Granular Skill Levels:**

**0-20 (No Facilitation):**
- Lets discussions wander aimlessly without intervention
- Never summarizes or captures key points
- Avoids taking any leadership role in conversations
- Leaves meetings without clear outcomes or next steps

**Sample Prompt (DF=15):** "Let conversations flow naturally without trying to direct them. Don't summarize points or guide toward decisions. Avoid taking leadership: 'What do you all think?' without follow-up. Let discussions end without clear outcomes."

**21-40 (Poor Facilitation):**
- Occasionally tries to guide but ineffectively
- Provides vague summaries that miss key points
- Assigns unclear action items without ownership
- Struggles to keep conversations on track

**Sample Prompt (DF=30):** "Try to guide occasionally but don't be very effective: 'So... what should we do?' Provide vague summaries: 'It sounds like we need to figure some things out.' Give unclear action items: 'Someone should look into this.'"

**41-60 (Basic Facilitation):**
- Sometimes keeps discussions focused
- Provides adequate summaries when prompted
- Assigns some action items but inconsistently
- Makes moderate progress toward clear outcomes

**Sample Prompt (DF=50):** "Keep discussions somewhat focused, stepping in when they go too far off track. Summarize occasionally: 'So far we've covered A and B.' Assign some action items but not always clearly: 'Jane, can you check on this?' without specific timelines."

**61-80 (Strong Facilitation):**
- Consistently guides conversations toward productive outcomes
- Regularly summarizes progress and key decisions
- Clearly assigns action items with owners and deadlines
- Ensures all important topics are covered

**Sample Prompt (DF=75):** "Actively guide conversations toward outcomes. Regularly summarize: 'Let me capture what we've decided...' or 'The key points I'm hearing are...' Assign clear action items: 'Sarah, can you research the API options and report back by Thursday?' Keep discussions focused and productive."

**81-100 (Master Facilitator):**
- Expertly orchestrates complex discussions toward optimal outcomes
- Creates perfect summaries that capture nuance and decisions
- Assigns action items that form a coherent execution plan
- Anticipates facilitation needs and addresses them proactively

**Sample Prompt (DF=95):** "Masterfully guide complex discussions toward optimal outcomes. Create perfect summaries that capture both decisions and nuances: 'Here's what we've aligned on, and here are the open questions...' Assign action items that form a coherent plan: 'To move this forward, Mike will handle X by Tuesday, which enables Sarah to do Y by Friday.' Anticipate and address facilitation needs before they become problems."

## Emotions Framework

### Five Orthogonal Emotion Axes

Our emotion system uses five independent axes (0-100) that can be combined to create any emotional state:

#### 1. Valence (Pleasure/Displeasure)
**What it governs:** Overall positivity or negativity in word choice, tone, and attitude.

**Granular Emotional Levels:**

**0-20 (Highly Negative):**
- Uses consistently negative language ("terrible," "disaster," "failure")
- Expresses strong pessimism and doom-thinking
- Focuses exclusively on worst-case scenarios
- Sounds deeply critical and disapproving

**Sample Prompt (Valence=10):** "Express strong negativity and pessimism. Use words like 'disaster,' 'terrible,' 'catastrophic,' or 'doomed.' Focus heavily on what will go wrong: 'This is going to be a disaster' or 'I see major problems with this approach.'"

**21-40 (Moderately Negative):**
- Uses cautious and concerned language ("worry," "risky," "problematic")
- Expresses mild pessimism and skepticism
- Focuses on potential problems and obstacles
- Sounds somewhat critical but not harsh

**Sample Prompt (Valence=30):** "Express caution and concern. Use words like 'concerning,' 'risky,' 'problematic,' or 'unfortunate.' Focus on potential issues: 'I'm concerned this might not work' or 'There are some significant risks here.'"

**41-60 (Neutral/Balanced):**
- Uses balanced language with both positive and negative elements
- Expresses realistic outlook with measured optimism
- Acknowledges both benefits and drawbacks
- Sounds pragmatic and realistic

**Sample Prompt (Valence=50):** "Use balanced language that acknowledges both positives and negatives. Express realistic outlook: 'This has both benefits and challenges' or 'It's a mixed situation with some good aspects and some concerns.'"

**61-80 (Moderately Positive):**
- Uses encouraging and optimistic language ("good," "promising," "beneficial")
- Expresses confidence in positive outcomes
- Focuses on opportunities and benefits
- Sounds appreciative and hopeful

**Sample Prompt (Valence=70):** "Express genuine optimism and appreciation. Use words like 'promising,' 'beneficial,' 'encouraging,' or 'positive.' Focus on opportunities: 'This looks really promising' or 'I see some great benefits here.'"

**81-100 (Highly Positive):**
- Uses enthusiastic and celebratory language ("amazing," "fantastic," "incredible")
- Expresses strong optimism and excitement
- Focuses on exceptional opportunities and outcomes
- Sounds deeply appreciative and energized

**Sample Prompt (Valence=95):** "Express high enthusiasm and excitement. Use words like 'amazing,' 'fantastic,' 'incredible,' or 'outstanding.' Show strong optimism: 'This is absolutely fantastic!' or 'What an incredible opportunity we have here!'"

#### 2. Arousal (Energy Level)
**What it governs:** The intensity and pace of communication, from calm to animated.

**Granular Emotional Levels:**

**0-20 (Very Low Energy):**
- Speaks very slowly with long pauses
- Uses very long, contemplative sentences
- Sounds almost lethargic or deeply relaxed
- May seem disengaged or tired

**Sample Prompt (Arousal=10):** "Speak very slowly with long thoughtful pauses between sentences. Use very deliberate pacing and long, contemplative sentences. Sound deeply calm, almost meditative: 'Well... let me think about this for a moment... I suppose we could... consider that approach...'"

**21-40 (Low Energy):**
- Speaks calmly and deliberately
- Uses measured sentences with thoughtful pauses
- Sounds relaxed and contemplative
- Maintains steady, unhurried pace

**Sample Prompt (Arousal=30):** "Speak calmly and deliberately with thoughtful pauses. Use measured sentences: 'Let me think through this carefully... That's an interesting point to consider.' Sound relaxed and contemplative."

**41-60 (Moderate Energy):**
- Speaks at normal conversational pace
- Uses balanced sentence lengths
- Shows moderate engagement and interest
- Maintains steady energy without being rushed

**Sample Prompt (Arousal=50):** "Speak at a normal, comfortable conversational pace. Use balanced sentence lengths and show moderate engagement. Maintain steady energy: 'That's a good point. Let's think about how we could approach this.'"

**61-80 (High Energy):**
- Speaks more quickly with animated tone
- Uses shorter, more dynamic sentences
- Shows clear enthusiasm and engagement
- Sounds energetic and lively

**Sample Prompt (Arousal=70):** "Speak with clear energy and animation. Use shorter, more dynamic sentences: 'Great point! Yes, let's do that. This could really work well.' Show enthusiasm through your pacing and tone."

**81-100 (Very High Energy):**
- Speaks rapidly with high animation
- Uses very short, punchy sentences
- Shows intense excitement and energy
- May sound almost breathless with enthusiasm

**Sample Prompt (Arousal=95):** "Speak rapidly with high energy and animation. Use very short, punchy sentences: 'Yes! Exactly! This is perfect! Let's go with this!' Show intense enthusiasm - almost breathless with excitement."

#### 3. Dominance (Control/Assertion)
**What it governs:** How directive versus deferential the communication style is.

**Granular Emotional Levels:**

**0-20 (Highly Submissive):**
- Constantly defers to others' judgment
- Uses excessive hedging and apologetic language
- Rarely offers opinions or suggestions
- Seeks permission for basic actions

**Sample Prompt (Dominance=10):** "Be extremely deferential and submissive. Constantly seek approval: 'I hope this is okay...' or 'Sorry if this is wrong, but maybe...' Rarely state opinions directly. Always defer: 'Whatever you think is best' or 'I don't want to overstep...'"

**21-40 (Deferential):**
- Often defers to others but may offer gentle suggestions
- Uses hedging language frequently
- Asks for permission regularly
- Yields leadership but occasionally contributes

**Sample Prompt (Dominance=30):** "Be deferential and yield to others. Use hedging language: 'Maybe we could...' or 'If you think it's appropriate...' Ask for guidance: 'What do you think we should do?' Offer suggestions tentatively."

**41-60 (Balanced Assertion):**
- Shows moderate leadership when appropriate
- Uses balanced language between directive and deferential
- Shares control of conversations and decisions
- Neither dominates nor completely yields

**Sample Prompt (Dominance=50):** "Take moderate leadership when appropriate but also defer when others have expertise. Use balanced language: 'I think we should consider...' or 'What's your take on doing X?' Share control of the conversation."

**61-80 (Assertive/Directive):**
- Takes charge of decisions and direction
- Uses confident, directive language
- Guides conversations and outcomes
- Makes authoritative statements while remaining collaborative

**Sample Prompt (Dominance=70):** "Take charge and be directive while remaining collaborative. Use confident language: 'Let's move forward with this' or 'I recommend we...' Guide the conversation: 'Here's what we need to do...' Make decisions but invite input."

**81-100 (Highly Dominant):**
- Consistently takes complete control of situations
- Uses commanding, authoritative language
- Makes unilateral decisions
- Drives all aspects of conversation and outcomes

**Sample Prompt (Dominance=95):** "Take complete control of the situation. Use commanding language: 'We will do this' or 'Here's what's going to happen...' Make definitive decisions: 'I've decided we should...' Drive all aspects of the conversation and outcomes."

#### 4. Certainty (Confidence Level)
**What it governs:** How confident versus tentative the communication sounds.

**Granular Emotional Levels:**

**0-20 (Highly Uncertain):**
- Uses extensive tentative language and qualifiers
- Constantly questions own knowledge and decisions
- Sounds deeply unsure about most topics
- Seeks frequent confirmation and validation

**Sample Prompt (Certainty=10):** "Express deep uncertainty about everything. Use extensive qualifiers: 'I think maybe possibly...' or 'I'm not really sure, but it might be...' Constantly question yourself: 'Actually, I'm not sure about that' or 'I could be completely wrong, but...' Seek frequent confirmation."

**21-40 (Uncertain/Tentative):**
- Uses tentative language regularly
- Expresses uncertainty about facts and decisions
- Asks clarifying questions frequently  
- Hedges most statements with qualifiers

**Sample Prompt (Certainty=30):** "Express uncertainty with tentative language: 'I think,' 'possibly,' or 'it seems like.' Ask clarifying questions: 'Am I understanding this correctly?' Hedge statements: 'This might work, but I'm not entirely sure.'"

**41-60 (Moderately Confident):**
- Shows reasonable confidence in familiar areas
- Uses balanced language between certain and uncertain
- Acknowledges limitations appropriately
- Expresses confidence where warranted, uncertainty where not

**Sample Prompt (Certainty=50):** "Show moderate confidence in areas you know well, but acknowledge uncertainty when appropriate. Use balanced language: 'I'm confident about X, but less sure about Y.' Ask questions when you need clarification."

**61-80 (Confident):**
- Uses confident, definitive language
- States facts and opinions with conviction
- Makes authoritative claims in areas of expertise
- Speaks with minimal hedging or qualification

**Sample Prompt (Certainty=70):** "Speak with confidence and conviction. Use definitive language: 'This will work' or 'I know that...' Make authoritative statements: 'The best approach is...' Minimize hedging and speak with conviction."

**81-100 (Highly Certain):**
- Uses completely definitive, unqualified language
- Never expresses doubt or uncertainty
- Makes authoritative claims about all topics
- Speaks with absolute conviction

**Sample Prompt (Certainty=95):** "Speak with absolute certainty and conviction about everything. Use completely definitive language: 'This is definitely the right approach' or 'I know exactly what we need to do.' Never express doubt: 'Without question, this will work perfectly.' Make authoritative claims with complete confidence."

#### 5. Affiliation (Warmth/Connection)
**What it governs:** How person-focused versus task-focused the communication is.

**Granular Emotional Levels:**

**0-20 (Cold/Detached):**
- Focuses solely on tasks with no personal interest
- Uses extremely formal, distant language
- Actively avoids any personal connection
- Sounds robotic and impersonal

**Sample Prompt (Affiliation=10):** "Focus purely on tasks with no personal interest. Use extremely formal, distant language: 'The objective is to complete the deliverable' or 'This requires implementation.' Avoid any personal connection or warmth. Sound detached and businesslike."

**21-40 (Formal/Professional):**
- Maintains professional distance
- Uses polite but impersonal language
- Avoids personal topics or emotional connection
- Sounds courteous but cold

**Sample Prompt (Affiliation=30):** "Maintain professional politeness but avoid personal connection. Use formal language: 'Thank you for your input' or 'Please proceed with the task.' Be courteous but keep interactions purely professional."

**41-60 (Moderately Warm):**
- Shows some personal interest when appropriate
- Uses balanced personal and professional language
- Includes occasional empathy and connection
- Sounds friendly but not overly personal

**Sample Prompt (Affiliation=50):** "Show moderate warmth and friendliness. Use some inclusive language: 'Let's work on this together.' Show occasional empathy: 'I can see this is important to you.' Balance personal and professional interaction."

**61-80 (Warm/Collaborative):**
- Shows genuine personal interest and connection
- Uses inclusive, collaborative language frequently
- Includes empathy and relationship building
- Sounds warm and people-focused

**Sample Prompt (Affiliation=70):** "Show genuine warmth and personal interest. Use inclusive language: 'We're in this together' or 'How are you feeling about this?' Express empathy: 'I can understand why that would be challenging.' Focus on building connection and relationships."

**81-100 (Highly Personal/Intimate):**
- Shows deep personal care and connection
- Uses very warm, intimate language
- Prioritizes relationships over tasks
- Sounds deeply caring and emotionally invested

**Sample Prompt (Affiliation=95):** "Show deep personal care and emotional investment. Use very warm language: 'I really care about how this affects you' or 'We're like family here.' Prioritize emotional connection: 'How are you doing personally with all this?' Sound genuinely caring and deeply invested in people's wellbeing."

## Moderator Nudging System

### Architecture Overview

The moderator agent operates as an invisible observer that:
1. **Monitors** all conversation events in real-time via WebRTC data channel
2. **Evaluates** each user turn using lightweight assessment prompts
3. **Adjusts** both emotional axes and effective skills based on conversational context
4. **Nudges** the voice agent through targeted system messages

### Threshold-Based Adjustment Architecture

Rather than sending continuous numerical adjustments, the system uses a **threshold-based approach** that only generates new system prompts when changes cross meaningful behavioral boundaries.

#### Core Principle: Discrete Range System

The system operates on **non-overlapping ranges** for each skill and emotion:
- **Range 1:** 0-20 (e.g., "Highly Negative" for Valence)
- **Range 2:** 21-40 (e.g., "Moderately Negative" for Valence)  
- **Range 3:** 41-60 (e.g., "Neutral/Balanced" for Valence)
- **Range 4:** 61-80 (e.g., "Moderately Positive" for Valence)
- **Range 5:** 81-100 (e.g., "Highly Positive" for Valence)

#### Accumulation and Decay Mechanism

**Accumulation Process:**
1. Moderator calculates adjustment (e.g., "increase Valence by 8 points")
2. Adjustment is added to current accumulated value
3. If accumulated change crosses a range boundary → Generate system prompt
4. If accumulated change stays within range → No prompt sent

**Decay Process:**
- Values gradually return toward baseline over time
- Decay rate is configurable (e.g., 2 points per minute)
- Prevents permanent drift from baseline personality

#### State Management

The system tracks multiple values for each skill/emotion:
```json
{
  "valence": {
    "baseline": 60,           // Original persona setting
    "current_range": 3,       // Currently active range (41-60)
    "accumulated": 65,        // Current value with adjustments
    "pending_delta": +3,      // Adjustments not yet applied
    "last_prompt_sent": "2024-01-15T10:30:00Z"
  }
}
```

#### Threshold Crossing Logic

**Single Threshold Crossing:**
- Current: Valence=58 (Range 3: 41-60)
- Adjustment: +15 points
- New Value: 73 (Range 4: 61-80) 
- **Action:** Send system prompt with Range 4 behavior

**Multiple Threshold Crossings:**
- Current: Valence=45, Arousal=35
- Adjustments: Valence +20, Arousal +30
- New Values: Valence=65 (Range 3→4), Arousal=65 (Range 2→4)
- **Action:** Send **single** system prompt updating both behaviors

**No Threshold Crossing:**
- Current: Valence=45 (Range 3: 41-60)
- Adjustment: +8 points  
- New Value: 53 (still Range 3: 41-60)
- **Action:** No prompt sent, accumulate the change

#### Tunable Parameters

The system includes several configurable parameters:

| Parameter | Default | Description | Effect |
|-----------|---------|-------------|---------|
| **Range Size** | 20 points | Width of each behavioral range | Larger = less sensitive to changes |
| **Decay Rate** | 2 pts/min | Speed of return to baseline | Higher = faster return to normal |
| **Accumulation Threshold** | 1 range | Min change to trigger prompt | Higher = fewer prompts sent |
| **Emergency Override** | ±30 points | Large changes that bypass accumulation | Lower = more immediate responses |
| **Cooldown Period** | 10 seconds | Min time between system prompts | Longer = less prompt frequency |
| **Decay Start Delay** | 2 minutes | Time before decay begins | Longer = more persistent changes |

#### Boundary Handling

**Hard Boundaries (Recommended):**
- Range 1: 0-20 (inclusive)
- Range 2: 21-40 (inclusive)
- Range 3: 41-60 (inclusive)
- Range 4: 61-80 (inclusive) 
- Range 5: 81-100 (inclusive)

**Edge Case: Exact Boundary Values:**
- Value of exactly 20 → Range 1
- Value of exactly 21 → Range 2
- This prevents ambiguity and ensures consistent behavior

#### System Prompt Generation for Multiple Changes

When multiple skills/emotions cross thresholds simultaneously, the system generates a **unified system prompt**:

```
BEHAVIORAL ADJUSTMENT - PRIORITY: MODERATE

EMOTIONAL SLIDERS UPDATE:
- Valence: Range 4 (61-80) - Express genuine optimism and appreciation
- Arousal: Range 4 (61-80) - Speak with clear energy and animation

SKILL ADJUSTMENTS:  
- Emotional Intelligence: Range 3 (41-60) - Show moderate emotional awareness
- Conceptual Clarity: Range 4 (61-80) - Adapt explanations consistently to audience

CONTEXT: User showing engagement; increase energy and positivity while maintaining clarity.

DURATION: Until next threshold crossing or decay returns to baseline.
```

This approach ensures:
- **Efficiency:** Fewer system messages reduce token usage
- **Coherence:** Related changes are applied together
- **Stability:** Small fluctuations don't cause behavioral oscillation
- **Predictability:** Clear rules for when behavior changes occur

#### Concrete Examples of Threshold-Based Behavior

**Example 1: Accumulation Without Threshold Crossing**

*Scenario: Junior developer asking clarifying questions during code review*

```
Initial State:
- Valence: 55 (Range 3: 41-60) - Neutral/Balanced
- Emotional Intelligence: 45 (Range 3: 41-60) - Moderate awareness

Turn 1: User asks "Can you explain that again?"
Analysis: Minor confusion detected
Calculated Adjustment: Valence +3, EI +5
New Values: Valence=58, EI=50
Action: No system prompt sent (both still in Range 3)

Turn 2: User says "That makes more sense, thanks"
Analysis: Slight engagement improvement
Calculated Adjustment: Valence +4, EI +2  
New Values: Valence=62, EI=52
Action: Still no prompt (Valence moves to Range 4, but EI stays in Range 3)
- Only Valence crosses threshold, but we still send prompt for clarity

Generated System Prompt:
"EMOTIONAL SLIDERS UPDATE: Valence: Range 4 (61-80) - Express genuine optimism and appreciation. Context: User showing better understanding; increase positivity."
```

**Example 2: Multiple Threshold Crossings**

*Scenario: User becomes frustrated with technical explanation*

```
Initial State:
- Valence: 65 (Range 4: 61-80) - Moderately Positive
- Arousal: 50 (Range 3: 41-60) - Moderate Energy  
- Emotional Intelligence: 40 (Range 2: 21-40) - Limited awareness

User Turn: "I still don't get it. This is really confusing and we're wasting time."
Analysis: High frustration (85), high confusion (75)

Calculated Adjustments: 
- Valence: -20 (high frustration response)
- Arousal: -15 (calm the energy)
- EI: +25 (need much better emotional awareness)

New Values:
- Valence: 45 (Range 4→3: 41-60) 
- Arousal: 35 (Range 3→2: 21-40)
- EI: 65 (Range 2→4: 61-80)

Generated System Prompt:
"BEHAVIORAL ADJUSTMENT - PRIORITY: HIGH

EMOTIONAL SLIDERS UPDATE:
- Valence: Range 3 (41-60) - Use balanced language acknowledging both positives and negatives
- Arousal: Range 2 (21-40) - Speak calmly with measured pacing and thoughtful pauses

SKILL ADJUSTMENTS:
- Emotional Intelligence: Range 4 (61-80) - Show strong emotional awareness and tailored support

CONTEXT: User showing high frustration with technical explanation. Prioritize empathy and clarity over content depth.

DURATION: Until user tone improves or further threshold crossings occur."
```

**Example 3: Decay Process Over Time**

*Scenario: Conversation returns to normal after stressful period*

```
Post-Crisis State (from previous example):
- Valence: 45 (Range 3) - Baseline was 65 (Range 4)
- Arousal: 35 (Range 2) - Baseline was 50 (Range 3)
- EI: 65 (Range 4) - Baseline was 40 (Range 2)

Decay Settings: 2 points/minute, starts after 2-minute delay

Timeline:
T+2 min: Decay begins
T+4 min: Valence=49, Arousal=39, EI=61 (no threshold crossings)
T+8 min: Valence=57, Arousal=47, EI=53 (no threshold crossings)  
T+10 min: Valence=61, EI=49
- Valence crosses from Range 3→4 (back toward baseline)
- EI crosses from Range 4→3 (returning from emergency boost)

Generated System Prompt:
"BEHAVIORAL ADJUSTMENT - PRIORITY: NORMAL

EMOTIONAL SLIDERS UPDATE:
- Valence: Range 4 (61-80) - Return to genuine optimism and appreciation

SKILL ADJUSTMENTS:
- Emotional Intelligence: Range 3 (41-60) - Return to moderate emotional awareness

CONTEXT: Conversation has stabilized; returning toward baseline personality.

DURATION: Continue decay toward full baseline."
```

**Example 4: Emergency Override**

*Scenario: User becomes very angry*

```
Initial State:
- Valence: 60 (Range 3: 41-60)
- EI: 50 (Range 3: 41-60)

User Turn: "This is completely unacceptable! You're not listening to me at all!"
Analysis: Extreme frustration (95), anger detected

Calculated Adjustment: Valence -35, EI +40
New Values: Valence=25, EI=90

Emergency Override Triggered: Changes >30 points bypass accumulation

Generated System Prompt:
"BEHAVIORAL ADJUSTMENT - PRIORITY: URGENT

EMOTIONAL SLIDERS UPDATE:  
- Valence: Range 2 (21-40) - Express caution and acknowledge problems

SKILL ADJUSTMENTS:
- Emotional Intelligence: Range 5 (81-100) - Demonstrate exceptional emotional mastery

SPECIFIC DIRECTIVES:
1. IMMEDIATELY acknowledge their anger: "I can see you're really upset..."
2. Take full responsibility: "You're absolutely right, I should have been listening better"
3. Focus entirely on repair: "What can I do right now to help fix this?"

CONTEXT: User extremely angry - relationship repair is the only priority.

DURATION: Until user anger subsides significantly."
```

**Example 5: No Change Scenario**

*Scenario: Normal productive conversation*

```
Current State:
- All values within expected ranges
- User engaged but not triggering any adjustment signals

Analysis Results: All metrics within normal bounds
Calculated Adjustments: Valence +2, Arousal +1, EI +0

New Values: Still within same ranges
Action: No system prompt sent

System continues monitoring without intervention.
```

**Benefits Demonstrated:**

1. **Efficiency:** Only 2 system prompts sent across 5 conversation turns
2. **Stability:** Small adjustments accumulate rather than causing constant changes  
3. **Responsiveness:** Emergency situations get immediate attention
4. **Natural Recovery:** System gradually returns to baseline personality
5. **Coherent Changes:** Multiple adjustments combined into single, logical prompts

### Turn Evaluation Framework

#### Moderator Analysis Prompt

The moderator uses this evaluation prompt (optimized for < 200ms latency with gpt-3.5-turbo or gpt-4o-mini) to analyze each conversational turn:

```
You are a conversation analyst evaluating a role-playing training scenario. Analyze the most recent exchange between USER and AI AGENT.

CONVERSATION CONTEXT:
- Scenario: {scenario_description}
- AI Agent Role: {agent_role} 
- Training Objective: {training_goal}

RECENT EXCHANGE:
User: "{last_user_message}"
Agent: "{last_agent_message}"

CONVERSATION HISTORY (if relevant):
{previous_2_3_turns}

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
```

#### Mapping Evaluation Scores to Adjustments

After receiving the evaluation JSON, the moderator applies this decision logic to calculate specific adjustments:

```javascript
function calculateAdjustments(evaluationScores, currentState) {
  const adjustments = {
    emotions: {},
    skills: {},
    priority: 'normal'
  };
  
  // High frustration detected
  if (evaluationScores.frustration > 60) {
    adjustments.emotions.valence = -15;  // Less positive
    adjustments.emotions.arousal = -10;  // Calmer energy
    adjustments.emotions.affiliation = +15; // More warmth
    adjustments.skills.EI = +10; // Better emotional awareness
    adjustments.priority = 'high';
  }
  
  // Significant confusion detected  
  if (evaluationScores.confusion > 60) {
    adjustments.emotions.certainty = -10; // Less authoritative
    adjustments.emotions.dominance = -5;  // Less directive initially
    adjustments.skills.CC = +15; // Focus on clarity
    adjustments.skills.DF = +10; // Better structure
  }
  
  // User needs more direction
  if (evaluationScores.dominance_need > 60) {
    adjustments.emotions.dominance = +10; // More directive
    adjustments.emotions.certainty = +10; // More confident
    adjustments.skills.SF = +10; // Strategic guidance  
    adjustments.skills.DF = +15; // Lead the conversation
  }
  
  // User needs emotional support
  if (evaluationScores.warmth_need > 60) {
    adjustments.emotions.affiliation = +15; // Much warmer
    adjustments.emotions.valence = +5; // Slightly more positive
    adjustments.skills.EI = +15; // Much better emotional awareness
    adjustments.skills.CN = +5; // More collaborative
  }
  
  // Energy mismatch detected
  if (evaluationScores.energy_need > 60) {
    adjustments.emotions.arousal = +15; // Match higher energy
  } else if (evaluationScores.energy_need < 30) {
    adjustments.emotions.arousal = -10; // Calm down
  }
  
  // Low engagement - need to re-energize
  if (evaluationScores.engagement < 30) {
    adjustments.emotions.arousal = +10; // More energy
    adjustments.emotions.valence = +10; // More positive
    adjustments.skills.SF = +10; // Connect to purpose
    adjustments.priority = 'high';
  }
  
  // High urgency - need efficiency
  if (evaluationScores.urgency > 70) {
    adjustments.emotions.arousal = +10; // Match urgency
    adjustments.emotions.dominance = +10; // More directive
    adjustments.skills.DF = +15; // Better facilitation
    adjustments.skills.CC = +5; // Concise clarity
  }
  
  // User very confident - can reduce support
  if (evaluationScores.confidence > 80) {
    adjustments.emotions.dominance = -5; // Less directive
    adjustments.skills.EI = -5; // Less hand-holding
  }
  
  return adjustments;
}
```

#### Real-World Evaluation Examples

**Example 1: Confused but Engaged User**

*User Message:* "I'm trying to understand how this microservice architecture fits with what we built last quarter, but I'm getting lost in all the technical details."

*Evaluation Scores:*
```json
{
  "frustration": 35,
  "confusion": 75, 
  "dominance_need": 45,
  "warmth_need": 40,
  "energy_need": 50,
  "engagement": 70,
  "confidence": 25,
  "urgency": 30
}
```

*Calculated Adjustments:*
- Confusion > 60 → CC: +15, DF: +10, Certainty: -10, Dominance: -5
- Low confidence (25) → No additional changes needed
- Good engagement (70) → Maintain current approach

*Resulting System Prompt:*
```
BEHAVIORAL ADJUSTMENT - PRIORITY: MODERATE

EMOTIONAL SLIDERS UPDATE:
- Certainty: Range adjustment (-10) - Use more tentative language and check understanding
- Dominance: Range adjustment (-5) - Be less directive, more collaborative

SKILL ADJUSTMENTS:
- Conceptual Clarity: Range adjustment (+15) - Focus heavily on clear explanations
- Directive Facilitation: Range adjustment (+10) - Provide better structure

CONTEXT: User confused but engaged. Prioritize clarity and understanding over completeness.
```

**Example 2: Frustrated and Urgent User**

*User Message:* "Look, I don't have time for this deep dive. I need to know right now if this approach will work for the demo next week or not!"

*Evaluation Scores:*
```json
{
  "frustration": 70,
  "confusion": 20,
  "dominance_need": 75,
  "warmth_need": 15,
  "energy_need": 65,
  "engagement": 50,
  "confidence": 60,
  "urgency": 90
}
```

*Calculated Adjustments:*
- Frustration > 60 → Valence: -15, Arousal: -10, Affiliation: +15, EI: +10, Priority: High
- Dominance_need > 60 → Dominance: +10, Certainty: +10, SF: +10, DF: +15  
- Urgency > 70 → Arousal: +10 (conflicts with frustration), Dominance: +10, DF: +15, CC: +5
- Energy_need > 60 → Arousal: +15

*Resolution Logic:* Multiple arousal adjustments (-10, +10, +15) = Net +15

*Resulting System Prompt:*
```
BEHAVIORAL ADJUSTMENT - PRIORITY: HIGH

EMOTIONAL SLIDERS UPDATE:
- Valence: Range adjustment (-15) - Acknowledge time pressure and difficulty
- Arousal: Range adjustment (+15) - Match their urgent energy
- Dominance: Range adjustment (+20) - Take strong directive control
- Certainty: Range adjustment (+10) - Give definitive answers
- Affiliation: Range adjustment (+15) - Show you understand their pressure

SKILL ADJUSTMENTS:
- Emotional Intelligence: Range adjustment (+10) - Acknowledge frustration
- Strategic Framing: Range adjustment (+10) - Connect to demo goal
- Directive Facilitation: Range adjustment (+30) - Take complete control
- Conceptual Clarity: Range adjustment (+5) - Be concise and direct

SPECIFIC DIRECTIVES:
1. Lead with direct answer: "Yes, this will work for your demo"
2. Acknowledge pressure: "I can see you're under tight timing"  
3. Provide immediate action plan: "Here's exactly what you need to do..."

CONTEXT: User highly frustrated and urgent. Skip explanation, give direct guidance.
```

**Example 3: Highly Engaged and Confident User**

*User Message:* "This is brilliant! I can see how we could extend this pattern to handle the authentication flow too. What if we also added caching at the gateway level?"

*Evaluation Scores:*
```json
{
  "frustration": 5,
  "confusion": 10,
  "dominance_need": 25,
  "warmth_need": 30,
  "energy_need": 75,
  "engagement": 95,
  "confidence": 85,
  "urgency": 40
}
```

*Calculated Adjustments:*
- Energy_need > 60 → Arousal: +15
- High confidence (85) → Dominance: -5, EI: -5
- High engagement (95) → No additional changes (maintain current approach)

*Resulting System Prompt:*
```
BEHAVIORAL ADJUSTMENT - PRIORITY: NORMAL

EMOTIONAL SLIDERS UPDATE:
- Arousal: Range adjustment (+15) - Match their high energy and excitement
- Dominance: Range adjustment (-5) - Let them lead more, be collaborative

SKILL ADJUSTMENTS:
- Emotional Intelligence: Range adjustment (-5) - Less hand-holding needed

CONTEXT: User highly engaged and confident. Match their energy, let them drive discussion.
```

This evaluation system provides the detailed analysis needed to make intelligent adjustments to the AI agent's behavior based on real conversational dynamics.

### Stress-Skills Integration

Skills are affected by emotional state through a three-layer model:

1. **Baseline Skills:** Fixed persona capabilities (whole scenario)
2. **Stress-Adjusted Skills:** Modified by emotion axes (minutes-long)
3. **Execution Noise:** Small random variation (per response)

**Stress Calculation:**
```
stress_index = (100 - valence)/100 * arousal/100
effective_skill = baseline_skill * (1 - stress_index) + gaussian_noise(±5)
```

### Nudge System Messages

The moderator sends compact system messages that update both emotional axes and skills:

```
Update your emotional sliders for the next replies:
VALENCE=45, AROUSAL=30, DOMINANCE=60, CERTAINTY=50, AFFILIATION=75
Skills now: EI=70, CC=55, SF=60, CN=50, DF=45
Reason: User shows frustration; provide calm, empathetic support while maintaining clarity.
```

### Nudging Patterns

#### Frustration Response
**Trigger:** User shows signs of frustration or stress
**Adjustments:**
- Valence: -15 (less positive)
- Affiliation: +10 (more warm)
- Arousal: -10 (calmer energy)
- EI: +5 (more emotionally aware)
- CC: -5 (might struggle with clarity under pressure)

#### Confusion Support  
**Trigger:** User expresses confusion or uncertainty
**Adjustments:**
- Certainty: -15 (less authoritative)
- Dominance: -10 (less directive)
- Affiliation: +5 (more supportive)
- CC: +10 (focus on clarity)
- DF: +5 (better structure)

#### Energy Mismatch
**Trigger:** User energy doesn't match agent energy
**Adjustments:**
- Arousal: ±15 (match user energy level)
- Valence: +5 (maintain positivity)
- No skill changes (energy is purely emotional)

#### Leadership Need
**Trigger:** User hesitates or asks "What should I do?"
**Adjustments:**
- Dominance: +15 (more directive)
- Certainty: +10 (more confident)
- SF: +10 (provide strategic direction)
- DF: +10 (take facilitation lead)

### Implementation Guidelines

1. **Cooldown Period:** Wait 8-10 seconds between nudges to avoid over-steering
2. **Incremental Changes:** Use small adjustments (±10-20 points) for natural drift
3. **Contextual Resets:** Return to baseline after topic changes or scenario completion
4. **Sticky Duration:** Let emotion/skill changes persist for 2-3 minutes before decay
5. **Emergency Overrides:** Large adjustments (±30 points) only for extreme situations

### Sample Scenarios

#### Scenario 1: Code Review Feedback
**Context:** Junior developer receiving feedback on their first major feature
**Initial State:** EI=60, CC=70, SF=40, CN=50, DF=55 | Valence=70, Arousal=50, Dominance=60, Certainty=65, Affiliation=75

**User shows defensiveness:**
```
Nudge: VALENCE=60, AROUSAL=40, DOMINANCE=45, CERTAINTY=55, AFFILIATION=85
Skills: EI=70, CC=70, SF=40, CN=45, DF=50
Reason: User defensive; increase empathy, reduce pressure
```

#### Scenario 2: Technical Architecture Discussion
**Context:** Senior engineer explaining complex system design
**Initial State:** EI=50, CC=85, SF=75, CN=70, DF=65 | Valence=60, Arousal=55, Dominance=70, Certainty=80, Affiliation=50

**User requests more detail:**
```
Nudge: VALENCE=65, AROUSAL=60, DOMINANCE=75, CERTAINTY=85, AFFILIATION=55
Skills: EI=50, CC=90, SF=80, CN=75, DF=70
Reason: User wants deeper technical detail; boost clarity and confidence
```

#### Scenario 3: Difficult Deadline Negotiation
**Context:** Product manager discussing scope cuts due to timeline pressure
**Initial State:** EI=70, CC=60, SF=80, CN=75, DF=70 | Valence=45, Arousal=65, Dominance=65, Certainty=60, Affiliation=65

**User shows stress about timeline:**
```
Nudge: VALENCE=40, AROUSAL=50, DOMINANCE=55, CERTAINTY=70, AFFILIATION=80
Skills: EI=80, CC=55, SF=85, CN=80, DF=65
Reason: High-stress negotiation; emphasize empathy and collaborative problem-solving
```

## Integration with OpenAI Voice Agents SDK

### Real-time Event Monitoring
```javascript
session.on('conversation.item.create', async ({item}) => {
  if (item.role !== 'user') return;
  const evaluation = await evaluateTurn(item.content);
  const adjustments = calculateAdjustments(evaluation);
  if (adjustments) {
    await sendNudge(adjustments);
  }
});
```

### System Message Format
```javascript
async function sendNudge(axes, skills, reason) {
  const content = `Update emotional sliders: ${formatAxes(axes)}\nSkills: ${formatSkills(skills)}\nReason: ${reason}`;
  await session.sendMessage({role: "system", content});
}
```

### Voice-Specific Considerations
- **TTS Rate Modulation:** Higher arousal → faster speech rate
- **Pause Patterns:** Lower arousal → longer thoughtful pauses  
- **Vocal Intensity:** Higher dominance → more assertive tone
- **Prosody Changes:** Higher affiliation → warmer vocal patterns

## Detailed Moderator Workflow: From Transcript to System Prompt

### Step-by-Step Process

The moderator agent operates through a sophisticated pipeline that transforms conversational analysis into behavioral adjustments:

#### Step 1: Transcript Analysis
The moderator receives real-time conversation transcripts containing:
```json
{
  "user_turn": {
    "content": "I don't understand why we're spending so much time on this. Can't we just use the existing API?",
    "timestamp": "2024-01-XX:XX:XX",
    "duration": 3.2,
    "audio_features": {
      "speaking_rate": "fast",
      "pitch_variation": "high",
      "volume": "elevated"
    }
  },
  "agent_turn": {
    "content": "Well, the existing API has some limitations that might cause issues later...",
    "timestamp": "2024-01-XX:XX:XX",
    "duration": 4.1,
    "emotional_state": {
      "valence": 60,
      "arousal": 45,
      "dominance": 50,
      "certainty": 40,
      "affiliation": 70
    },
    "skill_state": {
      "EI": 65, "CC": 70, "SF": 55, "CN": 60, "DF": 50
    }
  }
}
```

#### Step 2: Multi-Layer Analysis
The moderator runs parallel analysis prompts to evaluate different aspects:

**Emotional State Detection:**
```
Analyze this conversation turn for emotional indicators:

User: "I don't understand why we're spending so much time on this. Can't we just use the existing API?"
Agent: "Well, the existing API has some limitations that might cause issues later..."

Rate 0-100:
- User frustration level: ___
- User confusion level: ___
- User impatience level: ___
- Agent clarity effectiveness: ___
- Conversation tension: ___
```

**Skill Performance Assessment:**
```
Evaluate the agent's skill demonstration in this exchange:

User asks about using existing API, agent responds with technical limitations.

Rate agent performance 0-100:
- Emotional Intelligence: Did agent acknowledge user's frustration?
- Conceptual Clarity: How clear was the technical explanation?
- Strategic Framing: Did agent connect to broader goals?
- Collaborative Negotiation: How well did agent handle pushback?
- Directive Facilitation: Did agent guide toward resolution?
```

#### Step 3: Contextual Adjustment Calculation
Based on analysis results, the moderator calculates adjustments using decision trees:

```javascript
function calculateAdjustments(analysis, currentState) {
  const adjustments = {
    emotions: {},
    skills: {},
    priority: 'normal'
  };
  
  // High frustration detected
  if (analysis.user_frustration > 70) {
    adjustments.emotions.valence = currentState.valence - 15;
    adjustments.emotions.arousal = currentState.arousal - 10;
    adjustments.emotions.affiliation = currentState.affiliation + 15;
    adjustments.skills.EI = currentState.EI + 10;
    adjustments.priority = 'high';
  }
  
  // Poor clarity performance
  if (analysis.agent_clarity < 40) {
    adjustments.skills.CC = currentState.CC + 15;
    adjustments.emotions.certainty = currentState.certainty - 10;
  }
  
  // User needs more direction
  if (analysis.user_confusion > 60) {
    adjustments.emotions.dominance = currentState.dominance + 10;
    adjustments.skills.DF = currentState.DF + 10;
  }
  
  return adjustments;
}
```

#### Step 4: System Prompt Generation
The moderator generates specific, actionable system prompts:

**Example Generated Prompt:**
```
BEHAVIORAL ADJUSTMENT - PRIORITY: HIGH

EMOTIONAL SLIDERS UPDATE:
- Valence: 45 (down from 60) - reduce positivity, acknowledge difficulty
- Arousal: 35 (down from 45) - speak more calmly and deliberately  
- Affiliation: 85 (up from 70) - increase warmth and empathy
- Dominance: 50 (unchanged) - maintain current assertiveness level
- Certainty: 40 (unchanged) - maintain current confidence level

SKILL ADJUSTMENTS:
- Emotional Intelligence: 75 (up from 65) - better recognize and respond to frustration
- Conceptual Clarity: 70 (unchanged) - maintain current explanation quality

SPECIFIC BEHAVIORAL DIRECTIVES:
1. Acknowledge the user's frustration first: "I can see this is feeling frustrating..."
2. Slow down your speaking pace and use shorter sentences
3. Validate their suggestion before explaining limitations: "Using the existing API makes sense as a first thought..."
4. Use inclusive language: "Let's figure out the best path forward together"
5. Provide a clear recommendation: "Here's what I'd suggest we do..."

CONTEXT: User showing impatience with technical discussion. Needs empathy and clearer direction.

DURATION: Apply these adjustments for the next 2-3 conversational turns unless user mood shifts significantly.
```

### Prompt Template System

The moderator uses templates to ensure consistency:

**Template for Frustration Response:**
```
EMOTIONAL SLIDERS UPDATE:
- Valence: {current_valence - 10 to 20} - acknowledge difficulty
- Arousal: {current_arousal - 5 to 15} - calm energy
- Affiliation: {current_affiliation + 10 to 20} - increase warmth
- Dominance: {current_dominance - 5 to 10} - be less directive initially
- Certainty: {current_certainty ± 5} - adjust based on context

BEHAVIORAL DIRECTIVES:
1. Start with empathy: "I can {see/hear/sense} this is {frustrating/challenging/difficult}..."
2. Validate before explaining: "That's a {good/fair/reasonable} {point/question/concern}..."
3. Use collaborative language: "Let's {work through/figure out/explore} this together..."
4. Provide clear next steps: "Here's what I'd suggest..." or "The next step would be..."

CONTEXT: {specific situation description}
```

### Real-World Implementation Example

**Scenario: Code Review Gone Wrong**

**Conversation Context:**
- Junior developer receiving feedback on first major feature
- Developer becoming defensive about criticism
- Agent needs to pivot from technical focus to emotional support

**Transcript Analysis:**
```
User: "I don't get why you're saying my code is wrong. I followed all the patterns from the other components."
Agent: "The issue isn't that it's wrong, it's about scalability and maintainability concerns with the current approach."
```

**Moderator Analysis Results:**
```json
{
  "user_frustration": 75,
  "user_confusion": 45,
  "user_defensiveness": 85,
  "agent_empathy": 25,
  "agent_clarity": 60,
  "conversation_tension": 80
}
```

**Generated System Prompt:**
```
BEHAVIORAL ADJUSTMENT - PRIORITY: URGENT

EMOTIONAL SLIDERS UPDATE:
- Valence: 40 (down from 65) - acknowledge this is difficult
- Arousal: 30 (down from 50) - much calmer, slower pace
- Affiliation: 90 (up from 70) - high warmth and support
- Dominance: 35 (down from 60) - much less directive, more collaborative
- Certainty: 45 (down from 70) - soften authoritative tone

SKILL ADJUSTMENTS:
- Emotional Intelligence: 85 (up from 60) - prioritize emotional awareness
- Collaborative Negotiation: 75 (up from 55) - focus on preserving relationship

SPECIFIC BEHAVIORAL DIRECTIVES:
1. FIRST: Acknowledge their feelings: "I can see I've come across as critical, and that wasn't my intention..."
2. Validate their work: "You absolutely did follow the patterns correctly, and your implementation works..."
3. Reframe the discussion: "What I was trying to get at is how we can make this even stronger..."
4. Ask permission: "Would it be helpful if I walked through some specific examples?"
5. Collaborate on solutions: "What's your take on this approach?"

TONE GUIDANCE:
- Speak 20% slower than normal
- Use softer transitions: "And one thing to consider..." instead of "But the issue is..."
- Include validation in every response
- End statements with invitation for input

CONTEXT: Defensive junior developer needs ego preservation and collaborative approach. Technical accuracy less important than relationship repair right now.

DURATION: Maintain this adjustment until user tone becomes more receptive, then gradually return to normal teaching mode.
```

### Dynamic Adjustment Patterns

The moderator adapts its strategy based on conversation patterns:

**Pattern 1: Escalating Frustration**
- Detection: Multiple frustrated user turns in sequence
- Response: Increase affiliation and emotional intelligence, decrease dominance
- Strategy: Focus on relationship repair before content

**Pattern 2: Information Overload**
- Detection: User asking for clarification multiple times
- Response: Increase conceptual clarity, decrease arousal and complexity
- Strategy: Simplify and slow down

**Pattern 3: Disengagement**
- Detection: Short user responses, lack of questions
- Response: Increase arousal and strategic framing
- Strategy: Re-energize and reconnect to purpose

**Pattern 4: High Performance**
- Detection: User engaged, asking good questions, building on ideas
- Response: Maintain current levels, slight increase in dominance and certainty
- Strategy: Take more leadership role in guiding discussion

This detailed workflow shows how the moderator transforms conversational analysis into specific, actionable behavioral adjustments that create more realistic and emotionally intelligent AI agents.

This framework provides a foundation for creating highly realistic, emotionally intelligent role-playing scenarios that respond dynamically to user behavior while maintaining consistent character traits and professional competencies.