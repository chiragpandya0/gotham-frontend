// Formats a raw ISO timestamp the same way the backend's own `_str` fields do
// (clock time in IST) — used where the backend stopped sending a pre-formatted
// string (e.g. alerts' raised_at) and the frontend has to match that convention itself.
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
}
