"use client"

import type { Scenario } from "@/app/page"

const options: { value: Scenario; label: string }[] = [
  { value: "balanced", label: "Balanced Week" },
  { value: "midterms", label: "Midterms Week" },
  { value: "allnighter", label: "All-nighter Week" },
]

interface ScenarioSelectorProps {
  value: Scenario
  onChange: (scenario: Scenario) => void
}

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select scenario"
      className="inline-flex items-center rounded-lg border border-border bg-secondary/50 p-1"
    >
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
