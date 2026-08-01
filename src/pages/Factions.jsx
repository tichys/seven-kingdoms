import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import { EmptyState, ErrorState } from '../components/Skeleton.jsx'

export default function Factions() {
  const [factions, setFactions] = useState(null)
  const [rewards, setRewards] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('list')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [f, r] = await Promise.all([
        api.factionList().catch(e => ({ error: e.message })),
        api.factionRewards().catch(e => ({ error: e.message }))
      ])
      if (f.error) { setError(f.error); setLoading(false); return }
      setFactions(f.factions || [])
      setRewards(r.rewards || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, msg) => {
    setMessage(null); setError(null)
    try { const r = await fn(); setMessage(r.message || msg); load() }
    catch (err) { setError(err.message) }
  }

  const tierColors = {
    nemesis: '#8b1a1a', enemy: '#8b4513', unfriendly: '#8a7a2a',
    wary: '#5a5550', neutral: '#8a8278', known: '#5b7db1',
    friendly: '#4d7c5b', honored: '#b08d57', exalted: '#d4b483', revered: '#daa520'
  }

  return (
    <div>
      <div className="page-header">
        <h1>Factions</h1>
        <p>Join factions, build reputation, and claim rewards</p>
      </div>
      <div className="page-content">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <div className="tabs">
            <div className="tab-nav">
              <button className={`tab-btn${tab === 'list' ? ' active' : ''}`} onClick={() => setTab('list')}>All Factions</button>
              <button className={`tab-btn${tab === 'rewards' ? ' active' : ''}`} onClick={() => setTab('rewards')}>Rewards ({rewards.length})</button>
            </div>
            <div className="tab-panel active">
              {tab === 'list' && (
                factions.length === 0 ? <EmptyState title="No Factions" message="No factions have been defined yet." /> : (
                  <div className="grid grid-2">
                    {factions.map(f => (
                      <div key={f.id} className="card" style={{ borderColor: f.joined ? 'var(--gold-dim)' : 'var(--border)' }}>
                        <div className="card-header">
                          {f.name} <span style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>({f.type})</span>
                        </div>
                        <div className="card-body">
                          <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{f.description}</p>
                          <table className="stats-table">
                            <tbody>
                              <tr>
                                <th>Reputation</th>
                                <td>
                                  <span style={{ color: tierColors[f.tier] || 'var(--text)', fontWeight: 600 }}>{f.reputation}</span>
                                  <span style={{ fontSize: '.75rem', color: 'var(--text-dim)', marginLeft: '.5rem', textTransform: 'capitalize' }}>({f.tier})</span>
                                </td>
                              </tr>
                              <tr><th>Joined</th><td>{f.joined ? 'Yes' : 'No'}</td></tr>
                            </tbody>
                          </table>
                          {f.joinable && !f.joined && (
                            <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.factionJoin(f.id), 'Joined faction')}>
                              Join
                            </button>
                          )}
                          {f.joined && <span className="badge badge-gold">Member</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'rewards' && (
                rewards.length === 0 ? <EmptyState title="No Rewards Available" message="Join a faction and build reputation to unlock rewards." /> : (
                  <table className="stats-table">
                    <thead><tr><th>Faction</th><th>Reward</th><th>Tier</th><th>Rep Required</th><th>Your Rep</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {rewards.map(r => (
                        <tr key={r.reward_id}>
                          <td>{r.faction}</td>
                          <td>{r.description || r.type}</td>
                          <td style={{ textTransform: 'capitalize' }}>{r.tier}</td>
                          <td>{r.reputation_required}</td>
                          <td>{r.current_reputation}</td>
                          <td>
                            {r.claimed ? <span className="badge badge-green">Claimed</span>
                              : r.claimable ? <span className="badge badge-gold">Available</span>
                              : <span className="text-muted">Locked</span>}
                          </td>
                          <td>
                            {r.claimable && (
                              <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.factionClaim(r.reward_id), 'Reward claimed!')}>
                                Claim
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
