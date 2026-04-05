import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TheoryBlockSchema } from "@/lib/theory-block-schema";
import type { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to publish" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = TheoryBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid theory block" },
        { status: 400 }
      );
    }

    const block = parsed.data;

    const { data: inserted, error } = await supabase
      .from("theory_blocks")
      .insert({
        title: block.title,
        goal_category: block.goalCategory,
        goal_statement: block.goalStatement,
        evidence_tier: block.evidenceTier,
        risk_level: block.riskLevel,
        reversibility: block.reversibility,
        mechanism_summary: block.mechanismSummary,
        key_insight: block.keyInsight ?? null,
        created_type: block.createdType ?? "ai_generated",
        ai_overview: block.aiOverview ?? null,
        user_theory_text: block.userTheoryText ?? null,
        combined_tiers: block.combinedTiers ?? null,
        action_steps: block.actionSteps ?? null,
        interventions: block.interventions,
        tags: block.tags,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[api/publish] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to publish theory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...block,
      id: inserted.id,
      traction: { saves: 0, experimentLogs: 0, avgOutcome: 0 },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
