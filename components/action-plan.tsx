"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Info } from "lucide-react"

const defaultItems = [
  { id: "blocks", label: "Schedule focus blocks (2h deep work, then break)", checked: false },
  { id: "tasks", label: "Break large tasks into smaller deliverables", checked: false },
  { id: "workload", label: "Reduce workload by deferring or delegating 1-2 items", checked: false },
  { id: "advisor", label: "Talk to advisor / RA about current load", checked: false },
]

export function ActionPlan() {
  const [items, setItems] = useState(defaultItems)

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const completed = items.filter((i) => i.checked).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Action Plan
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            {completed}/{items.length} done
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              <span
                className={`text-sm leading-relaxed ${
                  item.checked
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Not medical advice. Consult a professional for clinical concerns.</span>
        </div>
      </CardFooter>
    </Card>
  )
}
