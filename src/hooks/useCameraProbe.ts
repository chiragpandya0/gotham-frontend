import { useCallback, useState } from 'react'
import { postSse } from '../lib/postSse'
import type { ProbeResultEvent, ProbeStepEvent } from '../types/sse'

interface ProbeConnection {
  url: string
}

export function useCameraProbe() {
  const [steps, setSteps] = useState<ProbeStepEvent[]>([])
  const [result, setResult] = useState<ProbeResultEvent | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (adapter: string, connection: ProbeConnection, cameraId?: number) => {
    setSteps([])
    setResult(null)
    setError(null)
    setRunning(true)
    try {
      for await (const chunk of postSse('/api/cameras/probe', { adapter, connection, camera_id: cameraId })) {
        if (chunk.event === 'step') {
          setSteps((prev) => [...prev, JSON.parse(chunk.data) as ProbeStepEvent])
        } else if (chunk.event === 'result') {
          setResult(JSON.parse(chunk.data) as ProbeResultEvent)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Probe failed.')
    } finally {
      setRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSteps([])
    setResult(null)
    setError(null)
  }, [])

  return { steps, result, running, error, run, reset }
}
