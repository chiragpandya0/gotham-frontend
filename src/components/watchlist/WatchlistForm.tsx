import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import type { PlateQuery, PlateType, WatchlistEntry, WatchlistListName, WatchlistPriority } from '../../types/domain'
import type { WatchlistEntryCreateBody, WatchlistEntryUpdateBody } from '../../types/requests'
import { useCreateWatchlistEntry, useUpdateWatchlistEntry, useUploadWatchlistMedia } from '../../hooks/useWatchlistActions'
import { parseFormattedPlate } from '../../lib/plateQuery'
import { PlateSegmentInput } from '../common/PlateSegmentInput'
import { ConfirmDialog } from './ConfirmDialog'
import { PRI_LABEL } from './WatchlistQueue'

interface FormState {
  list_name: WatchlistListName
  plateType: PlateType
  stateCode: string
  rtoCode: string
  yearCode: string
  series: string
  number: string
  subject_ref: string
  priority: WatchlistPriority
  description: string
  notes: string
}

const EMPTY_FORM: FormState = {
  list_name: 'stolen_vehicles',
  plateType: 'STANDARD_STATE',
  stateCode: '',
  rtoCode: '',
  yearCode: '',
  series: '',
  number: '',
  subject_ref: '',
  priority: 'critical',
  description: '',
  notes: '',
}

// Seeds the create form from a plate handed off by another view (e.g. Trace's
// "Add to watchlist") — already segmented, unlike a WatchlistEntry's plain
// plate_display, so no parseFormattedPlate round-trip is needed here.
function plateQueryToForm(p: PlateQuery): FormState {
  return {
    ...EMPTY_FORM,
    plateType: p.plate_type,
    stateCode: p.state_code ?? '',
    rtoCode: p.rto_code ?? '',
    yearCode: p.year_code ?? '',
    series: p.series ?? '',
    number: p.number ?? '',
  }
}

function entryToForm(e: WatchlistEntry): FormState {
  const seg = e.plate_display ? parseFormattedPlate(e.plate_display, e.plate_type ?? 'STANDARD_STATE') : null
  return {
    list_name: e.list_name,
    plateType: seg?.plate_type ?? 'STANDARD_STATE',
    stateCode: seg?.state_code ?? '',
    rtoCode: seg?.rto_code ?? '',
    yearCode: seg?.year_code ?? '',
    series: seg?.series ?? '',
    number: seg?.number ?? '',
    subject_ref: e.subject_ref ?? '',
    priority: e.priority,
    description: typeof e.details?.description === 'string' ? e.details.description : '',
    notes: typeof e.details?.notes === 'string' ? e.details.notes : '',
  }
}

// The backend replaces `details` wholesale on PATCH (same field-level
// semantics as every other column) rather than merging it, so any save has
// to resend both sub-fields together or the untouched one gets wiped.
function detailsBody(form: FormState): Record<string, string> | null {
  const details: Record<string, string> = {}
  if (form.description.trim()) details.description = form.description.trim()
  if (form.notes.trim()) details.notes = form.notes.trim()
  return Object.keys(details).length > 0 ? details : null
}

// Kept in sync with the backend's MEDIA_CONTENT_TYPES (app/watchlist/media.py)
// — checked client-side too so a wrong file type is rejected before a
// pointless upload round-trip.
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function MediaUploadField({ entry }: { entry: WatchlistEntry }) {
  const upload = useUploadWatchlistMedia(entry.id)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function tryUpload(file: File | undefined | null) {
    if (!file) return
    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      setTypeError('Only JPEG, PNG or WebP images are allowed.')
      return
    }
    setTypeError(null)
    upload.mutate(file)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    tryUpload(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    tryUpload(e.dataTransfer.files?.[0])
  }

  const browseInput = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style={{ display: 'none' }}
      onChange={handleFileChange}
      disabled={upload.isPending}
    />
  )

  return (
    <div className="wlfield">
      <label>Reference image</label>
      {entry.media_url ? (
        <div className="wlmedia">
          <img src={entry.media_url} alt="" className="wlmedia-img" />
          <label className="btn" style={{ cursor: upload.isPending ? 'default' : 'pointer' }}>
            {upload.isPending ? 'Uploading…' : 'Replace image'}
            {browseInput}
          </label>
        </div>
      ) : (
        <div
          className={`wldrop${dragOver ? ' over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path
              d="M7 18a4 4 0 0 1-.6-7.96A5 5 0 0 1 16 8.1 4.5 4.5 0 0 1 17.5 17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 12v6M9.5 15.5 12 13l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="wldrop-title">{upload.isPending ? 'Uploading…' : 'Choose a file or drag & drop it here'}</div>
          <div className="wldrop-sub">JPEG, PNG or WebP, up to 50 MB</div>
          <label className="btn" style={{ cursor: upload.isPending ? 'default' : 'pointer' }}>
            Browse file
            {browseInput}
          </label>
        </div>
      )}
      {typeError && <div className="err">{typeError}</div>}
      {upload.isError && <div className="err">{upload.error.message}</div>}
    </div>
  )
}

function hasPlate(form: FormState): boolean {
  return form.plateType === 'BH_SERIES'
    ? !!(form.yearCode.trim() && form.series.trim() && form.number.trim())
    : !!(form.stateCode.trim() && form.rtoCode.trim() && form.number.trim())
}

function validate(form: FormState): string | null {
  if (form.list_name === 'wanted_persons') {
    if (!form.subject_ref.trim()) return 'Subject is required for wanted-person entries.'
  } else if (!hasPlate(form)) {
    return form.plateType === 'BH_SERIES'
      ? 'Year, series and number are required for a BH-series plate.'
      : 'State, RTO and number are required for a standard-state plate.'
  }
  return null
}

function plateFieldsBody(form: FormState): Pick<
  WatchlistEntryCreateBody,
  'plate_type' | 'state_code' | 'rto_code' | 'year_code' | 'series' | 'number'
> {
  if (!hasPlate(form)) return { plate_type: null, state_code: null, rto_code: null, year_code: null, series: null, number: null }
  if (form.plateType === 'BH_SERIES') {
    return {
      plate_type: 'BH_SERIES',
      state_code: null,
      rto_code: null,
      year_code: form.yearCode.trim(),
      series: form.series.trim(),
      number: form.number.trim(),
    }
  }
  return {
    plate_type: 'STANDARD_STATE',
    state_code: form.stateCode.trim(),
    rto_code: form.rtoCode.trim(),
    year_code: null,
    series: form.series.trim() || null,
    number: form.number.trim(),
  }
}

function FormFields({
  form,
  onChange,
  resetKey,
}: {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  // Forces the segmented plate input to remount (discarding any typed
  // values and re-seeding from `form`) when the selected entry or plate
  // type changes — it's otherwise an uncontrolled field.
  resetKey: string
}) {
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
          <label>Plate type</label>
          <select
            value={form.plateType}
            onChange={(e) =>
              onChange({
                plateType: e.target.value as PlateType,
                stateCode: '',
                rtoCode: '',
                yearCode: '',
                series: '',
                number: '',
              })
            }
          >
            <option value="STANDARD_STATE">Standard state</option>
            <option value="BH_SERIES">BH series</option>
          </select>
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
        <label>Plate</label>
        <PlateSegmentInput
          key={resetKey}
          plateType={form.plateType}
          initialValue={{
            state_code: form.stateCode,
            rto_code: form.rtoCode,
            year_code: form.yearCode,
            series: form.series,
            number: form.number,
          }}
          onChange={(seg) =>
            onChange({
              stateCode: seg.state_code ?? '',
              rtoCode: seg.rto_code ?? '',
              yearCode: seg.year_code ?? '',
              series: seg.series ?? '',
              number: seg.number ?? '',
            })
          }
        />
        <div className="hint">Plate fields are for vehicle-based entries (stolen, blacklist, suspect vehicle).</div>
      </div>
      <div className="wlfield">
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Make, model and colour, distinguishing marks, height and build, when and where last seen…"
        />
        <div className="hint">
          What to look for — vehicle details or a person's description. Shown to the operator when a match fires.
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

function WatchlistCreateForm({
  onCreated,
  onCancel,
  initialPlate,
}: {
  onCreated: (id: number) => void
  onCancel: () => void
  initialPlate?: PlateQuery | null
}) {
  const [form, setForm] = useState<FormState>(() => (initialPlate ? plateQueryToForm(initialPlate) : EMPTY_FORM))
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
      ...plateFieldsBody(form),
      subject_ref: form.subject_ref.trim() || null,
      details: detailsBody(form),
    }
    create.mutate(body, {
      onSuccess: (created) => {
        setConfirming(false)
        onCreated(created.id)
      },
    })
  }

  const who = form.number.trim() || form.subject_ref.trim() || 'this entry'

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
        <FormFields form={form} onChange={handleChange} resetKey={form.plateType} />
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

  // Touching any one plate field (even to send it back unchanged) makes the
  // backend recompute the whole plate from the merge of stored + touched
  // fields, so it's safe — and simpler — to diff each segment individually
  // rather than reconstructing the full plate. baseline is what the form
  // started from (entryToForm(original)), not the raw entry, since the
  // entry itself only carries plate_display/plate_type, not segments.
  const baseline = entryToForm(original)
  if (!hasPlate(form) && hasPlate(baseline)) {
    diff.plate_type = null
    diff.state_code = null
    diff.rto_code = null
    diff.year_code = null
    diff.series = null
    diff.number = null
  } else if (hasPlate(form)) {
    if (form.plateType !== baseline.plateType) Object.assign(diff, plateFieldsBody(form))
    else {
      if (form.stateCode !== baseline.stateCode) diff.state_code = form.stateCode.trim() || null
      if (form.rtoCode !== baseline.rtoCode) diff.rto_code = form.rtoCode.trim() || null
      if (form.yearCode !== baseline.yearCode) diff.year_code = form.yearCode.trim() || null
      if (form.series !== baseline.series) diff.series = form.series.trim() || null
      if (form.number !== baseline.number) diff.number = form.number.trim() || null
    }
  }

  const subject = form.subject_ref.trim() || null
  if (subject !== (original.subject_ref ?? null)) diff.subject_ref = subject

  if (form.description !== baseline.description || form.notes !== baseline.notes) {
    diff.details = detailsBody(form)
  }

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

  // No entry.id-keyed reset effect here: this component is now keyed by
  // entry.id at the call site (see WatchlistForm below), so switching entries
  // fully remounts it — form/validationError/confirming/justSaved all start
  // fresh from their useState initializers. A refetch of the *same* entry
  // (e.g. after the active-toggle mutation) doesn't remount, which is what
  // preserves in-progress edits.
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
        <FormFields form={form} onChange={handleChange} resetKey={`${entry.id}-${form.plateType}`} />
        <MediaUploadField entry={entry} />
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
  | { mode: 'create'; onCreated: (id: number) => void; onCancel: () => void; initialPlate?: PlateQuery | null }
  | { mode: 'edit'; entry: WatchlistEntry }

export function WatchlistForm(props: WatchlistFormProps) {
  if (props.mode === 'create') {
    return <WatchlistCreateForm onCreated={props.onCreated} onCancel={props.onCancel} initialPlate={props.initialPlate} />
  }
  // Keyed on entry.id so switching entries fully remounts the form instead of
  // relying only on the effect below to re-sync state — PlateSegmentInput is
  // uncontrolled and only reads its initialValue at mount, so a remount here
  // is what guarantees it seeds from the newly-selected entry, not the
  // previous one (the effect alone updates `form` a render late for that).
  return <WatchlistEditForm key={props.entry.id} entry={props.entry} />
}
