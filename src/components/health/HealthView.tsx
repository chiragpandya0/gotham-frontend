import { useHealthOverview } from '../../hooks/useHealthOverview'
import { useHealthSeries } from '../../hooks/useHealthSeries'
import { NotImplementedNotice } from '../common/NotImplementedNotice'
import { Sparkline } from '../common/Sparkline'

export function HealthView({ active }: { active: boolean }) {
  const { data: overview, notImplemented: overviewNotBuilt } = useHealthOverview()
  const { data: series, notImplemented: seriesNotBuilt } = useHealthSeries()

  const seriesByMetric = new Map((series?.series ?? []).map((s) => [s.metric, s]))
  const reconnects = seriesByMetric.get('reconnects')
  const decodeErrors = seriesByMetric.get('decode_errors')
  const platesPerMin = seriesByMetric.get('plates_per_min')

  return (
    <section className={active ? 'view on' : 'view'} id="viewHealth">
      {overviewNotBuilt ? (
        <div style={{ padding: 16 }}>
          <NotImplementedNotice what="Grid health" />
        </div>
      ) : (
        <div className="kpis" id="hKpis">
          {overview && (
            <>
              <div className="kpi">
                <i>{overview.kpis.streams_connected}</i>
                <s>streams connected</s>
              </div>
              <div className="kpi">
                <i>{overview.kpis.frames_decoded_per_sec}</i>
                <s>frames decoded per second</s>
              </div>
              <div className="kpi">
                <i>{overview.kpis.capture_to_alert_p95_str}</i>
                <s>capture to alert, p95</s>
              </div>
              <div className="kpi">
                <i>{overview.kpis.gpu_utilisation_pct}%</i>
                <s>GPU utilisation</s>
              </div>
              <div className="kpi">
                <i>{overview.kpis.ingest_mbps} Mbps</i>
                <s>ingest right now</s>
              </div>
              <div className="kpi warn">
                <i>{overview.kpis.cameras_unprobed}</i>
                <s>cameras unprobed</s>
              </div>
            </>
          )}
        </div>
      )}

      <div className="hgrid">
        <div className="hleft">
          {overview && (
            <>
              <div className="block">
                <h4>
                  Bandwidth, and why the architecture is what it is
                  <em>projected to {(overview.bandwidth.fleet_size ?? 0).toLocaleString()} cameras</em>
                </h4>
                <div className="bw">
                  <div className="bwcell no">
                    <h6>If every stream were pulled to one centre</h6>
                    <div className="big" id="bwCentral">
                      {overview.bandwidth.central_gbps} Gbps
                    </div>
                    <div className="sm" id="bwCentralNote">
                      {overview.bandwidth.fleet_size_note}
                    </div>
                  </div>
                  <div className="bwcell hi">
                    <h6>Edge inference, metadata upstream, video on demand</h6>
                    <div className="big" id="bwEdge">
                      {overview.bandwidth.edge_gbps} Gbps
                    </div>
                    <div className="sm" id="bwEdgeNote">
                      {overview.bandwidth.mean_bitrate_note}
                    </div>
                  </div>
                </div>
                <div className="mathrow" id="bwMath">
                  {overview.bandwidth.workings}
                </div>
              </div>

              <div className="block">
                <h4>
                  Processing pipeline <em>rates measured across the onboarded cameras</em>
                </h4>
                <div className="stage2" id="hStages">
                  {(overview.stages ?? []).map((s) => (
                    <div key={s.name} className={s.state === 'warn' ? 'st2 warn' : 'st2'}>
                      <b>{s.name}</b>
                      <div className="r">{s.rate}</div>
                      <div className="u">{s.unit}</div>
                      <div className="lag">lag {s.lag_str}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="block">
                <h4>
                  Compute tier <em>edge nodes carry inference, centre carries correlation</em>
                </h4>
                <table className="seg">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Site</th>
                      <th>Cameras</th>
                      <th>Inference load</th>
                      <th>Uplink</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody id="hNodes">
                    {(overview.nodes ?? []).map((n, i) => (
                      <tr key={i}>
                        <td>
                          <span className="tag">{n.tier}</span>
                        </td>
                        <td>{n.site}</td>
                        <td className="m">{n.cameras}</td>
                        <td className="m dim">{n.inference_load}</td>
                        <td className="m dim">{n.uplink}</td>
                        <td>
                          <span className="verdict ok">
                            <i />
                            {n.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="hright">
          {seriesNotBuilt ? (
            <div style={{ padding: 16 }}>
              <NotImplementedNotice what="Health sparklines" />
            </div>
          ) : (
            <>
              <div className="sparkwrap">
                <h6>
                  Reconnects, last 24 hours <span id="spk1v">{reconnects?.total_str}</span>
                </h6>
                <div id="spk1">
                  {reconnects && <Sparkline values={reconnects.values ?? []} color="#7fa7bc" fill="rgba(127,167,188,.15)" />}
                </div>
              </div>
              <div className="sparkwrap">
                <h6>
                  Decode errors, last 24 hours <span id="spk2v">{decodeErrors?.total_str}</span>
                </h6>
                <div id="spk2">
                  {decodeErrors && <Sparkline values={decodeErrors.values ?? []} color="#e2685c" fill="rgba(226,104,92,.15)" />}
                </div>
              </div>
              <div className="sparkwrap">
                <h6>
                  Plate reads per minute <span id="spk3v">{platesPerMin?.latest_str}</span>
                </h6>
                <div id="spk3">
                  {platesPerMin && <Sparkline values={platesPerMin.values ?? []} color="#4fc3d9" fill="rgba(79,195,217,.15)" />}
                </div>
              </div>
            </>
          )}
          <div className="tblock">
            <h4>Services</h4>
            <div className="svc" id="hSvc">
              {(overview?.services ?? []).map((s) => (
                <div key={s.name} className={s.state === 'ok' ? 'svcrow' : 'svcrow deg'}>
                  <i />
                  <div className="nm">
                    <b>{s.name}</b>
                    <s>{s.detail}</s>
                  </div>
                  <div className="v">
                    {s.value}
                    <s>{s.value_label}</s>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
