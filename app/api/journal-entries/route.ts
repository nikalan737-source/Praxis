import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/journal-entries?experimentId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const experimentId = new URL(request.url).searchParams.get("experimentId");
    if (!experimentId) return NextResponse.json({ error: "experimentId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("experiment_journal_entries")
      .select("*")
      .eq("experiment_id", experimentId)
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((e) => ({
        id: e.id,
        experimentId: e.experiment_id,
        entryDate: e.entry_date,
        rating: e.rating,
        notes: e.notes,
        sideEffects: e.side_effects ?? undefined,
        photoUrls: e.photo_urls ?? [],
        createdAt: e.created_at,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// POST /api/journal-entries
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { experimentId, entryDate, rating, notes, sideEffects, photoUrls } = body as {
      experimentId: string;
      entryDate?: string;
      rating: number;
      notes: string;
      sideEffects?: string;
      photoUrls?: string[];
    };

    if (!experimentId || !rating || !notes) {
      return NextResponse.json({ error: "experimentId, rating, and notes required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("experiment_journal_entries")
      .insert({
        user_id: user.id,
        experiment_id: experimentId,
        entry_date: entryDate ?? new Date().toISOString().slice(0, 10),
        rating,
        notes,
        side_effects: sideEffects ?? null,
        photo_urls: photoUrls ?? [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      experimentId: data.experiment_id,
      entryDate: data.entry_date,
      rating: data.rating,
      notes: data.notes,
      sideEffects: data.side_effects ?? undefined,
      photoUrls: data.photo_urls ?? [],
      createdAt: data.created_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
