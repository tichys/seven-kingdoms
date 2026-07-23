import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Quests() {
  const [tab, setTab] = useState('available')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [available, setAvailable] = useState([])
  const [active, setActive] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [avail, act] = await Promise.all([
        api.questList().catch(e => ({ quests: [], error: e.message })),
        api.questActive().catch(e => ({ quests: [], error: e.message }))
      ])
      if (avail.error) setError(avail.error)
      setAvailable(avail.quests || [])
      setActive(act.quests || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, label) => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fn()
      setSuccess(res.message || label || 'Done')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quests</h1>
        <p>Available adventures and active undertakings</p>
      </div>
      <div className="page-content">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tabs">
          <div className="tab-nav">
            <button className={`tab-btn${tab === 'available' ? ' active' : ''}`} onClick={() => setTab('available')}>Available ({available.length})</button>
            <button className={`tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Active ({active.length})</button>
          </div>
          <div className="tab-panel active">
            {loading ? <Loading /> : tab === 'available' ? (
              available.length === 0 ? <p className="text-muted">No quests available. Complete quests in-world or level up to unlock more.</p> : (
                <div className="grid grid-2">
                  {available.map(q => (
                    <div key={q.id} className="card">
                      <div className="card-header">
                        {q.name} <span className="text-muted" style={{ fontSize: '.8rem' }}>[{q.difficulty}]</span>
                      </div>
                      <div className="card-body">
                        <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{q.description}</p>
                        <table className="stats-table">
                          <tbody>
                            <tr><th>Type</th><td style={{ textTransform: 'capitalize' }}>{q.type}</td></tr>
                            <tr><th>Min Level</th><td>{q.min_level}</td></tr>
                            {q.prerequisite_id && <tr><th>Requires</th><td>Quest #{q.prerequisite_id}</td></tr>}
                            <tr><th>Repeatable</th><td>{q.repeatable ? 'Yes' : 'No'}</td></tr>
                            <tr><th>Rewards</th><td style={{ fontSize: '.8rem' }}>
                              {q.rewards_xp > 0 && `${q.rewards_xp}xp `}
                              {q.rewards_gold > 0 && `${q.rewards_gold}g `}
                              {q.rewards_stags > 0 && `${q.rewards_stags}s `}
                              {q.rewards_stars > 0 && `${q.rewards_stars} stars`}
                            </td></tr>
                          </tbody>
                        </table>
                        <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.questAccept(q.id), 'Quest accepted')}>
                          Accept Quest
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              active.length === 0 ? <p className="text-muted">No active quests. Accept one from the Available tab.</p> : (
                <div className="grid grid-2">
                  {active.map(q => (
                    <div key={q.id} className="card">
                      <div className="card-header">
                        {q.name} <span className="text-muted" style={{ fontSize: '.8rem' }}>[{q.status}]</span>
                      </div>
                      <div className="card-body">
                        <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{q.description}</p>
                        <table className="stats-table">
                          <tbody>
                            <tr><th>Type</th><td style={{ textTransform: 'capitalize' }}>{q.type}</td></tr>
                            <tr><th>Difficulty</th><td style={{ textTransform: 'capitalize' }}>{q.difficulty}</td></tr>
                            <tr><th>Status</th><td style={{ textTransform: 'capitalize' }}>{q.status}</td></tr>
                            <tr><th>Rewards</th><td style={{ fontSize: '.8rem' }}>
                              {q.rewards_xp > 0 && `${q.rewards_xp}xp `}
                              {q.rewards_gold > 0 && `${q.rewards_gold}g `}
                              {q.rewards_stags > 0 && `${q.rewards_stags}s `}
                              {q.rewards_stars > 0 && `${q.rewards_stars} stars`}
                            </td></tr>
                          </tbody>
                        </table>
                        <div className="mt-2 d-flex gap-1">
                          <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.questComplete(q.id), 'Quest completed')}>
                            Complete
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.questAbandon(q.id), 'Quest abandoned')}>
                            Abandon
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
