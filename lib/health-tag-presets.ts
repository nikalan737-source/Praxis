import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  BatteryLow,
  BedDouble,
  Bone,
  Brain,
  CloudFog,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Moon,
  MoonStar,
  Pill,
  Scale,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  Sunrise,
  Sunset,
  Target,
  TrendingDown,
  UserRound,
  Wind,
  ZapOff,
} from "lucide-react";

export type HealthTagCategoryId =
  | "hormonal"
  | "energy"
  | "recovery"
  | "sleep"
  | "movement"
  | "mental";

export type HealthTagCategory = {
  id: HealthTagCategoryId;
  label: string;
};

export type HealthTagPreset = {
  label: string;
  Icon: LucideIcon;
  category: HealthTagCategoryId;
  /** Shown first in the picker for our core ICP */
  featured?: boolean;
};

/** Category order in the health profile picker */
export const HEALTH_TAG_CATEGORIES: HealthTagCategory[] = [
  { id: "hormonal", label: "Hormonal Changes" },
  { id: "energy", label: "Energy & Metabolism" },
  { id: "recovery", label: "Recovery & Stress" },
  { id: "sleep", label: "Sleep" },
  { id: "movement", label: "Movement & Body" },
  { id: "mental", label: "Mental Clarity" },
];

/**
 * Curated tags for adults 35–55 navigating hormonal or physiological shifts.
 * Featured ICP tags appear first; remaining tags follow by category.
 */
export const HEALTH_TAG_PRESETS: HealthTagPreset[] = [
  // Featured — most ICP-relevant (shown first)
  { label: "Perimenopause", Icon: Sunrise, category: "hormonal", featured: true },
  { label: "Postpartum recovery", Icon: Baby, category: "hormonal", featured: true },
  { label: "Testosterone decline", Icon: TrendingDown, category: "hormonal", featured: true },
  { label: "Low energy", Icon: BatteryLow, category: "energy", featured: true },

  // Hormonal Changes
  { label: "Menopause", Icon: Sunset, category: "hormonal" },
  { label: "Coming off birth control", Icon: Pill, category: "hormonal" },
  { label: "Andropause", Icon: UserRound, category: "hormonal" },

  // Energy & Metabolism
  { label: "Unexplained weight changes", Icon: Scale, category: "energy" },
  { label: "Slow metabolism", Icon: Gauge, category: "energy" },
  { label: "Blood sugar fluctuations", Icon: Activity, category: "energy" },

  // Recovery & Stress
  { label: "Chronic stress", Icon: Wind, category: "recovery" },
  { label: "Poor recovery", Icon: HeartPulse, category: "recovery" },
  { label: "High cortisol", Icon: Flame, category: "recovery" },
  { label: "Burnout", Icon: ZapOff, category: "recovery" },

  // Sleep
  { label: "Poor sleep quality", Icon: Moon, category: "sleep" },
  { label: "Disrupted sleep", Icon: MoonStar, category: "sleep" },
  { label: "Trouble falling asleep", Icon: BedDouble, category: "sleep" },

  // Movement & Body
  { label: "Post-injury", Icon: ShieldPlus, category: "movement" },
  { label: "Post-surgery", Icon: Stethoscope, category: "movement" },
  { label: "Joint pain", Icon: Bone, category: "movement" },
  { label: "Low muscle mass", Icon: Dumbbell, category: "movement" },
  { label: "Reduced endurance", Icon: TrendingDown, category: "movement" },

  // Mental Clarity
  { label: "Brain fog", Icon: CloudFog, category: "mental" },
  { label: "Mood changes", Icon: Sparkles, category: "mental" },
  { label: "Anxiety", Icon: Brain, category: "mental" },
  { label: "Low motivation", Icon: Target, category: "mental" },
];

export const FEATURED_HEALTH_TAG_LABELS = HEALTH_TAG_PRESETS.filter((p) => p.featured).map(
  (p) => p.label
);

export const PRESET_LABEL_SET = new Set(HEALTH_TAG_PRESETS.map((p) => p.label));

/** Presets grouped by category (featured tags only appear in the featured section). */
export const HEALTH_TAG_PRESETS_BY_CATEGORY = HEALTH_TAG_CATEGORIES.map((cat) => ({
  ...cat,
  presets: HEALTH_TAG_PRESETS.filter((p) => p.category === cat.id && !p.featured),
}));

export const FEATURED_HEALTH_TAG_PRESETS = HEALTH_TAG_PRESETS.filter((p) => p.featured);
