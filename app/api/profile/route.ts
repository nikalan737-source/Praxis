import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_pro, theory_generations_this_month, generation_month, stripe_subscription_status, pro_expires_at")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      // Profile might not exist yet — return defaults
      return NextResponse.json({
        is_pro: false,
        theory_generations_this_month: 0,
        generation_month: null,
        stripe_subscription_status: null,
        pro_expires_at: null,
      });
    }

    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
