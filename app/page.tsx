"use client"

import { useState } from "react"
import { TopNav } from "@/components/top-nav"
import { ScenarioSelector } from "@/components/scenario-selector"
import { RiskGauge } from "@/components/risk-gauge"
import { ProjectionChart } from "@/components/projection-chart"
import { AlertCard } from "@/components/alert-card"
import { ContributingFactors } from "@/components/contributing-factors"
import { ExplanationCard } from "@/components/explanation-card"
import { ActionPlan } from "@/components/action-plan"
import { WhatIfSimulator } from "@/components/what-if-simulator"

/* ------------------------------------------------------------------ */
/*  Mock data per scenario                                             */
/* ------------------------------------------------------------------ */

export type Scenario = "balanced" | "midterms" | "allnighter"

export interface Factor {
  name: string
  value: number
}

export interface ChartPoint {
  day: string
  forecast: number
  upper: number
  lower: number
}

export interface ScenarioData {
  risk: number
  factors: Factor[]
  alertText: string
  explanation: string
  chart: ChartPoint[]
}

function makeChart(base: number, slope: number): ChartPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const forecast = Math.min(100, Math.max(0, Math.round(base + slope * i)))
    return {
      day: `Day ${i + 1}`,
      forecast,
      upper: Math.min(100, forecast + 8 + i),
      lower: Math.max(0, forecast - 8 - i),
    }
  })
}

const SCENARIOS: Record<Scenario, ScenarioData> = {
  balanced: {
    risk: 28,
    factors: [
      { name: "Sleep", value: 0.18 },
      { name: "Deadlines", value: 0.25 },
      { name: "Stress", value: 0.22 },
      { name: "Workload", value: 0.30 },
      { name: "Sentiment", value: 0.15 },
    ],
    alertText:
      "Risk is well below the threshold. Keep up the good habits!",
    explanation:
      "You're averaging 7.8 hours of sleep and your deadline load is light this week. Stress and workload are both within healthy ranges. No immediate action needed -- just maintain the balance.",
    chart: makeChart(24, 0.5),
  },
  midterms: {
    risk: 72,
    factors: [
      { name: "Sleep", value: 0.82 },
      { name: "Deadlines", value: 0.75 },
      { name: "Stress", value: 0.68 },
      { name: "Workload", value: 0.55 },
      { name: "Sentiment", value: 0.32 },
    ],
    alertText:
      "Projected risk crosses 70% in 6 days. Consider taking preventive action.",
    explanation:
      "Your sleep dropped 2.1 hours below your baseline this week and upcoming deadlines have doubled compared to last week. These two factors are the primary drivers of the projected spike. Stress levels have also remained elevated, further compounding the risk.",
    chart: makeChart(48, 2.3),
  },
  allnighter: {
    risk: 91,
    factors: [
      { name: "Sleep", value: 0.96 },
      { name: "Deadlines", value: 0.88 },
      { name: "Stress", value: 0.90 },
      { name: "Workload", value: 0.85 },
      { name: "Sentiment", value: 0.78 },
    ],
    alertText:
      "Risk is critically high and rising. Immediate intervention recommended.",
    explanation:
      "You've had less than 3 hours of sleep for two consecutive nights, with 6 deadlines stacking in the next 4 days. Every contributing factor is in the red zone. Prioritize sleep tonight -- even 5 hours will meaningfully reduce projected risk by ~15%.",
    chart: makeChart(82, 1.1),
  },
}

export default function DashboardPage() {
  const [scenario, setScenario] = useState<Scenario>("midterms")
  const data = SCENARIOS[scenario]

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Burnout Radar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personalized risk analysis and action recommendations.
          </p>
        </div>

        {/* Scenario selector */}
        <div className="mb-6">
          <ScenarioSelector value={scenario} onChange={setScenario} />
        </div>

        {/* Main 2-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT column: Status */}
          <div className="flex flex-col gap-6">
            <RiskGauge value={data.risk} />
            <ProjectionChart data={data.chart} />
            <AlertCard
              text={data.alertText}
              severity={data.risk > 70 ? "high" : data.risk >= 35 ? "medium" : "low"}
            />
          </div>

          {/* RIGHT column: Why + Actions */}
          <div className="flex flex-col gap-6">
            <ContributingFactors factors={data.factors} />
            <ExplanationCard text={data.explanation} />
            <ActionPlan />
          </div>
        </div>

        {/* BOTTOM full-width: What-if Simulator */}
        <div className="mt-6">
          <WhatIfSimulator baselineRisk={data.risk} />
        </div>
      </main>
    </div>
  )
}
