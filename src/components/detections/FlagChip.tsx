// Watchlist flag as a severity chip: stolen is red, wanted is amber, everything
// else on the watchlist (suspect, missing) is blue. No flag shows a dimmed dash.
export function FlagChip({ flag }: { flag?: string | null }) {
  if (!flag) return <span className="exact">—</span>
  const f = flag.toLowerCase()
  const tone = f.includes('stolen') ? 'pri crit' : f.includes('wanted') ? 'pri high' : 'pri med'
  return <span className={tone}>{flag}</span>
}
