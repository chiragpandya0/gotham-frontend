import { useState, type FormEvent } from 'react'
import { IconSso } from '../../styles/icons'
import { useLogin } from '../../hooks/useLogin'
import { authStore } from '../../state/authStore'

interface SignInProps {
  visible: boolean
}

export function SignIn({ visible }: SignInProps) {
  const [username, setUsername] = useState('op.mharkhani')
  const [password, setPassword] = useState('GridDemo2026!')
  const login = useLogin()

  function submitServiceAccount(e: FormEvent) {
    e.preventDefault()
    login.mutate({ username, password })
  }

  function submitSso() {
    login.mutate({ sso: 'gswan' })
  }

  return (
    <div className={visible ? 'signin on' : 'signin'} id="signin">
      <div className="signin-wrap">
        <div className="signin-brand">
          <b>Gotham</b>
          <span>Sentinel</span>
        </div>
        <div className="card2">
          <form className="cb" onSubmit={submitServiceAccount}>
            <div className="sihead">
              <b>Sign in</b>
              <s>Authorised personnel only.</s>
            </div>
            <button type="button" className="sso" id="ssoBtn" onClick={submitSso} disabled={login.isPending}>
              <IconSso />
              Continue with GSWAN single sign-on
            </button>
            <div className="or">or use a service account</div>
            <div>
              <label>Service identifier</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} spellCheck={false} />
            </div>
            <div>
              <label>Passphrase</label>
              <input
                type="password"
                className={login.isError ? 'err' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {login.isError ? (
              <div className="simsg bad">{login.error instanceof Error ? login.error.message : 'Sign-in failed.'}</div>
            ) : (
              authStore.wasSessionExpired() && <div className="simsg warn">Your session has expired. Please sign in again.</div>
            )}
            <button type="submit" className="go2" id="signBtn" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="cf">
            Access is scoped by role and logged against your identity. Every view, trace and export is recorded in the audit
            trail and retained for 180 days.
          </div>
        </div>
      </div>
    </div>
  )
}
