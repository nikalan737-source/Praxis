import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_HEALTH_TAGS_MAX } from "@/lib/health-tags-limits";

export const dynamic = "force-dynamic";

const MAX_TAGS = 40;
const MAX_TAG_LEN = 120;

function normalizeHealthTags(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const s = String(item).trim().slice(0, MAX_TAG_LEN);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_pro, theory_generations_this_month, generation_month, stripe_subscription_status, pro_expires_at, health_tags, health_profile_onboarding_completed")
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
        health_tags: [] as string[],
        health_profile_onboarding_completed: true,
      });
    }

    return NextResponse.json({
      ...profile,
      health_tags: profile.health_tags ?? [],
      health_profile_onboarding_completed: profile.health_profile_onboarding_completed ?? true,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const patch = body as {
      health_tags?: unknown;
      complete_health_onboarding?: unknown;
    };

    const updates: Record<string, unknown> = {};

    if (patch.health_tags !== undefined) {
      const tags = normalizeHealthTags(patch.health_tags);
      if (tags === null) {
        return NextResponse.json({ error: "health_tags must be an array of strings" }, { status: 400 });
      }

      const { data: row } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      const isPro = row?.is_pro === true;
      if (!isPro && tags.length > FREE_HEALTH_TAGS_MAX) {
        return NextResponse.json(
          {
            error: "health_tag_limit",
            message: "Unlock unlimited health tags with Praxis Pro.",
            limit: FREE_HEALTH_TAGS_MAX,
          },
          { status: 403 }
        );
      }

      updates.health_tags = tags;
    }

    if (patch.complete_health_onboarding === true) {
      updates.health_profile_onboarding_completed = true;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("health_tags, health_profile_onboarding_completed")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({
      health_tags: updated?.health_tags ?? [],
      health_profile_onboarding_completed: updated?.health_profile_onboarding_completed ?? true,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
