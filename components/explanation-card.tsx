import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface ExplanationCardProps {
  text: string
}

export function ExplanationCard({ text }: ExplanationCardProps) {
  return (
    <Card className="glass-subtle rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Plain-English Explanation
          </CardTitle>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-primary/10 text-[11px] font-normal text-primary ring-1 ring-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            Gemini-assisted
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
