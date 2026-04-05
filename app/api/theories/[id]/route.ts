import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("theory_blocks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      goalCategory: data.goal_category,
      goalStatement: data.goal_statement,
      evidenceTier: data.evidence_tier,
      riskLevel: data.risk_level,
      reversibility: data.reversibility,
      mechanismSummary: data.mechanism_summary,
      keyInsight: data.key_insight ?? undefined,
      createdType: (data.created_type ?? "ai_generated") as "ai_generated" | "user_created",
      aiOverview: data.ai_overview ?? undefined,
      userTheoryText: data.user_theory_text ?? undefined,
      combinedTiers: data.combined_tiers ?? undefined,
      actionSteps: data.action_steps ?? undefined,
      interventions: data.interventions ?? [],
      tags: data.tags ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch theory" },
      { status: 500 }
    );
  }
}
