import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"

interface AlertCardProps {
  text: string
  severity: "low" | "medium" | "high"
}

const config = {
  low: {
    border: "border-risk-low/30",
    bg: "bg-risk-low/5",
    iconBg: "bg-risk-low/10",
    iconColor: "text-risk-low",
    Icon: CheckCircle2,
    title: "Looking Good",
  },
  medium: {
    border: "border-risk-medium/30",
    bg: "bg-risk-medium/5",
    iconBg: "bg-risk-medium/10",
    iconColor: "text-risk-medium",
    Icon: AlertCircle,
    title: "Moderate Risk Alert",
  },
  high: {
    border: "border-risk-high/30",
    bg: "bg-risk-high/5",
    iconBg: "bg-risk-high/10",
    iconColor: "text-risk-high",
    Icon: AlertTriangle,
    title: "Risk Threshold Alert",
  },
}

export function AlertCard({ text, severity }: AlertCardProps) {
  const c = config[severity]
  const Icon = c.Icon

  return (
    <Card className={`${c.border} ${c.bg}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}>
          <Icon className={`h-4 w-4 ${c.iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{c.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}
