import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarKey, setAvatarKey] = useState('')
  const [loginCode, setLoginCode] = useState('')
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

    if (!loginCode.trim()) {
      setError('Please enter your one-time login code from the HUD')
      setSubmitting(false)
      return
    }

    const result = await login(avatarKey.trim(), loginCode.trim())
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Login failed. Check your code and try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">Login to Your Character</h1>
        <p className="text-muted text-center mb-4" style={{ fontSize: '.9rem' }}>
          Enter your avatar key and a one-time login code generated from the HUD in-world.
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
            <label className="form-label">Login Code</label>
            <input
              type="text"
              className="form-input"
              placeholder="6-digit code from HUD"
              maxLength="6"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, ''))}
              disabled={submitting}
            />
            <small className="text-muted" style={{ fontSize: '.8rem', display: 'block', marginTop: '.25rem' }}>
              Wear the HUD in-world and say <strong>/7 web</strong> to generate a code.
              Codes expire after 5 minutes.
            </small>
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
