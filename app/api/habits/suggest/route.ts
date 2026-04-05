import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/habits/suggest — AI suggests a frequency + day schedule for an action step
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionText, goalCategory, evidenceTier } = body as {
      actionText: string;
      goalCategory?: string;
      evidenceTier?: string;
    };

    if (!actionText) {
      return NextResponse.json({ error: "actionText is required" }, { status: 400 });
    }

    const prompt = `You are a health protocol scheduler. Given an action step from a health theory, suggest an optimal weekly schedule.

Action step: "${actionText}"
${goalCategory ? `Goal category: ${goalCategory}` : ""}
${evidenceTier ? `Evidence tier: ${evidenceTier}` : ""}

Respond with a JSON object only, no markdown, no explanation. Format:
{
  "frequency": "daily" | "weekly" | "custom",
  "scheduledDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "rationale": "one sentence explaining why this schedule"
}

Rules:
- "daily" means every day — scheduledDays should be all 7 days
- "weekly" means once per week — scheduledDays should have exactly 1 day
- "custom" means specific days — pick 2-5 days that make physiological sense
- Day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- For exercise/physical protocols, consider recovery days
- For supplementation/nutrition, consider daily or consistent scheduling
- Start the week on Monday`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";

    let parsed: {
      frequency?: string;
      scheduledDays?: string[];
      rationale?: string;
    } = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: default to daily
      parsed = {
        frequency: "daily",
        scheduledDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        rationale: "Daily practice builds consistent habits.",
      };
    }

    const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const scheduledDays = (parsed.scheduledDays ?? []).filter((d) =>
      VALID_DAYS.includes(d)
    );

    return NextResponse.json({
      frequency: parsed.frequency ?? "daily",
      scheduledDays,
      rationale: parsed.rationale ?? "",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to suggest schedule" }, { status: 500 });
  }
}
