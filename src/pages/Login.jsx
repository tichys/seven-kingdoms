import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import Icon from '../components/Icon.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [avatarKey, setAvatarKey] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)

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
      if (!result.player?.character_approved || !result.player?.has_archetype) {
        navigate('/character-creator', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } else {
      setError(result.error || 'Login failed. Check your code and try again.')
    }
    setSubmitting(false)
  }

  const handleDiscordLogin = async () => {
    setError(null)
    setDiscordLoading(true)
    try {
      const data = await api.discordAuthUrl('login')
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to get Discord login URL.')
      }
    } catch (err) {
      setError(err.message || 'Discord login is not available.')
    }
    setDiscordLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div aria-hidden="true" style={{
          height: '7px',
          background: 'repeating-linear-gradient(90deg, #2a2a2a 0px, #161616 3px, #050505 6px, #161616 9px)',
          boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.6), 0 1px 0 rgba(197,160,89,.12)',
          borderRadius: '3px',
          marginBottom: '1.5rem',
        }} />
        <span className="ember" style={{ left: '20%', animationDelay: '0s', animationDuration: '4s', pointerEvents: 'none' }} />
        <span className="ember" style={{ left: '55%', animationDelay: '1.5s', animationDuration: '5s', pointerEvents: 'none' }} />
        <span className="ember" style={{ left: '80%', animationDelay: '3s', animationDuration: '4.5s', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center' }}>
          <svg viewBox="0 0 100 120" className="crest-svg" style={{ width: '48px', height: '58px', opacity: '.8' }}>
            <path d="M50 5 L90 25 L90 70 Q90 110 50 115 Q10 110 10 70 L10 25 Z" fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.6" />
            <path d="M50 15 L80 30 L80 65 Q80 100 50 105 Q20 100 20 65 L20 30 Z" fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.3" />
          </svg>
        </div>
        <div style={{ textAlign: 'center', marginTop: '.75rem', marginBottom: '1rem' }}>
          <Icon name="gate" size={32} color="var(--gold)" />
        </div>
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
              Wear the HUD in-world and say <strong>/hud web</strong> or touch the HUD and select <strong>Web Login</strong> to generate a code.
              Codes expire after 5 minutes.
            </small>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login with HUD Code'}
          </button>
        </form>

        <div className="divider-ornate"><span>or</span></div>

        <button
          className="btn btn-discord btn-block"
          onClick={handleDiscordLogin}
          disabled={discordLoading}
        >
          {discordLoading ? 'Redirecting...' : (
            <>
              <Icon name="raven" size={18} color="currentColor" style={{ verticalAlign: 'middle', marginRight: '.5rem' }} />
              Send a Raven
            </>
          )}
        </button>
        <small className="text-muted" style={{ fontSize: '.8rem', display: 'block', textAlign: 'center', marginTop: '.5rem' }}>
          Login with your linked Discord account. First time? Login with HUD code above, then link Discord in Character settings.
        </small>

        <div className="login-help">
          <p><strong>How to find your avatar key:</strong></p>
          <ul>
            <li>Touch the HUD in-world — your key is shown on the main menu dialog</li>
            <li>Say <strong>/hud status</strong> in chat</li>
            <li>Use a key finder script in Second Life</li>
            <li>Visit my.secondlife.com and check your profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
