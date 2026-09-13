import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { streamStore } from '../state/streamStore'
import type { AlertsResponse, AlertSummary, StreamAlertEvent } from '../types/domain'

// Mirrors app/common/constants.py's PRIORITY_LABELS/STATE_LABELS — a
// same-shaped fallback for the notify_alert_raised() trigger predating
// migration 2a55e9c92424, which built the "raised" action's jsonb payload
// without priority_label/state_label/counts.total_today at all. Once that
// migration is live everywhere this fallback is simply never used.
// The event queue backing /api/stream caps at 100 events per client and
// silently drops anything past that, so an acknowledge/dispatch transition
// can go missing without the connection itself ever dropping (no error to
// hang a backfill off) — same class of bug confirmed live on the camera
// health side (a stale "Down" that had actually gone back to "live"). Left
// unnoticed here it's worse: a dispatcher could re-act on an alert that was
// already handled. This periodic re-fetch is the safety net under the
// event-driven path, not a replacement for it.
const RECONCILE_MS = 30_000

const PRIORITY_LABELS: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium' }
const STATE_LABELS: Record<string, string> = {
  open: 'Open, unacknowledged',
  acknowledged: 'Acknowledged',
  dispatched: 'Dispatched',
  closed: 'Closed',
  false_positive: 'False positive',
}

function toSummary(e: StreamAlertEvent, existing?: AlertSummary): AlertSummary {
  return {
    id: e.id,
    plate_display: e.plate_display,
    kind: e.kind,
    priority: e.priority,
    priority_label: e.priority_label || PRIORITY_LABELS[e.priority] || e.priority,
    state: e.state,
    state_label: e.state_label || STATE_LABELS[e.state] || e.state,
    raised_at: existing?.raised_at,
    raised_time_str: e.raised_time_str,
    camera_label: e.camera_label,
    confidence: e.confidence ?? existing?.confidence ?? 0,
  }
}

function applyEvent(old: AlertsResponse, filterState: string, e: StreamAlertEvent): AlertsResponse {
  const idx = old.alerts.findIndex((a) => a.id === e.id)
  const merged = toSummary(e, idx === -1 ? undefined : old.alerts[idx])

  let alerts: AlertSummary[]
  if (idx === -1) {
    alerts = [merged, ...old.alerts]
  } else {
    alerts = old.alerts.slice()
    alerts[idx] = merged
  }
  if (filterState !== 'all') {
    alerts = alerts.filter((a) => a.state === filterState)
  }

  // Same reasoning as the labels above — pre-migration 'raised' events omit
  // counts.total_today, so keep whatever value was already cached for it.
  return { counts: { ...old.counts, ...e.counts }, alerts }
}

// Mount once (in Shell). Patches every cached GET /api/alerts query — one
// per filter tab (all/open/acknowledged/dispatched) — in place from the
// `alert` stream event, so useAlerts needs no polling.
export function useAlertsLiveSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubAlert = streamStore.subscribe('alert', (e) => {
      // setQueriesData's updater doesn't receive the query key, and the
      // per-query filter state lives in that key — so update each cached
      // query individually instead.
      queryClient.getQueryCache().findAll({ queryKey: ['alerts'] }).forEach((query) => {
        const old = query.state.data as AlertsResponse | undefined
        if (!old) return
        const filterState = (query.queryKey as [string, string])[1] ?? 'all'
        queryClient.setQueryData(query.queryKey, applyEvent(old, filterState, e))
      })
    })

    function reconcile() {
      queryClient.getQueryCache().findAll({ queryKey: ['alerts'] }).forEach((query) => {
        const filterState = (query.queryKey as [string, string])[1] ?? 'all'
        apiClient
          .get<AlertsResponse>(`/api/alerts${buildQuery({ state: filterState })}`)
          .then((data) => queryClient.setQueryData(query.queryKey, data))
          .catch(() => {
            // Try again next reconcile.
          })
      })
    }

    const unsubReconnect = streamStore.onReconnect(reconcile)
    const intervalId = window.setInterval(reconcile, RECONCILE_MS)

    return () => {
      unsubAlert()
      unsubReconnect()
      window.clearInterval(intervalId)
    }
  }, [queryClient])
}
