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
            <button className={tab === 'espionage' ? 'active' : ''} onClick={() => setTab('espionage')}>Espionage</button>
            <button className={tab === 'supply' ? 'active' : ''} onClick={() => setTab('supply')}>Supply Lines</button>
            <button className={tab === 'court' ? 'active' : ''} onClick={() => setTab('court')}>Court & Intrigue</button>
            <button className={tab === 'blackmarket' ? 'active' : ''} onClick={() => setTab('blackmarket')}>Black Market</button>
            <button className={tab === 'crisis' ? 'active' : ''} onClick={() => setTab('crisis')}>Crises</button>
            <button className={tab === 'traditions' ? 'active' : ''} onClick={() => setTab('traditions')}>Traditions</button>
            <button className={tab === 'interdependence' ? 'active' : ''} onClick={() => setTab('interdependence')}>Supply Web</button>
            <button className={tab === 'colonization' ? 'active' : ''} onClick={() => setTab('colonization')}>Colonization</button>
            <button className={tab === 'npcs' ? 'active' : ''} onClick={() => setTab('npcs')}>Residents</button>
            <button className={tab === 'diplomacy' ? 'active' : ''} onClick={() => setTab('diplomacy')}>Treaties</button>
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
          {tab === 'espionage' && <EspionageTab houseId={houseId} />}
          {tab === 'supply' && <SupplyLinesTab houseId={houseId} />}
          {tab === 'court' && <CourtIntrigueTab territoryId={territoryId} houseId={houseId} />}
          {tab === 'blackmarket' && <BlackMarketTab territoryId={territoryId} />}
          {tab === 'crisis' && <CrisisTab territoryId={territoryId} />}
          {tab === 'traditions' && <TraditionsTab territoryId={territoryId} houseId={houseId} />}
          {tab === 'interdependence' && <InterdependenceTab houseId={houseId} />}
          {tab === 'colonization' && <ColonizationTab houseId={houseId} territoryId={territoryId} />}
          {tab === 'npcs' && <NPCTab territoryId={territoryId} />}
          {tab === 'diplomacy' && <DiplomacyTab houseId={houseId} />}
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

// =====================================================
// 10 NEW TABS — SETTLEMENT EXPANSION 2
// =====================================================

function EspionageTab({ houseId }) {
  const [spies, setSpies] = useState([])
  const [reports, setReports] = useState([])
  const [msg, setMsg] = useState(null)
  const [showRecruit, setShowRecruit] = useState(false)
  const [spyName, setSpyName] = useState('')
  const [missionTarget, setMissionTarget] = useState('')
  const [missionType, setMissionType] = useState('recon')

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.spyList(), api.spyReportsList()])
      setSpies(s.spies || [])
      setReports(r.reports || [])
    } catch (e) { setMsg(e.message) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRecruit = async () => {
    try { const res = await api.spyRecruit(spyName); setMsg(res.message); setShowRecruit(false); setSpyName(''); load() }
    catch (e) { setMsg(e.message) }
  }

  const handleMission = async (spyId) => {
    if (!missionTarget) { setMsg('Enter a target territory ID'); return }
    try { const res = await api.spyMissionStart(spyId, parseInt(missionTarget), missionType); setMsg(res.message); load() }
    catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Your Spies</h3>
      {spies.length === 0 ? <p>No spies recruited. Recruit one to gather intel or sabotage enemies.</p> : (
        <div className="spy-list">
          {spies.map(s => (
            <div key={s.id} className="spy-card">
              <span className="spy-name">{s.spy_name}</span>
              <span className="spy-skill">Skill: {s.skill}/10</span>
              <span className={`spy-status ${s.status}`}>{s.status}</span>
              {s.target_name && <span className="spy-target">Target: {s.target_name}</span>}
              {s.status === 'idle' && (
                <div className="spy-mission-controls">
                  <input type="number" placeholder="Target ID" onChange={(e) => setMissionTarget(e.target.value)} />
                  <select value={missionType} onChange={(e) => setMissionType(e.target.value)}>
                    {['recon', 'sabotage_walls', 'sabotage_food', 'poison', 'spread_dissent', 'assassinate'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button className="btn-primary" onClick={() => handleMission(s.id)}>Send</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowRecruit(!showRecruit)}>+ Recruit Spy (100 stags)</button>
      {showRecruit && (
        <div className="role-assign-form">
          <input type="text" placeholder="Spy codename" value={spyName} onChange={(e) => setSpyName(e.target.value)} />
          <button className="btn-primary" onClick={handleRecruit}>Recruit</button>
        </div>
      )}

      {reports.length > 0 && (
        <>
          <h3>Intel Reports</h3>
          <div className="event-history-list">
            {reports.map(r => (
              <div key={r.id} className="event-history-row">
                <span className="event-type-badge">{r.territory_name}</span>
                <span className="event-choice">{r.report_type} (accuracy: {r.accuracy}%)</span>
                <span className="event-date">expires: {r.expires_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SupplyLinesTab({ houseId }) {
  const [msg, setMsg] = useState(null)
  const [armies, setArmies] = useState([])
  const [selectedArmy, setSelectedArmy] = useState('')
  const [sourceTerritory, setSourceTerritory] = useState('')
  const [supply, setSupply] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.armyList(houseId)
      setArmies(res.armies || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  const checkSupply = async (armyId) => {
    setSelectedArmy(armyId)
    try { const res = await api.supplyGet(armyId); setSupply(res.supply) }
    catch (e) { setSupply(null) }
  }

  const handleCreate = async () => {
    if (!selectedArmy || !sourceTerritory) { setMsg('Select army and source territory'); return }
    try { const res = await api.supplyCreate(parseInt(selectedArmy), parseInt(sourceTerritory)); setMsg(res.message); checkSupply(parseInt(selectedArmy)) }
    catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Army Supply Lines</h3>
      <p>Armies need supply lines from a settlement. Cut supply = attrition and morale loss.</p>
      {armies.length === 0 ? <p>No armies raised.</p> : (
        <div className="trade-list">
          {armies.map(a => (
            <div key={a.id} className="trade-card">
              <div className="trade-route">{a.army_name} ({a.total_units} units)</div>
              <div className="trade-details">
                <span>Status: {a.status}</span>
                <span>Morale: {a.morale}</span>
                {supply && supply.army_id === a.id && (
                  <span className={`trade-status ${supply.status}`}>Supply: {supply.status} ({supply.efficiency}%)</span>
                )}
              </div>
              <div className="trade-actions">
                <button className="btn-secondary" onClick={() => checkSupply(a.id)}>Check Supply</button>
              </div>
              {selectedArmy === String(a.id) && (
                <div className="trade-create-form">
                  <input type="number" placeholder="Source territory ID" value={sourceTerritory} onChange={(e) => setSourceTerritory(e.target.value)} />
                  <button className="btn-primary" onClick={handleCreate}>Establish Supply Line</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CourtIntrigueTab({ territoryId, houseId }) {
  const [events, setEvents] = useState([])
  const [actions, setActions] = useState([])
  const [msg, setMsg] = useState(null)
  const [showHost, setShowHost] = useState(false)
  const [showIntrigue, setShowIntrigue] = useState(false)
  const [newEvent, setNewEvent] = useState({ event_type: 'feast', title: '', description: '', scheduled_at: '' })
  const [newIntrigue, setNewIntrigue] = useState({ target_house_id: '', action_type: 'rumor', description: '' })

  const load = useCallback(async () => {
    try {
      const [e, a] = await Promise.all([
        api.courtEventList(houseId),
        api.intrigueList(),
      ])
      setEvents(e.events || [])
      setActions(a.actions || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  const handleHost = async () => {
    try { const res = await api.courtEventHost({ territory_id: territoryId, ...newEvent }); setMsg(res.message); setShowHost(false); load() }
    catch (e) { setMsg(e.message) }
  }

  const handleIntrigue = async () => {
    try { const res = await api.intrigueAction({ ...newIntrigue, target_house_id: parseInt(newIntrigue.target_house_id) || 0 }); setMsg(res.message); setShowIntrigue(false); load() }
    catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Court Events</h3>
      {events.length === 0 ? <p>No court events planned.</p> : (
        <div className="event-list">
          {events.map(e => (
            <div key={e.id} className={`event-card severity-moderate`}>
              <div className="event-header">
                <span className="event-type-badge">{e.event_type}</span>
                <span className="event-severity">{e.status}</span>
              </div>
              <p className="event-desc"><strong>{e.title}</strong> — {e.description || 'No description'}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {e.territory_name} | Scheduled: {e.scheduled_at?.slice(0, 16)} | Cost: {e.cost_gold} stags | Morale +{e.morale_bonus}
              </p>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowHost(!showHost)}>+ Host Court Event</button>
      {showHost && (
        <div className="trade-create-form">
          <select value={newEvent.event_type} onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}>
            {['feast', 'tournament', 'wedding', 'audience', 'hunt'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
          <input type="text" placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
          <input type="datetime-local" value={newEvent.scheduled_at} onChange={(e) => setNewEvent({ ...newEvent, scheduled_at: e.target.value })} />
          <button className="btn-primary" onClick={handleHost}>Plan Event</button>
        </div>
      )}

      <h3>Intrigue Actions</h3>
      {actions.length === 0 ? <p>No intrigue actions taken.</p> : (
        <div className="event-history-list">
          {actions.map(a => (
            <div key={a.id} className="event-history-row">
              <span className="event-type-badge">{a.action_type}</span>
              <span className="event-choice">{a.description}</span>
              <span className={`trade-status ${a.result}`}>{a.result || 'pending'}</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowIntrigue(!showIntrigue)}>+ Intrigue Action</button>
      {showIntrigue && (
        <div className="trade-create-form">
          <input type="number" placeholder="Target house ID (optional)" value={newIntrigue.target_house_id} onChange={(e) => setNewIntrigue({ ...newIntrigue, target_house_id: e.target.value })} />
          <select value={newIntrigue.action_type} onChange={(e) => setNewIntrigue({ ...newIntrigue, action_type: e.target.value })}>
            {['rumor', 'false_evidence', 'bribe', 'seduce', 'threaten', 'manipulate'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Description" value={newIntrigue.description} onChange={(e) => setNewIntrigue({ ...newIntrigue, description: e.target.value })} />
          <button className="btn-primary" onClick={handleIntrigue}>Execute</button>
        </div>
      )}
    </div>
  )
}

function BlackMarketTab({ territoryId }) {
  const [market, setMarket] = useState(null)
  const [smuggling, setSmuggling] = useState([])
  const [msg, setMsg] = useState(null)
  const [showSmuggle, setShowSmuggle] = useState(false)
  const [newOp, setNewOp] = useState({ good_name: 'Grain', volume: 10 })

  const load = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        api.blackmarketGet(territoryId),
        api.smugglingList(territoryId),
      ])
      setMarket(m.market)
      setSmuggling(s.operations || [])
    } catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Black Market</h3>
      {market ? (
        <div className="overview-card">
          <p>Activity: {market.activity_level}/100</p>
          <p>Hidden Income: {market.hidden_income} stags/day</p>
          <p>Risk of Discovery: {market.risk_level}%</p>
          <p>Status: {market.is_suppressed ? 'Suppressed' : 'Active'}</p>
          <div className="trade-actions">
            <button className="btn-primary" onClick={async () => { try { const res = await api.blackmarketCollect(territoryId); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Collect Income</button>
            <button className="btn-secondary" onClick={async () => { try { const res = await api.blackmarketSuppress(territoryId); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Suppress</button>
            <button className="btn-secondary" onClick={async () => { try { const res = await api.blackmarketEncourage(territoryId); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Encourage</button>
          </div>
        </div>
      ) : <p>No black market in this settlement.</p>}

      <h3>Smuggling Operations</h3>
      {smuggling.length === 0 ? <p>No smuggling operations.</p> : (
        <div className="trade-list">
          {smuggling.map(s => (
            <div key={s.id} className="trade-card">
              <div className="trade-route">{s.good_name} — {s.volume} units</div>
              <div className="trade-details">
                <span>{s.gold_per_shipment} stags/shipment</span>
                <span>Risk: {s.risk_level}%</span>
                <span className={`trade-status ${s.status}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowSmuggle(!showSmuggle)}>+ New Operation</button>
      {showSmuggle && (
        <div className="trade-create-form">
          <select value={newOp.good_name} onChange={(e) => setNewOp({ ...newOp, good_name: e.target.value })}>
            {['Grain', 'Timber', 'Furs', 'Wine', 'Spices', 'Iron', 'Gold', 'Horses'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <label>Volume: <input type="number" min="1" max="100" value={newOp.volume} onChange={(e) => setNewOp({ ...newOp, volume: parseInt(e.target.value) })} /></label>
          <button className="btn-primary" onClick={async () => { try { const res = await api.smugglingCreate({ territory_id: territoryId, ...newOp }); setMsg(res.message); setShowSmuggle(false); load() } catch (e) { setMsg(e.message) } }}>Establish</button>
        </div>
      )}
    </div>
  )
}

function CrisisTab({ territoryId }) {
  const [crises, setCrises] = useState([])
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try { const res = await api.crisisList(territoryId); setCrises(res.crises || []) }
    catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Active Crises</h3>
      {crises.length === 0 ? (
        <p>No active crises. Events left unresolved may cascade into larger problems.</p>
      ) : (
        <div className="event-list">
          {crises.map(c => (
            <div key={c.id} className="event-card severity-crisis">
              <div className="event-header">
                <span className="event-type-badge">Crisis Cascade</span>
                <span className="event-severity">Stage {c.current_stage}</span>
              </div>
              <p className="event-desc">A chain of crises is unfolding. Next stage triggers: {c.next_stage_at?.slice(0, 16)}</p>
              <div className="event-choices">
                <button className="btn-choice" onClick={async () => { try { const res = await api.crisisAdvance(c.id); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Advance Stage (Admin)</button>
                <button className="btn-choice" onClick={async () => { try { const res = await api.crisisResolve(c.id); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Resolve Crisis</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TraditionsTab({ territoryId, houseId }) {
  const [traditions, setTraditions] = useState([])
  const [festivals, setFestivals] = useState([])
  const [msg, setMsg] = useState(null)
  const [showFestival, setShowFestival] = useState(false)
  const [newFestival, setNewFestival] = useState({ festival_type: 'harvest', name: '', scheduled_at: '' })

  const load = useCallback(async () => {
    try {
      const [t, f] = await Promise.all([
        api.traditionList(territoryId),
        api.festivalList(houseId),
      ])
      setTraditions(t.traditions || [])
      setFestivals(f.festivals || [])
    } catch (e) { setMsg(e.message) }
  }, [territoryId, houseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Traditions</h3>
      {traditions.length === 0 ? <p>No traditions for this settlement.</p> : (
        <div className="spec-grid">
          {traditions.map(t => (
            <div key={t.id} className="spec-card" style={{ cursor: 'pointer' }} onClick={async () => { try { const res = await api.traditionObserve(t.id); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>
              <div className="spec-icon">✧</div>
              <h4>{t.tradition_name}</h4>
              <p>{t.description}</p>
              <p style={{ fontSize: '0.75rem' }}>Morale +{t.morale_bonus} | Cost: {t.gold_cost} stags</p>
            </div>
          ))}
        </div>
      )}

      <h3>Festivals</h3>
      {festivals.length === 0 ? <p>No festivals planned.</p> : (
        <div className="event-history-list">
          {festivals.map(f => (
            <div key={f.id} className="event-history-row">
              <span className="event-type-badge">{f.festival_type}</span>
              <span className="event-choice">{f.name}</span>
              <span>{f.territory_name}</span>
              <span className="event-date">{f.scheduled_at?.slice(0, 16)}</span>
              <span className={`trade-status ${f.status}`}>{f.status}</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowFestival(!showFestival)}>+ Host Festival</button>
      {showFestival && (
        <div className="trade-create-form">
          <select value={newFestival.festival_type} onChange={(e) => setNewFestival({ ...newFestival, festival_type: e.target.value })}>
            {['harvest', 'spring', 'winter_solstice', 'name_day', 'tournament'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Festival name" value={newFestival.name} onChange={(e) => setNewFestival({ ...newFestival, name: e.target.value })} />
          <input type="datetime-local" value={newFestival.scheduled_at} onChange={(e) => setNewFestival({ ...newFestival, scheduled_at: e.target.value })} />
          <button className="btn-primary" onClick={async () => { try { const res = await api.festivalHost({ territory_id: territoryId, ...newFestival }); setMsg(res.message); setShowFestival(false); load() } catch (e) { setMsg(e.message) } }}>Plan Festival</button>
        </div>
      )}
    </div>
  )
}

function InterdependenceTab({ houseId }) {
  const [routes, setRoutes] = useState([])
  const [msg, setMsg] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoute, setNewRoute] = useState({ from_territory_id: '', to_territory_id: '', resource_type: 'food', amount: 10, frequency_hours: 24 })

  const load = useCallback(async () => {
    try { const res = await api.supplyRouteList(houseId); setRoutes(res.routes || []) }
    catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Internal Supply Routes</h3>
      <p>Route resources between your settlements. Farms feed castles, mines fund garrisons.</p>
      {routes.length === 0 ? <p>No supply routes established.</p> : (
        <div className="trade-list">
          {routes.map(r => (
            <div key={r.id} className="trade-card">
              <div className="trade-route">{r.from_name} → {r.to_name}</div>
              <div className="trade-details">
                <span>{r.resource_type}: {r.amount}/shipment</span>
                <span>Every {r.frequency_hours}h</span>
                <span className={`trade-status ${r.status}`}>{r.status}</span>
              </div>
              <div className="trade-actions">
                <button className="btn-danger" onClick={async () => { await api.supplyRouteDisrupt(r.id); load() }}>Disrupt</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>+ New Supply Route</button>
      {showCreate && (
        <div className="trade-create-form">
          <input type="number" placeholder="From territory ID" value={newRoute.from_territory_id} onChange={(e) => setNewRoute({ ...newRoute, from_territory_id: e.target.value })} />
          <input type="number" placeholder="To territory ID" value={newRoute.to_territory_id} onChange={(e) => setNewRoute({ ...newRoute, to_territory_id: e.target.value })} />
          <select value={newRoute.resource_type} onChange={(e) => setNewRoute({ ...newRoute, resource_type: e.target.value })}>
            {['food', 'gold', 'troops'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label>Amount: <input type="number" value={newRoute.amount} onChange={(e) => setNewRoute({ ...newRoute, amount: parseInt(e.target.value) })} /></label>
          <label>Hours: <input type="number" value={newRoute.frequency_hours} onChange={(e) => setNewRoute({ ...newRoute, frequency_hours: parseInt(e.target.value) })} /></label>
          <button className="btn-primary" onClick={async () => { try { const res = await api.supplyRouteCreate({ ...newRoute, from_territory_id: parseInt(newRoute.from_territory_id), to_territory_id: parseInt(newRoute.to_territory_id) }); setMsg(res.message); setShowCreate(false); load() } catch (e) { setMsg(e.message) } }}>Create</button>
        </div>
      )}
    </div>
  )
}

function ColonizationTab({ houseId, territoryId }) {
  const [projects, setProjects] = useState([])
  const [msg, setMsg] = useState(null)
  const [showStart, setShowStart] = useState(false)
  const [newProj, setNewProj] = useState({ territory_name: '', region: '', territory_type: 'village' })

  const load = useCallback(async () => {
    try { const res = await api.colonizationList(houseId); setProjects(res.projects || []) }
    catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Colonization Projects</h3>
      <p>Found new settlements in unclaimed territory. Costs 500 gold, 300 food, 20 recruits.</p>
      {projects.length === 0 ? <p>No colonization projects.</p> : (
        <div className="construction-list">
          {projects.map(p => (
            <div key={p.id} className={`construction-card ${p.status === 'established' ? 'complete' : 'pending'}`}>
              <span className="construction-type">{p.territory_name} ({p.region})</span>
              <span className="construction-cost">{p.status}</span>
              <span className="construction-time">{p.progress}% complete</span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowStart(!showStart)}>+ Start Colonization</button>
      {showStart && (
        <div className="trade-create-form">
          <input type="text" placeholder="New settlement name" value={newProj.territory_name} onChange={(e) => setNewProj({ ...newProj, territory_name: e.target.value })} />
          <select value={newProj.region} onChange={(e) => setNewProj({ ...newProj, region: e.target.value })}>
            {['North', 'Crownlands', 'Westerlands', 'Reach', 'Stormlands', 'Vale', 'Riverlands', 'Iron Islands', 'Dorne'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={newProj.territory_type} onChange={(e) => setNewProj({ ...newProj, territory_type: e.target.value })}>
            {['village', 'town', 'farm', 'mine', 'trade_post'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-primary" onClick={async () => { try { const res = await api.colonizationStart({ ...newProj, origin_territory_id: territoryId }); setMsg(res.message); setShowStart(false); load() } catch (e) { setMsg(e.message) } }}>Begin Colonization</button>
        </div>
      )}
    </div>
  )
}

function NPCTab({ territoryId }) {
  const [npcs, setNpcs] = useState([])
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    try { const res = await api.npcList(territoryId); setNpcs(res.npcs || []) }
    catch (e) { setMsg(e.message) }
  }, [territoryId])

  useEffect(() => { load() }, [load])

  const interact = async (npcId, interaction) => {
    try { const res = await api.npcInteract(npcId, interaction); setMsg(`${res.result} (Loyalty: ${res.loyalty})`); load() }
    catch (e) { setMsg(e.message) }
  }

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Named Residents</h3>
      {npcs.length === 0 ? <p>No notable residents found.</p> : (
        <div className="roles-list">
          {npcs.map(n => (
            <div key={n.id} className="role-card">
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span className="role-name">{n.npc_name}</span>
                <span className="role-holder">{n.role} | {n.personality} | Service: {n.provides_service}</span>
                <div className="bar-container" style={{ width: 100, marginTop: 4 }}>
                  <div className="bar-fill" style={{ width: `${n.loyalty}%`, background: n.loyalty >= 60 ? '#28a745' : n.loyalty >= 30 ? '#ffc107' : '#dc3545' }} />
                </div>
                <span className="role-permissions">Loyalty: {n.loyalty}/100 | Skill: {n.skill_level}/10</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="btn-choice" onClick={() => interact(n.id, 'talk')}>Talk</button>
                <button className="btn-choice" onClick={() => interact(n.id, 'flatter')}>Flatter</button>
                <button className="btn-choice" onClick={() => interact(n.id, 'gift')}>Gift (50g)</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiplomacyTab({ houseId }) {
  const [treaties, setTreaties] = useState([])
  const [violations, setViolations] = useState([])
  const [msg, setMsg] = useState(null)
  const [showPropose, setShowPropose] = useState(false)
  const [newTreaty, setNewTreaty] = useState({ house2_id: '', treaty_type: 'peace', terms: '', duration_days: '' })

  const load = useCallback(async () => {
    try {
      const [t, v] = await Promise.all([
        api.treatyList(houseId, false),
        api.treatyViolations(),
      ])
      setTreaties(t.treaties || [])
      setViolations(v.violations || [])
    } catch (e) { setMsg(e.message) }
  }, [houseId])

  useEffect(() => { load() }, [load])

  return (
    <div className="settlement-section">
      {msg && <div className="info-banner">{msg}</div>}
      <h3>Treaties</h3>
      {treaties.length === 0 ? <p>No treaties. Propose one to formalize diplomatic relations.</p> : (
        <div className="tax-list">
          {treaties.map(t => (
            <div key={t.id} className="tax-card">
              <span className="tax-parties">{t.house1_name} ↔ {t.house2_name}</span>
              <span className="tax-rate">{t.treaty_type}</span>
              <span className={`tax-status ${t.is_active ? 'accepted' : 'pending'}`}>
                {t.accepted ? (t.is_active ? 'Active' : 'Broken') : 'Pending'}
              </span>
              {!t.accepted && <button className="btn-primary" onClick={async () => { try { const res = await api.treatyAccept(t.id); setMsg(res.message); load() } catch (e) { setMsg(e.message) } }}>Accept</button>}
              {t.is_active && <button className="btn-danger" onClick={async () => { if (confirm('Break this treaty? This may have consequences.')) { try { const res = await api.treatyBreak(t.id); setMsg(res.message); load() } catch (e) { setMsg(e.message) } } }}>Break</button>}
            </div>
          ))}
        </div>
      )}
      <button className="btn-secondary" onClick={() => setShowPropose(!showPropose)}>+ Propose Treaty</button>
      {showPropose && (
        <div className="trade-create-form">
          <input type="number" placeholder="Target house ID" value={newTreaty.house2_id} onChange={(e) => setNewTreaty({ ...newTreaty, house2_id: e.target.value })} />
          <select value={newTreaty.treaty_type} onChange={(e) => setNewTreaty({ ...newTreaty, treaty_type: e.target.value })}>
            {['peace', 'trade', 'border', 'hostage', 'non_aggression', 'alliance'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Treaty terms" value={newTreaty.terms} onChange={(e) => setNewTreaty({ ...newTreaty, terms: e.target.value })} />
          <input type="number" placeholder="Duration (days, blank=permanent)" value={newTreaty.duration_days} onChange={(e) => setNewTreaty({ ...newTreaty, duration_days: e.target.value })} />
          <button className="btn-primary" onClick={async () => { try { const res = await api.treatyPropose({ ...newTreaty, house1_id: houseId, house2_id: parseInt(newTreaty.house2_id), duration_days: newTreaty.duration_days || null }); setMsg(res.message); setShowPropose(false); load() } catch (e) { setMsg(e.message) } }}>Propose</button>
        </div>
      )}

      {violations.length > 0 && (
        <>
          <h3>Treaty Violations</h3>
          <div className="event-history-list">
            {violations.map(v => (
              <div key={v.id} className="event-history-row">
                <span className="event-type-badge">{v.violation_type}</span>
                <span className="event-choice">{v.description}</span>
                <span className="event-severity">{v.severity}</span>
                <span className="event-date">{v.created_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
