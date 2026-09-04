import { useEffect, useRef, useState } from 'react'
import type { WatchlistEntry, WatchlistListName, WatchlistPriority } from '../../types/domain'
import type { WatchlistEntryCreateBody, WatchlistEntryUpdateBody } from '../../types/requests'
import { useCreateWatchlistEntry, useUpdateWatchlistEntry } from '../../hooks/useWatchlistActions'
import { ConfirmDialog } from './ConfirmDialog'
import { PRI_LABEL } from './WatchlistQueue'

interface FormState {
  list_name: WatchlistListName
  plate: string
  subject_ref: string
  priority: WatchlistPriority
  notes: string
}

const EMPTY_FORM: FormState = {
  list_name: 'stolen_vehicles',
  plate: '',
  subject_ref: '',
  priority: 'critical',
  notes: '',
}

function entryToForm(e: WatchlistEntry): FormState {
  return {
    list_name: e.list_name,
    plate: e.plate_display ?? '',
    subject_ref: e.subject_ref ?? '',
    priority: e.priority,
    notes: typeof e.details?.notes === 'string' ? e.details.notes : '',
  }
}

function validate(form: FormState): string | null {
  if (form.list_name === 'wanted_persons') {
    if (!form.subject_ref.trim()) return 'Subject is required for wanted-person entries.'
  } else if (!form.plate.trim()) {
    return 'Plate is required for this list type.'
  }
  return null
}

function FormFields({ form, onChange }: { form: FormState; onChange: (patch: Partial<FormState>) => void }) {
  return (
    <>
      <div className="wlfieldrow">
        <div className="wlfield">
          <label>
            List<span className="req">*</span>
          </label>
          <select value={form.list_name} onChange={(e) => onChange({ list_name: e.target.value as WatchlistListName })}>
            <option value="stolen_vehicles">Stolen vehicle</option>
            <option value="wanted_persons">Wanted person</option>
            <option value="blacklist">Blacklist</option>
            <option value="suspect">Suspect</option>
          </select>
        </div>
        <div className="wlfield">
          <label>
            Priority<span className="req">*</span>
          </label>
          <div className="wlsegbtns">
            {(['critical', 'high', 'medium'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`wlsegbtn ${p === 'critical' ? 'crit' : p === 'high' ? 'high' : 'med'}`}
                aria-pressed={form.priority === p}
                onClick={() => onChange({ priority: p })}
              >
                {PRI_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="wlfieldrow">
        <div className="wlfield">
          <label>Plate</label>
          <input
            type="text"
            className="mono"
            value={form.plate}
            onChange={(e) => onChange({ plate: e.target.value })}
            placeholder="GJ 01 AB 1234"
          />
          <div className="hint">For vehicle-based entries (stolen, blacklist, suspect vehicle).</div>
        </div>
        <div className="wlfield">
          <label>Subject</label>
          <input
            type="text"
            value={form.subject_ref}
            onChange={(e) => onChange({ subject_ref: e.target.value })}
            placeholder="Name, DOB, or case reference"
          />
          <div className="hint">For person-based entries (wanted persons). Fill either this or plate.</div>
        </div>
      </div>
      <div className="wlfield">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Case number, issuing authority, reason for listing…"
        />
        <div className="hint">Stored in the entry's details field.</div>
      </div>
    </>
  )
}

function WatchlistCreateForm({ onCreated, onCancel }: { onCreated: (id: number) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const create = useCreateWatchlistEntry()

  function handleChange(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }))
    setValidationError(null)
  }

  function handleSaveClick() {
    const err = validate(form)
    if (err) {
      setValidationError(err)
      return
    }
    setConfirming(true)
  }

  function handleConfirm() {
    const body: WatchlistEntryCreateBody = {
      list_name: form.list_name,
      priority: form.priority,
      plate: form.plate.trim() || null,
      subject_ref: form.subject_ref.trim() || null,
      details: form.notes.trim() ? { notes: form.notes.trim() } : null,
    }
    create.mutate(body, {
      onSuccess: (created) => {
        setConfirming(false)
        onCreated(created.id)
      },
    })
  }

  const who = form.plate.trim() || form.subject_ref.trim() || 'this entry'

  return (
    <div className="detail">
      <div className="dhead">
        <div>
          <div className="p" style={{ fontSize: 15 }}>
            New watchlist entry
          </div>
          <div className="sub">Not saved yet</div>
        </div>
      </div>
      <div className="wlbody">
        <FormFields form={form} onChange={handleChange} />
        {validationError && <div className="wlfield err">{validationError}</div>}
      </div>
      <div className="wlfoot">
        <span className={`meta${create.isError ? ' err' : ''}`}>
          {create.isError ? create.error.message : 'POST /api/watchlist'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSaveClick}>
            Add entry
          </button>
        </div>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Add watchlist entry?"
          message={
            <>
              <b>{who}</b> will be added and start matching against live detections immediately.
            </>
          }
          confirmLabel="Add entry"
          pending={create.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

function buildDiff(original: WatchlistEntry, form: FormState): WatchlistEntryUpdateBody {
  const diff: WatchlistEntryUpdateBody = {}
  if (form.list_name !== original.list_name) diff.list_name = form.list_name
  if (form.priority !== original.priority) diff.priority = form.priority

  const plate = form.plate.trim() || null
  if (plate !== (original.plate_display ?? null)) diff.plate = plate

  const subject = form.subject_ref.trim() || null
  if (subject !== (original.subject_ref ?? null)) diff.subject_ref = subject

  const notes = form.notes.trim() || null
  const originalNotes = typeof original.details?.notes === 'string' ? original.details.notes : null
  if (notes !== originalNotes) diff.details = notes ? { notes } : null

  return diff
}

function WatchlistEditForm({ entry }: { entry: WatchlistEntry }) {
  const [form, setForm] = useState<FormState>(() => entryToForm(entry))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const savedTimeoutRef = useRef<number | null>(null)
  const update = useUpdateWatchlistEntry(entry.id)
  const toggleActive = useUpdateWatchlistEntry(entry.id)

  useEffect(() => {
    setForm(entryToForm(entry))
    setValidationError(null)
    setConfirming(false)
    setJustSaved(false)
    if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current)
    // Only reset when the selected entry actually changes, not on every
    // refetch of the same entry (e.g. after the active-toggle mutation),
    // which would blow away in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  function handleChange(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }))
    setValidationError(null)
  }

  const diff = buildDiff(entry, form)
  const isDirty = Object.keys(diff).length > 0

  function handleSaveClick() {
    const err = validate(form)
    if (err) {
      setValidationError(err)
      return
    }
    setConfirming(true)
  }

  function handleConfirm() {
    update.mutate(diff, {
      onSuccess: () => {
        setConfirming(false)
        setJustSaved(true)
        savedTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 1600)
      },
    })
  }

  const who = entry.plate_display ?? entry.subject_ref ?? 'this entry'

  return (
    <div className="detail">
      <div className="dhead">
        <div>
          <div className="p" style={{ fontSize: 15 }}>
            {entry.plate_display ?? entry.subject_ref}
          </div>
          <div className="sub">
            {entry.source_system === 'manual' ? 'Added manually' : `Synced from ${entry.source_system}`} ·{' '}
            <b>{new Date(entry.created_at).toLocaleDateString('en-GB')}</b>
          </div>
        </div>
        <button
          className={`toggleactive${entry.active ? '' : ' off'}`}
          onClick={() => toggleActive.mutate({ active: !entry.active })}
          disabled={toggleActive.isPending}
        >
          <span className="dot" /> {entry.active ? 'Active' : 'Inactive'}
        </button>
      </div>
      <div className="wlbody">
        <FormFields form={form} onChange={handleChange} />
        {validationError && <div className="wlfield err">{validationError}</div>}
      </div>
      <div className="wlfoot">
        <span className={`meta${update.isError ? ' err' : justSaved ? ' ok' : ''}`}>
          {update.isError ? update.error.message : justSaved ? 'Changes saved ✓' : `PATCH /api/watchlist/${entry.id}`}
        </span>
        <button className="btn primary" onClick={handleSaveClick} disabled={!isDirty}>
          Save changes
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Save changes?"
          message={
            <>
              This updates the live entry for <b>{who}</b> — changes apply to matching immediately.
            </>
          }
          confirmLabel="Save changes"
          pending={update.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

type WatchlistFormProps =
  | { mode: 'create'; onCreated: (id: number) => void; onCancel: () => void }
  | { mode: 'edit'; entry: WatchlistEntry }

export function WatchlistForm(props: WatchlistFormProps) {
  if (props.mode === 'create') {
    return <WatchlistCreateForm onCreated={props.onCreated} onCancel={props.onCancel} />
  }
  return <WatchlistEditForm entry={props.entry} />
}
