import { NextRequest, NextResponse } from "next/server"
import { scoreRisk } from "@/lib/backendModel"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sleep_hours = Number(body.sleep_hours)
    const deadlines_next_7_days = Number(body.deadlines_next_7_days)
    const work_hours = Number(body.work_hours)
    const stress_self_report = Number(body.stress_self_report)
    const sentiment_score =
      typeof body.sentiment_score === "number"
        ? body.sentiment_score
        : Number(body.sentiment_score ?? 0)

    if (
      !Number.isFinite(sleep_hours) ||
      !Number.isFinite(deadlines_next_7_days) ||
      !Number.isFinite(work_hours) ||
      !Number.isFinite(stress_self_report)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid fields: sleep_hours, deadlines_next_7_days, work_hours, stress_self_report",
        },
        { status: 400 }
      )
    }

    const result = scoreRisk({
      sleep_hours,
      deadlines_next_7_days,
      work_hours,
      stress_self_report,
      sentiment_score,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/score] Error:", error)
    return NextResponse.json({ error: "Failed to score record" }, { status: 500 })
  }
}
