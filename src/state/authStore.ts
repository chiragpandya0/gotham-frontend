// Tracks only whether we believe there's a live session, so App.tsx can flip
// back to <SignIn/> the instant any request 401s — the actual identity lives
// in TanStack Query's cache for qk.me() (useMe), not duplicated here.
type Listener = (signedIn: boolean) => void

const listeners = new Set<Listener>()
let signedIn = false

export const authStore = {
  signIn() {
    signedIn = true
    for (const l of listeners) l(signedIn)
  },
  signOut() {
    signedIn = false
    for (const l of listeners) l(signedIn)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): boolean {
    return signedIn
  },
}
