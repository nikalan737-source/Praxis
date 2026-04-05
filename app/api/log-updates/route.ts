import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get("logId");
    if (!logId) return NextResponse.json({ updates: [] });

    const { data, error } = await supabase
      .from("log_updates")
      .select("*")
      .eq("log_id", logId)
      .order("date", { ascending: true });

    if (error) return NextResponse.json({ updates: [] });

    return NextResponse.json({
      updates: (data ?? []).map((row) => ({
        id: row.id,
        logId: row.log_id,
        date: row.date,
        notes: row.notes ?? "",
        adherencePercent: row.adherence_percent ?? null,
        outcomeRating: row.outcome_rating ?? null,
        sideEffects: row.side_effects ?? "",
        createdAt: row.created_at,
      })),
    });
  } catch {
    return NextResponse.json({ updates: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { logId, date, notes, adherencePercent, outcomeRating, sideEffects } = await request.json();
    if (!logId) return NextResponse.json({ error: "Missing logId" }, { status: 400 });

    const { data, error } = await supabase
      .from("log_updates")
      .insert({
        log_id: logId,
        user_id: user.id,
        date: date || new Date().toISOString().slice(0, 10),
        notes: notes ?? "",
        adherence_percent: adherencePercent ?? null,
        outcome_rating: outcomeRating ?? null,
        side_effects: sideEffects ?? "",
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Failed to add update" }, { status: 500 });

    return NextResponse.json({
      id: data.id,
      logId: data.log_id,
      date: data.date,
      notes: data.notes ?? "",
      adherencePercent: data.adherence_percent ?? null,
      outcomeRating: data.outcome_rating ?? null,
      sideEffects: data.side_effects ?? "",
      createdAt: data.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Failed to add update" }, { status: 500 });
  }
}
