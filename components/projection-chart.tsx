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
  hero?: boolean
}

export function ProjectionChart({ data, hero = false }: ProjectionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(0)
  const chartHeight = hero ? 300 : 220

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
    <Card className="glass-subtle rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
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
      <CardContent className="pb-4">
        <div ref={containerRef} className="w-full" style={{ height: chartHeight }}>
          {chartWidth > 0 && (
            <AreaChart
              width={chartWidth}
              height={chartHeight}
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175,70%,42%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(175,70%,42%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="forecastLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(175,70%,42%)" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="hsl(175,70%,42%)" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(175,70%,42%)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(215,20%,16%)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(215,14%,52%)" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215,14%,52%)" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(215,25%,10%)",
                  border: "1px solid hsl(215,20%,16%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210,20%,92%)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <ReferenceLine
                y={70}
                stroke="hsl(0,72%,55%)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "High risk",
                  position: "right",
                  fill: "hsl(0,72%,55%)",
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
                stroke="url(#forecastLine)"
                strokeWidth={2.5}
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
