import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/experiment-habits?experimentId=xxx — get linked habits for an experiment
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const experimentId = new URL(request.url).searchParams.get("experimentId");
    if (!experimentId) return NextResponse.json({ error: "experimentId required" }, { status: 400 });

    const { data: links, error } = await supabase
      .from("experiment_habit_links")
      .select("id, habit_id, created_at")
      .eq("experiment_id", experimentId)
      .eq("user_id", user.id);

    if (error) throw error;
    if (!links || links.length === 0) return NextResponse.json([]);

    // Fetch habit details
    const habitIds = links.map((l) => l.habit_id);
    const { data: habits } = await supabase
      .from("habits")
      .select("id, action_text, frequency, scheduled_days, theory_title, goal_category")
      .in("id", habitIds);

    const habitMap = new Map(
      (habits ?? []).map((h) => [h.id, h])
    );

    const result = links.map((link) => {
      const h = habitMap.get(link.habit_id);
      return {
        linkId: link.id,
        habitId: link.habit_id,
        actionText: h?.action_text ?? "",
        frequency: h?.frequency ?? "daily",
        scheduledDays: h?.scheduled_days ?? [],
        theoryTitle: h?.theory_title ?? null,
        goalCategory: h?.goal_category ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch experiment habits" }, { status: 500 });
  }
}

// POST /api/experiment-habits — link habits to an experiment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { experimentId, habitIds } = body as {
      experimentId: string;
      habitIds: string[];
    };

    if (!experimentId || !Array.isArray(habitIds)) {
      return NextResponse.json({ error: "experimentId and habitIds required" }, { status: 400 });
    }

    const rows = habitIds.map((habitId) => ({
      user_id: user.id,
      experiment_id: experimentId,
      habit_id: habitId,
    }));

    const { error } = await supabase
      .from("experiment_habit_links")
      .upsert(rows, { onConflict: "experiment_id,habit_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to link habits" }, { status: 500 });
  }
}
