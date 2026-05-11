/**
 * Shared personalization block for theory generation & evaluation (authenticated users).
 * Informational only — no diagnosis or medical directives.
 */
export function buildHealthProfilePrompt(tags: string[]): string {
  const trimmed = tags.map((t) => t.trim()).filter(Boolean);
  const cleaned = Array.from(new Set(trimmed));
  if (cleaned.length === 0) return "";

  const list = cleaned.map((t) => `• ${t}`).join("\n");
  return `

USER HEALTH PROFILE (personalization — apply consistently across all blocks and interventions):
The user shared these contexts or focus areas (may include custom free-text tags):
${list}

Personalization rules (informational framing only — do not diagnose or prescribe medical care):
- Contraindicated movement: When tags suggest spine/disc issues or similar, avoid recommending heavy axial loading, high-impact spinal compression, or aggressive end-range spinal flexion/extension; prefer graded, joint-sparing options and note when a clinician's input would be prudent.
- Hormonal & life-stage context: For postpartum, perimenopause, or hormonal-change tags, reflect realistic recovery pacing, nutrition considerations, and symptom language that fits those life stages without overstating certainty.
- Condition-appropriate exercise: For neurologic or balance-related tags (e.g. Parkinson's), favor evidence-informed, safety-first movement framing — cueing, balance, dual-task awareness, and progression appropriate to that context.
- Conflicting or ambiguous tags: If tags pull advice in different directions, choose conservative, well-supported recommendations and briefly acknowledge tradeoffs rather than forcing a single aggressive protocol.
- Tone: Warm, practical, non-alarmist. Never diagnose or claim certainty about the user's medical status; encourage professional guidance for medical decisions.`;
}

/** @deprecated Use buildHealthProfilePrompt — alias kept for any older imports */
export const buildHealthTagsPromptSection = buildHealthProfilePrompt;
