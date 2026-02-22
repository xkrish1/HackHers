import { NextRequest, NextResponse } from "next/server"
import { buildForecast } from "@/lib/backendModel"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const past_scores = Array.isArray(body.past_scores) ? body.past_scores : []
    const numeric = past_scores
      .map((value: unknown) => Number(value))
      .filter((value: number) => Number.isFinite(value))

    const forecast = buildForecast(numeric)
    return NextResponse.json({ forecast })
  } catch (error) {
    console.error("[api/forecast] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    )
  }
}
