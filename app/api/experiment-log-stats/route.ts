import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const theoryIds = idsParam
      ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    if (theoryIds.length === 0) {
      return NextResponse.json({});
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_experiment_log_stats", {
      theory_ids: theoryIds,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    const stats: Record<
      string,
      { logCount: number; avgOutcome: number }
    > = {};
    for (const id of theoryIds) {
      stats[id] = { logCount: 0, avgOutcome: 0 };
    }
    for (const row of data ?? []) {
      stats[row.theory_id] = {
        logCount: Number(row.log_count) || 0,
        avgOutcome: Number(row.avg_outcome) || 0,
      };
    }

    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
