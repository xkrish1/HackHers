"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { DailyRecord, getRecords, seedIfEmpty, setRecords, resetRecords, subscribeRecords, saveCheckin } from "@/lib/localDb"
import { Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  RiskGaugeCard,
  ForecastCard,
  AlertCard,
  FactorsCard,
  ExplanationCard,
  ActionChecklistCard,
  WhatIfSimulatorCard,
} from "@/components/dashboard-cards"
import { CheckInCard } from "@/components/dashboard-cards"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { SCENARIOS } from "@/lib/mock-data"
import type { DashboardData, Scenario } from "@/lib/mock-data"

/* ------------------------------------------------------------------ */
/*  Scenario labels for the segmented control                          */
/* ------------------------------------------------------------------ */

const SCENARIO_OPTIONS: { value: Scenario; label: string }[] = [
  { value: "balanced", label: "Balanced Week" },
  { value: "midterms", label: "Midterms Week" },
  { value: "allnighter", label: "All-nighter Week" },
]

/* ------------------------------------------------------------------ */
/*  SWR fetcher — falls back to scenario mock data on any error        */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export default function DashboardPage() {
  const [scenario, setScenario] = useState<Scenario>("midterms")
  const [records, setRecordsState] = useState<DailyRecord[]>(() => getRecords())
  const [isInitializing, setIsInitializing] = useState(true)
  const { data: apiDashboard } = useSWR<DashboardData>(
    `/api/dashboard?scenario=${scenario}`,
    fetcher
  )

  // initialize user and seed if needed, then subscribe
  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      await seedIfEmpty()
      setRecordsState(getRecords())
      unsub = subscribeRecords((r) => setRecordsState(r))
      setIsInitializing(false)
    })()
    return () => {
      if (unsub) unsub()
    }
  }, [])

  // Compute dashboard data from local records (latest record drives values)
  function computeDashboard(recordsList: DailyRecord[]) {
    const last = recordsList.length > 0 ? recordsList[recordsList.length - 1] : null
    const riskPercent =
      last?.burnout_probability ??
      (typeof last?.risk_index_raw === "number"
        ? Math.round(last.risk_index_raw * 100)
        : apiDashboard?.riskPercent ?? SCENARIOS[scenario].riskPercent)
    const statusColor = riskPercent < 35 ? "low" : riskPercent <= 70 ? "medium" : "high"
    const factors = (last?.factors
      ? [
          { name: "Sleep", value: last.factors.sleep },
          { name: "Deadlines", value: last.factors.deadlines },
          { name: "Stress", value: last.factors.stress },
          { name: "Workload", value: last.factors.workload },
          { name: "Sentiment", value: last.factors.sentiment },
        ]
      : apiDashboard?.factors ?? SCENARIOS[scenario].factors)

    // Forecast: simple trend extrapolation based on last N risk_index_raw values
    const past = recordsList
      .map((r) => (typeof r.risk_index_raw === "number" ? r.risk_index_raw * 100 : null))
      .filter((v): v is number => v !== null)
    const forecast = apiDashboard?.forecast ?? SCENARIOS[scenario].forecast

    const alertText =
      (past.length > 0
        ? (riskPercent > 70 ? "Risk is elevated — consider immediate actions." : "Risk is within acceptable range.")
        : apiDashboard?.alertText) ?? SCENARIOS[scenario].alertText
    const explanation = last?.explanation ?? apiDashboard?.explanation ?? SCENARIOS[scenario].explanation
    const actions = apiDashboard?.actions ?? SCENARIOS[scenario].actions

    return {
      riskPercent,
      statusColor: statusColor as "low" | "medium" | "high",
      factors,
      forecast,
      forecastBand: forecast,
      alertText,
      explanation,
      actions,
    }
  }

  const dashboard = computeDashboard(records)
  const isUsingFallback = false

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
              <span className="text-sm font-bold text-primary">E</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Equilibria
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground"
            >
              <Shield className="h-3 w-3" />
              <span>Privacy: data stays local (demo)</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* ── Scenario segmented control ────────────────────────── */}
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Scenarios
          </span>
          <div className="flex gap-1 rounded-lg bg-secondary/60 p-1">
            {SCENARIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScenario(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  scenario === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Fallback indicator (dev-visible only when API fails) */}
        {isUsingFallback && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-risk-medium/20 bg-risk-medium/5 px-3 py-2 text-xs text-risk-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-risk-medium" />
            Using local fallback data. API endpoint unavailable.
          </div>
        )}

        {isInitializing ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Row 1: Forecast chart + Risk gauge side by side */}
            <section className="mb-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <ForecastCard data={dashboard.forecast} hero />
                <div className="flex flex-col gap-6">
                  <RiskGaugeCard value={dashboard.riskPercent} />
                  <AlertCard
                    text={dashboard.alertText}
                    severity={dashboard.statusColor}
                  />
                </div>
              </div>
            </section>

            {/* Row 2: Risk Factors + Explanation + Action Plan */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Risk Factors & Insights
              </h2>
              <div className="grid gap-6 lg:grid-cols-4">
                <FactorsCard factors={dashboard.factors} />
                <ExplanationCard text={dashboard.explanation} />
                <ActionChecklistCard actions={dashboard.actions} />
                <CheckInCard />
              </div>
            </section>

            {/* Row 3: Full-width What-If Simulator */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                What-If Simulator
              </h2>
              <WhatIfSimulatorCard baselineRisk={dashboard.riskPercent} />
            </section>

          </>
        )}
      </main>
    </div>
  )
}
