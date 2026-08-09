import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const CRIME_LABELS = { theft: 'Theft', assault: 'Assault', murder: 'Murder', treason: 'Treason', poaching: 'Poaching', smuggling: 'Smuggling', arson: 'Arson', desertion: 'Desertion' }
const SEVERITY_LABELS = { 1: 'Misdemeanor', 2: 'Felony', 3: 'Capital' }
const SEVERITY_COLORS = { 1: '#6b8f3e', 2: '#b5642a', 3: '#702618' }
const CRIME_STATUS = { accused: 'Accused', convicted: 'Convicted', acquitted: 'Acquitted', pardoned: 'Pardoned', outlaw: 'Outlaw' }
const WEATHER_LABELS = { clear: 'Clear', rain: 'Rain', storm: 'Storm', snow: 'Snow', blizzard: 'Blizzard', fog: 'Fog', heatwave: 'Heatwave', drought: 'Drought', sandstorm: 'Sandstorm' }
const TOURNAMENT_LABELS = { joust: 'Joust', melee: 'Melee', archery: 'Archery', grand: 'Grand Tournament' }
const SITE_LABELS = { sept: 'Sept', weirwood: 'Weirwood Grove', temple: 'Temple', shrine: 'Shrine', great_sept: 'Great Sept' }
const OUTBREAK_LABELS = { greyscale: 'Greyscale', pale_mare: 'Pale Mare', red_death: 'Red Death', grey_fever: 'Grey Fever', custom: 'Unknown Plague' }
const ROAD_LABELS = { kings_road: "King's Road", highway: 'Highway', local: 'Local Road', bridge: 'Bridge' }

const TABS = [
  { id: 'justice', label: 'Justice' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'weather', label: 'Weather' },
  { id: 'production', label: 'Production' },
  { id: 'roads', label: 'Roads' },
  { id: 'vassalage', label: 'Vassalage' },
  { id: 'census', label: 'Census' },
  { id: 'religious', label: 'Religious Sites' },
  { id: 'outbreaks', label: 'Outbreaks' },
  { id: 'heraldry', label: 'Heraldry' },
]

export default function SettlementExpansion3() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('justice')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Realm Management</h1>
        <p className="text-muted">Justice, tournaments, infrastructure, and governance</p>
      </div>

      <div className="tabs">
        <div className="tab-nav" style={{ flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'justice' && <JusticeTab adminLevel={adminLevel} />}
        {tab === 'tournaments' && <TournamentsTab adminLevel={adminLevel} />}
        {tab === 'weather' && <WeatherTab adminLevel={adminLevel} />}
        {tab === 'production' && <ProductionTab adminLevel={adminLevel} />}
        {tab === 'roads' && <RoadsTab adminLevel={adminLevel} />}
        {tab === 'vassalage' && <VassalageTab adminLevel={adminLevel} />}
        {tab === 'census' && <CensusTab adminLevel={adminLevel} />}
        {tab === 'religious' && <ReligiousTab adminLevel={adminLevel} />}
        {tab === 'outbreaks' && <OutbreaksTab adminLevel={adminLevel} />}
        {tab === 'heraldry' && <HeraldryTab adminLevel={adminLevel} />}
      </div>
    </div>
  )
}

function JusticeTab({ adminLevel }) {
  const [records, setRecords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFile, setShowFile] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await api.criminalList(0, '')
      if (res.status === 'ok') setRecords(res.records)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={5} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowFile(true)}>File Crime Report</button>
      </div>
      {!records || records.length === 0 ? (
        <EmptyState icon="&#9876;" title="No Criminal Records" message="No crimes have been reported." />
      ) : (
        <div className="card">
          <div className="card-header"><h3>Criminal Records</h3></div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>#</th><th>Accused</th><th>Crime</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={async () => { const res = await api.criminalGet(r.id); if (res.status === 'ok') alert(JSON.stringify(res.record, null, 2)) }}>
                    <td>{r.id}</td>
                    <td>{r.avatar_name || r.avatar_key.slice(0, 8)}</td>
                    <td>{CRIME_LABELS[r.crime_type] || r.crime_type}</td>
                    <td><span className="wound-badge" style={{ background: SEVERITY_COLORS[r.severity], fontSize: '.75rem' }}>{SEVERITY_LABELS[r.severity]}</span></td>
                    <td><span className="text-muted">{CRIME_STATUS[r.status] || r.status}</span></td>
                    <td className="text-muted" style={{ fontSize: '.85rem' }}>{r.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showFile && <FileCrimeModal onClose={() => setShowFile(false)} onSubmit={async (data) => { try { await api.criminalFile(data); setShowFile(false); load() } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function FileCrimeModal({ onClose, onSubmit }) {
  const [subjectKey, setSubjectKey] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [crimeType, setCrimeType] = useState('theft')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState(1)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>File Crime Report</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Accused Avatar Key</label>
            <input className="form-input" style={{ width: '100%' }} value={subjectKey} onChange={e => setSubjectKey(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Accused Name</label>
            <input className="form-input" style={{ width: '100%' }} value={subjectName} onChange={e => setSubjectName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Crime Type</label>
            <select className="form-input" style={{ width: '100%' }} value={crimeType} onChange={e => setCrimeType(e.target.value)}>
              {Object.entries(CRIME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Severity</label>
            <select className="form-input" style={{ width: '100%' }} value={severity} onChange={e => setSeverity(Number(e.target.value))}>
              {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => onSubmit({ subject_key: subjectKey, subject_name: subjectName, crime_type: crimeType, description, severity })}>Submit</button>
        </div>
      </div>
    </div>
  )
}

function TournamentsTab({ adminLevel }) {
  const [tournaments, setTournaments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.tournamentList()
      if (res.status === 'ok') setTournaments(res.tournaments)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={5} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {adminLevel >= 1 && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Host Tournament</button></div>}
      {!tournaments || tournaments.length === 0 ? (
        <EmptyState icon="&#9876;" title="No Tournaments" message="No tournaments have been announced." />
      ) : (
        <div className="grid grid-2">
          {tournaments.map(t => (
            <div key={t.id} className="card">
              <div className="card-header"><h3>{t.name}</h3></div>
              <div className="card-body">
                <p><strong>Type:</strong> {TOURNAMENT_LABELS[t.event_type] || t.event_type}</p>
                <p><strong>Host:</strong> {t.host_house_name || 'Unknown'}</p>
                <p><strong>Entry Fee:</strong> {t.entry_fee} stars</p>
                <p><strong>Prize Pool:</strong> {t.prize_pool} stars</p>
                <p><strong>Status:</strong> <span className="text-gold">{t.status}</span></p>
                <p><strong>Scheduled:</strong> {t.scheduled_at?.slice(0, 16)}</p>
                {t.status === 'announced' || t.status === 'registration' ? (
                  <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.tournamentRegister(t.id); load() } catch (e) { setError(e.message) } }}>Register</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} onSubmit={async (data) => { try { await api.tournamentCreate(data); setShowCreate(false); load() } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function CreateTournamentModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [eventType, setEventType] = useState('joust')
  const [entryFee, setEntryFee] = useState(0)
  const [prizePool, setPrizePool] = useState(500)
  const [maxPart, setMaxPart] = useState(16)
  const [description, setDescription] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Host Tournament</h3><button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-input" style={{ width: '100%' }} value={eventType} onChange={e => setEventType(e.target.value)}>{Object.entries(TOURNAMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Entry Fee (stars)</label><input className="form-input" type="number" style={{ width: '100%' }} value={entryFee} onChange={e => setEntryFee(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Prize Pool (stars)</label><input className="form-input" type="number" style={{ width: '100%' }} value={prizePool} onChange={e => setPrizePool(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Max Participants</label><input className="form-input" type="number" style={{ width: '100%' }} value={maxPart} onChange={e => setMaxPart(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => onSubmit({ name, event_type: eventType, entry_fee: entryFee, prize_pool: prizePool, max_participants: maxPart, description })}>Create</button>
        </div>
      </div>
    </div>
  )
}

function WeatherTab({ adminLevel }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.weatherList()
      if (res.status === 'ok') setWeather(res.weather)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {!weather || weather.length === 0 ? (
        <EmptyState icon="&#9728;" title="No Active Weather" message="No weather effects are currently active." />
      ) : (
        <div className="grid grid-3">
          {weather.map(w => (
            <div key={w.id} className="card">
              <div className="card-header"><h3>{w.territory_name || `Territory #${w.territory_id}`}</h3></div>
              <div className="card-body">
                <p><strong>Weather:</strong> {WEATHER_LABELS[w.weather_type] || w.weather_type} (Intensity {w.intensity})</p>
                <p><strong>Food Production:</strong> {(w.food_modifier * 100).toFixed(0)}%</p>
                <p><strong>Gold Production:</strong> {(w.gold_modifier * 100).toFixed(0)}%</p>
                <p><strong>Combat Modifier:</strong> {w.combat_modifier > 0 ? '+' : ''}{w.combat_modifier}</p>
                <p><strong>Travel Speed:</strong> {(w.travel_modifier * 100).toFixed(0)}%</p>
                {w.description && <p className="text-muted">{w.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductionTab({ adminLevel }) {
  const [chains, setChains] = useState(null)
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([api.chainList(), api.chainStatus()])
      if (c.status === 'ok') setChains(c.chains)
      if (a.status === 'ok') setActive(a.productions)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {active && active.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h3>Active Production</h3></div>
          <div className="card-body">
            {active.map(p => (
              <div key={p.id} style={{ marginBottom: '.5rem' }}>
                <strong>{p.chain_name}</strong> - Step {p.current_step}
                <span className="text-muted" style={{ marginLeft: '1rem' }}>Completes: {p.step_completes_at?.slice(0, 16)}</span>
                <button className="btn btn-outline btn-sm" style={{ marginLeft: '1rem' }} onClick={async () => { try { await api.chainAdvance(p.id); load() } catch (e) { setError(e.message) } }}>Advance</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!chains || chains.length === 0 ? (
        <EmptyState icon="&#9881;" title="No Production Chains" message="No production chains have been defined." />
      ) : (
        <div className="grid grid-2">
          {chains.map(c => (
            <div key={c.id} className="card">
              <div className="card-header"><h3>{c.name}</h3></div>
              <div className="card-body">
                <p><strong>Output:</strong> {c.output_name || `Item #${c.output_item_id}`}</p>
                <p><strong>Skill:</strong> {c.required_skill} (min {c.min_skill_level})</p>
                <p><strong>Station:</strong> {c.station_type || 'Any'}</p>
                <p><strong>Total Time:</strong> {c.total_time_minutes} min</p>
                {c.steps && c.steps.length > 0 && (
                  <div style={{ marginTop: '.5rem' }}>
                    <strong>Steps:</strong>
                    {c.steps.map(s => <div key={s.id} className="text-muted" style={{ fontSize: '.85rem' }}>Step {s.step_number}: {s.input_name || 'Input'} x{s.input_quantity} {'->'} {s.output_name || 'Output'} x{s.output_quantity} ({s.time_minutes}m)</div>)}
                  </div>
                )}
                <button className="btn btn-outline btn-sm" style={{ marginTop: '.5rem' }} onClick={async () => { try { await api.chainStart(c.id, 0); load() } catch (e) { setError(e.message) } }}>Start Production</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoadsTab({ adminLevel }) {
  const [roads, setRoads] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.roadList()
      if (res.status === 'ok') setRoads(res.roads)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {!roads || roads.length === 0 ? (
        <EmptyState icon="&#9763;" title="No Roads" message="No roads have been defined yet." />
      ) : (
        roads.map(r => (
          <div key={r.id} className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>{r.name}</h3>
              <span className="text-muted">{ROAD_LABELS[r.road_type] || r.road_type}</span>
            </div>
            <div className="card-body">
              <p><strong>Condition:</strong> {'★'.repeat(r.condition)}{'☆'.repeat(5 - r.condition)} | <strong>Travel Speed:</strong> {(r.travel_speed_mod * 100).toFixed(0)}% | <strong>Trade Bonus:</strong> {(r.trade_bonus * 100).toFixed(0)}% | <strong>Maintenance:</strong> {r.maintenance_cost} stars/wk</p>
              {r.segments && r.segments.length > 0 && (
                <table className="stats-table" style={{ marginTop: '.5rem' }}>
                  <thead><tr><th>From</th><th>To</th><th>Distance</th><th>Condition</th><th>Bandits</th><th>Toll</th></tr></thead>
                  <tbody>
                    {r.segments.map(s => (
                      <tr key={s.id}>
                        <td>{s.terr1_name || `#${s.territory1_id}`}</td>
                        <td>{s.terr2_name || `#${s.territory2_id}`}</td>
                        <td>{s.distance_km} km</td>
                        <td>{'★'.repeat(s.condition)}</td>
                        <td>{s.has_bandits == 1 ? 'Yes' : 'No'}</td>
                        <td>{s.toll_cost} stars</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {adminLevel >= 1 && <button className="btn btn-outline btn-sm" style={{ marginTop: '.5rem' }} onClick={async () => { try { await api.roadRepair(r.id, 100); load() } catch (e) { setError(e.message) } }}>Repair Road</button>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function VassalageTab({ adminLevel }) {
  const [vassalage, setVassalage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.vassalageList(0, true)
      if (res.status === 'ok') setVassalage(res.vassalage)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {!vassalage || vassalage.length === 0 ? (
        <EmptyState icon="&#9876;" title="No Vassalage Oaths" message="No houses have sworn fealty." />
      ) : (
        <div className="card">
          <div className="card-header"><h3>Active Fealty Oaths</h3></div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>Vassal House</th><th>Overlord House</th><th>Tribute Rate</th><th>Military Aid</th><th>Sworn At</th><th></th></tr></thead>
              <tbody>
                {vassalage.filter(v => v.is_active == 1).map(v => (
                  <tr key={v.id}>
                    <td>{v.vassal_name || `#${v.vassal_house_id}`}</td>
                    <td>{v.lord_name || `#${v.lord_house_id}`}</td>
                    <td>{(v.tribute_rate * 100).toFixed(0)}%</td>
                    <td>{v.military_aid == 1 ? 'Yes' : 'No'}</td>
                    <td className="text-muted" style={{ fontSize: '.85rem' }}>{v.sworn_at?.slice(0, 10)}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={async () => { if (confirm('Break this vassalage oath?')) { try { await api.vassalageBreak(v.id, 'Broken via website'); load() } catch (e) { setError(e.message) } } }}>Break</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CensusTab({ adminLevel }) {
  const [census, setCensus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [territoryId, setTerritoryId] = useState(1)

  const load = useCallback(async () => {
    try {
      const res = await api.censusGet(territoryId)
      if (res.status === 'ok') setCensus(res.census)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [territoryId])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <input className="filter-input" type="number" placeholder="Territory ID" value={territoryId} onChange={e => setTerritoryId(Number(e.target.value))} />
        <button className="btn btn-outline btn-sm" onClick={load}>Load Census</button>
      </div>
      {!census ? (
        <EmptyState icon="&#128202;" title="No Census Data" message="No census has been recorded for this territory." />
      ) : (
        <div className="grid grid-3">
          <div className="card"><div className="card-header"><h3>Population</h3></div><div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--gold)' }}>{census.total_population}</p></div></div>
          <div className="card"><div className="card-header"><h3>Births (Year)</h3></div><div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--green)' }}>{census.births_this_year}</p></div></div>
          <div className="card"><div className="card-header"><h3>Deaths (Year)</h3></div><div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--red)' }}>{census.deaths_this_year}</p></div></div>
          <div className="card"><div className="card-header"><h3>Demographics</h3></div><div className="card-body">
            <p>Nobles: {census.nobles} | Knights: {census.knights}</p>
            <p>Men-at-Arms: {census.men_at_arms} | Smallfolk: {census.smallfolk}</p>
            <p>Merchants: {census.merchants} | Craftsmen: {census.craftsmen}</p>
            <p>Clergy: {census.clergy} | Children: {census.children} | Elderly: {census.elderly}</p>
          </div></div>
          <div className="card"><div className="card-header"><h3>Migration</h3></div><div className="card-body">
            <p>Immigrants: {census.immigrants}</p><p>Emigrants: {census.emigrants}</p>
          </div></div>
          <div className="card"><div className="card-header"><h3>Economy</h3></div><div className="card-body">
            <p>Food Consumption: {census.food_consumption}/day</p><p>Tax Base: {census.tax_base}</p>
          </div></div>
        </div>
      )}
    </div>
  )
}

function ReligiousTab({ adminLevel }) {
  const [sites, setSites] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.religiousSiteList(0)
      if (res.status === 'ok') setSites(res.sites)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {!sites || sites.length === 0 ? (
        <EmptyState icon="&#9961;" title="No Religious Sites" message="No religious sites have been established." />
      ) : (
        <div className="grid grid-2">
          {sites.map(s => (
            <div key={s.id} className="card">
              <div className="card-header"><h3>{s.name || SITE_LABELS[s.site_type] || s.site_type}</h3></div>
              <div className="card-body">
                <p><strong>Type:</strong> {SITE_LABELS[s.site_type] || s.site_type}</p>
                <p><strong>Religion:</strong> {s.religion_name || 'Any'}</p>
                <p><strong>Territory:</strong> {s.territory_name || `#${s.territory_id}`}</p>
                <p><strong>Devotion Bonus:</strong> +{s.devotion_bonus} | <strong>Piety Bonus:</strong> +{s.piety_bonus}</p>
                {s.pilgrimage_destination == 1 && <p className="text-gold">Pilgrimage Destination</p>}
                <p className="text-muted">Visitors: {s.visitor_count} | Last prayer: {s.last_prayer_at?.slice(0, 16) || 'Never'}</p>
                <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.religiousSitePray(s.id); load() } catch (e) { setError(e.message) } }}>Pray Here</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OutbreaksTab({ adminLevel }) {
  const [outbreaks, setOutbreaks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.outbreakList('')
      if (res.status === 'ok') setOutbreaks(res.outbreaks)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={4} />
  if (error) return <ErrorState message={error} onRetry={load} />

  const sevColors = { 1: '#6b8f3e', 2: '#b5642a', 3: '#702618', 4: '#4a1a0e' }
  const sevLabels = { 1: 'Contained', 2: 'Spreading', 3: 'Epidemic', 4: 'Plague' }

  return (
    <div>
      {!outbreaks || outbreaks.length === 0 ? (
        <EmptyState icon="&#9888;" title="No Disease Outbreaks" message="No disease outbreaks have been recorded." />
      ) : (
        <div className="grid grid-2">
          {outbreaks.map(o => (
            <div key={o.id} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>{OUTBREAK_LABELS[o.outbreak_type] || o.outbreak_type}</h3>
                <span className="wound-badge" style={{ background: sevColors[o.severity], fontSize: '.75rem' }}>{sevLabels[o.severity]}</span>
              </div>
              <div className="card-body">
                <p><strong>Territory:</strong> {o.territory_name || `#${o.territory_id}`}</p>
                <p><strong>Infected:</strong> {o.infected_count} | <strong>Deaths:</strong> {o.deaths_count}</p>
                <p><strong>Food Penalty:</strong> {(o.food_penalty * 100).toFixed(0)}% | <strong>Trade Penalty:</strong> {(o.trade_penalty * 100).toFixed(0)}%</p>
                <p><strong>Quarantine:</strong> {o.quarantine_active == 1 ? 'Active' : 'None'} | <strong>Status:</strong> <span className="text-gold">{o.status}</span></p>
                <p className="text-muted">Started: {o.started_at?.slice(0, 10)}</p>
                {adminLevel >= 1 && o.status === 'active' && (
                  <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.outbreakContain(o.id); load() } catch (e) { setError(e.message) } }}>Quarantine</button>
                    <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.outbreakResolve(o.id); load() } catch (e) { setError(e.message) } }}>Resolve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HeraldryTab({ adminLevel }) {
  const [heraldry, setHeraldry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.heraldryList(false)
      if (res.status === 'ok') setHeraldry(res.heraldry)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonTable rows={5} />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      {!heraldry || heraldry.length === 0 ? (
        <EmptyState icon="&#9876;" title="No Heraldry Registered" message="No houses have registered their heraldry." />
      ) : (
        <div className="grid grid-3">
          {heraldry.map(h => (
            <div key={h.id} className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{h.house_name || `House #${h.house_id}`}</h3>
                {h.is_historical == 1 && <span className="text-gold" style={{ fontSize: '.75rem' }}>Historical</span>}
              </div>
              <div className="card-body">
                {h.coat_of_arms && (() => {
                  try {
                    const coat = JSON.parse(h.coat_of_arms)
                    return (
                      <div style={{ marginBottom: '.5rem' }}>
                        {coat.shape && <p><strong>Shape:</strong> {coat.shape}</p>}
                        {coat.field_color && <p><strong>Field:</strong> <span style={{ color: coat.field_color }}>&#9608;</span> {coat.field_color}</p>}
                        {coat.charge && <p><strong>Charge:</strong> {coat.charge}</p>}
                        {coat.motto && <p className="text-muted" style={{ fontStyle: 'italic' }}>"{coat.motto}"</p>}
                      </div>
                    )
                  } catch { return null }
                })()}
                {h.blazon && <p className="text-muted" style={{ fontSize: '.85rem' }}>{h.blazon}</p>}
                <p><strong>Approved:</strong> {h.approved == 1 ? 'Yes' : 'Pending'}</p>
                {h.words && <p style={{ fontStyle: 'italic', color: 'var(--gold)' }}>"{h.words}"</p>}
                {adminLevel >= 2 && h.approved == 0 && (
                  <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.heraldryApprove(h.id); load() } catch (e) { setError(e.message) } }}>Approve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
