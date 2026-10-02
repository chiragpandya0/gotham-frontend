// A plate as plain dashed text (GJ-05-AB-1234). Segments the camera could not
// read arrive as "??" and are dimmed so they read as "unknown", not as data.
export function PlateText({ value }: { value: string }) {
  const parts = value.split('-')
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && '-'}
          {part.includes('?') ? <span className="plate-unk">{part}</span> : part}
        </span>
      ))}
    </>
  )
}
