"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/40 ${className ?? ""}`} />
}

export function DashboardSkeleton() {
  return (
    <>
      {/* Row 1: Chart + Gauge */}
      <section className="mb-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Chart skeleton */}
          <Card className="glass-subtle rounded-xl">
            <CardHeader className="pb-2">
              <Pulse className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Pulse className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
          {/* Gauge + Alert */}
          <div className="flex flex-col gap-6">
            <Card className="glass-subtle rounded-xl">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-5">
                <Pulse className="h-4 w-28" />
                <Pulse className="h-[160px] w-[200px] rounded-lg" />
                <div className="flex gap-4">
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-3 w-12" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-subtle rounded-xl">
              <CardContent className="flex items-start gap-3 p-4">
                <Pulse className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Pulse className="h-4 w-32" />
                  <Pulse className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Row 2: Factors + Explanation + Checklist */}
      <section className="mb-8">
        <Pulse className="mb-4 h-5 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass-subtle rounded-xl">
            <CardHeader>
              <Pulse className="h-4 w-36" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <Pulse className="h-3 w-16" />
                    <Pulse className="h-3 w-8" />
                  </div>
                  <Pulse className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-subtle rounded-xl">
            <CardHeader>
              <Pulse className="h-4 w-44" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-4 w-5/6" />
            </CardContent>
          </Card>
          <Card className="glass-subtle rounded-xl">
            <CardHeader>
              <Pulse className="h-4 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Pulse className="h-4 w-4 rounded" />
                  <Pulse className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Row 3: Simulator */}
      <section className="mb-8">
        <Pulse className="mb-4 h-5 w-36" />
        <Card className="glass-subtle rounded-xl">
          <CardContent className="pt-6">
            <div className="grid gap-8 md:grid-cols-[1fr_180px]">
              <div className="flex flex-col gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <Pulse className="h-3 w-24" />
                      <Pulse className="h-3 w-8" />
                    </div>
                    <Pulse className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
              <Pulse className="h-[140px] rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
