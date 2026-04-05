import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const theoryId = searchParams.get("theoryId");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    if (!theoryId) return NextResponse.json({ logs: [] });

    const { data: { user } } = await supabase.auth.getUser();

    const { data: logs, error } = await supabase
      .from("experiment_logs")
      .select("*, log_endorsements(user_id)")
      .eq("theory_id", theoryId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ logs: [] });

    const result = (logs ?? []).map((row) => {
      const endorsements = (row.log_endorsements as { user_id: string }[]) ?? [];
      return {
        id: row.id,
        theoryId: row.theory_id,
        startedAt: row.started_at,
        endedAt: row.ended_at ?? null,
        status: row.status,
        isPublic: row.is_public,
        adherencePercent: row.adherence_percent,
        followedInterventions: row.followed_interventions ?? [],
        skippedInterventions: row.skipped_interventions ?? [],
        outcomeRating: row.outcome_rating,
        notes: row.notes ?? "",
        sideEffects: row.side_effects ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        endorsementCount: endorsements.length,
        userEndorsed: user ? endorsements.some((e) => e.user_id === user.id) : false,
      };
    });

    return NextResponse.json({ logs: result });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
