import { Shell } from './components/shell/Shell'
import { SignIn } from './components/shell/SignIn'
import { Toast } from './components/shell/Toast'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { useMe } from './hooks/useMe'
import { useAuthSignedIn } from './hooks/useAuthSignedIn'

export function App() {
  const { data: me, isLoading } = useMe()
  const signedIn = useAuthSignedIn()

  if (isLoading) {
    return <div style={{ position: 'fixed', inset: 0, background: 'var(--ground)' }} />
  }

  return (
    <ErrorBoundary>
      {signedIn && me ? <Shell me={me} /> : null}
      <SignIn visible={!signedIn} />
      <Toast />
    </ErrorBoundary>
  )
}
