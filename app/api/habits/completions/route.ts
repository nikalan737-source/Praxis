import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/habits/completions?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns all completions for the user across all habits in the date range
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("habit_completions")
      .select("id, habit_id, completed_date, note")
      .eq("user_id", user.id)
      .order("completed_date", { ascending: false });

    if (from) query = query.gte("completed_date", from);
    if (to) query = query.lte("completed_date", to);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((c) => ({
        id: c.id,
        habitId: c.habit_id,
        completedDate: c.completed_date,
        note: c.note ?? undefined,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch completions" }, { status: 500 });
  }
}
