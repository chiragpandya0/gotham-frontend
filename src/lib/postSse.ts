import { API_BASE_URL } from '../config/env'

export interface SseChunk {
  event: string
  data: string
}

// POST /api/cameras/probe streams SSE-formatted lines but is a POST with a
// JSON body, so the native EventSource API can't be used — this manually
// parses the streamed response body instead.
export async function* postSse(path: string, body: unknown): AsyncGenerator<SseChunk> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(`Probe request failed (${res.status}): ${text || res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sepIndex: number
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawBlock = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + 2)

      let event = 'message'
      const dataLines: string[] = []
      for (const line of rawBlock.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      if (dataLines.length > 0) {
        yield { event, data: dataLines.join('\n') }
      }
    }
  }
}
