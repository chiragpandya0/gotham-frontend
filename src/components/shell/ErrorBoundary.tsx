import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// A single unguarded property access anywhere in the tree otherwise takes
// the whole app down to a blank screen with no recovery path — this is the
// safety net so a bug in one view degrades gracefully instead.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ground)',
            color: 'var(--ink)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--sans)',
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 16 }}>
              {this.state.error.message}
            </div>
            <button
              style={{
                border: '1px solid var(--line)',
                borderRadius: 3,
                padding: '8px 14px',
                background: 'var(--panel)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
