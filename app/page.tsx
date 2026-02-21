import { TopNav } from "@/components/top-nav"
import { RiskGauge } from "@/components/risk-gauge"
import { ProjectionChart } from "@/components/projection-chart"
import { AlertCard } from "@/components/alert-card"
import { ContributingFactors } from "@/components/contributing-factors"
import { ExplanationCard } from "@/components/explanation-card"
import { ActionPlan } from "@/components/action-plan"
import { WhatIfSimulator } from "@/components/what-if-simulator"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Burnout Radar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personalized risk analysis and action recommendations.
          </p>
        </div>

        {/* Main 2-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT column: Status */}
          <div className="flex flex-col gap-6">
            <RiskGauge value={72} />
            <ProjectionChart />
            <AlertCard />
          </div>

          {/* RIGHT column: Why + Actions */}
          <div className="flex flex-col gap-6">
            <ContributingFactors />
            <ExplanationCard />
            <ActionPlan />
          </div>
        </div>

        {/* BOTTOM full-width: What-if Simulator */}
        <div className="mt-6">
          <WhatIfSimulator />
        </div>
      </main>
    </div>
  )
}
