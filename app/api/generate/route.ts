import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GenerateResultSchema } from "@/lib/theory-block-schema";
import type { PubMedArticle } from "@/types/theory-block";

const openai = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey });
};

// ── Step 1: Extract biological search queries from user goal ─────────────────

async function extractSearchQueries(goal: string): Promise<string[]> {
  try {
    const client = openai();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a research librarian specializing in biomedical science. Given a user's health goal, extract the core biological/physiological concepts and return 3-5 precise PubMed search queries that would find the most mechanistically relevant papers.

Rules:
- Use scientific/medical terminology (e.g. "melanogenesis UV radiation" not "getting a tan")
- Each query should target a different mechanistic angle
- Think about upstream biology, feedback loops, co-factors, and pathways
- Return ONLY a JSON array of strings: ["query1", "query2", "query3"]`,
        },
        {
          role: "user",
          content: `Health goal: ${goal}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    const content = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    // Handle both {queries: [...]} and direct array wrapped in object
    const arr = parsed.queries ?? parsed.searches ?? parsed.terms ?? Object.values(parsed)[0];
    if (Array.isArray(arr)) return arr.slice(0, 5).map(String);
    return [goal];
  } catch {
    return [goal];
  }
}

// ── Step 2: Search PubMed with multiple queries ───────────────────────────────

async function searchPubMedQuery(query: string): Promise<string[]> {
  try {
    const q = encodeURIComponent(query);
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=5&sort=relevance&retmode=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.esearchresult?.idlist ?? [];
  } catch {
    return [];
  }
}

async function fetchArticles(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];
  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data.result ?? {};
    return pmids.map((id) => {
      const doc = result[id];
      if (!doc?.title) return null;
      const authors = (doc.authors ?? []).slice(0, 3).map((a: { name: string }) => a.name).join(", ");
      return {
        pmid: id,
        title: doc.title.replace(/\.$/, ""),
        authors: authors || "Unknown",
        year: (doc.pubdate ?? "").split(" ")[0] || "n.d.",
        source: doc.source ?? "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      } satisfies PubMedArticle;
    }).filter((a): a is PubMedArticle => a !== null);
  } catch {
    return [];
  }
}

async function searchPubMed(queries: string[]): Promise<PubMedArticle[]> {
  // Run all queries in parallel
  const idArrays = await Promise.all(queries.map(searchPubMedQuery));
  // Deduplicate PMIDs
  const seen = new Set<string>();
  const allIds: string[] = [];
  for (const ids of idArrays) {
    for (const id of ids) {
      if (!seen.has(id)) { seen.add(id); allIds.push(id); }
    }
  }
  return fetchArticles(allIds.slice(0, 15));
}

// ── Step 3: Generate theory blocks with synthesis prompt ──────────────────────

function buildSystemPrompt(articles: PubMedArticle[], goal: string): string {
  const articleContext = articles.length > 0
    ? `\n\nRELEVANT RESEARCH (use these to reason from — don't just summarize them):\n` +
      articles.map((a) => `[PMID ${a.pmid}] "${a.title}" — ${a.authors} (${a.year}, ${a.source})`).join("\n")
    : "\n\nNo PubMed articles found. Reason from established physiology and biochemistry.";

  return `You are a research scientist and mechanistic thinker. Your job is NOT to summarize studies — it is to reason from biology, find non-obvious connections, and generate surprising but grounded insights.

USER GOAL: "${goal}"
${articleContext}

Generate TWELVE theory blocks — THREE per evidence tier — as a JSON object. Each block should:
1. Take a DIFFERENT mechanistic angle on the same goal (different biological pathway, cofactor, or upstream cause)
2. Within the same tier, each of the 3 theories MUST cover a genuinely distinct mechanism, intervention, or angle — no variations of the same approach
3. Draw its OWN conclusions by connecting dots across studies — find what's surprising, counterintuitive, or overlooked
4. Explain feedback loops, upstream causes, and second-order effects where relevant
5. Give a keyInsight that sounds like something a smart researcher would say at a conference — specific, non-obvious, actionable
6. NOT simply restate what a paper says — synthesize and reason beyond individual papers

Example of BAD keyInsight: "Studies show that X intervention improves Y outcome."
Example of GOOD keyInsight: "The body actively breaks down melanin in winter to absorb more vitamin D — meaning a tan is actually a signal of sufficient vitamin D status, and you can slow tan loss by keeping PTH low through calcium, magnesium, and boron."

Output ONLY this JSON (no markdown, no code fences):
{
  "blocks": [
    {
      "id": "generated-strong-1-<6char>",
      "title": "concise title max 60 chars",
      "goalCategory": "Cognitive|Metabolic|Mood|Physical|Recovery|Sleep",
      "goalStatement": "one sentence restatement of the goal",
      "evidenceTier": "Strong",
      "riskLevel": "Low|Moderate|High",
      "reversibility": "High|Medium|Low",
      "mechanismSummary": "2-3 sentences explaining the biological mechanism — focus on the pathway, feedback loop, or upstream cause that makes this work",
      "keyInsight": "ONE specific, surprising, mechanistic takeaway — the kind of insight that makes someone say 'I never thought of it that way'. Must reference a concrete biological process, compound, or feedback loop.",
      "actionSteps": [
        "3-5 immediately actionable things someone can do TODAY. Each must be specific: include quantities, timing, exact activities, and WHY it works mechanistically. Format: 'Concrete action — mechanistic reason'. Examples: 'Sprint at 100% effort for 30 seconds immediately after waking — triggers a growth hormone pulse lasting 20-30 minutes via pituitary response to lactate', 'Take 400mg magnesium glycinate before bed — lowers PTH overnight, reducing enzymatic melanin breakdown', 'Eat 100g of calf liver weekly — provides retinol and copper, both rate-limiting cofactors for melanin synthesis'"
      ],
      "references": ["<pmid>"],
      "interventions": [{
        "tier": "Strong",
        "name": "string",
        "mechanism": "string",
        "steps": ["string"],
        "durationDays": 14,
        "trackingMetrics": ["string"],
        "expectedMagnitude": "Small|Medium|Large",
        "riskLevel": "Low|Moderate|High",
        "reversibility": "High|Medium|Low",
        "contraindications": ["string"]
      }],
      "tags": ["string"],
      "traction": { "saves": 0, "experimentLogs": 0, "avgOutcome": 0 }
    },
    { ...same structure, "evidenceTier": "Strong", "id": "generated-strong-2-<6char>" — DIFFERENT mechanism },
    { ...same structure, "evidenceTier": "Strong", "id": "generated-strong-3-<6char>" — DIFFERENT mechanism },
    { ...3 blocks with "evidenceTier": "Emerging", each with DIFFERENT mechanisms },
    { ...3 blocks with "evidenceTier": "Theoretical", each with DIFFERENT mechanisms },
    { ...3 blocks with "evidenceTier": "Unsupported", each with DIFFERENT mechanisms, "references": [] }
  ]
}

Rules:
- Strong: well-established mechanism, cite the most relevant PMIDs, conservative interventions
- Emerging: promising but not fully proven, cite suggestive evidence, explain the theoretical bridge
- Theoretical: mechanistically plausible, minimal direct evidence, be explicit about the reasoning chain
- Unsupported: speculative/anecdotal, no references needed, clearly label the reasoning as speculative
- Each block MUST address a different angle/pathway — not variations of the same mechanism
- Within each tier, the 3 theories must explore genuinely different approaches (e.g. for Strong: one dietary, one exercise-based, one supplemental)
- Generate exactly 12 blocks total: 3 Strong, 3 Emerging, 3 Theoretical, 3 Unsupported
- keyInsight MUST be specific and mechanistic — never generic
- Only cite PMIDs that are genuinely mechanistically relevant to that block`;
}

async function callOpenAI(goal: string, articles: PubMedArticle[], repairErrors?: string): Promise<string> {
  const client = openai();
  const userMessage = repairErrors
    ? `Fix this JSON to match the schema. Errors:\n${repairErrors}\nReturn ONLY valid JSON.`
    : `Generate the 12-block theory analysis now (3 per evidence tier).`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(articles, goal) },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response");
  return content;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
    }

    const body = await request.json();
    const { goal } = body;
    if (typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'goal'" }, { status: 400 });
    }
    const goalNorm = goal.trim();

    // Step 1: Extract smart biological search queries
    const queries = await extractSearchQueries(goalNorm);

    // Step 2: Search PubMed with targeted queries (parallel)
    const articles = await searchPubMed(queries);

    // Step 3: Generate with synthesis-focused prompt
    let raw: string;
    try {
      raw = await callOpenAI(goalNorm, articles);
    } catch (e) {
      if ((e as Error).message === "OPENAI_API_KEY_MISSING") {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
      }
      return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return NextResponse.json({ error: "Invalid JSON from model." }, { status: 502 });
    }

    const first = GenerateResultSchema.safeParse(parsed);
    if (first.success) {
      return NextResponse.json({ blocks: first.data.blocks, articles, searchQuery: queries.join(" · ") });
    }

    // Repair pass
    const errors = first.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
    let repairRaw: string;
    try { repairRaw = await callOpenAI(goalNorm, articles, errors); } catch {
      return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
    }

    let repairParsed: unknown;
    try { repairParsed = JSON.parse(repairRaw); } catch {
      return NextResponse.json({ error: "Invalid JSON from model." }, { status: 502 });
    }

    const repair = GenerateResultSchema.safeParse(repairParsed);
    if (repair.success) {
      return NextResponse.json({ blocks: repair.data.blocks, articles, searchQuery: queries.join(" · ") });
    }

    return NextResponse.json({ error: "Generated output did not match schema. Please try again." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
