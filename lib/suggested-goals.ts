/** Quick-pick goals for the create / experiment flow */
export const SUGGESTED_GOALS = [
  "I want to lose weight",
  "I want to increase my longevity",
  "I want to improve my memory",
  "I want to sleep better",
  "I want to improve my energy levels",
  "I want to help heal my knee",
  "I want to reduce stress",
  "I want to improve my recovery",
] as const;

export type SuggestedGoal = (typeof SUGGESTED_GOALS)[number];
