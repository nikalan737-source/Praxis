import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { EvaluateResultSchema } from "@/lib/theory-block-schema";
import type { PubMedArticle } from "@/types/theory-block";

const openai = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey });
};

// ── Step 1: Extract search queries from user theory ──────────────────────────

async function extractSearchQueries(title: string, theory: string, goal: string): Promise<string[]> {
  try {
    const client = openai();
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a research librarian. Given a user-submitted health theory, extract 3-5 precise PubMed search queries targeting the biological mechanisms involved. Use scientific terminology. Return ONLY a JSON object: {"queries": ["query1", "query2", "query3"]}`,
        },
        {
          role: "user",
          content: `Theory title: ${title}\nGoal: ${goal}\nTheory: ${theory}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const arr = parsed.queries ?? parsed.searches ?? Object.values(parsed)[0];
    if (Array.isArray(arr)) return arr.slice(0, 5).map(String);
    return [title, goal];
  } catch {
    return [title, goal];
  }
}

// ── Step 2: PubMed search ────────────────────────────────────────────────────

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
  const idArrays = await Promise.all(queries.map(searchPubMedQuery));
  const seen = new Set<string>();
  const allIds: string[] = [];
  for (const ids of idArrays) {
    for (const id of ids) {
      if (!seen.has(id)) { seen.add(id); allIds.push(id); }
    }
  }
  return fetchArticles(allIds.slice(0, 15));
}

// ── Step 3: AI evaluation prompt ─────────────────────────────────────────────

function buildEvalPrompt(
  title: string, goal: string, theory: string,
  protocol: string, category: string,
  articles: PubMedArticle[]
): string {
  const articleContext = articles.length > 0
    ? `\n\nRELEVANT RESEARCH (use to evaluate — don't just summarize):\n` +
      articles.map((a) => `[PMID ${a.pmid}] "${a.title}" — ${a.authors} (${a.year}, ${a.source})`).join("\n")
    : "\n\nNo directly matching PubMed articles found. Evaluate using general scientific knowledge.";

  return `You are a scientific peer reviewer evaluating a user-submitted health theory. Your job is to cross-reference it with available evidence and give an honest, useful analysis.

USER'S THEORY:
- Title: "${title}"
- Health goal: "${goal}"
- Category: "${category}"
- Their theory: "${theory}"
- Their proposed protocol: "${protocol || "Not specified"}"
${articleContext}

Evaluate this theory and return a single JSON object (no markdown, no code fences):
{
  "block": {
    "id": "user-${Date.now()}",
    "title": "${title}",
    "goalCategory": "${category}",
    "goalStatement": "one sentence restatement of their goal",
    "evidenceTier": "Strong|Emerging|Theoretical|Unsupported",
    "riskLevel": "Low|Moderate|High",
    "reversibility": "High|Medium|Low",
    "mechanismSummary": "2-3 sentences: explain the underlying biology honestly — what could be true and what is uncertain",
    "keyInsight": "the most important takeaway from your evaluation — what is the single most useful thing to know about this theory?",
    "aiOverview": "3-5 sentences: a frank AI analysis — what parts of the theory align with evidence, where it diverges, what the actual risks are, and what a scientist would say. Be specific about which PMIDs support or contradict claims. Avoid being dismissive — acknowledge genuine insight even in speculative theories.",
    "actionSteps": [
      "3-5 immediately actionable things someone can do TODAY to act on this theory. Be specific: quantities, timing, exact activities, and the mechanistic reason. Format each as 'Concrete action — why it works'. Examples: 'Take 400mg magnesium glycinate before bed — lowers PTH overnight, reducing melanin breakdown', 'Eat 100g calf liver weekly — provides copper and retinol, both cofactors for melanin synthesis'"
    ],
    "references": ["<pmid>"],
    "createdType": "user_created",
    "interventions": [{
      "tier": "<evidenceTier>",
      "name": "string — name the protocol clearly",
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
  }
}

Evidence tier assignment:
- Strong: core mechanism backed by multiple robust studies in the PubMed list
- Emerging: some supporting evidence but limited, preliminary, or indirect
- Theoretical: mechanistically plausible but little or no direct evidence
- Unsupported: contradicts established evidence or is purely speculative with no plausible mechanism

Rules:
- Be honest — if the theory is speculative, say Theoretical or Unsupported
- aiOverview must cite specific PMIDs when relevant (e.g. "PMID 12345 suggests...")
- If no PMIDs are relevant, say so explicitly in aiOverview
- keyInsight should be the single most actionable or surprising finding
- interventions should faithfully reflect the user's proposed protocol, structured safely`;
}

async function callOpenAI(
  title: string, goal: string, theory: string,
  protocol: string, category: string,
  articles: PubMedArticle[],
  repairErrors?: string
): Promise<string> {
  const client = openai();
  const systemPrompt = buildEvalPrompt(title, goal, theory, protocol, category, articles);
  const userMessage = repairErrors
    ? `Fix this JSON to match the schema. Errors:\n${repairErrors}\nReturn ONLY valid JSON.`
    : "Evaluate the theory and return your analysis as JSON now.";

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
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
    const { title, goal, theory, protocol, category } = body;

    if (!title?.trim() || !goal?.trim() || !theory?.trim()) {
      return NextResponse.json({ error: "Title, goal, and theory are required." }, { status: 400 });
    }

    const categoryNorm = category?.trim() || "Physical";

    // Step 1: Extract search queries
    const queries = await extractSearchQueries(title.trim(), theory.trim(), goal.trim());

    // Step 2: Search PubMed
    const articles = await searchPubMed(queries);

    // Step 3: Evaluate
    let raw: string;
    try {
      raw = await callOpenAI(title.trim(), goal.trim(), theory.trim(), protocol?.trim() ?? "", categoryNorm, articles);
    } catch (e) {
      if ((e as Error).message === "OPENAI_API_KEY_MISSING") {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
      }
      return NextResponse.json({ error: "Evaluation failed. Please try again." }, { status: 502 });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return NextResponse.json({ error: "Invalid JSON from model." }, { status: 502 });
    }

    const first = EvaluateResultSchema.safeParse(parsed);
    if (first.success) {
      return NextResponse.json({
        block: { ...first.data.block, userTheoryText: theory.trim(), createdType: "user_created" },
        articles,
        searchQuery: queries.join(" · "),
      });
    }

    // Repair pass
    const errors = first.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
    let repairRaw: string;
    try {
      repairRaw = await callOpenAI(title.trim(), goal.trim(), theory.trim(), protocol?.trim() ?? "", categoryNorm, articles, errors);
    } catch {
      return NextResponse.json({ error: "Evaluation failed. Please try again." }, { status: 502 });
    }

    let repairParsed: unknown;
    try { repairParsed = JSON.parse(repairRaw); } catch {
      return NextResponse.json({ error: "Invalid JSON from model." }, { status: 502 });
    }

    const repair = EvaluateResultSchema.safeParse(repairParsed);
    if (repair.success) {
      return NextResponse.json({
        block: { ...repair.data.block, userTheoryText: theory.trim(), createdType: "user_created" },
        articles,
        searchQuery: queries.join(" · "),
      });
    }

    return NextResponse.json({ error: "Could not evaluate theory. Please try again." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
