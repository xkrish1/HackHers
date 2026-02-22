import fs from "node:fs"
import path from "node:path"
import type {
  ActionItem,
  ChartPoint,
  DashboardData,
  WhatIfRequest,
  WhatIfResponse,
} from "@/lib/mock-data"

export type ScoreInput = {
  sleep_hours: number
  deadlines_next_7_days: number
  work_hours: number
  stress_self_report: number
  sentiment_score?: number
}

export type ScoreOutput = {
  risk_index_raw: number
  burnout_probability: number
  factors: {
    sleep: number
    deadlines: number
    stress: number
    workload: number
    sentiment: number
  }
  explanation: string
}

type CsvRecord = ScoreInput & {
  week_type?: string
  date: string
  journal_text?: string
  risk_index_raw?: number
  burnout_probability?: number
}

const DATA_PATH = path.join(process.cwd(), "backend", "burnout_data.csv")

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === "," && !inQuotes) {
      out.push(current)
      current = ""
      continue
    }
    current += char
  }
  out.push(current)
  return out.map((value) => value.trim())
}

export function loadCsvRecords(): CsvRecord[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return []
    const raw = fs.readFileSync(DATA_PATH, "utf8")
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) return []

    const headers = parseCsvLine(lines[0])
    return lines.slice(1).map((line) => {
      const cols = parseCsvLine(line)
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = cols[idx] ?? ""
      })

      return {
        week_type: row.week_type || undefined,
        date: row.date || new Date().toISOString().slice(0, 10),
        sleep_hours: Number(row.sleep_hours || 7),
        deadlines_next_7_days: Number(row.deadlines_next_7_days || 0),
        work_hours: Number(row.work_hours || 40),
        stress_self_report: Number(row.stress_self_report || 5),
        journal_text: row.journal_text || undefined,
        sentiment_score:
          row.sentiment_score === "" ? undefined : Number(row.sentiment_score),
        risk_index_raw:
          row.risk_index_raw === "" ? undefined : Number(row.risk_index_raw),
        burnout_probability:
          row.burnout_probability === ""
            ? undefined
            : Number(row.burnout_probability),
      }
    })
  } catch (error) {
    console.error("[backendModel] Failed to read CSV:", error)
    return []
  }
}

function computeFactors(input: ScoreInput) {
  const sleep = clamp((8 - input.sleep_hours) / 8, 0, 1)
  const deadlines = clamp(input.deadlines_next_7_days / 10, 0, 1)
  const stress = clamp(input.stress_self_report / 10, 0, 1)
  const workload = clamp((input.work_hours - 20) / 60, 0, 1)
  const sentiment = clamp((1 - (input.sentiment_score ?? 0)) / 2, 0, 1)

  return {
    sleep,
    deadlines,
    stress,
    workload,
    sentiment,
  }
}

function explanationFromFactors(factors: ScoreOutput["factors"]) {
  const ranked = Object.entries(factors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name)

  const names = ranked.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
  if (names.length < 2) {
    return "Risk is stable with no dominant burnout drivers."
  }
  return `${names[0]} and ${names[1]} are currently the strongest burnout drivers.`
}

export function scoreRisk(input: ScoreInput): ScoreOutput {
  const factors = computeFactors(input)
  const raw =
    0.25 * factors.sleep +
    0.25 * factors.deadlines +
    0.2 * factors.stress +
    0.2 * factors.workload +
    0.1 * factors.sentiment

  const risk_index_raw = clamp(raw, 0, 1)
  return {
    risk_index_raw,
    burnout_probability: Math.round(risk_index_raw * 100),
    factors,
    explanation: explanationFromFactors(factors),
  }
}

function statusColorFromRisk(risk: number): DashboardData["statusColor"] {
  if (risk < 35) return "low"
  if (risk <= 70) return "medium"
  return "high"
}

function alertTextFromRisk(risk: number) {
  if (risk < 35) return "Risk is low and stable. Keep your routine consistent."
  if (risk <= 70) return "Risk is moderate. Consider small preventive adjustments this week."
  return "Risk is high and trending up. Immediate preventive action is recommended."
}

function actionsForScenario(weekType: string | undefined, risk: number): ActionItem[] {
  if (weekType === "balanced") {
    return [
      {
        id: "bal-rank-impact",
        label:
          "Rank deadlines by impact → identify top 2 graded items this week → finish highest-weight one first",
      },
      {
        id: "bal-daily-deliverables",
        label:
          "Split assignments into daily deliverables (Day 1 outline, Day 2 research, Day 3 draft, Day 4 revise)",
      },
      {
        id: "bal-cap-hours",
        label: "Cap work at 10 hrs/day (target 6–8) and leave up to 2 buffer hours",
      },
      {
        id: "bal-sleep-floor",
        label: "Sleep floor: 6.5+ hrs (aim 7–8) and protect bedtime",
      },
    ]
  }

  if (weekType === "midterms") {
    return [
      {
        id: "mid-rank-impact",
        label:
          "Rank deadlines by impact (grade weight × due date) and drop/minimize the lowest-impact task",
      },
      {
        id: "mid-daily-deliverables",
        label:
          "Split major assignments into daily deliverables and break exam prep into practice problems, flashcards, mock exam, and weakness review",
      },
      {
        id: "mid-cap-hours",
        label:
          "Hard cap: 10 hrs/day max; if over 10, force stop and move extra review to next morning",
      },
      {
        id: "mid-sleep-floor",
        label: "Sleep floor: minimum 6.5 hrs, no all-nighters, protect memory consolidation",
      },
    ]
  }

  if (weekType === "allnighter") {
    return [
      {
        id: "all-rank-impact",
        label:
          "Rank deadlines by impact immediately, identify ONLY top 2, and de-prioritize everything else",
      },
      {
        id: "all-emergency-deliverables",
        label:
          "Split work into emergency deliverables: minimum viable submission (60% complete > 100% perfect)",
      },
      {
        id: "all-cap-hours",
        label:
          "Cap work strictly at 10 hrs (reduce to 8 if exhausted); no doubling work after 11pm",
      },
      {
        id: "all-sleep-reset",
        label: "Sleep reset tonight: minimum 6.5 hrs mandatory, even if work is incomplete",
      },
    ]
  }

  if (risk < 35) {
    return [
      { id: "maintain-sleep", label: "Maintain a consistent 7-8 hour sleep schedule" },
      { id: "protect-breaks", label: "Protect 2 short breaks during long work blocks" },
      { id: "weekly-checkin", label: "Do a quick weekly stress check-in" },
      { id: "exercise", label: "Keep at least 3 light activity sessions this week" },
    ]
  }

  if (risk <= 70) {
    return [
      { id: "reduce-load", label: "Defer or split one non-urgent task" },
      { id: "sleep-target", label: "Target at least 6.5 hours of sleep nightly" },
      { id: "focus-block", label: "Use 90-minute focus blocks with breaks" },
      { id: "support", label: "Check in with a mentor or teammate about workload" },
    ]
  }

  return [
    { id: "sleep-priority", label: "Prioritize sleep recovery tonight (5+ hours minimum)" },
    { id: "drop-task", label: "Drop or defer one low-priority commitment" },
    { id: "ask-help", label: "Request help on one high-effort task" },
    { id: "recovery-block", label: "Schedule a short recovery block in the next 24 hours" },
  ]
}

export function buildForecast(pastScores: number[], days = 14): ChartPoint[] {
  const normalized = pastScores
    .map((value) => (value > 1 ? value / 100 : value))
    .map((value) => clamp(value, 0, 1))

  const usable = normalized.length > 0 ? normalized : [0.5]
  const window = usable.slice(-7)
  const start = window[window.length - 1]
  const slope =
    window.length >= 2
      ? (window[window.length - 1] - window[0]) / (window.length - 1)
      : 0
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length
  const volatility =
    window.length > 1
      ? Math.sqrt(
          window.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
            (window.length - 1)
        )
      : 0.02

  let prev = start
  return Array.from({ length: days }, (_, i) => {
    const trend = slope * 0.45
    const meanReversion = (mean - prev) * 0.18
    const cycle = Math.sin((i + 1) / 2.4) * Math.max(0.006, volatility * 0.25)
    const shock = Math.max(-0.012, Math.min(0.012, trend + meanReversion + cycle))
    const nextRaw = clamp(prev + shock, 0.05, 0.97)
    prev = nextRaw

    const forecast = Math.round(nextRaw * 100)
    const spread = Math.round(Math.min(16, 6 + i * 0.55 + volatility * 100 * 0.08))
    return {
      day: `Day ${i + 1}`,
      forecast,
      upper: clamp(forecast + spread, 0, 100),
      lower: clamp(forecast - spread, 0, 100),
    }
  })
}

export function buildDashboardData(weekType?: string): DashboardData {
  const csvAll = loadCsvRecords()
  const csv = weekType
    ? csvAll.filter((row) => row.week_type?.toLowerCase() === weekType.toLowerCase())
    : csvAll
  const latest = csv[csv.length - 1]

  const baselineInput: ScoreInput = {
    sleep_hours: latest?.sleep_hours ?? 6.5,
    deadlines_next_7_days: latest?.deadlines_next_7_days ?? 4,
    work_hours: latest?.work_hours ?? 42,
    stress_self_report: latest?.stress_self_report ?? 5,
    sentiment_score: latest?.sentiment_score ?? 0,
  }

  const scored = scoreRisk(baselineInput)
  const riskPercent =
    typeof latest?.burnout_probability === "number"
      ? clamp(Math.round(latest.burnout_probability), 0, 100)
      : scored.burnout_probability

  const factors = [
    { name: "Sleep", value: scored.factors.sleep },
    { name: "Deadlines", value: scored.factors.deadlines },
    { name: "Stress", value: scored.factors.stress },
    { name: "Workload", value: scored.factors.workload },
    { name: "Sentiment", value: scored.factors.sentiment },
  ]

  const past = csv
    .map((row) => {
      if (typeof row.risk_index_raw === "number") return row.risk_index_raw
      if (typeof row.burnout_probability === "number") return row.burnout_probability / 100
      return null
    })
    .filter((value): value is number => typeof value === "number")

  const forecast = buildForecast(past.length > 0 ? past : [riskPercent / 100])

  return {
    riskPercent,
    statusColor: statusColorFromRisk(riskPercent),
    factors,
    forecast,
    forecastBand: forecast,
    alertText: alertTextFromRisk(riskPercent),
    explanation: latest?.journal_text ? `${latest.journal_text} ${scored.explanation}` : scored.explanation,
    actions: actionsForScenario(weekType, riskPercent),
  }
}

export function computeWhatIf(
  req: WhatIfRequest,
  baselineRisk: number
): WhatIfResponse {
  const scored = scoreRisk({
    sleep_hours: req.sleep_hours,
    deadlines_next_7_days: req.deadlines_next_7_days,
    work_hours: req.work_hours,
    stress_self_report: 5,
    sentiment_score: 0,
  })

  return {
    newRiskPercent: scored.burnout_probability,
    deltaPercent: scored.burnout_probability - baselineRisk,
  }
}

const POSITIVE_WORDS = [
  "good",
  "calm",
  "focused",
  "better",
  "productive",
  "confident",
  "rested",
  "happy",
]

const NEGATIVE_WORDS = [
  "stressed",
  "anxious",
  "tired",
  "exhausted",
  "overwhelmed",
  "burned",
  "behind",
  "worried",
  "hate",
  "hating",
  "fucking",
  "fuck",
  "awful",
  "miserable",
  "hopeless",
  "depressed",
]

export function analyzeJournalText(text: string) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)

  let pos = 0
  let neg = 0
  for (const token of tokens) {
    if (POSITIVE_WORDS.includes(token)) pos += 1
    if (NEGATIVE_WORDS.includes(token)) neg += 1
  }

  const total = Math.max(1, pos + neg)
  const sentiment_score = clamp((pos - neg) / total, -1, 1)
  const tone =
    sentiment_score > 0.25
      ? "positive"
      : sentiment_score < -0.25
        ? "negative"
        : "mixed"

  return {
    sentiment_score,
    summary: `Journal tone appears ${tone}. Positive cues: ${pos}, negative cues: ${neg}.`,
  }
}
