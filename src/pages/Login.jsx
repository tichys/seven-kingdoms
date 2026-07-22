import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarKey, setAvatarKey] = useState('')
  const [avatarName, setAvatarName] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/character'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!avatarKey.trim()) {
      setError('Please enter your Second Life avatar key')
      setSubmitting(false)
      return
    }

    const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!keyPattern.test(avatarKey.trim())) {
      setError('Invalid UUID format. Avatar keys look like: 00000000-0000-0000-0000-000000000000')
      setSubmitting(false)
      return
    }

    const result = await login(avatarKey.trim(), avatarName.trim() || 'Unknown')
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Login failed. Make sure you have registered in-world first.')
    }
    setSubmitting(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">Login to Your Character</h1>
        <p className="text-muted text-center mb-4" style={{ fontSize: '.9rem' }}>
          Enter your Second Life avatar key to access your character.
          You must have worn the HUD in-world at least once to register.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Second Life Avatar Key</label>
            <input
              type="text"
              className="form-input"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={avatarKey}
              onChange={(e) => setAvatarKey(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Avatar Name (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Stark"
              value={avatarName}
              onChange={(e) => setAvatarName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-help">
          <p><strong>How to find your avatar key:</strong></p>
          <ul>
            <li>Check the HUD's "Status" menu in-world (it displays your key)</li>
            <li>Use a key finder script in Second Life</li>
            <li>Visit my.secondlife.com and check your profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
