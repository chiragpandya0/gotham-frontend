// Lucide icons behind the same names the shell already imports, so call
// sites don't change. Sizes follow docs/ui-theme.md 2.12: 18px rail,
// 16px inline controls, 14px dense controls; stroke 1.5.
import { Activity, Bell, Building2, Cctv, Eye, KeyRound, Map, Route, ScanLine, Search, TriangleAlert } from 'lucide-react'

const STROKE = 1.5

export function IconSearch() {
  return <Search className="glass" size={14} strokeWidth={STROKE} />
}

export function IconBell() {
  return <Bell size={16} strokeWidth={STROKE} />
}

export function IconMap() {
  return <Map size={18} strokeWidth={STROKE} />
}

export function IconAlert() {
  return <TriangleAlert size={18} strokeWidth={STROKE} />
}

export function IconWatchlist() {
  return <Eye size={18} strokeWidth={STROKE} />
}

export function IconCam() {
  return <Cctv size={18} strokeWidth={STROKE} />
}

export function IconDet() {
  return <ScanLine size={18} strokeWidth={STROKE} />
}

export function IconTrace() {
  return <Route size={18} strokeWidth={STROKE} />
}

export function IconHealth() {
  return <Activity size={18} strokeWidth={STROKE} />
}

export function IconDept() {
  return <Building2 size={18} strokeWidth={STROKE} />
}

export function IconSso() {
  return <KeyRound size={16} strokeWidth={STROKE} />
}
