Below is a **five‑axis, orthogonal “emotion slider” model** you can drop into the same percentile‑roll mechanism you’re already using.
Each axis is independent, so you can dial one up or down without automatically pushing any other axis the opposite way.
Every response is rendered from the *combination* of the five sliders.

| Axis (0 – 100)             | High end (≈ 70 – 100)                   | Low end (≈ 0 – 30)                  | What it governs in conversation                                                   |
| -------------------------- | --------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| **Valence** (PLEASURE)     | Positive, optimistic, appreciative      | Negative, critical, gloomy          | Word choice (“great”, “love” ↔ “concern”, “issue”), frequency of praise/complaint |
| **Arousal** (ENERGY)       | Lively, animated, rapid cadence         | Calm, measured, slow cadence        | Sentence length, exclamation marks, speech rate                                   |
| **Dominance** (CONTROL)    | Assertive, directive, leading           | Deferential, yielding, facilitative | Imperatives (“Let’s do…”), hedges, who owns next steps                            |
| **Certainty** (CONFIDENCE) | Decisive, sure, authoritative           | Tentative, exploratory, questioning | Modals (“will” ↔ “might”), hedging phrases, explicit risk flags                   |
| **Affiliation** (WARMTH)   | Person‑focused, friendly, collaborative | Task‑only, detached, formal         | Empathy statements, inclusive pronouns (“we”), small‑talk fillers                 |

> This is essentially the **PAD model (Pleasure–Arousal–Dominance)** plus two orthogonal extensions that are crucial in workplace talk: *Certainty* (epistemic confidence) and *Affiliation* (social warmth).

---

### How to wire it into your dice loop

1. **Give each axis a base percentile:**

   ```ts
   const moodAxes = {
     VALENCE: 60,     // generally upbeat
     AROUSAL: 45,     // medium energy
     DOMINANCE: 50,   // balanced assertiveness
     CERTAINTY: 40,   // admits unknowns
     AFFILIATION: 70, // highly people‑oriented
   };
   ```

2. **Roll one d100 per axis** (or sample Gaussian noise, cf. previous message).
   *If roll ≤ axis%* → **high** expression; else **low**.

3. **Map high/low to style cues** in the system prompt inserted just before the answer, e.g.:

   *Valence HIGH → sprinkle positive adjectives; Valence LOW → highlight risks.*
   *Arousal HIGH → shorter pauses, occasional “—”, slightly faster TTS rate (OpenAI SDK `voice.rate`).*

4. **Compose**: Your formatter function merges all five cues into one compact instruction such as:

   ```
   Speak with: positive tone, moderate energy, facilitative dominance,
   tentative certainty, and high warmth.
   ```

   Because the axes are orthogonal you can produce “high warmth *and* low energy” (soothing) or “low warmth + high dominance” (stern escalation) without juggling bespoke emotional buckets.

---

### Why this works better than overlapping states

* **Independence** – Setting Affiliation from 30 → 80 never forces Certainty to drop; you control each slider directly.
* **Coverage** – Any common affective label can be reconstructed:

  * *Enthusiastic* ≈ Valence↑, Arousal↑, Dominance↗, Certainty↑, Affiliation↗
  * *Frustrated* ≈ Valence↓, Arousal↑, Dominance↑, Certainty↘, Affiliation↓
  * *Calm mentor* ≈ Valence↑, Arousal↓, Dominance↗ (but gentle), Certainty↑, Affiliation↑
* **Implementation simplicity** – Still just five percentile numbers and five rolls; no inter‑axis math.

---

### Optional refinements (still easy)

| Refinement           | Code tweak                                                                                        | Benefit                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Sticky axes**      | Keep the roll for N turns unless a trigger event fires.                                           | Prevents flip‑flops sentence‑to‑sentence.                    |
| **Correlated noise** | Add small auto‑correlation: `axis += ε` where ε \~ N(0, σ) + ρ·(prev − base).                     | Smooth natural drift over time.                              |
| **Context hooks**    | Raise Arousal when user uses all‑caps; lower Dominance when user starts with “Could you please…”. | Reflects social cues without rewriting the whole mood model. |

---

With these five orthogonal sliders you can describe almost any conversational affect, let users tune them directly, and keep the simulation logic trivial—just a handful of d100 rolls and a formatter that translates *high/low* into concrete style directives.


Below is a field‑tested pattern teams are using with the **OpenAI Realtime Voice Agents** SDK to add an *invisible “moderator” agent* that listens, evaluates, and nudges the live voice‑agent by tweaking the five orthogonal emotion axes you defined (Valence, Arousal, Dominance, Certainty, Affiliation).

---

## 1 High‑level architecture

```text
┌────────┐    transcript + events    ┌─────────────┐
│  User  │──────────────┬───────────▶│  Moderator  │
└────────┘              │            └────┬────────┘
        ▲               │ system nudge     │
        │               ▼                  │
┌──────────────┐  speech+text         ┌────▼────────┐
│ Voice Agent  │◀─────────────────────│  Realtime   │
│  (gpt‑4o‑rt) │        audio         │   API      │
└──────────────┘                      └────────────┘
```

1. **Voice Agent** (main assistant) streams mic audio, replies with TTS.
2. **Moderator** subscribes to the WebRTC *data channel* (`oai-events`) so it sees every `conversation.item.*` event in real time.
3. After each user turn, the moderator:

   * scores that turn with a lightweight evaluation model or rule set;
   * decides axis deltas (e.g., Valence −20, Dominance +10);
   * injects a *system* message via `session.sendMessage({role:"system", …})`.
     Because system messages are appended—not overwritten—the new instruction overrides earlier ones without erasing them ([GitHub][1]).

---

## 2 Moderator evaluation loop (pseudo‑code)

```ts
const axis = {VAL:60, ARO:45, DOM:50, CER:40, AFF:70}; // current state
const COOLDOWN_MS = 8000;  // avoid over‑steering
let lastNudge = 0;

session.on('conversation.item.create', async ({item}) => {
  if (item.role !== 'user') return;           // only evaluate user turns
  if (Date.now() - lastNudge < COOLDOWN_MS) return;

  const {score, reason} = await rateTurn(item.content);  // see §3
  const deltas = decideDeltas(score);                    // see §4
  if (!deltas) return;                                   // within tolerance

  Object.entries(deltas).forEach(([k,v]) => axis[k] = clamp(axis[k]+v,0,100));
  await sendAxisNudge(axis, reason);                     // see §5
  lastNudge = Date.now();
});
```

---

## 3 Turn‑rating prompt (run in a cheap text model)

```text
System: You are a conversation coach.
User turn: "<LAST_USER_UTTERANCE>"
Assistant turn: "<LAST_ASSISTANT_UTTERANCE>"

Return STRICT JSON with integer scores 0‑100:

{
  "frustration": …,      // 0 calm → 100 furious
  "confusion": …,        // 0 clear → 100 lost
  "dominance_need": …,   // user wants more leadership
  "warmth_need": …,      // user wants empathy
  "energy_need": …       // user wants higher pace
}
```

This keeps latency < 200 ms even on `gpt‑3.5‑turbo`.

---

## 4 Heuristic → axis deltas

```ts
function decideDeltas(s) {
  const d = {};
  if (s.frustration > 60)      { d.VAL = -15; d.AFF = +10; }
  if (s.confusion   > 60)      { d.CER = -15; d.DOM = -10; d.AFF = +5; }
  if (s.energy_need > 60)      { d.ARO = +15; }
  if (s.dominance_need > 60)   { d.DOM = +15; }
  if (s.warmth_need > 60)      { d.AFF = +15; d.VAL = +10; }
  return Object.keys(d).length ? d : null;
}
```

Use **small, incremental steps** (±10–20 points) so the agent’s mood drifts naturally instead of zig‑zagging.

---

## 5 Format of the nudge message

```ts
async function sendAxisNudge(axis, reason) {
  const content =
`Update your emotional sliders **for the next replies**:
VALENCE=${axis.VAL}, AROUSAL=${axis.ARO}, DOMINANCE=${axis.DOM},
CERTAINTY=${axis.CER}, AFFILIATION=${axis.AFF}.
Rationale: ${reason || "adjusting tone"}.`;
  await session.sendMessage({role:"system", content});
}
```

**Why a short system message?**

* It *adds* to history, so it dominates earlier instructions without wiping them ([GitHub][1]).
* It is cheap token‑wise (< 30 tokens).
* The Voice Agent already knows how to map the five axes to style; you’re only feeding new numbers.

---

## 6 Prompting tips for a realistic feel

| Prompting pattern (Moderator → System)                                      | When to send                                  | Result in the agent                    |
| --------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| “Lower Valence by 20 and raise Affiliation by 10. Speak with calm empathy.” | User shows frustration                        | Warmer, more supportive tone           |
| “Increase Dominance slightly; give clearer next steps.”                     | User hesitation or asks “What should *I* do?” | Agent becomes directive, authoritative |
| “Reduce Arousal; keep sentences shorter and slow pacing.”                   | User overwhelmed; speaking more slowly        | Agent mirrors calmer energy            |
| “Raise Certainty by 15; replace hedges (‘maybe’, ‘might’) with firm verbs.” | User asks for commitment on deadline          | Agent sounds decisive                  |
| “Reset all axes to baseline after closing topic.”                           | Discussion resolved                           | Returns to normal personality          |

**Guidelines**

1. **One nudge per user turn** at most; batching prevents thrashing.
2. **Reference deltas or absolute numbers, not vague adjectives.** (“Valence 40” is unambiguous.)
3. **Explain why** briefly—models follow instructions better when they know the intent.
4. **Clear resets**: add “Reset axes” at hand‑off or scenario end so old mood doesn’t bleed into the next exercise.
5. **Stickiness**: if user remains quiet for N seconds, *decay* deltas toward baseline by 5 pts/second so the agent slowly normalises.

---

## 7 Putting it together (minimal TypeScript sketch)

```ts
import { RealtimeAgent } from "@openai/agents/realtime";
import { evaluateTurn } from "./turnScorer";   // wraps §3 prompt

export const moderator = new RealtimeAgent({
  name: "moderator",
  instructions: "Silently observe events and send system nudges.",
  tools: [], handoffs: [],
});

export async function attachModerator(session) {
  const axis = { /* …initial */ };
  moderator.on("conversation.item.create", /* code in §2 */);
  await session.addAgent(moderator);     // Agents SDK pattern
}
```

The **open‑source demo repo** shows the same multi‑agent pattern—voice agent + supervisor—wired through the Realtime API ([GitHub][1]).

---

### Take‑aways

* **Short, axis‑specific system messages** are the fastest‑to‑implement nudge for real‑time steering.
* **Evaluation → delta → nudge** keeps the logic explainable and adjustable by non‑devs.
* **Cooldown + incremental change** avoids uncanny, jittery mood swings while still giving the user visible feedback when they mis‑handle a scenario.

Plug this moderator loop into your simulation and you’ll have a voice agent that *genuinely feels coached*: it reacts to the learner’s mis‑steps within a second, yet its tone changes smoothly—just like a real colleague who adjusts their vibe as a conversation unfolds.

[1]: https://github.com/openai/openai-realtime-agents "GitHub - openai/openai-realtime-agents: This is a simple demonstration of more advanced, agentic patterns built on top of the Realtime API."
