import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/habits — list all habits for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((h) => ({
        id: h.id,
        userId: h.user_id,
        theoryId: h.theory_id ?? undefined,
        theoryTitle: h.theory_title ?? undefined,
        goalCategory: h.goal_category ?? undefined,
        evidenceTier: h.evidence_tier ?? undefined,
        actionText: h.action_text,
        frequency: h.frequency,
        scheduledDays: h.scheduled_days ?? [],
        isActive: h.is_active,
        notionId: h.notion_id ?? undefined,
        createdAt: h.created_at,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

// POST /api/habits — create a new habit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      theoryId,
      theoryTitle,
      goalCategory,
      evidenceTier,
      actionText,
      frequency,
      scheduledDays,
    } = body as {
      theoryId?: string;
      theoryTitle?: string;
      goalCategory?: string;
      evidenceTier?: string;
      actionText: string;
      frequency: string;
      scheduledDays: string[];
    };

    if (!actionText) {
      return NextResponse.json({ error: "actionText is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        theory_id: theoryId ?? null,
        theory_title: theoryTitle ?? null,
        goal_category: goalCategory ?? null,
        evidence_tier: evidenceTier ?? null,
        action_text: actionText,
        frequency: frequency ?? "daily",
        scheduled_days: scheduledDays ?? [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      userId: data.user_id,
      theoryId: data.theory_id ?? undefined,
      theoryTitle: data.theory_title ?? undefined,
      goalCategory: data.goal_category ?? undefined,
      evidenceTier: data.evidence_tier ?? undefined,
      actionText: data.action_text,
      frequency: data.frequency,
      scheduledDays: data.scheduled_days ?? [],
      isActive: data.is_active,
      createdAt: data.created_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
