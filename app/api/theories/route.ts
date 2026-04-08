import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("theory_blocks")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch theories" },
        { status: 500 }
      );
    }

    const blocks = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      goalCategory: row.goal_category,
      goalStatement: row.goal_statement,
      evidenceTier: row.evidence_tier,
      riskLevel: row.risk_level,
      reversibility: row.reversibility,
      mechanismSummary: row.mechanism_summary,
      keyInsight: row.key_insight ?? undefined,
      createdType: (row.created_type ?? "ai_generated") as "ai_generated" | "user_created",
      aiOverview: row.ai_overview ?? undefined,
      userTheoryText: row.user_theory_text ?? undefined,
      combinedTiers: row.combined_tiers ?? undefined,
      actionSteps: row.action_steps ?? undefined,
      interventions: row.interventions ?? [],
      tags: row.tags ?? [],
      createdAt: row.created_at ?? undefined,
    }));

    return NextResponse.json(blocks);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch theories" },
      { status: 500 }
    );
  }
}
