import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Crafting() {
  const [tab, setTab] = useState('recipes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [stations, setStations] = useState([])
  const [activeCrafts, setActiveCrafts] = useState([])
  const [stationFilter, setStationFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rec, sta, check] = await Promise.all([
        api.craftRecipes(stationFilter || null).catch(e => ({ recipes: [], error: e.message })),
        api.craftStations().catch(e => ({ stations: [], error: e.message })),
        api.craftCheck().catch(e => ({ active_crafts: [], error: e.message }))
      ])
      if (rec.error) setError(rec.error)
      setRecipes(rec.recipes || [])
      setStations(sta.stations || [])
      setActiveCrafts(check.active_crafts || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [stationFilter])

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

  const stationTypes = [...new Set(recipes.map(r => r.station_type))].sort()

  return (
    <div>
      <div className="page-header">
        <h1>Crafting</h1>
        <p>Forge weapons, brew potions, cook provisions</p>
      </div>
      <div className="page-content">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tabs">
          <div className="tab-nav">
            <button className={`tab-btn${tab === 'recipes' ? ' active' : ''}`} onClick={() => setTab('recipes')}>Recipes ({recipes.length})</button>
            <button className={`tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Active ({activeCrafts.length})</button>
            <button className={`tab-btn${tab === 'stations' ? ' active' : ''}`} onClick={() => setTab('stations')}>Stations ({stations.length})</button>
          </div>
          <div className="tab-panel active">
            {loading ? <Loading /> : tab === 'recipes' ? (
              <>
                <div className="filter-bar mb-2">
                  <select className="filter-select" value={stationFilter} onChange={e => setStationFilter(e.target.value)}>
                    <option value="">All Stations</option>
                    {stationTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {recipes.length === 0 ? <p className="text-muted">No recipes found.</p> : (
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Name</th><th>Station</th><th>Skill</th><th>Lvl</th>
                        <th>Time</th><th>Materials</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.name}</strong></td>
                          <td style={{ textTransform: 'capitalize' }}>{r.station_type}</td>
                          <td>{r.skill_required}</td>
                          <td>{r.skill_level}</td>
                          <td>{r.time_minutes}m</td>
                          <td style={{ fontSize: '.8rem' }}>
                            {(r.materials || []).map(m => `${m.quantity}x item#${m.item_id}`).join(', ') || 'None'}
                          </td>
                          <td>
                            <select
                              className="filter-select"
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) doAction(() => api.craftStart(r.id, e.target.value), 'Crafting started')
                                e.target.value = ""
                              }}
                            >
                              <option value="" disabled>Select station...</option>
                              {stations.filter(s => s.station_type === r.station_type).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : tab === 'active' ? (
              activeCrafts.length === 0 ? <p className="text-muted">No active crafting jobs.</p> : (
                <div className="grid grid-2">
                  {activeCrafts.map(c => (
                    <div key={c.id} className="card">
                      <div className="card-header">{c.recipe_name}</div>
                      <div className="card-body">
                        <table className="stats-table">
                          <tbody>
                            <tr><th>Station</th><td>{c.station_name || 'Unknown'}</td></tr>
                            <tr><th>Started</th><td>{new Date(c.started_at).toLocaleString()}</td></tr>
                            <tr><th>Completes</th><td>{new Date(c.completes_at).toLocaleString()}</td></tr>
                            <tr><th>Status</th><td>{c.ready ? <span className="text-gold">Ready!</span> : `${c.seconds_left}s left`}</td></tr>
                          </tbody>
                        </table>
                        <div className="mt-2 d-flex gap-1">
                          {c.ready && (
                            <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.craftComplete(c.id), 'Craft complete!')}>
                              Collect
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.craftCancel(c.id), 'Craft cancelled')}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              stations.length === 0 ? <p className="text-muted">No crafting stations found.</p> : (
                <table className="stats-table">
                  <thead>
                    <tr><th>Name</th><th>Type</th><th>Territory</th></tr>
                  </thead>
                  <tbody>
                    {stations.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ textTransform: 'capitalize' }}>{s.station_type}</td>
                        <td>{s.territory_id || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
