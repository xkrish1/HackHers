import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export function ExplanationCard() {
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
        <p className="text-sm leading-relaxed text-foreground">
          Your sleep dropped <strong>2.1 hours</strong> below your baseline this week and
          upcoming deadlines have <strong>doubled</strong> compared to last week. These two
          factors are the primary drivers of the projected spike. Stress levels have also
          remained elevated, further compounding the risk. Consider addressing sleep first
          as it has the highest impact weight.
        </p>
      </CardContent>
    </Card>
  )
}
