"use client"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

function getRiskLevel(value: number) {
  if (value < 35) return { label: "Low", color: "text-risk-low" }
  if (value <= 70) return { label: "Medium", color: "text-risk-medium" }
  return { label: "High", color: "text-risk-high" }
}

function GaugeSVG({ value, size = 220 }: { value: number; size?: number }) {
  const risk = getRiskLevel(value)
  const startAngle = -225
  const endAngle = 45
  const totalAngle = endAngle - startAngle
  const currentAngle = startAngle + (value / 100) * totalAngle

  const cx = 100
  const cy = 100
  const r = 80

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const bgStart = polarToCartesian(startAngle)
  const bgEnd = polarToCartesian(endAngle)
  const bgLargeArc = totalAngle > 180 ? 1 : 0

  const valueEnd = polarToCartesian(currentAngle)
  const valueArc = currentAngle - startAngle
  const valueLargeArc = valueArc > 180 ? 1 : 0

  const strokeColor =
    value < 35
      ? "hsl(var(--risk-low))"
      : value <= 70
        ? "hsl(var(--risk-medium))"
        : "hsl(var(--risk-high))"

  const glowColor =
    value < 35
      ? "0 0 18px hsla(152,69%,46%,0.4)"
      : value <= 70
        ? "0 0 18px hsla(38,92%,55%,0.4)"
        : "0 0 18px hsla(0,72%,55%,0.4)"

  return (
    <svg
      viewBox="0 0 200 140"
      className="mx-auto w-full"
      style={{ maxWidth: size, filter: `drop-shadow(${glowColor})` }}
    >
      {/* Background arc */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${bgLargeArc} 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Value arc */}
      {value > 0 && (
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${valueLargeArc} 1 ${valueEnd.x} ${valueEnd.y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      {/* Tick marks */}
      {[0, 35, 70, 100].map((tick) => {
        const tickAngle = startAngle + (tick / 100) * totalAngle
        const inner = {
          x: cx + (r - 18) * Math.cos((tickAngle * Math.PI) / 180),
          y: cy + (r - 18) * Math.sin((tickAngle * Math.PI) / 180),
        }
        const outer = {
          x: cx + (r - 12) * Math.cos((tickAngle * Math.PI) / 180),
          y: cy + (r - 12) * Math.sin((tickAngle * Math.PI) / 180),
        }
        return (
          <line
            key={tick}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      {/* Center percentage */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-sans"
        fontSize="34"
        fontWeight="700"
      >
        {value}%
      </text>
      {/* Label */}
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
        fill={strokeColor}
      >
        {risk.label} Risk
      </text>
    </svg>
  )
}

interface RiskGaugeProps {
  value?: number
  compact?: boolean
}

export function RiskGauge({ value = 72, compact = false }: RiskGaugeProps) {
  if (compact) {
    return (
      <Card className="glass-subtle rounded-xl">
        <CardContent className="flex flex-col items-center p-4">
          <GaugeSVG value={value} size={180} />
          <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-risk-low" />
              <span>{"<35"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-risk-medium" />
              <span>{"35-70"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-risk-high" />
              <span>{">70"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-subtle rounded-xl">
      <CardContent className="flex flex-col items-center p-6">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Burnout Risk Score
        </p>
        <GaugeSVG value={value} />
        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-low" />
            <span>{"Low <35"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-medium" />
            <span>{"Med 35-70"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-high" />
            <span>{">70 High"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
