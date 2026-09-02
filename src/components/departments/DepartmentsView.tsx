import { useDepartments } from '../../hooks/useDepartments'
import { NotImplementedNotice } from '../common/NotImplementedNotice'

const SHARING_CLASS: Record<string, string> = { signed: 'mou sign', draft: 'mou draft' }
const SHARING_LABEL: Record<string, string> = { signed: 'Signed', draft: 'In draft' }

export function DepartmentsView({ active }: { active: boolean }) {
  const { data, notImplemented } = useDepartments()

  return (
    <section className={active ? 'view on' : 'view'} id="viewDept">
      {notImplemented ? (
        <div style={{ padding: 16 }}>
          <NotImplementedNotice what="Departments" />
        </div>
      ) : (
        <>
          <div className="kpis" id="depKpis">
            {data && (
              <>
                <div className="kpi">
                  <i>{data.kpis.departments_in_scope ?? '—'}</i>
                  <s>departments in scope</s>
                </div>
                <div className="kpi">
                  <i>{(data.kpis.cameras_held ?? 0).toLocaleString()}</i>
                  <s>cameras held, estimated</s>
                </div>
                <div className="kpi">
                  <i>{data.kpis.onboarded ?? '—'}</i>
                  <s>onboarded so far</s>
                </div>
                <div className="kpi">
                  <i>{data.kpis.sharing_agreed ?? '—'}</i>
                  <s>data sharing agreed</s>
                </div>
                <div className="kpi warn">
                  <i>{data.kpis.vms_undeclared ?? '—'}</i>
                  <s>VMS not yet declared</s>
                </div>
                <div className="kpi">
                  <i>{data.kpis.retention_range_str ?? '—'}</i>
                  <s>retention days in use</s>
                </div>
              </>
            )}
          </div>

          <div className="dgrid">
            <div className="dleft">
              <table className="reg">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Cameras held</th>
                    <th>Onboarded</th>
                    <th>Progress</th>
                    <th>VMS in use</th>
                    <th>Storage</th>
                    <th>Retention</th>
                    <th>Data sharing</th>
                    <th>Nodal officer</th>
                  </tr>
                </thead>
                <tbody id="depBody">
                  {(data?.departments ?? []).map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td className="m">{(d.cameras_held ?? 0).toLocaleString()}</td>
                      <td className="m">{d.onboarded || <span className="dim">0</span>}</td>
                      <td>
                        <span className="prog">
                          <u>
                            <b style={{ width: `${Math.min(100, (d.progress_pct ?? 0) * 400)}%` }} />
                          </u>
                          {d.progress_str}
                        </span>
                      </td>
                      <td className={d.vms_declared ? 'm' : undefined}>
                        <span className={d.vms_declared ? 'tag' : 'tag unk'}>{d.vms_vendor}</span>
                      </td>
                      <td className="dim">{d.storage_label}</td>
                      <td className="m dim">{d.retention_str}</td>
                      <td>
                        <span className={SHARING_CLASS[d.sharing_status] ?? 'mou'}>
                          {SHARING_LABEL[d.sharing_status] ?? 'Not started'}
                        </span>
                      </td>
                      <td className="dim">
                        {d.nodal_assigned ? d.nodal_officer : <span style={{ color: 'var(--signal)' }}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dright">
              <div className="tblock">
                <h4 id="depWho">What we need from each department</h4>
                <div className="chk" id="depChk">
                  {(data?.requirements ?? []).map((r, i) => (
                    <div key={i} className={`chkrow ${r.status === 'have' ? 'got' : 'need'}`}>
                      <u>{r.status === 'have' ? '✓' : '!'}</u>
                      <div>
                        <b>{r.title}</b>
                        <s>{r.detail}</s>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="tblock">
                <h4>Onboarding waves</h4>
                <div id="depWaves">
                  {(data?.waves ?? []).map((w) => (
                    <div key={w.wave} className="wave">
                      <b>
                        Wave {w.wave} · {w.departments}
                      </b>
                      <span className="m">{w.rationale}</span>
                      <span className="m">{w.cameras_str}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
