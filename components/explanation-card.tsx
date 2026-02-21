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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Plain-English Explanation
          </CardTitle>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs font-normal text-muted-foreground"
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
