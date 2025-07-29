### 1  Why the “roll‑every‑utterance” BRP trick feels jerky

Using a fresh d100 pass/fail for **every** sentence makes the agent oscillate: a Staff Engineer who was crystal‑clear a second ago may suddenly fumble an explanation. Human aptitude is far “stickier.” Cognitive research shows that *stress and mood move faster than hard skills*, and that rising stress degrades complex‑reasoning and communication quality in predictable ways ([PMC][1], [PMC][2], [PMC][3], [PubMed][4]).

### 2  Three‑layer model that plays nicer with reality

| Layer                                   | Lifespan                           | Source of change                  | Implementation sketch                                                                            |
| --------------------------------------- | ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Baseline skills** (the persona sheet) | Whole scenario (or until level‑up) | Scenario designer / learner knobs | 5 numbers: EI, CC, SF, CN, DF. Store in `session.state.skills`.                                  |
| **Stress‑adjusted “effective” skills**  | Seconds‑to‑minutes                 | Function of emotion axes          | `effective = base * (1 – stressIdx)` where `stressIdx = f(Val↓, Aro↑, Dom↑, Aff↓)`, clamped 0–1. |
| **Momentary execution noise**           | Per reply                          | Small Gaussian ±5 pts             | `effectiveSkill += N(0, σ=5)` → gentle variability without flip‑flop.                            |

*Result:* Skills drift smoothly as the moderator bumps emotion axes; sudden jolts are limited to ±5 pts.

---

### 3  How the moderator steers both *emotions* and *skills*

1. **Observe** the last user + assistant turn (you already stream these over the `oai-events` data channel ([OpenAI Platform][5], [webrtcHacks][6])).

2. **Score** the turn with a fast rubric prompt (see previous answer).

3. **Decide** axis deltas **and** optional skill deltas:

   ```ts
   if (stress > 0.8) {          // e.g. Valence <30 & Arousal >70
       deltaAxis.VAL = -10;
       deltaSkill.CC = -10;     // concept clarity suffers under stress
       deltaSkill.DF = -5;      // facilitation slips a bit
   }
   if (userNeedsTechDepth) {
       deltaSkill.CN = +10;     // boost certainty & depth
       deltaAxis.CER = +10;
   }
   ```

4. **Emit *one* compact system message** that updates both vectors:

   ```
   Adjust sliders:
   VALENCE=30 AROUSAL=75 DOMINANCE=55 CERTAINTY=50 AFFILIATION=45
   Skills now: EI=70 CC=55 SF=60 CN=50 DF=45
   Reason: user shows frustration; keep calm but tighten clarity.
   ```

   Appending a new system message overrides previous ones without erasing them .

---

### 4  Choosing *when* to recompute skills

| Trigger                                                           | Why it feels natural                         |
| ----------------------------------------------------------------- | -------------------------------------------- |
| **Topic boundary** (new agenda item, new ticket)                  | People re‑orient mentally at topic switches. |
| **Stress‑index crosses a threshold** (e.g., > 0.7)                | Under heat, performance drops rapidly.       |
| **Time slice** (every 3–5 min)                                    | Mirrors fatigue or “second wind.”            |
| **Moderator explicit nudge** (“Let’s try to be more concise now”) | Pedagogical intervention.                    |

A single d100 **per skill per trigger**, not per utterance, is usually enough. Store the resulting *effective* values until the next trigger.

---

### 5  Mapping emotions → skill penalties/bonuses (starter table)

| Axis pattern                                 | Cognitive effect (literature)                           | Skill tweaks            |
| -------------------------------------------- | ------------------------------------------------------- | ----------------------- |
| **Val↓ & Aro↑** (high stress)                | Working‑memory load ↑, verbal articulation ↓ ([PMC][3]) | CC −10, DF −10          |
| **Val↑ & Aff↑** (psychological safety)       | Better idea exchange, active listening ([PMC][7])       | EI +10, DF +5           |
| **Dom↑ & Cert↑** (assertive flow)            | Clear decisions, risk of steam‑rolling                  | SF +5, EI −5            |
| **Aro↓ & Val↘** (low energy, mild pessimism) | Rambling, less structure                                | CC −5, DF −5            |
| **Cert↓ (self‑doubt)**                       | More qualifiers, checks for understanding               | EI +5 (listens), CN −10 |

---

### 6  Putting it in code (simplified)

```ts
function recalcEffectiveSkills(base, axis) {
  const stress = (100 - axis.VAL)/100 * axis.ARO/100;   // 0‑1
  const eff = {...base};
  if (stress > 0.7) { eff.CC -= 10; eff.DF -= 10; }
  if (axis.AFF > 70 && axis.VAL > 60) eff.EI += 10;
  Object.keys(eff).forEach(k => eff[k] = clamp(eff[k] + randn(0,5), 0, 100));
  return eff;
}
```

Call this only on chosen triggers; cache the result in `session.state.effectiveSkills`.

---

### 7  How the voice‑agent uses *effective* skills

* Roll once against **each effective skill** when it *first* needs that dimension (e.g., first time the conversation calls for facilitation).
* Pick the highest success to colour the answer (“degrees‑of‑success” model), **or** feed the raw percentage into a style template:

  > *“Because my *Conceptual Clarity* is at **55 %**, keep explanations concise and use one example max.”*

  This avoids big style flips mid‑turn while still letting performance sag if stress remains high.

---

### 8  When *not* to touch skills

* **Micro‑back‑channels** (“mm‑hmm”, “right”)—they hinge on emotion only.
* **Fixed­‑scope drills** (e.g., “Practise facilitation for 5 min”)—freeze DF high so learner can focus.
* **Assessment checkpoints**—reset skills to baseline before grading consistency.

---

### 9  Why this works

* **Realistic drift:** skills shift with stress, echoing empirical findings on communication under pressure.
* **Predictable knobs:** designers still set just two sliders—axis deltas and skill penalties.
* **Smooth audio:** no jarring tone changes because effective skills persist for minutes, not milliseconds.
* **Same SDK primitives:** everything still rides on `session.sendMessage({role:"system", …})` and `session.state`, so there’s **zero extra latency**—important for real‑time voice ([OpenAI Cookbook][8], [OpenAI Platform][5]).

Move the quick‑math into a helper, call it from the moderator’s loop, and you’ll have a simulation where mood and competence ebb and flow together—much closer to how real humans spike and slump during tough workplace conversations.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12242891/?utm_source=chatgpt.com "Improving breaking bad news communication skills through stress ..."
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8608119/?utm_source=chatgpt.com "Anxiety Effect on Communication Skills in Nursing Supervisors"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10298416/?utm_source=chatgpt.com "Influence of Stress and Emotions in the Learning Process"
[4]: https://pubmed.ncbi.nlm.nih.gov/36625564/?utm_source=chatgpt.com "Team Stress and Its Impact on Interprofessional Teams: A Narrative ..."
[5]: https://platform.openai.com/docs/guides/voice-agents?utm_source=chatgpt.com "Voice agents - OpenAI API"
[6]: https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/?utm_source=chatgpt.com "The Unofficial Guide to OpenAI Realtime WebRTC API - webrtcHacks"
[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8361146/?utm_source=chatgpt.com "Leadership communication, stress, and burnout among frontline ..."
[8]: https://cookbook.openai.com/examples/voice_solutions/steering_tts?utm_source=chatgpt.com "Steering Text-to-Speech for more dynamic audio generation"
