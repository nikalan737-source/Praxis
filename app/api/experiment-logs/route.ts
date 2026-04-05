import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    theoryId: row.theory_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    status: row.status ?? "in_progress",
    isPublic: row.is_public ?? false,
    adherencePercent: row.adherence_percent,
    followedInterventions: (row.followed_interventions as string[]) ?? [],
    skippedInterventions: (row.skipped_interventions as string[]) ?? [],
    outcomeRating: row.outcome_rating,
    notes: (row.notes as string) ?? "",
    sideEffects: (row.side_effects as string) ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      theoryId, startedAt, endedAt, status, isPublic,
      adherencePercent, followedInterventions, skippedInterventions,
      outcomeRating, notes, sideEffects,
    } = body;

    if (typeof theoryId !== "string" || !theoryId.trim()) {
      return NextResponse.json({ error: "Missing or invalid theoryId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("experiment_logs")
      .insert({
        theory_id: theoryId.trim(),
        user_id: user.id,
        started_at: startedAt || null,
        ended_at: endedAt || null,
        status: status ?? "in_progress",
        is_public: isPublic ?? false,
        adherence_percent: adherencePercent ?? null,
        followed_interventions: Array.isArray(followedInterventions) ? followedInterventions : [],
        skipped_interventions: Array.isArray(skippedInterventions) ? skippedInterventions : [],
        outcome_rating: outcomeRating ?? null,
        notes: notes ?? "",
        side_effects: sideEffects ?? "",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
    }

    return NextResponse.json(mapRow(data as Record<string, unknown>));
  } catch {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ logs: [] });
    }

    const { searchParams } = new URL(request.url);
    const theoryId = searchParams.get("theoryId");

    let query = supabase
      .from("experiment_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (theoryId) {
      query = query.eq("theory_id", theoryId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ logs: [] });

    return NextResponse.json({ logs: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)) });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
