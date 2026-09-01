interface SparklineProps {
  values: number[]
  color: string
  fill: string
}

// Ports spark() (unified-grid-v2.html ~line 6092) — hand-rolled SVG, no
// charting library needed for a single filled line.
export function Sparkline({ values, color, fill }: SparklineProps) {
  if (values.length < 2) return null
  const w = 300
  const h = 42
  const mx = Math.max(...values)
  const mn = Math.min(...values)
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 2 - ((v - mn) / (mx - mn || 1)) * (h - 8),
  ])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]!.toFixed(1)} ${p[1]!.toFixed(1)}`).join(' ')

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={fill} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  )
}
