// verdict is free text from the backend ("accepted" | "accepted, long
// unobserved gap") — no separate verdict/verdict_label pair like API.md's
// aspirational example, confirmed against live data.
export function verdictClass(verdict: string): string {
  if (!verdict.startsWith('accepted')) return 'verdict no'
  return verdict.includes('gap') ? 'verdict gap' : 'verdict ok'
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
