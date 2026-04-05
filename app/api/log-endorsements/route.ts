import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { logId } = await request.json();
    const { error } = await supabase
      .from("log_endorsements")
      .insert({ log_id: logId, user_id: user.id });

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

    const { logId } = await request.json();
    const { error } = await supabase
      .from("log_endorsements")
      .delete()
      .eq("log_id", logId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: "Failed to remove endorsement" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove endorsement" }, { status: 500 });
  }
}
