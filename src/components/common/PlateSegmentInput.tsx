import { Fragment, useEffect, useMemo, useRef } from 'react'
import type { PlateQuery, PlateType } from '../../types/domain'

export type PlateSegmentValue = Omit<PlateQuery, 'plate_type'>

type SegGroup =
  | { type: 'literal'; len: number; literalValue: string }
  | {
      type: 'letter' | 'digit'
      key: keyof PlateSegmentValue
      label: string
      len: number
      // Cells before this index are required for the segment to count as
      // given; cells from here on are optional (e.g. a 1-3 letter series, a
      // 3-4 digit number) — mirrors the backend's SegmentQuery.is_complete().
      min: number
    }

interface PlateTypeConfig {
  hint: string
  groups: SegGroup[]
}

const CONFIGS: Record<PlateType, PlateTypeConfig> = {
  STANDARD_STATE: {
    hint: 'GJ-01-AB-1234',
    groups: [
      { type: 'letter', key: 'state_code', label: 'state', len: 2, min: 2 },
      { type: 'digit', key: 'rto_code', label: 'RTO', len: 2, min: 2 },
      { type: 'letter', key: 'series', label: 'series', len: 3, min: 0 },
      { type: 'digit', key: 'number', label: 'number', len: 4, min: 3 },
    ],
  },
  BH_SERIES: {
    hint: '22-BH-1234-AB',
    groups: [
      { type: 'digit', key: 'year_code', label: 'year', len: 2, min: 2 },
      { type: 'literal', len: 2, literalValue: 'BH' },
      { type: 'digit', key: 'number', label: 'number', len: 4, min: 4 },
      { type: 'letter', key: 'series', label: 'series', len: 2, min: 1 },
    ],
  },
}

interface FlatCell {
  type: 'letter' | 'digit'
  optional: boolean
}

interface PlateSegmentInputProps {
  plateType: PlateType
  /** Seeds the cells once on mount — this is otherwise an uncontrolled field. */
  initialValue?: PlateSegmentValue
  onChange: (value: PlateSegmentValue) => void
  /** Hides the format/completeness row and shrinks the cells for toolbar use. */
  compact?: boolean
}

function isDigitChar(ch: string): boolean {
  return /[0-9]/.test(ch)
}

function isLetterChar(ch: string): boolean {
  return /[a-zA-Z]/.test(ch)
}

// Same plate identity model detections/vehicles/trace/watchlist all share
// (app.detections.segment_search.SegmentQuery on the backend) — one
// character-cell field shaped like the plate itself instead of four separate
// labeled boxes.
export function PlateSegmentInput({ plateType, initialValue, onChange, compact }: PlateSegmentInputProps) {
  const cfg = CONFIGS[plateType]
  const hintSegs = useMemo(() => cfg.hint.split('-'), [cfg.hint])

  const flatCells = useMemo(() => {
    const arr: FlatCell[] = []
    cfg.groups.forEach((g) => {
      if (g.type === 'literal') return
      for (let i = 0; i < g.len; i++) arr.push({ type: g.type, optional: i >= g.min })
    })
    return arr
  }, [cfg.groups])

  const cellRefs = useRef<(HTMLInputElement | null)[]>([])
  const statusRef = useRef<HTMLDivElement>(null)

  // Reflects any seeded initialValue immediately (e.g. editing a watchlist
  // entry that already has a complete plate). Runs once per mount — this
  // component is remounted wholesale (via a `key` on plateType) whenever the
  // plate type changes, so a mount-only effect is enough.
  useEffect(() => {
    refreshStyles()
    updateStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function focusIndex(idx: number) {
    cellRefs.current[idx]?.focus()
  }

  function refreshStyles() {
    cellRefs.current.forEach((el) => el?.classList.toggle('filled', !!el.value))
  }

  function updateStatus() {
    if (!statusRef.current) return
    const missing: string[] = []
    let idx = 0
    cfg.groups.forEach((g) => {
      if (g.type === 'literal') return
      let filled = 0
      for (let i = 0; i < g.len; i++) {
        if (cellRefs.current[idx]?.value) filled++
        idx++
      }
      if (filled < g.min) missing.push(g.label)
    })
    const pill = statusRef.current.querySelector('.status-pill')
    const text = statusRef.current.querySelector('.status-text')
    if (!pill || !text) return
    if (missing.length === 0) {
      pill.classList.add('complete')
      text.textContent = 'Complete'
    } else {
      pill.classList.remove('complete')
      text.textContent = 'Needs ' + missing.join(', ')
    }
  }

  function emitChange() {
    const result: PlateSegmentValue = {}
    let idx = 0
    cfg.groups.forEach((g) => {
      if (g.type === 'literal') return
      let val = ''
      for (let i = 0; i < g.len; i++) {
        val += cellRefs.current[idx]?.value ?? ''
        idx++
      }
      if (val) result[g.key] = val
    })
    onChange(result)
    updateStatus()
  }

  // Places `ch` at the first cell from `startIdx` onward whose type accepts
  // it, skipping filled cells and empty *optional* cells whose type rejects
  // it (e.g. typing a digit straight through an unfilled letter series into
  // the number group) — without this, continuous typing dead-ends on any
  // optional cell whose type doesn't match the next character.
  function tryInsert(startIdx: number, ch: string): number {
    for (let i = startIdx; i < flatCells.length; i++) {
      const meta = flatCells[i]
      const el = cellRefs.current[i]
      if (!el || !meta) continue
      const digit = isDigitChar(ch)
      const accepts = (meta.type === 'digit' && digit) || (meta.type === 'letter' && !digit && isLetterChar(ch))
      if (accepts) {
        el.value = digit ? ch : ch.toUpperCase()
        return i + 1
      }
      if (el.value || !meta.optional) return i
    }
    return flatCells.length
  }

  function handleInput(idx: number, e: React.FormEvent<HTMLInputElement>) {
    const native = e.nativeEvent as InputEvent
    const raw = (native.data || e.currentTarget.value || '').slice(-1)
    e.currentTarget.value = ''
    if (raw) {
      const next = tryInsert(idx, raw)
      focusIndex(Math.min(next, flatCells.length - 1))
    }
    refreshStyles()
    emitChange()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !e.currentTarget.value && idx > 0) {
      const prev = cellRefs.current[idx - 1]
      if (prev) prev.value = ''
      focusIndex(idx - 1)
      refreshStyles()
      emitChange()
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusIndex(idx - 1)
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && idx < flatCells.length - 1) {
      focusIndex(idx + 1)
      e.preventDefault()
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.select()
  }

  function handlePaste(idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const chars = text.replace(/[^a-zA-Z0-9]/g, '').split('')
    let cursor = idx
    chars.forEach((ch) => {
      cursor = tryInsert(cursor, ch)
    })
    focusIndex(Math.min(cursor, flatCells.length - 1))
    refreshStyles()
    emitChange()
  }

  let flatIdx = 0

  return (
    <div className="plate-field" data-compact={compact ? '1' : undefined}>
      <div className="plate-cells">
        {cfg.groups.map((g, gi) => (
          <Fragment key={gi}>
            {gi > 0 && <span className="seg-dash">–</span>}
            <div className="seg-group">
              {Array.from({ length: g.len }, (_, i) => {
                if (g.type === 'literal') {
                  return (
                    <input
                      key={i}
                      className="cell literal"
                      disabled
                      readOnly
                      value={g.literalValue[i] ?? ''}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  )
                }
                const myIdx = flatIdx++
                const optional = i >= g.min
                const placeholderChar = (hintSegs[gi] || '')[i] || ''
                return (
                  <input
                    key={i}
                    ref={(el) => {
                      cellRefs.current[myIdx] = el
                    }}
                    className={optional ? 'cell optional' : 'cell'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={placeholderChar}
                    defaultValue={(initialValue?.[g.key] ?? '')[i] ?? ''}
                    onInput={(e) => handleInput(myIdx, e)}
                    onKeyDown={(e) => handleKeyDown(myIdx, e)}
                    onFocus={handleFocus}
                    onPaste={(e) => handlePaste(myIdx, e)}
                  />
                )
              })}
            </div>
          </Fragment>
        ))}
      </div>
      {!compact && (
        <div className="plate-hint" ref={statusRef}>
          <span className="status-pill">
            <span className="dot" />
            <span className="status-text">Incomplete</span>
          </span>
        </div>
      )}
    </div>
  )
}
