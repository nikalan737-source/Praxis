import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const theoryId = body?.theoryId;

    if (typeof theoryId !== "string" || !theoryId.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid theoryId" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("theory_upvotes")
      .select("id")
      .eq("theory_id", theoryId.trim())
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase
        .from("theory_upvotes")
        .delete()
        .eq("id", existing.id);
      return NextResponse.json({ upvoted: false });
    } else {
      await supabase.from("theory_upvotes").insert({
        theory_id: theoryId.trim(),
        user_id: user.id,
      });
      return NextResponse.json({ upvoted: true });
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to toggle upvote" },
      { status: 500 }
    );
  }
}
