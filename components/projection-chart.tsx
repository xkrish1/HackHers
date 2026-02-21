"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import { useEffect, useRef, useState } from "react"
import type { ChartPoint } from "@/app/page"

interface ProjectionChartProps {
  data: ChartPoint[]
}

export function ProjectionChart({ data }: ProjectionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setChartWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            14-Day Projection
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full bg-primary" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-primary/20" />
              <span>Confidence</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full" style={{ height: 220 }}>
          {chartWidth > 0 && (
            <AreaChart
              width={chartWidth}
              height={220}
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <ReferenceLine
                y={70}
                stroke="hsl(var(--risk-high))"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "High risk",
                  position: "right",
                  fill: "hsl(var(--risk-high))",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="band"
                stroke="none"
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="band"
                stroke="none"
                fill="url(#confidenceBand)"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="none"
                dot={false}
              />
            </AreaChart>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
