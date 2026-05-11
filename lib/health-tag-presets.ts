import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  BatteryWarning,
  Bone,
  Brain,
  Dumbbell,
  FlaskConical,
  Leaf,
  Moon,
  Scale,
  ShieldPlus,
  Sparkles,
  Sunrise,
} from "lucide-react";

export type HealthTagPreset = { label: string; Icon: LucideIcon };

/** Curated tags shown in the health profile picker (order = display order). */
export const HEALTH_TAG_PRESETS: HealthTagPreset[] = [
  { label: "Postpartum recovery", Icon: Baby },
  { label: "Parkinson's disease", Icon: Activity },
  { label: "Herniated disk", Icon: Bone },
  { label: "Hormonal changes", Icon: FlaskConical },
  { label: "Athletic performance", Icon: Dumbbell },
  { label: "Weight management", Icon: Scale },
  { label: "Sleep optimization", Icon: Moon },
  { label: "Chronic fatigue", Icon: BatteryWarning },
  { label: "Perimenopause", Icon: Sunrise },
  { label: "Injury recovery", Icon: ShieldPlus },
  { label: "Mental wellness", Icon: Brain },
  { label: "Healthy aging", Icon: Leaf },
];

export const PRESET_LABEL_SET = new Set(HEALTH_TAG_PRESETS.map((p) => p.label));
