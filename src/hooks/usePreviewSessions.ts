import { useSyncExternalStore } from 'react'
import { previewSessionsStore } from '../state/previewSessionsStore'

export function usePreviewSessions() {
  const open = useSyncExternalStore(previewSessionsStore.subscribe, previewSessionsStore.get, previewSessionsStore.get)
  return {
    open,
    count: open.size,
    start: previewSessionsStore.start.bind(previewSessionsStore),
    stop: previewSessionsStore.stop.bind(previewSessionsStore),
    canOpen: previewSessionsStore.canOpen.bind(previewSessionsStore),
  }
}
