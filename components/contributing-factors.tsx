"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const factors = [
  { name: "Sleep", value: 0.82, color: "hsl(var(--risk-high))" },
  { name: "Deadlines", value: 0.75, color: "hsl(var(--risk-high))" },
  { name: "Stress", value: 0.68, color: "hsl(var(--risk-medium))" },
  { name: "Workload", value: 0.55, color: "hsl(var(--risk-medium))" },
  { name: "Sentiment", value: 0.32, color: "hsl(var(--risk-low))" },
]

export function ContributingFactors() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Contributing Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {factors.map((factor) => (
            <div key={factor.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{factor.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {factor.value.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${factor.value * 100}%`,
                    backgroundColor: factor.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
