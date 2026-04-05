import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { commentId } = await request.json();
    const { error } = await supabase
      .from("comment_endorsements")
      .insert({ comment_id: commentId, user_id: user.id });

    if (error) return NextResponse.json({ error: "Failed to endorse" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to endorse" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { commentId } = await request.json();
    const { error } = await supabase
      .from("comment_endorsements")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: "Failed to remove endorsement" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove endorsement" }, { status: 500 });
  }
}
