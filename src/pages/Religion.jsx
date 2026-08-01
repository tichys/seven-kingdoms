import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import { EmptyState, ErrorState } from '../components/Skeleton.jsx'

export default function Religion() {
  const { isAdmin } = useAuth()
  const [myReligion, setMyReligion] = useState(null)
  const [religions, setReligions] = useState(null)
  const [powers, setPowers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('my')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [r, list, p] = await Promise.all([
        api.religionGet().catch(e => ({ error: e.message })),
        api.religionList().catch(e => ({ error: e.message })),
        api.religionPowers().catch(e => ({ error: e.message }))
      ])
      if (r.error) { setError(r.error); setLoading(false); return }
      setMyReligion(r.religion ? r : null)
      setReligions(list.religions || [])
      setPowers(p.powers || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, msg) => {
    setMessage(null); setError(null)
    try { const r = await fn(); setMessage(r.message || msg); load() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Religion</h1>
        <p>Devote yourself to the gods, pray for piety, and invoke divine powers</p>
      </div>
      <div className="page-content">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <div className="tabs">
            <div className="tab-nav">
              <button className={`tab-btn${tab === 'my' ? ' active' : ''}`} onClick={() => setTab('my')}>My Faith</button>
              <button className={`tab-btn${tab === 'convert' ? ' active' : ''}`} onClick={() => setTab('convert')}>Convert</button>
              <button className={`tab-btn${tab === 'powers' ? ' active' : ''}`} onClick={() => setTab('powers')}>Divine Powers</button>
            </div>
            <div className="tab-panel active">
              {tab === 'my' && (
                myReligion ? (
                  <div className="card">
                    <div className="card-header">{myReligion.religion}</div>
                    <div className="card-body">
                      <p className="text-muted mb-2">{myReligion.description}</p>
                      <table className="stats-table">
                        <tbody>
                          <tr><th>Devotion</th><td>{myReligion.devotion}/100</td></tr>
                          <tr><th>Piety</th><td>{myReligion.piety}</td></tr>
                          <tr><th>Last Prayer</th><td>{myReligion.last_prayer ? new Date(myReligion.last_prayer).toLocaleString() : 'Never'}</td></tr>
                          <tr><th>Converted</th><td>{myReligion.converted_at ? new Date(myReligion.converted_at).toLocaleDateString() : 'Unknown'}</td></tr>
                          <tr><th>Devotion Ability</th><td>{myReligion.devotion_ability || 'None'}</td></tr>
                        </tbody>
                      </table>
                      <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.religionPray(), 'Prayed')}>
                        Pray (Daily)
                      </button>
                      <div className="mt-2">
                        <h4 style={{ fontSize: '.85rem', color: 'var(--gold)', marginBottom: '.5rem' }}>Sacrifice</h4>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.religionSacrifice('animal'), 'Animal sacrifice offered')}>
                            Animal (+5 devotion, +5 piety)
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.religionSacrifice('valuable'), 'Valuable sacrifice offered')}>
                            Valuable (-10 stars, +5 devotion, +8 piety)
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Blood sacrifice costs 1 permanent HP. Continue?')) doAction(() => api.religionSacrifice('blood'), 'Blood sacrifice offered') }}>
                            Blood (-1 max HP, +10 devotion, +10 piety)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No Religion" message="You have not devoted yourself to any god. Visit the Convert tab to choose your faith." />
                )
              )}

              {tab === 'convert' && (
                religions.length === 0 ? <EmptyState title="No Religions" message="No religions are available." /> : (
                  <div className="grid grid-2">
                    {religions.map(r => (
                      <div key={r.id} className="card" style={{ borderColor: myReligion?.religion_id === r.id ? 'var(--gold)' : 'var(--border)' }}>
                        <div className="card-header">{r.name}</div>
                        <div className="card-body">
                          <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{r.description}</p>
                          {r.devotion_ability && (
                            <p style={{ fontSize: '.8rem' }}><span className="text-muted">Devotion Ability:</span> <span className="text-gold">{r.devotion_ability}</span></p>
                          )}
                          {myReligion?.religion_id === r.id ? (
                            <span className="badge badge-gold">Current Faith</span>
                          ) : (
                            <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.religionSet(r.id), 'Converted')}>
                              {myReligion ? (isAdmin ? 'Change Faith' : 'Admin Required to Change') : 'Convert'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'powers' && (
                !myReligion ? <EmptyState title="No Powers" message="Convert to a religion to access divine powers." /> : (
                  <div>
                    <p className="text-muted mb-2">Current Piety: <span className="text-gold">{powers.length > 0 ? myReligion.piety : 0}</span></p>
                    <div className="grid grid-2">
                      {powers.map(p => (
                        <div key={p.key} className="card" style={{ opacity: p.usable ? 1 : 0.5 }}>
                          <div className="card-header">{p.name} <span style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>({p.cost} piety)</span></div>
                          <div className="card-body">
                            <p className="text-muted" style={{ fontSize: '.85rem' }}>{p.effect}</p>
                            <button
                              className="btn btn-primary btn-sm mt-2"
                              disabled={!p.usable}
                              onClick={() => doAction(() => api.religionUsePower(p.key), 'Power invoked')}
                            >
                              {p.usable ? 'Invoke' : 'Not Enough Piety'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
