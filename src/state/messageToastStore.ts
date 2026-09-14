type Listener = (message: string | null) => void

const AUTO_DISMISS_MS = 4000

const listeners = new Set<Listener>()
let current: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export const messageToastStore = {
  show(message: string) {
    if (timer) clearTimeout(timer)
    current = message
    for (const l of listeners) l(current)
    timer = setTimeout(() => messageToastStore.dismiss(), AUTO_DISMISS_MS)
  },
  dismiss() {
    if (timer) clearTimeout(timer)
    timer = null
    current = null
    for (const l of listeners) l(current)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): string | null {
    return current
  },
}
