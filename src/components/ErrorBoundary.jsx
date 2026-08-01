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
        <div className="container">
          <div className="error-state" style={{ marginTop: '6rem' }}>
            <div className="error-state-icon">&#9888;</div>
            <h3>Something Went Wrong</h3>
            <p>The application encountered an error. Try reloading the page.</p>
            <pre style={{ fontSize: '0.8rem', color: 'var(--danger)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '600px', margin: '0 auto 1rem' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
