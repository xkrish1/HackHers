import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export function AlertCard() {
  return (
    <Card className="border-risk-high/30 bg-risk-high/5">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-risk-high/10">
          <AlertTriangle className="h-4 w-4 text-risk-high" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Risk Threshold Alert
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Projected risk crosses 70% in 6 days. Consider taking preventive action.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
