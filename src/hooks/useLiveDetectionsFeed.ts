import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/apiClient'
import { streamStore } from '../state/streamStore'
import type { DetectionsFeedResponse, StreamDetectionEvent } from '../types/domain'

const MAX_ROWS = 60

export interface LiveDetectionRow {
  id: number
  seen_time_str: string
  plate_display: string
  camera_label: string
  confidence: number
  watchlist_flag: string | null
  /** Derived, not sent directly by either source — see field comments below. */
  partial: boolean
}

function fromStreamEvent(e: StreamDetectionEvent): LiveDetectionRow {
  return {
    id: e.id,
    seen_time_str: e.seen_time_str,
    plate_display: e.plate_display,
    camera_label: e.camera_label ?? `Cam ${e.camera_id}`,
    confidence: e.confidence,
    watchlist_flag: e.watchlist_flag,
    // The stream doesn't send read_quality — resolved_plate containing `?`
    // is the one signal it does send for a partial read.
    partial: e.resolved_plate.includes('?'),
  }
}

function fromFeedResponse(reads: DetectionsFeedResponse['reads']): LiveDetectionRow[] {
  return reads.map((r) => ({
    id: r.id,
    seen_time_str: r.seen_time_str,
    plate_display: r.plate_display,
    camera_label: r.camera_label,
    confidence: r.confidence,
    watchlist_flag: r.watchlist_flag ?? null,
    partial: r.read_quality === 'partial',
  }))
}

// Live ticker for the sidebar's "Live plate detections" feed, driven by the
// `detection` event on /api/stream. Seeds from GET /api/detections on mount
// (the stream has no replay), then appends live events as they arrive; on a
// reconnect that followed a dropped connection, backfills via `since=` to
// cover whatever the stream's own 100-event client queue may have dropped.
export function useLiveDetectionsFeed() {
  const [rows, setRows] = useState<LiveDetectionRow[]>([])
  const lastIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    function addRows(incoming: LiveDetectionRow[]) {
      if (incoming.length === 0) return
      const maxId = incoming.reduce((m, r) => Math.max(m, r.id), lastIdRef.current ?? 0)
      lastIdRef.current = maxId
      setRows((prev) => {
        const ids = new Set(incoming.map((r) => r.id))
        const next = [...incoming, ...prev.filter((r) => !ids.has(r.id))]
        return next.slice(0, MAX_ROWS)
      })
    }

    async function seed() {
      try {
        const res = await apiClient.get<DetectionsFeedResponse>('/api/detections?limit=20')
        if (cancelled) return
        addRows(fromFeedResponse(res.reads).reverse())
      } catch {
        // Transient failure — the stream will still carry new rows once connected.
      }
    }

    async function backfill() {
      if (lastIdRef.current === undefined) return
      try {
        const res = await apiClient.get<DetectionsFeedResponse>(`/api/detections?since=${lastIdRef.current}&limit=25`)
        if (cancelled) return
        addRows(fromFeedResponse(res.reads).reverse())
      } catch {
        // Try again on the next reconnect.
      }
    }

    seed()
    const unsubDetection = streamStore.subscribe('detection', (e) => addRows([fromStreamEvent(e)]))
    const unsubReconnect = streamStore.onReconnect(backfill)

    return () => {
      cancelled = true
      unsubDetection()
      unsubReconnect()
    }
  }, [])

  return rows
}
