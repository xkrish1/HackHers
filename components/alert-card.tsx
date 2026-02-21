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
    border: "border-risk-low/20",
    iconColor: "text-risk-low",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(152,69%,46%,0.15)]",
    Icon: CheckCircle2,
    title: "Looking Good",
  },
  medium: {
    border: "border-risk-medium/20",
    iconColor: "text-risk-medium",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(38,92%,55%,0.15)]",
    Icon: AlertCircle,
    title: "Moderate Risk Alert",
  },
  high: {
    border: "border-risk-high/20",
    iconColor: "text-risk-high",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(0,72%,55%,0.15)]",
    Icon: AlertTriangle,
    title: "Risk Threshold Alert",
  },
}

export function AlertCard({ text, severity }: AlertCardProps) {
  const c = config[severity]
  const Icon = c.Icon

  return (
    <Card className={`glass-subtle rounded-xl ${c.border} ${c.glowShadow}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass-highlight">
          <Icon className={`h-4 w-4 ${c.iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{c.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}
