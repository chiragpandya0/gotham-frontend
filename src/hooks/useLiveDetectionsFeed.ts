import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/apiClient'
import type { DetectionRead, DetectionsFeedResponse } from '../types/domain'

const MAX_ROWS = 60
const POLL_MS = 5000

// Polling-based live ticker for the sidebar's "Live plate detections" feed.
// /api/stream doesn't exist yet (confirmed by FRONTEND_INTEGRATION.md), so
// this is the primary live-update mechanism, not a fallback — matches the
// doc's guidance to build against GET /api/detections?since= directly.
export function useLiveDetectionsFeed() {
  const [rows, setRows] = useState<DetectionRead[]>([])
  const lastIdRef = useRef<number | undefined>(undefined)
  const seededRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const qs = lastIdRef.current !== undefined ? `since=${lastIdRef.current}&limit=25` : 'limit=20'
        const res = await apiClient.get<DetectionsFeedResponse>(`/api/detections?${qs}`)
        if (cancelled || res.reads.length === 0) return

        const maxId = res.reads.reduce((m, r) => Math.max(m, r.id), lastIdRef.current ?? 0)
        lastIdRef.current = maxId

        setRows((prev) => {
          const incoming = seededRef.current ? [...res.reads].reverse() : res.reads
          const next = [...incoming, ...prev]
          return next.slice(0, MAX_ROWS)
        })
        seededRef.current = true
      } catch {
        // Transient poll failure — try again next interval, don't surface an error UI for a sidebar ticker.
      }
    }

    poll()
    const id = window.setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return rows
}
