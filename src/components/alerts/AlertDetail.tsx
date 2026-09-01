import { Fragment } from 'react'
import { useAlert } from '../../hooks/useAlert'
import { useAcknowledgeAlert, useDispatchAlert, useFalsePositiveAlert } from '../../hooks/useAlertActions'
import { ApiError } from '../../types/api'
import { AlertLocationMiniMap } from './AlertLocationMiniMap'

function actionErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError && error.status === 409) {
    return `Already actioned by another operator: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Action failed.'
}

// Ports renderDetail() (unified-grid-v2.html ~line 4600).
export function AlertDetail({ id }: { id: number }) {
  const { data: a, isLoading } = useAlert(id)
  const acknowledge = useAcknowledgeAlert(id)
  const dispatch = useDispatchAlert(id)
  const falsePositive = useFalsePositiveAlert(id)

  if (isLoading || !a) {
    return (
      <div className="detail">
        <div style={{ padding: 24, color: 'var(--ink-3)' }}>Loading alert…</div>
      </div>
    )
  }

  const canAcknowledge = a.available_actions.includes('acknowledge')
  const canEscalate = a.available_actions.some((x) => x === 'escalate' || x === 'dispatch')
  const canFalsePositive = a.available_actions.includes('false_positive')

  const pending = acknowledge.isPending || dispatch.isPending || falsePositive.isPending
  const errorMessage =
    actionErrorMessage(acknowledge.error) ?? actionErrorMessage(dispatch.error) ?? actionErrorMessage(falsePositive.error)

  function onEscalate() {
    const unit = window.prompt('Unit to dispatch (e.g. RJT-04):')
    if (unit) dispatch.mutate({ unit })
  }

  function onFalsePositive() {
    const reason = window.prompt('Reason this is a false positive:')
    if (reason) falsePositive.mutate({ reason })
  }

  return (
    <div className="detail">
      <div className="dhead">
        <span className="p" id="dPlate" style={{ color: a.priority === 'critical' ? 'var(--crit)' : 'var(--signal)' }}>
          {a.plate_display}
        </span>
        <div className="sub" id="dSub">
          {a.subtitle}
        </div>
        <div className="dactions">
          <button id="btnFalse" disabled={!canFalsePositive || pending} onClick={onFalsePositive}>
            False positive
          </button>
          <button id="btnEsc" disabled={!canEscalate || pending} onClick={onEscalate}>
            Escalate
          </button>
          <button
            className="primary"
            id="btnAck"
            disabled={!canAcknowledge || pending}
            onClick={() => acknowledge.mutate({})}
          >
            Acknowledge
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 16px', color: 'var(--crit)', fontSize: 12 }}>{errorMessage}</div>
      )}

      <div className="dbody">
        <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <div className="block">
            <h4>
              Evidence <em id="eviRef">{a.evidence.reference}</em>
            </h4>
            <div className="in evi">
              <div className="frame">
                {a.evidence.frame_url ? (
                  <img src={a.evidence.frame_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <div className="road" />
                    <div className="car" />
                    <div className="win" />
                    <div className="box" />
                  </>
                )}
                <div className="cap" id="eviCap">
                  {a.evidence.caption}
                </div>
              </div>
              <div className="crop">
                {a.evidence.crop_url ? (
                  <img
                    src={a.evidence.crop_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="plateimg" id="eviPlate">
                    {a.plate_display}
                  </div>
                )}
                <div className="u" id="eviConf">
                  {a.evidence.ocr_note}
                </div>
              </div>
            </div>
          </div>

          <div className="block">
            <h4>
              Matched watchlist record <em id="recSrc">{a.matched_record.source_label}</em>
            </h4>
            <div className="in">
              <dl className="kv" id="recKv">
                {Object.entries(a.matched_record.fields).map(([k, v]) => (
                  <Fragment key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </Fragment>
                ))}
              </dl>
              <div className="src" id="recQuery">
                {a.matched_record.sync_note}
              </div>
            </div>
          </div>

          <div className="block">
            <h4>Rule that fired</h4>
            <div id="rules">
              <div className="rule">
                <b>{a.rule.name}</b>
                <code>{a.rule.condition}</code>
                <span className={a.rule.enabled ? 'on' : ''}>
                  {a.rule.enabled ? 'Enabled' : 'Disabled'} · {a.rule.window}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, alignContent: 'start', minWidth: 0 }}>
          <div className="block">
            <h4>
              Location <em id="locCam">camera {a.location.camera_id}</em>
            </h4>
            <AlertLocationMiniMap lat={a.location.lat} lon={a.location.lon} critical={a.priority === 'critical'} />
            <div className="in">
              <dl className="kv" id="locKv">
                <dt>Site</dt>
                <dd>{a.location.site}</dd>
                <dt>District</dt>
                <dd>{a.location.district}</dd>
                <dt>Department</dt>
                <dd>{a.location.department ?? '—'}</dd>
                <dt>Adapter</dt>
                <dd>{a.location.adapter}</dd>
                <dt>Coordinates</dt>
                <dd>{a.location.coordinates_str}</dd>
              </dl>
            </div>
          </div>
          <div className="block">
            <h4>Audit trail</h4>
            <ul className="trail" id="trail">
              {a.audit.map((r, i) => (
                <li key={i}>
                  <time>{r.at}</time>
                  <div>
                    <b>{r.action}</b>
                    {r.detail && <span>{r.detail}</span>}
                    {r.actor && <span>{r.actor}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
