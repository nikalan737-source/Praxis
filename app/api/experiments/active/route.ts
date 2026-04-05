import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/experiments/active — fetch active experiments with settings + latest journal entry + adherence
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch in-progress experiment logs (required table)
    const { data: logs, error: logErr } = await supabase
      .from("experiment_logs")
      .select("id, theory_id, started_at, status, created_at")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false });

    if (logErr) {
      console.error("experiment_logs query error:", logErr);
      return NextResponse.json([], { status: 200 });
    }
    if (!logs || logs.length === 0) return NextResponse.json([]);

    const experimentIds = logs.map((l) => l.id);

    // Fetch settings (optional — table may not exist if migration 010 not run)
    const { data: settings } = await supabase
      .from("experiment_settings")
      .select("experiment_id, primary_metric, expected_duration_days")
      .in("experiment_id", experimentIds);

    // Fetch latest journal entry date (optional)
    const { data: latestEntries } = await supabase
      .from("experiment_journal_entries")
      .select("experiment_id, entry_date")
      .in("experiment_id", experimentIds)
      .order("entry_date", { ascending: false });

    // Fetch theory titles
    const theoryIds = Array.from(new Set(logs.map((l) => l.theory_id)));
    const { data: theories } = await supabase
      .from("theory_blocks")
      .select("id, title")
      .in("id", theoryIds);

    // Fetch habit links (optional — table may not exist if migration 011 not run)
    const { data: habitLinks } = await supabase
      .from("experiment_habit_links")
      .select("experiment_id, habit_id")
      .in("experiment_id", experimentIds);

    // Fetch habit checkins (optional)
    const { data: habitCheckins } = await supabase
      .from("experiment_habit_checkins")
      .select("experiment_id, completed")
      .in("experiment_id", experimentIds);

    // Count journal entries per experiment (optional)
    const { data: entryCounts } = await supabase
      .from("experiment_journal_entries")
      .select("experiment_id")
      .in("experiment_id", experimentIds);

    const settingsMap = new Map(
      (settings ?? []).map((s) => [s.experiment_id, s])
    );
    const theoryMap = new Map(
      (theories ?? []).map((t) => [t.id, t.title])
    );

    // Get latest entry per experiment (first occurrence since sorted desc)
    const latestMap = new Map<string, string>();
    for (const entry of latestEntries ?? []) {
      if (!latestMap.has(entry.experiment_id)) {
        latestMap.set(entry.experiment_id, entry.entry_date);
      }
    }

    // Calculate adherence per experiment
    // adherence = completedCheckins / (entryCount × habitCount) × 100
    const habitCountMap = new Map<string, number>();
    for (const link of habitLinks ?? []) {
      habitCountMap.set(link.experiment_id, (habitCountMap.get(link.experiment_id) ?? 0) + 1);
    }

    const entryCountMap = new Map<string, number>();
    for (const entry of entryCounts ?? []) {
      entryCountMap.set(entry.experiment_id, (entryCountMap.get(entry.experiment_id) ?? 0) + 1);
    }

    const completedCheckinMap = new Map<string, number>();
    for (const checkin of habitCheckins ?? []) {
      if (checkin.completed) {
        completedCheckinMap.set(
          checkin.experiment_id,
          (completedCheckinMap.get(checkin.experiment_id) ?? 0) + 1
        );
      }
    }

    const result = logs.map((log) => {
      const s = settingsMap.get(log.id);
      const habitCount = habitCountMap.get(log.id) ?? 0;
      const entryCount = entryCountMap.get(log.id) ?? 0;
      const completedCount = completedCheckinMap.get(log.id) ?? 0;
      const total = habitCount * entryCount;
      const adherencePercent = total > 0 ? Math.round((completedCount / total) * 100) : null;

      return {
        experimentId: log.id,
        theoryId: log.theory_id,
        theoryTitle: theoryMap.get(log.theory_id) ?? "Unknown theory",
        startedAt: log.started_at,
        expectedDurationDays: s?.expected_duration_days ?? 30,
        primaryMetric: s?.primary_metric ?? "",
        lastCheckinDate: latestMap.get(log.id) ?? null,
        adherencePercent,
        linkedHabitCount: habitCount,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("active experiments error:", e);
    // Return empty array instead of 500 so the UI degrades gracefully
    return NextResponse.json([]);
  }
}
