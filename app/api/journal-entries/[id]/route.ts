import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/journal-entries/[id]
// Body: { isPublic?: boolean, rating?: number, notes?: string, sideEffects?: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      isPublic?: boolean;
      rating?: number;
      notes?: string;
      sideEffects?: string;
    };

    const updates: Record<string, unknown> = {};
    if (typeof body.isPublic === "boolean") updates.is_public = body.isPublic;
    if (typeof body.rating === "number") updates.rating = body.rating;
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (typeof body.sideEffects === "string") updates.side_effects = body.sideEffects;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("experiment_journal_entries")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: data.id,
      experimentId: data.experiment_id,
      entryDate: data.entry_date,
      rating: data.rating,
      notes: data.notes,
      sideEffects: data.side_effects ?? undefined,
      photoUrls: data.photo_urls ?? [],
      isPublic: data.is_public ?? true,
      createdAt: data.created_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE /api/journal-entries/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("experiment_journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
