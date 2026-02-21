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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"

const data = [
  { day: "Day 1", forecast: 48, upper: 55, lower: 41 },
  { day: "Day 2", forecast: 50, upper: 58, lower: 42 },
  { day: "Day 3", forecast: 53, upper: 62, lower: 44 },
  { day: "Day 4", forecast: 56, upper: 66, lower: 46 },
  { day: "Day 5", forecast: 59, upper: 70, lower: 48 },
  { day: "Day 6", forecast: 62, upper: 74, lower: 50 },
  { day: "Day 7", forecast: 65, upper: 77, lower: 53 },
  { day: "Day 8", forecast: 67, upper: 80, lower: 54 },
  { day: "Day 9", forecast: 69, upper: 82, lower: 56 },
  { day: "Day 10", forecast: 72, upper: 85, lower: 59 },
  { day: "Day 11", forecast: 74, upper: 87, lower: 61 },
  { day: "Day 12", forecast: 76, upper: 89, lower: 63 },
  { day: "Day 13", forecast: 78, upper: 91, lower: 65 },
  { day: "Day 14", forecast: 80, upper: 93, lower: 67 },
]

export function ProjectionChart() {
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
        <div className="w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
