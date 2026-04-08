import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/theories/[id]/visibility — toggle is_public for a theory the user owns
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const isPublic: boolean = body.isPublic;

    const { data, error } = await supabase
      .from("theory_blocks")
      .update({ is_public: isPublic })
      .eq("id", id)
      .eq("created_by", user.id) // only owner can change
      .select("id, is_public")
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    return NextResponse.json({ id: data.id, isPublic: data.is_public });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }
}
