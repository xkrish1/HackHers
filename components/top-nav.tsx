import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">E</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Equilibria
          </span>
        </div>
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Shield className="h-3 w-3" />
          <span>Privacy: data stays local (demo)</span>
        </Badge>
      </div>
    </header>
  )
}
