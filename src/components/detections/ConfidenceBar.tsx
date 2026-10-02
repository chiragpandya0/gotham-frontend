export function ConfidenceBar({ value, low }: { value: number; low?: boolean }) {
  return (
    <span className={low ? 'confbar low' : 'confbar'}>
      <u>
        <b style={{ width: `${Math.round(value * 100)}%` }} />
      </u>
      {value.toFixed(2)}
    </span>
  )
}
