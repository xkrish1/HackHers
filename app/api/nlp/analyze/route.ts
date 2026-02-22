import { NextRequest, NextResponse } from "next/server"
import { analyzeJournalText } from "@/lib/backendModel"
import { GoogleGenAI } from "@google/genai"

const RISK_KEYS = [
  "sleep_hours",
  "deadlines_next_7_days",
  "work_hours",
  "stress_self_report",
  "sentiment_score",
] as const

type RiskKey = (typeof RISK_KEYS)[number]

type RiskExtraction = Partial<
  Record<Exclude<RiskKey, "sentiment_score">, number> & {
    sentiment_score: number
  }
>

function parseGeminiJson(text: string): Record<string, unknown> {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function normalizeRiskExtraction(raw: Record<string, unknown>): RiskExtraction {
  const out: RiskExtraction = {}

  const sleep = toNumber(raw.sleep_hours)
  if (sleep !== undefined) out.sleep_hours = sleep

  const deadlines = toNumber(raw.deadlines_next_7_days)
  if (deadlines !== undefined && Number.isInteger(deadlines)) {
    out.deadlines_next_7_days = deadlines
  }

  const work = toNumber(raw.work_hours)
  if (work !== undefined) out.work_hours = work

  const stress = toNumber(raw.stress_self_report)
  if (stress !== undefined && Number.isInteger(stress) && stress >= 1 && stress <= 10) {
    out.stress_self_report = stress
  }

  const sentiment = toNumber(raw.sentiment_score)
  out.sentiment_score = Math.max(-1, Math.min(1, sentiment ?? 0))

  return out
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const journal_text = typeof body.journal_text === "string" ? body.journal_text : ""

    if (!journal_text.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid field: journal_text" },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash"

    if (geminiApiKey) {
      try {
        const prompt = `
Return ONLY valid JSON (no markdown, no extra text).
Keys must be a subset of: ${JSON.stringify(RISK_KEYS)}

Rules:
- sleep_hours (number), deadlines_next_7_days (int), work_hours (number), stress_self_report (int 1-10):
  Include ONLY if the journal explicitly states a numeric value. Otherwise OMIT the key.
  Do NOT guess or infer.
- sentiment_score (float in [-1, 1]):
  ALWAYS include. Compute from overall tone: -1 very negative, 0 neutral/mixed, +1 very positive.

Journal entry:
${journal_text}
`.trim()

        const client = new GoogleGenAI({ apiKey: geminiApiKey })
        const response = await client.models.generateContent({
          model: geminiModel,
          contents: prompt,
        })

        const parsed = parseGeminiJson(response.text ?? "")
        const extracted = normalizeRiskExtraction(parsed)

        return NextResponse.json({
          ...extracted,
          provider: "gemini",
        })
      } catch (error) {
        console.error("[api/nlp/analyze] Gemini error, falling back:", error)
      }
    }

    const fallback = analyzeJournalText(journal_text)
    return NextResponse.json({ ...fallback, provider: "local" })
  } catch (error) {
    console.error("[api/nlp/analyze] Error:", error)
    return NextResponse.json(
      { error: "Failed to analyze journal text" },
      { status: 500 }
    )
  }
}
