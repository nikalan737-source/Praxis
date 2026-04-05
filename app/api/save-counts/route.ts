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
    const { data, error } = await supabase
      .from("theory_saves")
      .select("theory_id")
      .in("theory_id", theoryIds);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch counts" },
        { status: 500 }
      );
    }

    const counts: Record<string, number> = {};
    for (const id of theoryIds) {
      counts[id] = 0;
    }
    for (const row of data ?? []) {
      counts[row.theory_id] = (counts[row.theory_id] ?? 0) + 1;
    }

    return NextResponse.json(counts);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
