export type ExperimentTemplate = {
  id: string;
  name: string;
  goal: string;
  trackingMetrics: string[];
  category: "Cognitive" | "Metabolic" | "Mood" | "Physical" | "Recovery" | "Sleep";
  /** Starter copy for the Write Your Own theory field */
  theoryStarter: string;
  /** One-line summary for template cards */
  summary: string;
};

/** Pre-built experiment templates for adults 35–55 navigating hormonal or physiological shifts. */
export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: "energy-hormonal-transition",
    name: "Improving energy during hormonal transition",
    goal: "Increase daily energy levels",
    trackingMetrics: ["Energy rating", "Sleep hours", "Stress level"],
    category: "Recovery",
    summary: "For when fatigue shows up during perimenopause, menopause, or andropause.",
    theoryStarter:
      "My energy has dropped during a hormonal shift and I want to see what actually helps day to day — sleep, stress, movement, or nutrition.\n\nI'll check in daily on how I feel and look for patterns over a few weeks.",
  },
  {
    id: "sleep-after-40",
    name: "Sleep quality after 40",
    goal: "Improve sleep consistency",
    trackingMetrics: ["Hours slept", "Sleep quality rating", "Evening habits"],
    category: "Sleep",
    summary: "For lighter sleep, later bedtimes, or waking up tired.",
    theoryStarter:
      "My sleep has gotten less reliable after 40. I want to test small evening changes and see what improves how rested I feel.\n\nI'll log sleep hours, rate sleep quality, and note whether I stuck to my evening routine.",
  },
  {
    id: "postpartum-rebuild",
    name: "Rebuilding after postpartum",
    goal: "Restore baseline energy and strength",
    trackingMetrics: ["Energy", "Mood", "Activity level"],
    category: "Recovery",
    summary: "For gradual return to strength without pushing too hard too soon.",
    theoryStarter:
      "I'm rebuilding after postpartum and want to increase energy and strength at a pace that fits recovery and sleep.\n\nI'll track energy, mood, and how much movement I actually got each day.",
  },
  {
    id: "stress-cortisol",
    name: "Managing stress and cortisol",
    goal: "Reduce chronic stress impact",
    trackingMetrics: ["Stress rating", "Sleep", "Recovery feeling"],
    category: "Mood",
    summary: "For burnout, wired-but-tired days, or poor recovery from stress.",
    theoryStarter:
      "Chronic stress is affecting how I sleep and recover. I want to test a few daily habits and see what lowers my stress load.\n\nI'll rate stress, note sleep, and log how recovered I feel each morning.",
  },
  {
    id: "metabolism-weight-shift",
    name: "Metabolism and weight after hormonal shift",
    goal: "Understand what affects body composition",
    trackingMetrics: ["Weight", "Energy", "Food patterns"],
    category: "Metabolic",
    summary: "For unexplained weight changes when hormones or metabolism shift.",
    theoryStarter:
      "My body composition has changed and I want to understand what drives it — energy, appetite, sleep, and daily food patterns.\n\nI'll track weight a few times a week plus daily energy and a simple note on how I ate.",
  },
  {
    id: "strength-recovery-40",
    name: "Strength and recovery over 40",
    goal: "Improve workout recovery",
    trackingMetrics: ["Soreness", "Energy post-workout", "Sleep"],
    category: "Physical",
    summary: "For slower recovery, lingering soreness, or flat workouts after 40.",
    theoryStarter:
      "Recovery from workouts takes longer than it used to. I want to adjust sleep, nutrition, or training load and see what helps me bounce back.\n\nI'll log soreness, energy after training, and sleep the night after hard sessions.",
  },
];

export function buildAiGoalFromTemplate(template: ExperimentTemplate): string {
  const metrics = template.trackingMetrics.join(", ");
  return `${template.goal}. Track: ${metrics}.`;
}

export function buildTrackingFieldFromTemplate(template: ExperimentTemplate): string {
  return template.trackingMetrics.join(", ");
}
