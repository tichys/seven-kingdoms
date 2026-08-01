import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'

export default function DiscordCallback() {
  const { discordLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('processing')
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace(/^#\/discord-callback\?/, ''))
    const code = params.get('code') || hashParams.get('code')
    const state = params.get('state') || hashParams.get('state')

    if (!code) {
      setStatus('error')
      setErrorMsg('No authorization code received from Discord.')
      return
    }

    let cancelled = false

    async function processCallback() {
      try {
        const data = await api.discordCallback(code, state)
        if (cancelled) return

        if (data.mode === 'login' && data.session) {
          discordLogin(data.session, data.player)
          if (!data.player?.character_approved || !data.player?.has_archetype) {
            navigate('/character-creator', { replace: true })
          } else {
            navigate('/character', { replace: true })
          }
        } else if (data.mode === 'link') {
          setStatus('linked')
          setTimeout(() => navigate('/character', { replace: true }), 2000)
        }
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(err.message || 'Discord authentication failed.')
      }
    }

    processCallback()
    return () => { cancelled = true }
  }, [])

  if (status === 'processing') {
    return (
      <div className="login-wrap">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h1 className="login-title">Discord Authentication</h1>
          <p className="text-muted">Verifying with Discord...</p>
        </div>
      </div>
    )
  }

  if (status === 'linked') {
    return (
      <div className="login-wrap">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h1 className="login-title">Discord Linked!</h1>
          <p className="text-muted">Your Discord account has been linked. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1 className="login-title">Discord Authentication Failed</h1>
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    </div>
  )
}
