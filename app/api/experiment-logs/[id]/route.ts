import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.startedAt !== undefined) updates.started_at = body.startedAt;
    if (body.endedAt !== undefined) updates.ended_at = body.endedAt;
    if (body.status !== undefined) updates.status = body.status;
    if (body.isPublic !== undefined) updates.is_public = body.isPublic;
    if (body.adherencePercent !== undefined) updates.adherence_percent = body.adherencePercent;
    if (body.followedInterventions !== undefined) updates.followed_interventions = body.followedInterventions;
    if (body.skippedInterventions !== undefined) updates.skipped_interventions = body.skippedInterventions;
    if (body.outcomeRating !== undefined) updates.outcome_rating = body.outcomeRating;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.sideEffects !== undefined) updates.side_effects = body.sideEffects;

    const { data, error } = await supabase
      .from("experiment_logs")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update log" }, { status: 500 });

    return NextResponse.json({
      id: data.id, theoryId: data.theory_id, startedAt: data.started_at,
      endedAt: data.ended_at ?? null, status: data.status, isPublic: data.is_public,
      adherencePercent: data.adherence_percent,
      followedInterventions: data.followed_interventions ?? [],
      skippedInterventions: data.skipped_interventions ?? [],
      outcomeRating: data.outcome_rating, notes: data.notes ?? "",
      sideEffects: data.side_effects ?? "", createdAt: data.created_at, updatedAt: data.updated_at,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update log" }, { status: 500 });
  }
}
