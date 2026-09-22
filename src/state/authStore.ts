// Tracks only whether we believe there's a live session, so App.tsx can flip
// back to <SignIn/> the instant any request 401s — the actual identity lives
// in TanStack Query's cache for qk.me() (useMe), not duplicated here.
type Listener = (signedIn: boolean) => void

const listeners = new Set<Listener>()
let signedIn = false
// A 401 while `signedIn` was already true means the session actually expired
// underneath an active user (vs. this just being a fresh, never-authenticated
// load — useMe's own 401 uses skipAuthRedirect and never reaches signOut()).
// SignIn.tsx reads this to show a distinct "session expired" notice.
let sessionExpired = false

export const authStore = {
  signIn() {
    signedIn = true
    sessionExpired = false
    for (const l of listeners) l(signedIn)
  },
  signOut() {
    if (signedIn) sessionExpired = true
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
  wasSessionExpired(): boolean {
    return sessionExpired
  },
}
