"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Factor } from "@/app/page"

function getBarColor(value: number) {
  if (value < 0.35) return "hsl(var(--risk-low))"
  if (value <= 0.7) return "hsl(var(--risk-medium))"
  return "hsl(var(--risk-high))"
}

interface ContributingFactorsProps {
  factors: Factor[]
}

export function ContributingFactors({ factors }: ContributingFactorsProps) {
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
                    backgroundColor: getBarColor(factor.value),
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
