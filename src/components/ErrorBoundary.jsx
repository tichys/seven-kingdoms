import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', color: '#e8e1d3', background: '#0d0d0d', borderRadius: '8px', border: '1px solid #222' }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', color: '#b08d57', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#8a8278', marginBottom: '1rem' }}>The application encountered an error:</p>
          <pre style={{ fontSize: '0.85rem', color: '#c44', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#b08d57', color: '#050505', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
