import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ theoryIds: [] });
    }

    const { data, error } = await supabase
      .from("theory_upvotes")
      .select("theory_id")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ theoryIds: [] });
    }

    const theoryIds = (data ?? []).map((r) => r.theory_id);
    return NextResponse.json({ theoryIds });
  } catch {
    return NextResponse.json({ theoryIds: [] });
  }
}
