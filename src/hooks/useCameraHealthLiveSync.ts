import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { streamStore } from '../state/streamStore'
import type { CamerasResponse } from '../types/domain'

const STATUS_LABEL: Record<string, string> = { live: 'Live', down: 'Down' }

// The event queue backing /api/stream caps at 100 events per client and
// silently drops anything past that — so a health transition can go missing
// without the connection itself ever dropping (no error/reconnect to hang a
// backfill off). Confirmed live: camera 29 sat on a stale "Down" patched by
// an earlier transition event long after the backend's own health.state had
// already gone back to "live". A push-only cache has no way to self-correct
// that, so this periodic re-poll is the safety net under the event-driven
// path, not a replacement for it.
const RECONCILE_MS = 60_000

// Mount once (in Shell). Patches every cached GET /api/cameras query in
// place from the `camera_health` stream event — fired only on an actual
// live/down transition, not on a timer. Initial per-camera health still
// comes from the REST fetch; there's no `since=` for this one, so a
// reconnect just re-polls GET /api/cameras via query invalidation.
export function useCameraHealthLiveSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubHealth = streamStore.subscribe('camera_health', (e) => {
      queryClient.setQueriesData<CamerasResponse>({ queryKey: ['cameras'] }, (old) => {
        if (!old) return old
        let changed = false
        const cameras = old.cameras.map((c) => {
          if (c.id !== e.camera_id) return c
          changed = true
          return {
            ...c,
            health: {
              state: e.status,
              label: STATUS_LABEL[e.status] ?? e.status,
              last_frame_str: c.health?.last_frame_str ?? '—',
              reconnects_24h: c.health?.reconnects_24h ?? 0,
              decode_errors_24h: c.health?.decode_errors_24h ?? 0,
            },
            measured_fps: e.measured_fps ?? c.measured_fps,
          }
        })
        return changed ? { ...old, cameras } : old
      })
    })

    function reconcile() {
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
      queryClient.invalidateQueries({ queryKey: ['camera'] })
    }

    const unsubReconnect = streamStore.onReconnect(reconcile)
    const intervalId = window.setInterval(reconcile, RECONCILE_MS)

    return () => {
      unsubHealth()
      unsubReconnect()
      window.clearInterval(intervalId)
    }
  }, [queryClient])
}
