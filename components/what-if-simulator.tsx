"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

interface WhatIfSimulatorProps {
  baselineRisk?: number
}

export function WhatIfSimulator({ baselineRisk = 72 }: WhatIfSimulatorProps) {
  const [sleepHours, setSleepHours] = useState([6])
  const [deadlines, setDeadlines] = useState([5])
  const [workHours, setWorkHours] = useState([50])

  const newRisk = useMemo(() => {
    const sleepEffect = (8 - sleepHours[0]) * 4
    const deadlineEffect = (deadlines[0] - 2) * 3
    const workEffect = (workHours[0] - 40) * 0.8
    const raw = 30 + sleepEffect + deadlineEffect + workEffect
    return Math.max(0, Math.min(100, Math.round(raw)))
  }, [sleepHours, deadlines, workHours])

  const delta = newRisk - baselineRisk
  const deltaSign = delta > 0 ? "+" : ""

  function getDeltaColor(d: number) {
    if (d < 0) return "text-risk-low"
    if (d > 0) return "text-risk-high"
    return "text-muted-foreground"
  }

  function getDeltaIcon(d: number) {
    if (d < 0) return <ArrowDown className="h-4 w-4" />
    if (d > 0) return <ArrowUp className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  function getRiskBg(value: number) {
    if (value < 35) return "bg-risk-low"
    if (value <= 70) return "bg-risk-medium"
    return "bg-risk-high"
  }

  function getRiskText(value: number) {
    if (value < 35) return "text-risk-low"
    if (value <= 70) return "text-risk-medium"
    return "text-risk-high"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          What-If Simulator
        </CardTitle>
        <CardDescription>
          Adjust the sliders to see how changes affect your projected risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          {/* Sliders */}
          <div className="flex flex-col gap-6">
            {/* Sleep */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Sleep Hours
                </label>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {sleepHours[0]}h
                </span>
              </div>
              <Slider
                value={sleepHours}
                onValueChange={setSleepHours}
                min={3}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3h</span>
                <span>10h</span>
              </div>
            </div>

            {/* Deadlines */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Deadlines (next 7 days)
                </label>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {deadlines[0]}
                </span>
              </div>
              <Slider
                value={deadlines}
                onValueChange={setDeadlines}
                min={0}
                max={10}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Work Hours */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Work Hours / Week
                </label>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {workHours[0]}h
                </span>
              </div>
              <Slider
                value={workHours}
                onValueChange={setWorkHours}
                min={20}
                max={80}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20h</span>
                <span>80h</span>
              </div>
            </div>
          </div>

          {/* Result display */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-accent/30 px-8 py-6 md:min-w-[180px]">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New Projected Risk
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-bold ${getRiskText(newRisk)}`}>
                {newRisk}%
              </span>
            </div>
            <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getRiskBg(newRisk)}`}
                style={{ width: `${newRisk}%` }}
              />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${getDeltaColor(delta)}`}
            >
              {getDeltaIcon(delta)}
              <span>
                {deltaSign}{delta}% from current
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
