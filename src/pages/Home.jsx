import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const introCards = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>, title: 'The Realms', desc: 'Seven kingdoms, each ruled by a great house. From the frozen North to the sun-scorched sands of Dorne.', link: '/houses' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, title: 'Systems & Rules', desc: 'Character creation, combat mechanics, dice rolling, and the laws that govern roleplay in Westeros.', link: '/wiki' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>, title: 'Your Character', desc: 'View your stats, skills, inventory, wounds, magic, and manage your house membership.', link: '/character' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, title: 'Player History', desc: 'Combat logs, economy transactions, raven messages, and quest progress at your fingertips.', link: '/logs' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServerStatus()
      .then(data => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="fog-overlay" />
        <div className="hero-content">
          <div className="hero-crest">
            <svg viewBox="0 0 100 120" className="crest-svg crest-animated">
              <path d="M50 5 L90 25 L90 70 Q90 110 50 115 Q10 110 10 70 L10 25 Z" fill="none" stroke="#b08d57" strokeWidth="1.5" opacity="0.6"/>
              <path d="M50 15 L80 30 L80 65 Q80 100 50 105 Q20 100 20 65 L20 30 Z" fill="none" stroke="#b08d57" strokeWidth="0.5" opacity="0.3"/>
              <text x="50" y="55" textAnchor="middle" fill="#b08d57" fontFamily="Cinzel" fontSize="10" opacity="0.8">SEVEN KINGDOMS</text>
            </svg>
          </div>
          <h1 className="hero-title">
            <span className="hero-line">Winter is coming.</span>
            <span className="hero-line">The Seven Kingdoms await,</span>
            <span className="hero-line hero-line--accent">and only the strong survive.</span>
          </h1>
          <div className="hero-cta">
            {isAuthenticated ? (
              <Link to="/character" className="btn btn-primary">View Character</Link>
            ) : (
              <Link to="/login" className="btn btn-primary">Login to Your Character</Link>
            )}
            <Link to="/houses" className="btn btn-outline">Browse Houses</Link>
          </div>
        </div>
      </section>

      {/* Intro cards */}
      <section className="intro-section">
        <div className="container">
          <div className="intro-grid">
            {introCards.map((c, i) => (
              <div key={i} className="intro-card">
                <div className="intro-card-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <Link to={c.link} className="link-arrow">Explore</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Server status */}
      <section className="container" style={{ paddingBottom: '3rem' }}>
        <h2 className="section-title">Server Status</h2>
        <p className="section-subtitle">The current state of Westeros</p>
        {loading ? <Loading /> : status ? (
          <div className="grid grid-4">
            <div className="card">
              <div className="card-header">Year &amp; Season</div>
              <div className="card-body">
                <p style={{ fontSize: '1.5rem', color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>{status.year || 298}</p>
                <p className="text-muted">{status.season || 'Summer'} (Intensity {status.intensity || 3})</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Online</div>
              <div className="card-body">
                <p style={{ fontSize: '1.5rem', color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>{status.online || 0}</p>
                <p className="text-muted">players in-world</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Weather</div>
              <div className="card-body">
                <p style={{ fontSize: '1.5rem', color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>{status.weather || 'Clear'}</p>
                <p className="text-muted">across the realm</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Top Players</div>
              <div className="card-body">
                {(status.leaders || []).slice(0, 3).map((l, i) => (
                  <p key={i} style={{ fontSize: '.85rem' }}>
                    <span className="text-gold">{l.avatar_name}</span> &mdash; {l.rp_score} RP
                  </p>
                ))}
                {(!status.leaders || !status.leaders.length) && <p className="text-muted">No data</p>}
              </div>
            </div>
          </div>
        ) : <p className="text-muted text-center">Unable to reach server</p>}
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>Join the Story</h2>
            <p>Step into Westeros and write your own chapter. Roleplay awaits in The Seven Kingdoms.</p>
            <div className="cta-links">
              {isAuthenticated ? (
                <Link to="/character" className="btn btn-primary">My Character</Link>
              ) : (
                <Link to="/login" className="btn btn-primary">Login with SL Key</Link>
              )}
              <Link to="/wiki" className="btn btn-outline">Read the Rules</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
