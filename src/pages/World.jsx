import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import { EmptyState, ErrorState } from '../components/Skeleton.jsx'

export default function World() {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [activeEvents, setActiveEvents] = useState([])
  const [myPlot, setMyPlot] = useState(null)
  const [plots, setPlots] = useState([])
  const [buffs, setBuffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('events')
  const [showCreate, setShowCreate] = useState(false)
  const [eventForm, setEventForm] = useState({ name: '', event_type: 'invasion', region: '', severity: 1, description: '', end_date: '' })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [el, ea, mp, fb] = await Promise.all([
        api.eventList().catch(e => ({ events: [] })),
        api.eventActive().catch(e => ({ events: [] })),
        api.plotMy().catch(e => ({ plot: null })),
        api.feastMy().catch(e => ({ buffs: [] }))
      ])
      setEvents(el.events || [])
      setActiveEvents(ea.events || [])
      setMyPlot(mp.plot || null)
      setBuffs(fb.buffs || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, msg) => {
    setMessage(null); setError(null)
    try { const r = await fn(); setMessage(r.message || msg); load() }
    catch (err) { setError(err.message) }
  }

  const severityColors = { 1: '#4d7c5b', 2: '#b08d57', 3: '#8a7a2a', 4: '#8b4513', 5: '#8b1a1a' }
  const eventTypes = ['invasion', 'plague', 'famine', 'storm', 'festival', 'tournament', 'religious']

  return (
    <div>
      <div className="page-header">
        <h1>World</h1>
        <p>Seasonal events, housing, and feast buffs</p>
      </div>
      <div className="page-content">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <div className="tabs">
            <div className="tab-nav">
              <button className={`tab-btn${tab === 'events' ? ' active' : ''}`} onClick={() => setTab('events')}>Events ({activeEvents.length})</button>
              <button className={`tab-btn${tab === 'housing' ? ' active' : ''}`} onClick={() => setTab('housing')}>Housing</button>
              <button className={`tab-btn${tab === 'buffs' ? ' active' : ''}`} onClick={() => setTab('buffs')}>Feast Buffs ({buffs.length})</button>
            </div>
            <div className="tab-panel active">
              {tab === 'events' && (
                <div>
                  {activeEvents.length > 0 && (
                    <div className="card mb-3">
                      <div className="card-header">Active Events</div>
                      <div className="card-body">
                        {activeEvents.map(e => (
                          <div key={e.id} className="item-card" style={{ borderLeft: `3px solid ${severityColors[e.severity] || 'var(--border)'}` }}>
                            <div className="item-name">{e.name} <span className="text-muted" style={{ fontSize: '.75rem' }}>({e.type})</span></div>
                            <div className="item-type">{e.description}</div>
                            <div style={{ fontSize: '.78rem', marginTop: '.25rem' }}>
                              <span className="text-muted">Region: {e.region}</span>
                              <span className="text-muted" style={{ marginLeft: '1rem' }}>Severity: {e.severity}/5</span>
                              {e.end && <span className="text-muted" style={{ marginLeft: '1rem' }}>Ends: {new Date(e.end).toLocaleDateString()}</span>}
                            </div>
                            {isAdmin && (
                              <button className="btn btn-danger btn-sm mt-1" onClick={() => doAction(() => api.eventEnd(e.id), 'Event ended')}>
                                End Event
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="card mb-3">
                      <div className="card-header">Create Event</div>
                      <div className="card-body">
                        {!showFound ? (
                          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>New Event</button>
                        ) : (
                          <div>
                            <div className="grid grid-2">
                              <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <input className="form-input" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} placeholder="Wildling Raid" />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={eventForm.event_type} onChange={e => setEventForm({...eventForm, event_type: e.target.value})}>
                                  {eventTypes.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Region (optional)</label>
                                <input className="form-input" value={eventForm.region} onChange={e => setEventForm({...eventForm, region: e.target.value})} placeholder="North" />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Severity (1-5)</label>
                                <input className="form-input" type="number" min="1" max="5" value={eventForm.severity} onChange={e => setEventForm({...eventForm, severity: parseInt(e.target.value) || 1})} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} placeholder="Wildlings have crossed the Wall..." />
                              </div>
                              <div className="form-group">
                                <label className="form-label">End Date (optional)</label>
                                <input className="form-input" type="datetime-local" value={eventForm.end_date} onChange={e => setEventForm({...eventForm, end_date: e.target.value})} />
                              </div>
                            </div>
                            <div className="d-flex gap-1 mt-2">
                              <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.eventCreate(eventForm.name, eventForm.event_type, eventForm.region, eventForm.severity, eventForm.description, eventForm.end_date), 'Event created')}>Create</button>
                              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="mb-2">Past Events ({events.length})</h3>
                  {events.length === 0 ? <EmptyState title="No Events" message="No events have been recorded." /> : (
                    <table className="stats-table">
                      <thead><tr><th>Name</th><th>Type</th><th>Region</th><th>Severity</th><th>Start</th><th>End</th></tr></thead>
                      <tbody>
                        {events.map(e => (
                          <tr key={e.id}>
                            <td><strong>{e.name}</strong></td>
                            <td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                            <td>{e.region}</td>
                            <td><span style={{ color: severityColors[e.severity] }}>{e.severity}/5</span></td>
                            <td style={{ fontSize: '.8rem' }}>{new Date(e.start).toLocaleDateString()}</td>
                            <td style={{ fontSize: '.8rem' }}>{e.end ? new Date(e.end).toLocaleDateString() : 'Active'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === 'housing' && (
                myPlot ? (
                  <div className="card">
                    <div className="card-header">Your Plot: {myPlot.house_name}</div>
                    <div className="card-body">
                      <table className="stats-table">
                        <tbody>
                          <tr><th>Location</th><td>{myPlot.territory}</td></tr>
                          <tr><th>Rent</th><td>{myPlot.rent} stars/week</td></tr>
                          <tr><th>Claimed</th><td>{new Date(myPlot.claimed_at).toLocaleDateString()}</td></tr>
                        </tbody>
                      </table>
                      <button className="btn btn-danger btn-sm mt-2" onClick={() => { if (confirm('Abandon this plot?')) doAction(() => api.plotAbandon(myPlot.id), 'Plot abandoned') }}>
                        Abandon Plot
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No Housing" message="You have not claimed any housing plot. Use the in-world housing objects to claim a plot." />
                )
              )}

              {tab === 'buffs' && (
                buffs.length === 0 ? <EmptyState title="No Active Buffs" message="You have no active feast buffs. Visit a tavern or ask an admin for feast buffs." /> : (
                  <div className="grid grid-2">
                    {buffs.map(b => (
                      <div key={b.id} className="card">
                        <div className="card-header" style={{ textTransform: 'capitalize' }}>{b.type}</div>
                        <div className="card-body">
                          <table className="stats-table">
                            <tbody>
                              {b.stat && <tr><th>Bonus Stat</th><td>{b.stat} +{b.value}</td></tr>}
                              {b.hp_bonus > 0 && <tr><th>HP Bonus</th><td>+{b.hp_bonus}</td></tr>}
                              {b.xp_bonus > 0 && <tr><th>XP Bonus</th><td>+{b.xp_bonus}%</td></tr>}
                              <tr><th>Expires</th><td style={{ fontSize: '.8rem' }}>{new Date(b.expires).toLocaleString()}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
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
