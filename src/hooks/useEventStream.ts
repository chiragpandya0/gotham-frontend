import { useEffect } from 'react'
import { streamStore } from '../state/streamStore'
import { useAuthSignedIn } from './useAuthSignedIn'

// Owns the /api/stream connection's lifecycle: open once signed in (the
// endpoint requires cookie auth + view_live permission), close on sign-out.
// Mount exactly once (in Shell) — the connection itself is a module-level
// singleton in streamStore, this just drives when it's open.
export function useEventStream() {
  const signedIn = useAuthSignedIn()

  useEffect(() => {
    if (!signedIn) return
    streamStore.signIn()
    return () => streamStore.signOut()
  }, [signedIn])
}
