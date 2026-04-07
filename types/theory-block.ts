export type PubMedArticle = {
  pmid: string;
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
};

export type TheoryBlock = {
  id: string;
  title: string;
  goalCategory: string;
  goalStatement: string;
  evidenceTier: "Strong" | "Emerging" | "Theoretical" | "Unsupported";
  riskLevel: "Low" | "Moderate" | "High";
  reversibility: "High" | "Medium" | "Low";
  mechanismSummary: string;
  keyInsight?: string;
  references?: string[];
  createdType?: "ai_generated" | "user_created";
  aiOverview?: string;
  userTheoryText?: string;
  combinedTiers?: string[];  // e.g. ["Strong", "Unsupported"] when blocks are merged
  actionSteps?: string[];    // 3-5 concrete, immediately actionable things to do today
  interventions: {
    tier: "Strong" | "Emerging" | "Theoretical" | "Unsupported";
    name: string;
    mechanism: string;
    steps: string[];
    durationDays: number;
    trackingMetrics: string[];
    expectedMagnitude: "Small" | "Medium" | "Large";
    riskLevel: "Low" | "Moderate" | "High";
    reversibility: "High" | "Medium" | "Low";
    contraindications: string[];
  }[];
  tags: string[];
  createdAt?: string;
  traction: { saves: number; experimentLogs: number; avgOutcome: number };
};

export type GenerateResult = {
  blocks: TheoryBlock[];
  articles: PubMedArticle[];
  searchQuery: string;
};

export type EvaluateResult = {
  block: TheoryBlock;           // legacy single-block
  blocks?: TheoryBlock[];       // multi-block segmented by tier
  articles: PubMedArticle[];
  searchQuery: string;
};
