import { useEffect, useRef, useState } from 'react'
import { useLogout } from '../../hooks/useLogout'
import type { Me } from '../../types/domain'

const ALL_PERMISSIONS = [
  { key: 'view_live', label: 'View live' },
  { key: 'trace', label: 'Trace vehicles' },
  { key: 'acknowledge', label: 'Acknowledge alerts' },
  { key: 'export', label: 'Export reports' },
  { key: 'manage_watchlist', label: 'Manage watchlist' },
  { key: 'ptz_control', label: 'PTZ control' },
  { key: 'delete_evidence', label: 'Delete evidence' },
  { key: 'onboard_camera', label: 'Onboard cameras' },
]

export function AccountMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logout = useLogout()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div
      className="acct"
      id="acct"
      ref={ref}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="av">{me.initials}</span>
      <span className="who">
        <b>{me.display_name}</b>
        <s>{me.role_label}</s>
      </span>
      <span className="cv">▾</span>

      {open && (
        <div className="menu on" id="acctMenu">
          <div className="mh">
            <span className="av">{me.initials}</span>
            <div>
              <b>{me.display_name}</b>
              {me.email && <s>{me.email}</s>}
              <s>{me.control_room}</s>
            </div>
          </div>

          <div className="msec">
            <h6>Role and scope</h6>
            <dl>
              <dt>Role</dt>
              <dd>{me.role_label}</dd>
              <dt>Camera scope</dt>
              <dd>{me.scope.summary}</dd>
              <dt>Departments</dt>
              <dd>{me.scope.departments.join(', ')}</dd>
            </dl>
          </div>

          <div className="msec">
            <h6>Permissions on this role</h6>
            <div className="perm">
              {ALL_PERMISSIONS.map((p) => (
                <span key={p.key} className={me.permissions.granted.includes(p.key) ? undefined : 'no'}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          <div className="msec">
            <h6>This session</h6>
            <dl>
              <dt>Signed in</dt>
              <dd>{me.session.signed_in_str}</dd>
              <dt>Second factor</dt>
              <dd>{me.session.second_factor}</dd>
              <dt>From</dt>
              <dd>
                {me.session.source_ip}, {me.session.network}
              </dd>
              <dt>Expires</dt>
              <dd>{new Date(me.session.expires_at).toLocaleTimeString('en-GB')}</dd>
            </dl>
          </div>

          <div className="mact">
            <button id="mAudit">My activity log</button>
            <button id="mRoom">Switch control room</button>
            <button>Preferences</button>
            <button className="out" id="mOut" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
