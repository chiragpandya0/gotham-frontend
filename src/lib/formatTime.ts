// Formats a raw ISO timestamp the same way the backend's own `_str` fields do
// (clock time in IST) — used where the backend stopped sending a pre-formatted
// string (e.g. alerts' raised_at) and the frontend has to match that convention itself.
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
}

// Same, with the date prefixed — for lists (e.g. raw detection reads) that can
// span more than a single day, where a time-only string is ambiguous.
export function formatClockDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
  return `${date} ${time}`
}
