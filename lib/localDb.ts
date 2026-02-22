export type DailyRecord = {
  date: string // YYYY-MM-DD
  sleep_hours: number
  deadlines_next_7_days: number
  work_hours: number
  stress_self_report: number
  journal_text?: string
  sentiment_score?: number // -1..1
  risk_index_raw?: number // 0..1
  burnout_probability?: number // 0..100
  factors?: { sleep: number; deadlines: number; stress: number; workload: number; sentiment: number }
  explanation?: string
}

const USER_KEY = "equilibria_user_id"
const RECORDS_KEY = "equilibria_records"

function uuidv4(): string {
  // RFC4122 version 4 compliant UUID using crypto
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    // set version bits
    buf[6] = (buf[6] & 0x0f) | 0x40
    // set variant bits
    buf[8] = (buf[8] & 0x3f) | 0x80
    const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("")
    return (
      hex.substr(0, 8) + "-" +
      hex.substr(8, 4) + "-" +
      hex.substr(12, 4) + "-" +
      hex.substr(16, 4) + "-" +
      hex.substr(20, 12)
    )
  }
  // fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getUserId(): string {
  if (typeof window === "undefined") return ""
  const existing = localStorage.getItem(USER_KEY)
  if (existing) return existing
  const id = uuidv4()
  try {
    localStorage.setItem(USER_KEY, id)
  } catch (e) {
    // ignore
  }
  return id
}

export function getRecords(): DailyRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DailyRecord[]
  } catch (e) {
    console.error("localDb.getRecords parse error", e)
    return []
  }
}

export function setRecords(records: DailyRecord[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
    // write a timestamp key to trigger storage events across tabs
    localStorage.setItem(`${RECORDS_KEY}_updated_at`, String(Date.now()))
    // also dispatch a custom event in the same tab
    window.dispatchEvent(new CustomEvent("equilibria:records-updated", { detail: { records } }))
  } catch (e) {
    console.error("localDb.setRecords error", e)
  }
}

export function appendRecord(record: DailyRecord): DailyRecord[] {
  const records = getRecords()
  const next = [...records, record]
  setRecords(next)
  return next
}

export function resetRecords(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(RECORDS_KEY)
    localStorage.removeItem(`${RECORDS_KEY}_updated_at`)
    // dispatch event
    window.dispatchEvent(new CustomEvent("equilibria:records-reset"))
  } catch (e) {
    console.error("localDb.resetRecords error", e)
  }
}

async function tryFetchJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  }
}

export async function seedIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return
  const current = getRecords()
  if (current && current.length > 0) return
  // Try to load /data/balanced.json from public
  const data = await tryFetchJson("/data/balanced.json")
  if (data && Array.isArray(data)) {
    setRecords(data as DailyRecord[])
    return
  }
  // else, leave empty (caller can fallback)
}

// Simple helper: subscribe to record updates (cross-tab via storage and same-tab via custom event)
export function subscribeRecords(cb: (records: DailyRecord[]) => void) {
  if (typeof window === "undefined") return () => {}
  const onCustom = (e: Event) => {
    const ev = e as CustomEvent
    if (ev.detail && Array.isArray(ev.detail.records)) {
      cb(ev.detail.records)
      return
    }
    cb(getRecords())
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === `${RECORDS_KEY}_updated_at`) {
      cb(getRecords())
    }
  }
  window.addEventListener("equilibria:records-updated", onCustom as EventListener)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener("equilibria:records-updated", onCustom as EventListener)
    window.removeEventListener("storage", onStorage)
  }
}

// saveCheckin: creates a DailyRecord and appends it. It will attempt to call
// /nlp/analyze, /score, and /forecast but has graceful fallbacks.
export async function saveCheckin(inputs: Partial<DailyRecord>): Promise<DailyRecord> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10)
  const base: DailyRecord = {
    date: dateStr,
    sleep_hours: inputs.sleep_hours ?? 7,
    deadlines_next_7_days: inputs.deadlines_next_7_days ?? 0,
    work_hours: inputs.work_hours ?? 40,
    stress_self_report: inputs.stress_self_report ?? 3,
    journal_text: inputs.journal_text,
  }

  // NLP analyze if there's journal text
  let sentiment_score: number | undefined = undefined
  if (base.journal_text && base.journal_text.trim().length > 0) {
    try {
      const res = await fetch("/api/nlp/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal_text: base.journal_text }),
      })
      if (res.ok) {
        const j = await res.json()
        if (typeof j.sentiment_score === "number") sentiment_score = j.sentiment_score
        if (!base.explanation && typeof j.summary === "string") base.explanation = j.summary
      }
    } catch (e) {
      // ignore — fallback later
    }
  }

  if (typeof sentiment_score !== "number") {
    sentiment_score = 0
  }
  base.sentiment_score = sentiment_score

  // Try calling score endpoint to get risk/factors
  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sleep_hours: base.sleep_hours,
        deadlines_next_7_days: base.deadlines_next_7_days,
        work_hours: base.work_hours,
        stress_self_report: base.stress_self_report,
        sentiment_score: base.sentiment_score,
      }),
    })
    if (res.ok) {
      const j = await res.json()
      if (typeof j.risk_index_raw === "number") base.risk_index_raw = j.risk_index_raw
      if (typeof j.burnout_probability === "number") base.burnout_probability = j.burnout_probability
      if (j.factors) base.factors = j.factors
      if (!base.explanation && typeof j.explanation === "string") base.explanation = j.explanation
    }
  } catch (e) {
    // ignore — fallback
  }

  // Fallback simple rule-based scoring if score endpoints didn't return values
  if (typeof base.risk_index_raw !== "number") {
    // compute simple raw risk 0..1
    const sleepScore = Math.max(0, Math.min(1, (8 - base.sleep_hours) / 8))
    const deadlinesScore = Math.max(0, Math.min(1, base.deadlines_next_7_days / 10))
    const workScore = Math.max(0, Math.min(1, (base.work_hours - 20) / 60))
    const stressScore = Math.max(0, Math.min(1, base.stress_self_report / 10))
    const sentimentScore = (1 - (base.sentiment_score ?? 0)) / 2 // map -1..1 -> 1..0
    const factors = {
      sleep: sleepScore,
      deadlines: deadlinesScore,
      stress: stressScore,
      workload: workScore,
      sentiment: sentimentScore,
    }
    base.factors = base.factors ?? factors
    // weighted raw
    const raw = 0.25 * factors.sleep + 0.25 * factors.deadlines + 0.2 * factors.stress + 0.2 * factors.workload + 0.1 * factors.sentiment
    base.risk_index_raw = Math.max(0, Math.min(1, raw))
    base.burnout_probability = Math.round((base.risk_index_raw ?? 0) * 100)
    if (!base.explanation) base.explanation = "Automated fallback scoring applied locally."
  }

  // Append to local DB
  appendRecord(base);

  // Try calling forecast endpoint asynchronously (best-effort)
  (async () => {
    try {
      const records = getRecords()
      const past = records
        .map((r) => (typeof r.risk_index_raw === "number" ? r.risk_index_raw : null))
        .filter((v): v is number => v !== null)
      await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ past_scores: past }),
      })
    } catch (e) {
      // ignore
    }
  })()

  return base
}

export default {
  getUserId,
  getRecords,
  setRecords,
  appendRecord,
  resetRecords,
  seedIfEmpty,
  subscribeRecords,
  saveCheckin,
}
