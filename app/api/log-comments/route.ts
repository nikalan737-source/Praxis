import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get("logId");
    if (!logId) return NextResponse.json({ comments: [] });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("log_comments")
      .select("*, comment_endorsements(user_id)")
      .eq("log_id", logId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ comments: [] });

    const comments = (data ?? []).map((row) => {
      const endorsements = (row.comment_endorsements as { user_id: string }[]) ?? [];
      return {
        id: row.id,
        logId: row.log_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
        endorsementCount: endorsements.length,
        userEndorsed: user ? endorsements.some((e) => e.user_id === user.id) : false,
      };
    });

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { logId, content } = await request.json();
    if (!logId || !content?.trim()) {
      return NextResponse.json({ error: "Missing logId or content" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("log_comments")
      .insert({ log_id: logId, user_id: user.id, content: content.trim() })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });

    return NextResponse.json({
      id: data.id, logId: data.log_id, userId: data.user_id,
      content: data.content, createdAt: data.created_at,
      endorsementCount: 0, userEndorsed: false,
    });
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
