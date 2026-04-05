import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/experiment-habit-checkins?experimentId=xxx — get all checkins for an experiment
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const experimentId = new URL(request.url).searchParams.get("experimentId");
    if (!experimentId) return NextResponse.json({ error: "experimentId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("experiment_habit_checkins")
      .select("id, habit_id, journal_entry_id, completed")
      .eq("experiment_id", experimentId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((c) => ({
        id: c.id,
        habitId: c.habit_id,
        journalEntryId: c.journal_entry_id,
        completed: c.completed,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch checkins" }, { status: 500 });
  }
}

// POST /api/experiment-habit-checkins — save checkins for a journal entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { experimentId, journalEntryId, checkins } = body as {
      experimentId: string;
      journalEntryId: string;
      checkins: { habitId: string; completed: boolean }[];
    };

    if (!experimentId || !journalEntryId || !Array.isArray(checkins)) {
      return NextResponse.json({ error: "experimentId, journalEntryId, and checkins required" }, { status: 400 });
    }

    const rows = checkins.map((c) => ({
      user_id: user.id,
      experiment_id: experimentId,
      habit_id: c.habitId,
      journal_entry_id: journalEntryId,
      completed: c.completed,
    }));

    const { error } = await supabase
      .from("experiment_habit_checkins")
      .upsert(rows, { onConflict: "journal_entry_id,habit_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save checkins" }, { status: 500 });
  }
}
