import { NextRequest, NextResponse } from "next/server"
import type { WhatIfRequest, WhatIfResponse } from "@/lib/mock-data"
import { computeWhatIf } from "@/lib/backendModel"

/**
 * POST /api/whatif
 *
 * Accepts: { sleep_hours, deadlines_next_7_days, work_hours }
 * Returns: { newRiskPercent, deltaPercent }
 *
 * Person A: Replace computeMockWhatIf with a real model call.
 * The request/response shapes are defined in lib/mock-data.ts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WhatIfRequest & {
      baselineRisk?: number
    }

    // Basic validation
    if (
      typeof body.sleep_hours !== "number" ||
      typeof body.deadlines_next_7_days !== "number" ||
      typeof body.work_hours !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields: sleep_hours, deadlines_next_7_days, work_hours" },
        { status: 400 }
      )
    }

    const baselineRisk = body.baselineRisk ?? 72
    const result: WhatIfResponse = computeWhatIf(body, baselineRisk)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/whatif] Error:", error)
    return NextResponse.json(
      { error: "Failed to compute what-if scenario" },
      { status: 500 }
    )
  }
}
