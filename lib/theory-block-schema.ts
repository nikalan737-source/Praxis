import { z } from "zod";

const evidenceTier = z.enum(["Strong", "Emerging", "Theoretical", "Unsupported"]);
const riskLevel = z.enum(["Low", "Moderate", "High"]);
const reversibility = z.enum(["High", "Medium", "Low"]);
const magnitude = z.enum(["Small", "Medium", "Large"]);

export const TheoryBlockSchema = z.object({
  id: z.string(),
  title: z.string(),
  goalCategory: z.string(),
  goalStatement: z.string(),
  evidenceTier,
  riskLevel,
  reversibility,
  mechanismSummary: z.string(),
  keyInsight: z.string().optional(),
  references: z.array(z.string()).optional(),
  createdType: z.enum(["ai_generated", "user_created"]).optional(),
  aiOverview: z.string().optional(),
  userTheoryText: z.string().optional(),
  combinedTiers: z.array(z.string()).optional(),
  actionSteps: z.array(z.string()).optional(),
  interventions: z.array(
    z.object({
      tier: evidenceTier,
      name: z.string(),
      mechanism: z.string(),
      steps: z.array(z.string()),
      durationDays: z.number(),
      trackingMetrics: z.array(z.string()),
      expectedMagnitude: magnitude,
      riskLevel,
      reversibility,
      contraindications: z.array(z.string()),
    })
  ),
  tags: z.array(z.string()),
  traction: z.object({
    saves: z.number(),
    experimentLogs: z.number(),
    avgOutcome: z.number(),
  }),
});

export const GenerateResultSchema = z.object({
  blocks: z.array(TheoryBlockSchema),
});

export const EvaluateResultSchema = z.object({
  block: TheoryBlockSchema,
});

export type TheoryBlockSchemaType = z.infer<typeof TheoryBlockSchema>;
