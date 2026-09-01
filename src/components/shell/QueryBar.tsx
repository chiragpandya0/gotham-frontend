import { useQueryBarMeta } from '../../hooks/useQueryBarMeta'

export function QueryBar() {
  const meta = useQueryBarMeta()

  return (
    <div className="qbar">
      <span className="seg env">STAGING</span>
      <span className="seg">build 0.9.3</span>
      <span className="seg db">postgres 16 + postgis 3.4</span>
      <span className="sql" id="sql">
        {meta?.query ?? 'connecting…'}
      </span>
      <span className="seg last" id="ms">
        {meta ? `${meta.rows} rows in ${meta.ms} ms` : ''}
      </span>
      <span className="seg">source: /api/ingest snapshot, 31 Aug 2026</span>
    </div>
  )
}
