import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import '../styles/settlement.css'

const UPGRADE_TYPES = ['walls', 'garrison', 'market', 'farm', 'mine', 'harbor', 'sept', 'weirwood', 'forge', 'stables']
const EVENT_TYPES = ['famine', 'raid', 'plague', 'trade', 'harvest', 'refugee', 'fire', 'flood', 'bandits']
const SPEC_TYPES = [
  { key: 'military', label: 'Military', desc: '+50% troop speed, +20% defense', icon: '⚔' },
  { key: 'economic', label: 'Economic', desc: '+30% income, +2 trade routes', icon: '⚜' },
  { key: 'cultural', label: 'Cultural', desc: '+5 morale, tournament hosting', icon: '♪' },
  { key: 'religious', label: 'Religious', desc: '+10% divine protection, faith events', icon: '✧' },
]
const SETTLEMENT_ROLES = ['castellan', 'master_of_coin', 'master_of_laws', 'maester', 'captain']
const SIEGE_ACTIONS = ['bombard', 'starve', 'sally', 'reinforce', 'negotiate', 'scorched_earth']

export default function SettlementExpansion() {
  const [tab, setTab] = useState('overview')
  const [territoryId, setTerritoryId] = useState(null)
  const [settlements, setSettlements] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [houseId, setHouseId] = useState(null)

  const loadSettlements = useCallback(async () => {
    try {
      const me = await api.getProfile()
      if (me.house_id) {
        setHouseId(me.house_id)
        const res = await api.settlementList(me.house_id)
        if (res.settlements) setSettlements(res.settlements)
        if (res.settlements.length > 0 && !territoryId) {
          setTerritoryId(res.settlements[0].id)
        }
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSettlements() }, [loadSettlements])

  const loadOverview = useCallback(async () => {
    if (!territoryId) return
    try {
      const res = await api.settlementOverview(territoryId)
      setOverview(res)
    } catch (e) { setError(e.message) }
  }, [territoryId])

  useEffect(() => { loadOverview() }, [loadOverview])

  if (loading) return <div className="page-content"><p>Loading settlements...</p></div>

  return (
    <div className="page-content">
      <h1>Settlement Management</h1>
      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      {settlements.length === 0 ? (
        <div className="empty-state">
          <p>Your house holds no settlements. Claim territories through conquest or diplomacy.</p>
        </div>
      ) : (
        <>
          <div className="settlement-selector">
            <label>Select Settlement: </label>
            <select value={territoryId || ''} onChange={(e) => setTerritoryId(parseInt(e.target.value))}>
              {settlements.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
              ))}
            </select>
          </div>

          <div className="settlement-tabs">
            <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
            <button className={tab === 'population' ? 'active' : ''} onClick={() => setTab('population')}>Population</button>
            <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>Events</button>
            <button className={tab === 'trade' ? 'active' : ''} onClick={() => setTab('trade')}>Trade Routes</button>
            <button className={tab === 'construction' ? 'active' : ''} onClick={() => setTab('construction')}>Construction</button>
            <button className={tab === 'roles' ? 'active' : ''} onClick={() => setTab('roles')}>Court Roles</button>
            <button className={tab === 'taxation' ? 'active' : ''} onClick={() => setTab('taxation')}>Taxation</button>
            <button className={tab === 'specialization' ? 'active' : ''} onClick={() => setTab('specialization')}>Specialization</button>
            <button className={tab === 'sieges' ? 'active' : ''} onClick={() => setTab('sieges')}>Sieges</button>
          </div>

          {tab === 'overview' && <OverviewTab overview={overview} />}
          {tab === 'population' && <PopulationTab territoryId={territoryId} />}
          {tab === 'events' && <EventsTab territoryId={territoryId} />}
          {tab === 'trade' && <TradeTab territoryId={territoryId} houseId={houseId} />}
          {tab === 'construction' && <ConstructionTab territoryId={territoryId} />}
          {tab === 'roles' && <RolesTab territoryId={territoryId} />}
          {tab === 'taxation' && <TaxationTab houseId={houseId} />}
          {tab === 'specialization' && <SpecializationTab territoryId={territoryId} overview={overview} onUpdated={loadOverview} />}
          {tab === 'sieges' && <SiegesTab territoryId={territoryId} houseId={houseId} />}
        </>
      )}
    </div>
  )
}

function OverviewTab({ overview }) {
  if (!overview) return <p>Loading overview...</p>
  const o = overview
  return (
    <div className="settlement-overview">
      {o.active_siege && (
        <div className="siege-warning">
          ⚔ This settlement is under siege by {o.active_siege.attacker}!
          {o.active_siege.starvation_days > 0 && ` Starvation: ${o.active_siege.starvation_days} days.`}
        </div>
      )}
      <div className="overview-grid">
        <div className="overview-card">
          <h3>Territory</h3>
          <p><strong>{o.territory.name}</strong> ({o.territory.type})</p>
          <p>Region: {o.territory.region}</p>
          <p>House: {o.territory.house_name}</p>
          <p>Defense: {o.territory.defense}</p>
          <p>Season: {o.season}</p>
        </div>
        <div className="overview-card">
          <h3>Resources</h3>
          {o.resources ? (
            <>
              <p>Food: {o.resources.stored_food} (+{o.resources.food_production}/day)</p>
              <p>Gold: {o.resources.stored_gold} (+{o.resources.gold_production}/day)</p>
              <p>Recruits: {o.resources.available_recruits} (+{o.resources.troop_production}/day)</p>
            </>
          ) : <p>No resource data</p>}
        </div>
        <div className="overview-card">
          <h3>Population</h3>
          {o.population ? (
            <>
              <p>Pop: {o.population.population} / {o.population.max_population}</p>
              <p>Morale: {o.population.morale}/100</p>
              <p>Unrest: {o.population.unrest}/100</p>
              <p>Tax: {o.population.tax_rate}%</p>
              <p>Grain: {o.population.grain_stores}</p>
            </>
          ) : <p>No population data</p>}
        </div>
        <div className="overview-card">
          <h3>Upgrades</h3>
          {Object.keys(o.upgrades).length > 0 ? (
            UPGRADE_TYPES.map(u => o.upgrades[u] ? <p key={u}>{u}: Lv {o.upgrades[u]}</p> : null)
          ) : <p>No upgrades built</p>}
        </div>
        <div className="overview-card">
          <h3>Status</h3>
          <p>Specialization: {o.specialization || 'None'}</p>
          <p>Active Events: {o.active_events}</p>
          <p>Construction: {o.construction_pending} pending</p>
          <p>Trade Routes: {o.active_trade_routes} active</p>
        </div>
        <div className="overview-card">
          <h3>Court</h3>
          {o.roles.length > 0 ? o.roles.map((r, i) => (
            <p key={i}>{r.role}: {r.avatar_name || 'Unknown'}</p>
          )) : <p>No court positions assigned</p>}
        </div>
      </div>
    </div>
  )
}

function PopulationTab({ territoryId }) {
  const [pop, setPop] = useState(null)
  const [taxRate, setTaxRate] = useState(10)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.populationGet(territoryId)
      setPop(res)
      setTaxRate(res.tax_rate)
    } catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  const handleSetTax = async () => {
    try {
      const res = await api.populationSetTax(territoryId, taxRate)
      setMsg(res.message)
      load()
    } catch (e) { setMsg(e.message) }
  }

  if (!pop) return <p>Loading population...</p>

  const moraleColor = pop.morale >= 65 ? '#28a745' : pop.morale >= 40 ? '#ffc107' : '#dc3545'
  const unrestColor = pop.unrest < 30 ? '#28a745' : pop.unrest < 60 ? '#ffc107' : '#dc3545'

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <div className="pop-grid">
        <div className="pop-card">
          <h3>Population</h3>
          <p className="pop-big">{pop.population}</p>
          <p className="pop-sub">Max: {pop.max_population}</p>
          <p className="pop-sub">Births this year: {pop.births_this_year}</p>
          <p className="pop-sub">Deaths this year: {pop.deaths_this_year}</p>
        </div>
        <div className="pop-card">
          <h3>Morale</h3>
          <p className="pop-big" style={{ color: moraleColor }}>{pop.morale}</p>
          <p className="pop-sub">{pop.morale_label}</p>
          <div className="bar-container">
            <div className="bar-fill" style={{ width: `${pop.morale}%`, background: moraleColor }} />
          </div>
        </div>
        <div className="pop-card">
          <h3>Unrest</h3>
          <p className="pop-big" style={{ color: unrestColor }}>{pop.unrest}</p>
          <div className="bar-container">
            <div className="bar-fill" style={{ width: `${pop.unrest}%`, background: unrestColor }} />
          </div>
        </div>
        <div className="pop-card">
          <h3>Loyalty</h3>
          <p className="pop-big">{pop.loyalty}</p>
          <div className="bar-container">
            <div className="bar-fill" style={{ width: `${pop.loyalty}%`, background: '#17a2b8' }} />
          </div>
        </div>
        <div className="pop-card">
          <h3>Grain Stores</h3>
          <p className="pop-big">{pop.grain_stores}</p>
          <p className="pop-sub">Consumed: ~{Math.ceil(pop.population * 0.01)}/hr</p>
        </div>
      </div>

      <div className="tax-control">
        <h3>Tax Rate</h3>
        <p>Current: {pop.tax_rate}% — Higher taxes reduce morale over time. Lower taxes improve morale.</p>
        <input type="range" min="0" max="50" value={taxRate} onChange={(e) => setTaxRate(parseInt(e.target.value))} />
        <span>{taxRate}%</span>
        <button className="btn-primary" onClick={handleSetTax}>Set Tax Rate</button>
      </div>
    </div>
  )
}

function EventsTab({ territoryId }) {
  const [events, setEvents] = useState([])
  const [history, setHistory] = useState([])
  const [msg, setMsg] = useState(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const load = useCallback(async () => {
    try {
      const [active, hist] = await Promise.all([
        api.eventList(territoryId),
        api.eventHistory(territoryId),
      ])
      setEvents(active.events || [])
      setHistory(hist.events || [])
    } catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  const handleResolve = async (eventId, choiceKey) => {
    try {
      const res = await api.eventResolve(eventId, choiceKey)
      setMsg(res.message)
      load()
    } catch (e) { setMsg(e.message) }
  }

  const handleGenerate = async (eventType) => {
    try {
      await api.eventGenerate(territoryId, eventType)
      setMsg('Event generated.')
      setShowGenerate(false)
      load()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Active Events ({events.length})</h3>
      {events.length === 0 ? (
        <p>No active events. Your settlement is peaceful.</p>
      ) : (
        <div className="event-list">
          {events.map(e => (
            <div key={e.id} className={`event-card severity-${e.severity}`}>
              <div className="event-header">
                <span className="event-type-badge">{e.event_type}</span>
                <span className="event-severity">{e.severity}</span>
              </div>
              <p className="event-desc">{e.description}</p>
              <div className="event-choices">
                {['a', 'b', 'c'].map(key => {
                  const choices = getEventChoiceTexts(e.event_type, key)
                  if (!choices) return null
                  return (
                    <button key={key} className="btn-choice" onClick={() => handleResolve(e.id, key)}>
                      {choices}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="event-admin">
        <button className="btn-secondary" onClick={() => setShowGenerate(!showGenerate)}>Generate Event (Admin)</button>
        {showGenerate && (
          <div className="event-generate">
            {EVENT_TYPES.map(t => (
              <button key={t} className="btn-choice" onClick={() => handleGenerate(t)}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <>
          <h3>Event History</h3>
          <div className="event-history-list">
            {history.map(h => (
              <div key={h.id} className="event-history-row">
                <span className="event-type-badge">{h.event_type}</span>
                <span className="event-choice">{h.choice_text}</span>
                <span className="event-date">{h.resolved_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function getEventChoiceTexts(eventType, choiceKey) {
  const texts = {
    famine: { a: 'Open the granaries (+morale, -food)', b: 'Hoard food (-morale, +unrest)', c: 'Import grain (-gold, +food)' },
    raid: { a: 'Send garrison (-defense, +morale)', b: 'Pay bandits (-gold)', c: 'Ignore (-pop, -gold, -morale)' },
    plague: { a: 'Quarantine (-gold, -pop)', b: 'Send for Maester (-gold, +morale)', c: 'Pray (-pop, -morale)' },
    trade: { a: 'Welcome merchants (+gold, +morale)', b: 'Tax heavily (+gold, -morale)', c: 'Turn away' },
    harvest: { a: 'Harvest festival (+food, -gold, +morale)', b: 'Store for winter (+food)', c: 'Sell surplus (+gold, +food)' },
    refugee: { a: 'Welcome (+pop, -food, +morale)', b: 'Labor tax (+pop, +gold, -morale)', c: 'Turn away (-morale, +unrest)' },
    fire: { a: 'Bucket brigades (-gold, +morale)', b: 'Demolish (-gold, -morale)', c: 'Let burn (-pop, -morale)' },
    flood: { a: 'Build levees (-gold, +morale)', b: 'Evacuate (-pop, -morale)', c: 'Pray (-morale, -food)' },
    bandits: { a: 'Dispatch guard (-defense, +morale)', b: 'Hire sellswords (-gold)', c: 'Negotiate (-gold, -morale)' },
  }
  return texts[eventType]?.[choiceKey] || null
}

function TradeTab({ territoryId, houseId }) {
  const [routes, setRoutes] = useState([])
  const [msg, setMsg] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoute, setNewRoute] = useState({ to_territory_id: '', good_name: 'Grain', volume: 10, frequency_hours: 24 })

  const load = useCallback(async () => {
    try {
      const res = await api.tradeList(houseId)
      setRoutes(res.routes || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      const res = await api.tradeCreate({ from_territory_id: territoryId, house_id: houseId, ...newRoute, to_territory_id: parseInt(newRoute.to_territory_id) })
      setMsg(res.message)
      setShowCreate(false)
      load()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Trade Routes ({routes.length})</h3>
      {routes.length === 0 ? <p>No trade routes established.</p> : (
        <div className="trade-list">
          {routes.map(r => (
            <div key={r.id} className="trade-card">
              <div className="trade-route">{r.from_name} → {r.to_name}</div>
              <div className="trade-details">
                <span>Good: {r.good_name}</span>
                <span>Volume: {r.volume}</span>
                <span>Every {r.frequency_hours}h</span>
                <span>Risk: {r.bandit_risk}%</span>
                <span className={`trade-status ${r.status}`}>{r.status}</span>
              </div>
              <div className="trade-actions">
                {r.status === 'active' && <button className="btn-secondary" onClick={async () => { await api.tradeSuspend(r.id); load() }}>Suspend</button>}
                {r.status === 'suspended' && <button className="btn-secondary" onClick={async () => { await api.tradeResume(r.id); load() }}>Resume</button>}
                <button className="btn-danger" onClick={async () => { if (confirm('Destroy this trade route?')) { await api.tradeDestroy(r.id); load() } }}>Destroy</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>+ New Trade Route</button>
      {showCreate && (
        <div className="trade-create-form">
          <input type="number" placeholder="Destination Territory ID" value={newRoute.to_territory_id} onChange={(e) => setNewRoute({ ...newRoute, to_territory_id: e.target.value })} />
          <select value={newRoute.good_name} onChange={(e) => setNewRoute({ ...newRoute, good_name: e.target.value })}>
            {['Grain', 'Timber', 'Furs', 'Gold', 'Iron', 'Wine', 'Wool', 'Fish', 'Stone', 'Spices', 'Horses'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <label>Volume: <input type="number" min="1" max="100" value={newRoute.volume} onChange={(e) => setNewRoute({ ...newRoute, volume: parseInt(e.target.value) })} /></label>
          <label>Frequency (hours): <input type="number" min="6" max="168" value={newRoute.frequency_hours} onChange={(e) => setNewRoute({ ...newRoute, frequency_hours: parseInt(e.target.value) })} /></label>
          <button className="btn-primary" onClick={handleCreate}>Establish Route</button>
        </div>
      )}
    </div>
  )
}

function ConstructionTab({ territoryId }) {
  const [queue, setQueue] = useState([])
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.constructionList(territoryId)
      setQueue(res.queue || [])
    } catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  const handleQueue = async (upgradeType) => {
    try {
      const res = await api.constructionQueue(territoryId, upgradeType)
      setMsg(res.message)
      load()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Construction Queue</h3>
      {queue.length === 0 ? <p>No construction projects.</p> : (
        <div className="construction-list">
          {queue.map(q => (
            <div key={q.id} className={`construction-card ${q.is_complete ? 'complete' : 'pending'}`}>
              <span className="construction-type">{q.upgrade_type} → Level {q.target_level}</span>
              <span className="construction-cost">{q.cost_gold} stags, {q.cost_food} food</span>
              <span className="construction-time">
                {q.is_complete ? 'Completed' : `Completes: ${q.completes_at?.slice(0, 16)}`}
              </span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: q.is_complete ? '100%' : `${Math.min(100, Math.max(0, (Date.now() - new Date(q.started_at).getTime()) / (new Date(q.completes_at).getTime() - new Date(q.started_at).getTime()) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <h4>Queue New Construction</h4>
      <div className="construction-buttons">
        {UPGRADE_TYPES.map(u => (
          <button key={u} className="btn-secondary" onClick={() => handleQueue(u)}>{u}</button>
        ))}
      </div>
    </div>
  )
}

function RolesTab({ territoryId }) {
  const [roles, setRoles] = useState([])
  const [msg, setMsg] = useState(null)
  const [showAssign, setShowAssign] = useState(false)
  const [newRole, setNewRole] = useState({ avatar_key: '', role: 'castellan' })

  const load = useCallback(async () => {
    try {
      const res = await api.rolesList(territoryId)
      setRoles(res.roles || [])
    } catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  const handleAssign = async () => {
    try {
      const res = await api.roleAssign(territoryId, newRole.avatar_key, newRole.role)
      setMsg(res.message)
      setShowAssign(false)
      load()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Court Positions</h3>
      <p>Assign trusted members to manage different aspects of your settlement.</p>
      {roles.length === 0 ? <p>No positions assigned.</p> : (
        <div className="roles-list">
          {roles.map(r => (
            <div key={r.id} className="role-card">
              <span className="role-name">{r.role}</span>
              <span className="role-holder">{r.avatar_name || 'Unknown'}</span>
              <span className="role-permissions">{(r.permissions || []).join(', ')}</span>
              <button className="btn-danger" onClick={async () => { await api.roleRevoke(r.id); load() }}>Revoke</button>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowAssign(!showAssign)}>+ Assign Role</button>
      {showAssign && (
        <div className="role-assign-form">
          <input type="text" placeholder="Avatar Key (UUID)" value={newRole.avatar_key} onChange={(e) => setNewRole({ ...newRole, avatar_key: e.target.value })} />
          <select value={newRole.role} onChange={(e) => setNewRole({ ...newRole, role: e.target.value })}>
            {SETTLEMENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn-primary" onClick={handleAssign}>Assign</button>
        </div>
      )}
    </div>
  )
}

function TaxationTab({ houseId }) {
  const [taxes, setTaxes] = useState([])
  const [history, setHistory] = useState([])
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([api.taxList(houseId), api.taxHistory(houseId)])
      setTaxes(t.taxes || [])
      setHistory(h.payments || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Tax Arrangements</h3>
      {taxes.length === 0 ? <p>No tax arrangements with vassals.</p> : (
        <div className="tax-list">
          {taxes.map(t => (
            <div key={t.id} className="tax-card">
              <span className="tax-parties">{t.overlord_name} → {t.vassal_name}</span>
              <span className="tax-rate">{t.tax_rate}% {t.tax_type}</span>
              <span className={`tax-status ${t.accepted ? 'accepted' : 'pending'}`}>
                {t.accepted ? 'Accepted' : 'Pending'}
              </span>
              {!t.accepted && <button className="btn-primary" onClick={async () => { await api.taxAccept(t.id); setMsg('Tax accepted.'); load() }}>Accept</button>}
              {!t.accepted && <button className="btn-danger" onClick={async () => { await api.taxRefuse(t.id); setMsg('Tax refused.'); load() }}>Refuse</button>}
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={async () => { try { const res = await api.taxCollect(houseId); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Collect Taxes</button>

      {history.length > 0 && (
        <>
          <h3>Payment History</h3>
          <div className="tax-history-list">
            {history.map(p => (
              <div key={p.id} className="tax-history-row">
                <span>{p.vassal_name} → {p.overlord_name}</span>
                <span>{p.amount} {p.currency}</span>
                <span>{p.was_refused ? 'REFUSED' : 'Paid'}</span>
                <span>{p.paid_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SpecializationTab({ territoryId, overview, onUpdated }) {
  const [msg, setMsg] = useState(null)
  const currentSpec = overview?.specialization

  const handleSet = async (spec) => {
    if (!confirm(`Specialize as ${spec}? This choice is PERMANENT.`)) return
    try {
      const res = await api.specializationSet(territoryId, spec)
      setMsg(res.message)
      onUpdated()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Settlement Specialization</h3>
      {currentSpec ? (
        <div className="spec-current">
          <p>Current specialization: <strong>{currentSpec}</strong></p>
          <p>This choice is permanent and cannot be changed.</p>
        </div>
      ) : (
        <>
          <p>Choose a focus for your settlement. This decision is permanent.</p>
          <div className="spec-grid">
            {SPEC_TYPES.map(s => (
              <div key={s.key} className="spec-card" onClick={() => handleSet(s.key)}>
                <div className="spec-icon">{s.icon}</div>
                <h4>{s.label}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SiegesTab({ territoryId, houseId }) {
  const [sieges, setSieges] = useState([])
  const [selectedSiege, setSelectedSiege] = useState(null)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.siegeList(houseId, true)
      setSieges(res.sieges || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  const handleAction = async (siegeId, actionType, side) => {
    try {
      const res = await api.siegeAction(siegeId, actionType, side)
      setMsg(`${res.action}: ${res.description}`)
      if (selectedSiege?.id === siegeId) {
        const detail = await api.siegeGet(siegeId)
        setSelectedSiege(detail)
      }
      load()
    } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Active Sieges</h3>
      {sieges.length === 0 ? (
        <p>No active sieges involving your house.</p>
      ) : (
        <div className="siege-list">
          {sieges.map(s => (
            <div key={s.id} className={`siege-card ${selectedSiege?.id === s.id ? 'selected' : ''}`} onClick={async () => { const d = await api.siegeGet(s.id); setSelectedSiege(d) }}>
              <div className="siege-header">
                <span className="siege-territory">{s.territory_name}</span>
                <span className="siege-vs">{s.attacker_name} vs {s.defender_name}</span>
              </div>
              <div className="siege-meta">
                <span>Starvation: {s.starvation_days} days</span>
                <span>Attacker losses: {s.attacker_losses}</span>
                <span>Defender losses: {s.defender_losses}</span>
                <span>Est. end: {s.estimated_end?.slice(0, 16)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSiege && (
        <div className="siege-detail">
          <h3>Siege Details — {selectedSiege.siege.territory_name}</h3>
          <div className="siege-actions">
            <h4>Attacker Actions</h4>
            {SIEGE_ACTIONS.filter(a => ['bombard', 'starve', 'negotiate'].includes(a)).map(a => (
              <button key={a} className="btn-secondary" onClick={() => handleAction(selectedSiege.siege.id, a, 'attacker')}>{a}</button>
            ))}
            <h4>Defender Actions</h4>
            {SIEGE_ACTIONS.filter(a => ['sally', 'scorched_earth'].includes(a)).map(a => (
              <button key={a} className="btn-secondary" onClick={() => handleAction(selectedSiege.siege.id, a, 'defender')}>{a}</button>
            ))}
          </div>
          <h4>Action Log</h4>
          <div className="siege-action-log">
            {(selectedSiege.actions || []).map((a, i) => (
              <div key={i} className="siege-action-row">
                <span className="action-side">{a.actor_side}</span>
                <span className="action-type">{a.action_type}</span>
                <span className="action-desc">{a.description}</span>
                <span className="action-time">{a.created_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
