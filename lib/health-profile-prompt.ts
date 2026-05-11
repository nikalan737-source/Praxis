/**
 * Shared personalization block for AI prompts (theory generation & evaluation).
 */
export function buildHealthTagsPromptSection(tags: string[]): string {
  const trimmed = tags.map((t) => t.trim()).filter(Boolean);
  const cleaned = Array.from(new Set(trimmed));
  if (cleaned.length === 0) return "";

  return `

USER HEALTH PROFILE (personalization — apply consistently across all blocks and interventions):
The user shared these contexts or focus areas (may include custom free-text tags):
${cleaned.map((t) => `• ${t}`).join("\n")}

Personalization rules:
- Avoid movements, loads, or interventions that are typically contraindicated for their situation when tags imply structural, neurological, metabolic, or pregnancy/postpartum concerns (e.g., minimize heavy spinal compression or high-risk maneuvers when disc/spine injury tags appear — prefer graded, clinician-aligned alternatives and flag uncertainty).
- Reflect hormonal and life-stage realities when tags suggest postpartum, perimenopause, or similar (nutrition, recovery pacing, symptom framing).
- When tags suggest neurologic or mobility conditions, bias toward evidence-informed, safety-first exercise framing (e.g., cueing, balance, progression appropriate to that context).
- Prefer tailored, specific guidance over generic defaults; when a tag is ambiguous, choose conservative options and brief caveats rather than one-size advice.
- Never diagnose; encourage professional care for medical decisions. Stay warm, practical, and non-alarmist.`;
}
