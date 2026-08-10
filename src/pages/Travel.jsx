import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'journey', label: 'My Journey' },
  { id: 'travel', label: 'Travel' },
  { id: 'history', label: 'History' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'roads', label: 'Roads' },
]

const TRAVEL_TYPES = ['road', 'sea', 'mountain', 'river']
const DANGER_LABELS = { 1: 'Safe', 2: 'Low Risk', 3: 'Moderate', 4: 'Dangerous', 5: 'Very Dangerous' }
const ENCOUNTER_TYPES = ['bandits', 'wildlife', 'weather', 'discovery', 'friendly', 'npc']
const STATUS_COLORS = { traveling: 'text-gold', arrived: 'text-muted', ambushed: 'text-danger', turned_back: 'text-muted' }

function dangerColor(level) {
  if (level <= 2) return '#27ae60'
  if (level === 3) return '#f39c12'
  return '#c0392b'
}

function formatSecs(secs) {
  if (!secs || secs <= 0) return 'Ready to arrive'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

export default function Travel() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('journey')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [journey, setJourney] = useState(null)
  const [connections, setConnections] = useState(null)
  const [history, setHistory] = useState(null)
  const [encounters, setEncounters] = useState(null)
  const [allConnections, setAllConnections] = useState(null)
  const [territoryId, setTerritoryId] = useState(1)
  const [searchedTerritory, setSearchedTerritory] = useState(1)
  const [expandedJourney, setExpandedJourney] = useState(null)
  const [journeyEncounters, setJourneyEncounters] = useState({})
  const [showCreateConnection, setShowCreateConnection] = useState(false)
  const [showTrigger, setShowTrigger] = useState(false)
  const [resolveEncounterId, setResolveEncounterId] = useState(null)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'journey') { const r = await api.travelJourneyStatus(); if (r.status === 'ok') setJourney(r.journey) }
      if (which === 'history') { const r = await api.travelJourneyHistory(); if (r.status === 'ok') setHistory(r.journeys) }
      if (which === 'encounters') {
        const [statusRes, histRes] = await Promise.all([api.travelJourneyStatus(), api.travelJourneyHistory()])
        if (statusRes.status === 'ok') setJourney(statusRes.journey)
        if (histRes.status === 'ok') setHistory(histRes.journeys)
        const jid = statusRes.journey?.id || statusRes.journey?.journey_id
        if (jid) {
          const enc = await api.travelEncounterList(jid)
          setEncounters(enc.status === 'ok' ? enc.encounters : [])
        } else {
          const allEnc = []
          for (const j of (histRes.journeys || []).slice(0, 10)) {
            const jid2 = j.id || j.journey_id
            if (jid2) {
              const e = await api.travelEncounterList(jid2)
              if (e.status === 'ok' && e.encounters) allEnc.push(...e.encounters)
            }
          }
          setEncounters(allEnc)
        }
      }
      if (which === 'roads') { const r = await api.travelConnectionsAll(); if (r.status === 'ok') setAllConnections(r.connections) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  const visibleTabs = TABS.filter(t => t.id !== 'roads' || adminLevel >= 1)

  const findRoutes = async () => {
    setError(null)
    try {
      const r = await api.travelConnectionsFrom(territoryId)
      if (r.status === 'ok') { setConnections(r.connections); setSearchedTerritory(territoryId) }
    } catch (e) { setError(e.message) }
  }

  const toggleJourney = async (jid) => {
    if (expandedJourney === jid) { setExpandedJourney(null); return }
    setExpandedJourney(jid)
    if (!journeyEncounters[jid]) {
      try {
        const r = await api.travelEncounterList(jid)
        if (r.status === 'ok') setJourneyEncounters(prev => ({ ...prev, [jid]: r.encounters || [] }))
      } catch (e) { setError(e.message) }
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Travel & Roads</h1>
        <p className="text-muted">Journey across Westeros via the kingsroad, sea lanes, and mountain passes</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {visibleTabs.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'journey' && (
          <div>
            {!journey ? <EmptyState icon="&#127968;" title="Not Traveling" message="You are not currently traveling." /> : (
              <div className="card">
                <div className="card-header"><h3>Active Journey</h3></div>
                <div className="card-body">
                  <p><strong>From:</strong> Territory #{journey.from_territory_id}</p>
                  <p><strong>To:</strong> Territory #{journey.to_territory_id}</p>
                  <p><strong>Type:</strong> {journey.travel_type}</p>
                  <p><strong>Status:</strong> <span className={STATUS_COLORS[journey.status] || 'text-muted'}>{journey.status}</span></p>
                  {journey.status === 'ambushed' && <p className="text-danger"><strong>&#9888; Warning:</strong> You have been ambushed!</p>}
                  <p><strong>Departure:</strong> {journey.departure_at?.slice(0, 16)}</p>
                  <p><strong>Arrival:</strong> {journey.arrival_at?.slice(0, 16)}</p>
                  <p><strong>Remaining:</strong> <span className="text-gold">{formatSecs(journey.remaining_secs)}</span></p>
                  <p><strong>Escorts:</strong> {journey.escort_count}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem' }}>
                    {journey.remaining_secs <= 0 && <button className="btn btn-primary btn-sm" onClick={async () => { try { await api.travelJourneyArrive(); load('journey') } catch (e) { setError(e.message) } }}>Arrive</button>}
                    <button className="btn btn-outline btn-sm" onClick={async () => { if (confirm('Cancel your journey?')) { try { await api.travelJourneyCancel(); load('journey') } catch (e) { setError(e.message) } } }}>Cancel Journey</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'travel' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input className="form-input" type="number" style={{ width: '120px' }} value={territoryId} onChange={e => setTerritoryId(Number(e.target.value))} placeholder="Territory ID" />
              <button className="btn btn-primary btn-sm" onClick={findRoutes}>Find Routes</button>
            </div>
            {!connections || connections.length === 0 ? <EmptyState icon="&#128506;" title="No Routes" message="Enter a territory ID and click Find Routes to see available connections." /> : (
              <div className="grid grid-2">
                {connections.map(c => (
                  <div key={c.to_territory_id} className="card">
                    <div className="card-header"><h3>{c.destination_name}</h3></div>
                    <div className="card-body">
                      <p><strong>Road:</strong> {c.road_name || 'Unnamed'}</p>
                      <p><strong>Type:</strong> {c.travel_type}</p>
                      <p><strong>Duration:</strong> {c.travel_hours} hours</p>
                      <p><strong>Danger:</strong> <span style={{ color: dangerColor(c.danger_level) }}>{DANGER_LABELS[c.danger_level] || 'Unknown'}</span></p>
                      {c.is_passable == 1 ? (
                        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                          <input id={`escort-${c.to_territory_id}`} className="form-input" style={{ width: '100px' }} type="number" defaultValue={0} placeholder="Escorts" />
                          <button className="btn btn-primary btn-sm" onClick={async () => {
                            const escorts = parseInt(document.getElementById(`escort-${c.to_territory_id}`).value) || 0
                            try { await api.travelJourneyStart(searchedTerritory, c.to_territory_id, escorts); load('journey'); setTab('journey') } catch (e) { setError(e.message) }
                          }}>Travel</button>
                        </div>
                      ) : <p className="text-danger">Impassable</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {!history || history.length === 0 ? <EmptyState icon="&#128218;" title="No Journey History" message="You have no past journeys." /> : (
              <div>
                <div className="card"><div className="card-body">
                  <table className="stats-table">
                    <thead><tr><th>#</th><th>From</th><th>To</th><th>Type</th><th>Status</th><th>Departure</th><th>Arrival</th><th></th></tr></thead>
                    <tbody>
                      {history.map(j => (
                        <tr key={j.id}>
                          <td>{j.id}</td>
                          <td>Territory #{j.from_territory_id}</td>
                          <td>Territory #{j.to_territory_id}</td>
                          <td>{j.travel_type}</td>
                          <td><span className={STATUS_COLORS[j.status] || 'text-muted'}>{j.status}</span></td>
                          <td className="text-muted">{j.departure_at?.slice(0, 16)}</td>
                          <td className="text-muted">{j.arrival_at?.slice(0, 16)}</td>
                          <td><button className="btn btn-outline btn-sm" onClick={() => toggleJourney(j.id || j.journey_id)}>{expandedJourney === (j.id || j.journey_id) ? 'Hide' : 'Encounters'}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
                {expandedJourney && journeyEncounters[expandedJourney] && (
                  <div className="card" style={{ marginTop: '1rem' }}>
                    <div className="card-header"><h3>Encounters — Journey #{expandedJourney}</h3></div>
                    <div className="card-body">
                      {journeyEncounters[expandedJourney].length === 0 ? <p className="text-muted">No encounters on this journey.</p> : (
                        <div>
                          {journeyEncounters[expandedJourney].map((en, i) => (
                            <div key={i} style={{ marginBottom: '.5rem', paddingLeft: '1rem' }}>
                              <span className="text-gold">{en.encounter_type}</span> — {en.description}
                              {en.is_resolved == 1 && <span className="text-muted"> (Resolved: {en.resolution})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'encounters' && (
          <div>
            {adminLevel >= 1 && journey && (
              <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowTrigger(true)}>Trigger Encounter</button></div>
            )}
            {!encounters || encounters.length === 0 ? <EmptyState icon="&#128165;" title="No Encounters" message="No encounters to report." /> : (
              <div className="grid grid-2">
                {encounters.map((en, i) => (
                  <div key={i} className="card">
                    <div className="card-header"><h3><span className="text-gold">{en.encounter_type}</span></h3></div>
                    <div className="card-body">
                      <p>{en.description}</p>
                      <p><strong>Resolved:</strong> {en.is_resolved == 1 ? 'Yes' : 'No'}</p>
                      {en.resolution && <p className="text-muted"><strong>Resolution:</strong> {en.resolution}</p>}
                      <p className="text-muted">Triggered: {en.triggered_at?.slice(0, 16)}</p>
                      {en.is_resolved != 1 && en.id && <button className="btn btn-outline btn-sm" style={{ marginTop: '.5rem' }} onClick={() => setResolveEncounterId(en.id)}>Resolve</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'roads' && adminLevel >= 1 && (
          <div>
            <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowCreateConnection(true)}>Create Road</button></div>
            {!allConnections || allConnections.length === 0 ? <EmptyState icon="&#128734;" title="No Roads" message="No territory connections defined." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>From</th><th>To</th><th>Type</th><th>Hours</th><th>Danger</th><th>Road Name</th><th>Passable</th></tr></thead>
                  <tbody>
                    {allConnections.map((c, i) => (
                      <tr key={i}>
                        <td>{c.origin_name}</td>
                        <td>{c.destination_name}</td>
                        <td>{c.travel_type}</td>
                        <td>{c.travel_hours}</td>
                        <td style={{ color: dangerColor(c.danger_level) }}>{DANGER_LABELS[c.danger_level] || 'Unknown'}</td>
                        <td>{c.road_name || 'Unnamed'}</td>
                        <td>{c.is_passable == 1 ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showCreateConnection && <CreateConnectionModal onClose={() => setShowCreateConnection(false)} onSubmit={async (data) => { try { await api.travelConnectionCreate(data); setShowCreateConnection(false); load('roads') } catch (e) { setError(e.message) } }} />}
      {showTrigger && <TriggerEncounterModal onClose={() => setShowTrigger(false)} onSubmit={async (data) => { try { const jid = journey?.id || journey?.journey_id; await api.travelEncounterTrigger({ journey_id: jid, ...data }); setShowTrigger(false); load('encounters') } catch (e) { setError(e.message) } }} />}
      {resolveEncounterId && <ResolveEncounterModal onClose={() => setResolveEncounterId(null)} onSubmit={async (resolution) => { try { await api.travelEncounterResolve(resolveEncounterId, resolution); setResolveEncounterId(null); load('encounters') } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function CreateConnectionModal({ onClose, onSubmit }) {
  const [fromId, setFromId] = useState(1)
  const [toId, setToId] = useState(2)
  const [travelType, setTravelType] = useState('road')
  const [travelHours, setTravelHours] = useState(8)
  const [dangerLevel, setDangerLevel] = useState(2)
  const [roadName, setRoadName] = useState('')
  return (
    <Modal title="Create Road" onClose={onClose}>
      <div className="form-group"><label className="form-label">From Territory ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={fromId} onChange={e => setFromId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">To Territory ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={toId} onChange={e => setToId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Travel Type</label><select className="form-input" style={{ width: '100%' }} value={travelType} onChange={e => setTravelType(e.target.value)}>{TRAVEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Travel Hours</label><input className="form-input" type="number" style={{ width: '100%' }} value={travelHours} onChange={e => setTravelHours(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Danger Level</label><select className="form-input" style={{ width: '100%' }} value={dangerLevel} onChange={e => setDangerLevel(Number(e.target.value))}>{Object.entries(DANGER_LABELS).map(([k, v]) => <option key={k} value={Number(k)}>{v}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Road Name</label><input className="form-input" style={{ width: '100%' }} value={roadName} onChange={e => setRoadName(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ from_territory_id: fromId, to_territory_id: toId, travel_type: travelType, travel_hours: travelHours, danger_level: dangerLevel, road_name: roadName })}>Create</button>
    </Modal>
  )
}

function TriggerEncounterModal({ onClose, onSubmit }) {
  const [encounterType, setEncounterType] = useState('bandits')
  const [description, setDescription] = useState('')
  return (
    <Modal title="Trigger Encounter" onClose={onClose}>
      <div className="form-group"><label className="form-label">Encounter Type</label><select className="form-input" style={{ width: '100%' }} value={encounterType} onChange={e => setEncounterType(e.target.value)}>{ENCOUNTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Description</label><input className="form-input" style={{ width: '100%' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ encounter_type: encounterType, description })}>Trigger</button>
    </Modal>
  )
}

function ResolveEncounterModal({ onClose, onSubmit }) {
  const [resolution, setResolution] = useState('')
  return (
    <Modal title="Resolve Encounter" onClose={onClose}>
      <div className="form-group"><label className="form-label">Resolution</label><textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={resolution} onChange={e => setResolution(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit(resolution)}>Resolve</button>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{title}</h3><button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}
