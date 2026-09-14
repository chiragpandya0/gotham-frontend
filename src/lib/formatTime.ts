// Formats a raw ISO timestamp the same way the backend's own `_str` fields do
// (clock time in IST) — used where the backend stopped sending a pre-formatted
// string (e.g. alerts' raised_at) and the frontend has to match that convention itself.
//
// Some endpoints (e.g. alert audit trail entries per API.md) send `at` as a
// bare "HH:MM:SS" already, with no date component — `new Date()` can't parse
// that and returns Invalid Date. Detect that up front and pass it through
// unchanged rather than reformatting a value that's already in this shape.
export function formatClockTime(iso: string): string {
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(iso)) return iso
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
}

// Same, with the date prefixed — for lists (e.g. raw detection reads) that can
// span more than a single day, where a time-only string is ambiguous.
export function formatClockDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
  return `${date} ${time}`
}
