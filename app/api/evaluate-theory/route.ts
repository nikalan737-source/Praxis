import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { EvaluateMultiResultSchema } from "@/lib/theory-block-schema";
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

// ── Step 3: AI evaluation prompt (multi-block by tier) ──────────────────────

function buildEvalPrompt(
  title: string, goal: string, theory: string,
  protocol: string, category: string,
  articles: PubMedArticle[]
): string {
  const articleContext = articles.length > 0
    ? `\n\nRELEVANT RESEARCH (use to evaluate — don't just summarize):\n` +
      articles.map((a) => `[PMID ${a.pmid}] "${a.title}" — ${a.authors} (${a.year}, ${a.source})`).join("\n")
    : "\n\nNo directly matching PubMed articles found. Evaluate using general scientific knowledge.";

  return `You are a scientific peer reviewer evaluating a user-submitted health theory. Your job is to analyze the ENTIRE theory thoroughly and SEGMENT IT into MANY separate theory blocks based on how well-supported each component is by evidence. You must cover EVERY part of the user's theory — do not skip or summarize away any section.

USER'S THEORY:
- Title: "${title}"
- Health goal: "${goal}"
- Category: "${category}"
- Their theory: "${theory}"
${protocol ? `- Their proposed protocol: "${protocol}"` : ""}
${articleContext}

IMPORTANT INSTRUCTIONS:

1. EXTRACT PROTOCOLS AUTOMATICALLY: The user's theory text likely contains specific supplements, dosages, lifestyle changes, timing, and protocols embedded within it. You MUST extract ALL of these and turn them into structured interventions. Do NOT ask for a separate protocol — pull everything actionable from the theory text itself. If the theory mentions "400mg magnesium glycinate before bed," that becomes an intervention.

2. SEGMENT BY EVIDENCE: Break the theory into MANY blocks. Each block should focus on a specific aspect, claim, or protocol cluster from the theory. A user's theory often contains parts that are well-supported AND parts that are speculative. Separate these into distinct blocks.

For example, if a theory says "take magnesium and drink moonwater for sleep" — the magnesium part might be "Strong" evidence tier, while moonwater would be "Unsupported". These should become TWO separate blocks.

3. Generate 6-10 blocks. Cover the ENTIRE theory — every claim, every supplement, every protocol mentioned. It is PERFECTLY FINE to have multiple blocks with the SAME evidence tier. If the theory is mostly unsupported, you might have 6 Unsupported blocks and 1 Emerging block — that's correct. Do NOT force variety in tiers if the evidence doesn't support it. Each block should focus on a different specific aspect/topic within the theory.

4. Each block should have MANY interventions/protocols (5-10 per block when applicable). Be thorough — users want comprehensive, actionable protocols. Include supplement dosages, timing, dietary changes, lifestyle modifications, etc. ALSO suggest additional protocols that the user didn't mention but that are supported by the research for their goal.

5. DO NOT COMPRESS OR SKIP CONTENT. If the user wrote a long, detailed theory, your output should be proportionally detailed. Every specific claim or mechanism they mention should appear in at least one block.

Return a JSON object (no markdown, no code fences):
{
  "blocks": [
    {
      "id": "user-eval-${Date.now()}-1",
      "title": "descriptive title for THIS aspect of the theory",
      "goalCategory": "${category}",
      "goalStatement": "one sentence goal specific to this aspect",
      "evidenceTier": "Strong|Emerging|Theoretical|Unsupported",
      "riskLevel": "Low|Moderate|High",
      "reversibility": "High|Medium|Low",
      "mechanismSummary": "2-3 sentences: explain the underlying biology for this specific aspect",
      "keyInsight": "the most important takeaway for this aspect",
      "aiOverview": "3-5 sentences: frank AI analysis for this aspect. Cite specific PMIDs. Be specific about what evidence supports or contradicts this.",
      "actionSteps": [
        "5-8 immediately actionable things — be VERY specific: exact dosages, timing, quantities, specific foods/supplements, and the mechanistic reason. Format: 'Concrete action — why it works'"
      ],
      "references": ["<pmid>"],
      "createdType": "user_created",
      "userTheoryText": "${theory.replace(/"/g, '\\"').slice(0, 200)}...",
      "interventions": [
        {
          "tier": "<same evidenceTier as block>",
          "name": "specific protocol name",
          "mechanism": "how it works biologically",
          "steps": ["step 1", "step 2", "step 3"],
          "durationDays": 30,
          "trackingMetrics": ["metric1", "metric2"],
          "expectedMagnitude": "Small|Medium|Large",
          "riskLevel": "Low|Moderate|High",
          "reversibility": "High|Medium|Low",
          "contraindications": ["if any"]
        }
      ],
      "tags": ["tag1", "tag2"],
      "traction": { "saves": 0, "experimentLogs": 0, "avgOutcome": 0 }
    }
  ]
}

Evidence tier assignment:
- Strong: core mechanism backed by multiple robust studies in the PubMed list
- Emerging: some supporting evidence but limited, preliminary, or indirect
- Theoretical: mechanistically plausible but little or no direct evidence
- Unsupported: contradicts established evidence or is purely speculative

Rules:
- Generate 6-10 blocks. Multiple blocks CAN share the same evidence tier — that is expected and correct
- Each block should have 5-10 interventions when the theory is comprehensive
- Each block should have 5-8 action steps
- Be honest — if parts are speculative, put them in their own Theoretical/Unsupported block
- aiOverview must cite specific PMIDs when relevant
- interventions should be thorough and comprehensive — include everything relevant
- Each intervention's tier should match its parent block's evidenceTier
- Cover EVERY part of the user's theory — do NOT skip sections or compress multiple topics into one block
- If the theory is very long, generate closer to 10 blocks to ensure full coverage`;
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

    // Step 3: Evaluate (multi-block)
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

    const first = EvaluateMultiResultSchema.safeParse(parsed);
    if (first.success) {
      const blocks = first.data.blocks.map((b) => ({
        ...b,
        userTheoryText: theory.trim(),
        createdType: "user_created" as const,
      }));
      return NextResponse.json({
        block: blocks[0], // backwards compat
        blocks,
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

    const repair = EvaluateMultiResultSchema.safeParse(repairParsed);
    if (repair.success) {
      const blocks = repair.data.blocks.map((b) => ({
        ...b,
        userTheoryText: theory.trim(),
        createdType: "user_created" as const,
      }));
      return NextResponse.json({
        block: blocks[0],
        blocks,
        articles,
        searchQuery: queries.join(" · "),
      });
    }

    return NextResponse.json({ error: "Could not evaluate theory. Please try again." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
