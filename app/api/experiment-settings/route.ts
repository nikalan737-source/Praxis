import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/experiment-settings?experimentId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const experimentId = new URL(request.url).searchParams.get("experimentId");
    if (!experimentId) return NextResponse.json({ error: "experimentId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("experiment_settings")
      .select("*")
      .eq("experiment_id", experimentId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return NextResponse.json(null);

    return NextResponse.json({
      id: data.id,
      experimentId: data.experiment_id,
      trackingTypes: data.tracking_types ?? [],
      checkinFrequency: data.checkin_frequency,
      trackingCategories: data.tracking_categories ?? [],
      primaryMetric: data.primary_metric ?? "",
      expectedDurationDays: data.expected_duration_days,
      createdAt: data.created_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST /api/experiment-settings — create settings + experiment log in one call
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      theoryId,
      startDate,
      expectedDurationDays,
      trackingTypes,
      trackingCategories,
      checkinFrequency,
      primaryMetric,
      followedInterventions,
    } = body as {
      theoryId: string;
      startDate: string;
      expectedDurationDays: number;
      trackingTypes: string[];
      trackingCategories: string[];
      checkinFrequency: string;
      primaryMetric: string;
      followedInterventions: string[];
    };

    // 1. Create the experiment_log entry
    const { data: log, error: logErr } = await supabase
      .from("experiment_logs")
      .insert({
        theory_id: theoryId,
        user_id: user.id,
        started_at: startDate,
        status: "in_progress",
        is_public: false,
        adherence_percent: 0,
        followed_interventions: followedInterventions ?? [],
        skipped_interventions: [],
        outcome_rating: null,
        notes: "",
        side_effects: "",
      })
      .select()
      .single();

    if (logErr) throw logErr;

    // 2. Create the experiment_settings entry (non-fatal — experiment still works without it)
    let settingsId: string | null = null;
    const { data: settings, error: settingsErr } = await supabase
      .from("experiment_settings")
      .insert({
        user_id: user.id,
        experiment_id: log.id,
        tracking_types: trackingTypes ?? [],
        tracking_categories: trackingCategories ?? [],
        checkin_frequency: checkinFrequency ?? "weekly",
        primary_metric: primaryMetric ?? "",
        expected_duration_days: expectedDurationDays ?? 30,
      })
      .select()
      .single();

    if (settingsErr) {
      console.error("Failed to create experiment settings (non-fatal):", settingsErr);
    } else {
      settingsId = settings.id;
    }

    return NextResponse.json({
      experimentId: log.id,
      settingsId,
      startDate: log.started_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 });
  }
}
