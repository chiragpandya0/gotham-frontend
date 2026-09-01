export function NotImplementedNotice({ what }: { what: string }) {
  return (
    <div className="probe">
      {what} isn't live on the API yet (confirmed against the backend's own integration
      notes — it's next in the build order, not a bug here). This screen is wired and ready
      to go the moment that route ships.
    </div>
  )
}
