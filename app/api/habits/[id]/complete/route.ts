import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/habits/[id]/complete — mark a habit complete for a given date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    // Accept explicit date, fall back to today UTC
    const completedDate: string =
      body.date ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("habit_completions")
      .insert({
        habit_id: id,
        user_id: user.id,
        completed_date: completedDate,
        note: body.note ?? null,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation → already completed
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already completed for this date" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ id: data.id, habitId: data.habit_id, completedDate: data.completed_date });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to mark complete" }, { status: 500 });
  }
}

// DELETE /api/habits/[id]/complete — unmark completion for a given date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const completedDate = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", id)
      .eq("user_id", user.id)
      .eq("completed_date", completedDate);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to unmark completion" }, { status: 500 });
  }
}

// GET /api/habits/[id]/complete — fetch completions for a date range
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select("id, completed_date, note")
      .eq("habit_id", id)
      .eq("user_id", user.id)
      .order("completed_date", { ascending: false });

    if (from) query = query.gte("completed_date", from);
    if (to) query = query.lte("completed_date", to);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json((data ?? []).map((c) => ({
      id: c.id,
      completedDate: c.completed_date,
      note: c.note ?? undefined,
    })));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch completions" }, { status: 500 });
  }
}
