import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const UPGRADE_TYPES = ['walls', 'garrison', 'market', 'farm', 'mine', 'harbor', 'sept', 'weirwood', 'forge', 'stables']
const MAX_LEVELS = { walls: 5, garrison: 5, market: 3, farm: 3, mine: 3, harbor: 2, sept: 1, weirwood: 1, forge: 2, stables: 2 }
const UNIT_TYPES = ['infantry', 'archers', 'cavalry', 'knights', 'siege']
const UNIT_COSTS = {
  infantry: { gold: 2, food: 5, recruits: 1 },
  archers: { gold: 3, food: 5, recruits: 1 },
  cavalry: { gold: 5, food: 8, recruits: 2 },
  knights: { gold: 10, food: 10, recruits: 2 },
  siege: { gold: 15, food: 15, recruits: 3 }
}

export default function War() {
  const { user } = useAuth()
  const houseId = user?.house_id || 0
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busyAction, setBusyAction] = useState(null)

  const [wars, setWars] = useState([])
  const [battles, setBattles] = useState([])
  const [armies, setArmies] = useState([])
  const [settlements, setSettlements] = useState([])
  const [resources, setResources] = useState(null)
  const [encounters, setEncounters] = useState([])
  const [creatures, setCreatures] = useState([])

  const [selectedArmy, setSelectedArmy] = useState(null)
  const [selectedSettlement, setSelectedSettlement] = useState(null)

  const [showCreateArmy, setShowCreateArmy] = useState(false)
  const [newArmyName, setNewArmyName] = useState('')
  const [newArmyTerritory, setNewArmyTerritory] = useState('')

  const [recruitArmyId, setRecruitArmyId] = useState(null)
  const [recruitType, setRecruitType] = useState('infantry')
  const [recruitCount, setRecruitCount] = useState(10)

  const [moveArmyId, setMoveArmyId] = useState(null)
  const [moveTarget, setMoveTarget] = useState('')

  const [attackArmyId, setAttackArmyId] = useState(null)
  const [attackTargetArmy, setAttackTargetArmy] = useState('')

  const [attackSettArmyId, setAttackSettArmyId] = useState(null)
  const [attackSettTarget, setAttackSettTarget] = useState('')

  const [declareH1, setDeclareH1] = useState('')
  const [declareH2, setDeclareH2] = useState('')
  const [declareReason, setDeclareReason] = useState('')

  const [huntRegion, setHuntRegion] = useState('')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'wars', label: 'Wars' },
    { id: 'armies', label: 'Armies' },
    { id: 'settlements', label: 'Settlements' },
    { id: 'encounters', label: 'Encounters' },
  ]

  const loadData = useCallback(async (tabId) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (tabId === 'wars') {
        const [w, b] = await Promise.all([api.warList(houseId), api.warBattles(houseId, 20)])
        setWars(w.wars || [])
        setBattles(b.battles || [])
      } else if (tabId === 'armies') {
        const a = await api.armyList(houseId)
        setArmies(a.armies || [])
      } else if (tabId === 'settlements') {
        const [s, r] = await Promise.all([api.settlementList(houseId), api.settlementResources(houseId)])
        setSettlements(s.settlements || [])
        setResources(r.totals || null)
      } else if (tabId === 'encounters') {
        const [e, c] = await Promise.all([api.encounterList(), api.creatureList()])
        setEncounters(e.encounters || [])
        setCreatures(c.creatures || [])
      } else if (tabId === 'overview') {
        if (houseId) {
          const [w, a, s, r] = await Promise.all([
            api.warList(houseId), api.armyList(houseId),
            api.settlementList(houseId), api.settlementResources(houseId)
          ])
          setWars(w.wars || [])
          setArmies(a.armies || [])
          setSettlements(s.settlements || [])
          setResources(r.totals || null)
        }
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [houseId])

  useEffect(() => { loadData(tab) }, [tab, loadData])

  const doAction = async (fn, successMsg, actionKey) => {
    setError(null)
    setMessage(null)
    if (actionKey) setBusyAction(actionKey)
    try {
      const res = await fn()
      setMessage(res.message || successMsg || 'Done')
      loadData(tab)
    } catch (err) {
      setError(err.message)
    }
    if (actionKey) setBusyAction(null)
  }

  const renderOverview = () => (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header">Active Wars</div>
        <div className="card-body">
          {wars.filter(w => w.status === 'active' || w.status === 'declared').length === 0
            ? <p className="text-muted">No active wars</p>
            : wars.filter(w => w.status === 'active' || w.status === 'declared').map(w => (
              <div key={w.id} className="mb-2">
                <strong className="text-gold">{w.house1}</strong> vs <strong className="text-gold">{w.house2}</strong>
                <span className="text-muted" style={{ fontSize: '.8rem' }}> — {w.status}</span>
                {w.reason && <div className="text-muted" style={{ fontSize: '.8rem' }}>{w.reason}</div>}
              </div>
            ))
          }
        </div>
      </div>
      <div className="card">
        <div className="card-header">House Armies</div>
        <div className="card-body">
          {armies.length === 0
            ? <p className="text-muted">No armies raised</p>
            : armies.map(a => (
              <div key={a.id} className="mb-2">
                <strong>{a.name}</strong> — {a.total_units} units, ATK {a.total_attack}, DEF {a.total_defense}
                <div className="text-muted" style={{ fontSize: '.8rem' }}>{a.region} | Morale {a.morale} | {a.status}</div>
              </div>
            ))
          }
        </div>
      </div>
      <div className="card">
        <div className="card-header">Settlements</div>
        <div className="card-body">
          {settlements.length === 0
            ? <p className="text-muted">No settlements</p>
            : settlements.map(s => (
              <div key={s.id} className="mb-2">
                <strong>{s.name}</strong> <span className="text-muted">({s.type})</span>
                <div className="text-muted" style={{ fontSize: '.8rem' }}>
                  Food {s.stored_food} (+{s.food_production}/day) | Gold {s.stored_gold} (+{s.gold_production}/day) | Recruits {s.available_recruits}
                </div>
              </div>
            ))
          }
        </div>
      </div>
      <div className="card">
        <div className="card-header">Total Resources</div>
        <div className="card-body">
          {resources ? (
            <table className="stats-table">
              <tbody>
                <tr><th>Stored Food</th><td>{resources.stored_food}</td></tr>
                <tr><th>Stored Gold</th><td>{resources.stored_gold}</td></tr>
                <tr><th>Available Recruits</th><td>{resources.available_recruits}</td></tr>
                <tr><th>Food/Day</th><td>{resources.food_per_day}</td></tr>
                <tr><th>Gold/Day</th><td>{resources.gold_per_day}</td></tr>
                <tr><th>Troops/Day</th><td>{resources.troops_per_day}</td></tr>
              </tbody>
            </table>
          ) : <p className="text-muted">No resource data</p>}
        </div>
      </div>
    </div>
  )

  const renderWars = () => (
    <div>
      <div className="card mb-3">
        <div className="card-header">Declare War</div>
        <div className="card-body">
          <div className="filter-bar">
            <input className="form-input" style={{ flex: 1, maxWidth: '100px' }} type="number" placeholder="Your House ID" value={declareH1} onChange={e => setDeclareH1(e.target.value)} />
            <input className="form-input" style={{ flex: 1, maxWidth: '100px' }} type="number" placeholder="Target House ID" value={declareH2} onChange={e => setDeclareH2(e.target.value)} />
            <input className="form-input" style={{ flex: 2 }} type="text" placeholder="Reason" value={declareReason} onChange={e => setDeclareReason(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.warDeclare(declareH1, declareH2, declareReason), 'War declared')}>Declare</button>
          </div>
        </div>
      </div>

      <h3 className="mb-2">Active Wars</h3>
      {wars.length === 0 ? <p className="text-muted">No wars declared</p> : (
        <table className="stats-table">
          <thead><tr><th>Houses</th><th>Status</th><th>Reason</th><th>Declared By</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {wars.map(w => (
              <tr key={w.id}>
                <td><strong>{w.house1}</strong> vs <strong>{w.house2}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>
                  {w.status === 'active' && <span className="text-gold">{w.status}</span>}
                  {w.status === 'declared' && <span className="text-warning">{w.status}</span>}
                  {w.status === 'ended' && <span className="text-muted">{w.status}</span>}
                </td>
                <td>{w.reason || '-'}</td>
                <td>{w.declared_by}</td>
                <td>{new Date(w.created_at).toLocaleDateString()}</td>
                <td>
                  {w.status === 'declared' && <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.warAccept(w.id), 'War accepted')}>Accept</button>}
                  {w.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.warEnd(w.id), 'War ended')}>End</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="mt-4 mb-2">Recent Battles</h3>
      {battles.length === 0 ? <p className="text-muted">No battles recorded</p> : (
        <table className="stats-table">
          <thead><tr><th>Type</th><th>Attacker</th><th>Defender</th><th>Territory</th><th>Result</th><th>Losses</th><th>Date</th></tr></thead>
          <tbody>
            {battles.map(b => (
              <tr key={b.id}>
                <td style={{ textTransform: 'capitalize' }}>{b.type.replace(/_/g, ' ')}</td>
                <td>{b.attacker}</td>
                <td>{b.defender}</td>
                <td>{b.territory || '-'}</td>
                <td>{b.attacker_won ? <span className="text-gold">Victory</span> : <span style={{ color: 'var(--danger)' }}>Defeat</span>}</td>
                <td>{b.attacker_losses} / {b.defender_losses}</td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderArmies = () => (
    <div>
      <div className="d-flex justify-between align-center mb-3">
        <h3>House Armies ({armies.length}/5)</h3>
        {armies.length < 5 && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateArmy(!showCreateArmy)}>
            {showCreateArmy ? 'Cancel' : 'Raise Army'}
          </button>
        )}
      </div>

      {showCreateArmy && (
        <div className="card mb-3">
          <div className="card-header">Raise New Army</div>
          <div className="card-body">
            <div className="filter-bar">
              <input className="form-input" type="text" placeholder="Army Name" value={newArmyName} onChange={e => setNewArmyName(e.target.value)} />
              <select className="form-input filter-select" value={newArmyTerritory} onChange={e => setNewArmyTerritory(e.target.value)}>
                <option value="">Select Settlement...</option>
                {settlements.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => {
                doAction(() => api.armyCreate(houseId, newArmyName || 'New Army', newArmyTerritory), 'Army raised')
                setShowCreateArmy(false)
                setNewArmyName('')
                setNewArmyTerritory('')
              }}>Raise</button>
            </div>
          </div>
        </div>
      )}

      {armies.length === 0 ? <p className="text-muted">No armies raised</p> : (
        <div className="grid grid-2">
          {armies.map(a => (
            <div key={a.id} className="card">
              <div className="card-header">{a.name}</div>
              <div className="card-body">
                <table className="stats-table">
                  <tbody>
                    <tr><th>Region</th><td>{a.region}</td></tr>
                    <tr><th>Location</th><td>{a.territory || 'In field'}</td></tr>
                    <tr><th>Status</th><td style={{ textTransform: 'capitalize' }}>{a.status}</td></tr>
                    <tr><th>Units</th><td>{a.total_units}</td></tr>
                    <tr><th>Attack</th><td>{a.total_attack}</td></tr>
                    <tr><th>Defense</th><td>{a.total_defense}</td></tr>
                    <tr><th>Morale</th><td>{a.morale}/100</td></tr>
                  </tbody>
                </table>

                {a.status === 'idle' && (
                  <div className="mt-2">
                    <button className="btn btn-outline btn-sm" onClick={() => setRecruitArmyId(recruitArmyId === a.id ? null : a.id)}>
                      {recruitArmyId === a.id ? 'Close' : 'Recruit'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setMoveArmyId(moveArmyId === a.id ? null : a.id)}>
                      {moveArmyId === a.id ? 'Close' : 'Move'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setAttackArmyId(attackArmyId === a.id ? null : a.id)}>
                      {attackArmyId === a.id ? 'Close' : 'Attack Army'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setAttackSettArmyId(attackSettArmyId === a.id ? null : a.id)}>
                      {attackSettArmyId === a.id ? 'Close' : 'Siege'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.armyDisband(a.id), 'Army disbanded')}>Disband</button>
                  </div>
                )}

                {recruitArmyId === a.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Recruit Units</h4>
                    <div className="filter-bar">
                      <select className="filter-select" value={recruitType} onChange={e => setRecruitType(e.target.value)}>
                        {UNIT_TYPES.map(t => <option key={t} value={t}>{t} ({UNIT_COSTS[t].gold}g, {UNIT_COSTS[t].food}f, {UNIT_COSTS[t].recruits}r)</option>)}
                      </select>
                      <input className="form-input" style={{ width: '80px' }} type="number" min="1" max="100" value={recruitCount} onChange={e => setRecruitCount(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.armyRecruit(a.id, recruitType, recruitCount), 'Units recruited')}>Recruit</button>
                    </div>
                  </div>
                )}

                {moveArmyId === a.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Move Army</h4>
                    <div className="filter-bar">
                      <input className="form-input" type="number" placeholder="Target Territory ID" value={moveTarget} onChange={e => setMoveTarget(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.armyMove(a.id, moveTarget), 'Army moving')}>March</button>
                    </div>
                  </div>
                )}

                {attackArmyId === a.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Attack Enemy Army</h4>
                    <div className="filter-bar">
                      <input className="form-input" type="number" placeholder="Target Army ID" value={attackTargetArmy} onChange={e => setAttackTargetArmy(e.target.value)} />
                      <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.armyAttackArmy(a.id, attackTargetArmy), 'Battle fought')}>Attack</button>
                    </div>
                  </div>
                )}

                {attackSettArmyId === a.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Siege Settlement</h4>
                    <div className="filter-bar">
                      <input className="form-input" type="number" placeholder="Target Territory ID" value={attackSettTarget} onChange={e => setAttackSettTarget(e.target.value)} />
                      <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.armyAttackSettlement(a.id, attackSettTarget), 'Siege resolved')}>Siege</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettlements = () => (
    <div>
      {resources && (
        <div className="card mb-3">
          <div className="card-header">House Resource Summary</div>
          <div className="card-body">
            <div className="grid grid-3">
              <div><span className="text-muted">Food:</span> <strong>{resources.stored_food}</strong> (+{resources.food_per_day}/day)</div>
              <div><span className="text-muted">Gold:</span> <strong>{resources.stored_gold}</strong> (+{resources.gold_per_day}/day)</div>
              <div><span className="text-muted">Recruits:</span> <strong>{resources.available_recruits}</strong> (+{resources.troops_per_day}/day)</div>
            </div>
          </div>
        </div>
      )}

      {settlements.length === 0 ? <p className="text-muted">No settlements owned</p> : (
        <div className="grid grid-2">
          {settlements.map(s => (
            <div key={s.id} className="card">
              <div className="card-header">{s.name} <span className="text-muted">({s.type})</span></div>
              <div className="card-body">
                <table className="stats-table">
                  <tbody>
                    <tr><th>Region</th><td>{s.region}</td></tr>
                    <tr><th>Defense</th><td>{s.defense}</td></tr>
                    <tr><th>Population</th><td>{s.population}</td></tr>
                    <tr><th>Stored Food</th><td>{s.stored_food} (+{s.accumulated_food} pending)</td></tr>
                    <tr><th>Stored Gold</th><td>{s.stored_gold} (+{s.accumulated_gold} pending)</td></tr>
                    <tr><th>Recruits</th><td>{s.available_recruits} (+{s.accumulated_recruits} pending)</td></tr>
                  </tbody>
                </table>
                <div className="mt-2 d-flex gap-1">
                  <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.settlementCollect(s.id), 'Resources collected')}>Collect</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedSettlement(selectedSettlement === s.id ? null : s.id)}>
                    {selectedSettlement === s.id ? 'Close' : 'Build'}
                  </button>
                </div>
                {selectedSettlement === s.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4>Upgrades</h4>
                    <div className="d-flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {UPGRADE_TYPES.map(u => {
                        const actionKey = `build-${s.id}-${u}`
                        const currentLevel = (s.upgrades && s.upgrades[u]) || 0
                        const maxLevel = MAX_LEVELS[u] || 3
                        const isMaxed = currentLevel >= maxLevel
                        const costGold = (currentLevel + 1) * 50
                        const costFood = (currentLevel + 1) * 100
                        const canAfford = s.stored_gold >= costGold && s.stored_food >= costFood
                        return (
                          <button key={u} className="btn btn-outline btn-sm" style={{ textTransform: 'capitalize' }}
                            disabled={busyAction === actionKey || isMaxed || !canAfford}
                            onClick={() => {
                              if (!confirm(`Build ${u} upgrade to level ${currentLevel + 1} at ${s.name}?\nCost: ${costGold} stags + ${costFood} food`)) return
                              doAction(() => api.settlementBuild(s.id, u), `Built ${u}`, actionKey)
                            }}>
                            {busyAction === actionKey ? 'Building...' : `${u} ${currentLevel > 0 ? `Lv${currentLevel}` : ''}`}
                            {isMaxed && ' (MAX)'}
                          </button>
                        )
                      })}
                    </div>
                    {s.upgrades && Object.keys(s.upgrades).length > 0 && (
                      <div className="mt-2" style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        <strong>Current upgrades:</strong>{' '}
                        {Object.entries(s.upgrades).map(([type, level]) => `${type} Lv${level}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderEncounters = () => (
    <div>
      <div className="card mb-3">
        <div className="card-header">Hunt for Creatures</div>
        <div className="card-body">
          <div className="filter-bar">
            <input className="form-input" type="text" placeholder="Region (e.g. North, Riverlands)" value={huntRegion} onChange={e => setHuntRegion(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.encounterHunt(huntRegion), 'Hunt initiated')}>Hunt</button>
          </div>
        </div>
      </div>

      <h3 className="mb-2">Active Encounters</h3>
      {encounters.length === 0 ? <p className="text-muted">No active encounters</p> : (
        <table className="stats-table">
          <thead><tr><th>Creature</th><th>Type</th><th>Region</th><th>Count</th><th>Difficulty</th><th>Rewards</th><th>Actions</th></tr></thead>
          <tbody>
            {encounters.map(e => (
              <tr key={e.id}>
                <td><strong>{e.creature}</strong>{e.is_boss ? ' ★' : ''}</td>
                <td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                <td>{e.region}</td>
                <td>{e.count}</td>
                <td>{e.difficulty}/10</td>
                <td style={{ fontSize: '.8rem' }}>{e.rewards ? `${e.rewards.xp || 0}xp, ${e.rewards.gold || 0}g, ${e.rewards.stars || 0}s` : '-'}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.encounterEngage(e.id), 'Engaged')}>Solo</button>
                  {armies.length > 0 && (
                    <select className="filter-select" style={{ marginLeft: '.5rem' }} onChange={(ev) => {
                      if (ev.target.value) doAction(() => api.encounterEngage(e.id, ev.target.value), 'Army engaged')
                    }} defaultValue="">
                      <option value="" disabled>Army...</option>
                      {armies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="mt-4 mb-2">Creature Bestiary</h3>
      {creatures.length === 0 ? <p className="text-muted">No creatures found</p> : (
        <table className="stats-table">
          <thead><tr><th>Name</th><th>Type</th><th>HP</th><th>DMG</th><th>Armor</th><th>Difficulty</th><th>Region</th><th>Rewards</th></tr></thead>
          <tbody>
            {creatures.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong>{c.is_boss ? ' ★' : ''}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                <td>{c.hp}</td>
                <td>{c.damage}</td>
                <td>{c.armor}</td>
                <td>{c.difficulty}/10</td>
                <td>{c.region}</td>
                <td style={{ fontSize: '.8rem' }}>{c.rewards ? `${c.rewards.xp || 0}xp, ${c.rewards.gold || 0}g, ${c.rewards.stars || 0}s` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>War Council</h1>
        <p>Command armies, manage settlements, wage war, and hunt creatures</p>
      </div>

      <div className="page-content">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tabs">
          <div className="tab-nav">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="tab-panel active">
            {loading && <Loading />}
            {!loading && tab === 'overview' && renderOverview()}
            {!loading && tab === 'wars' && renderWars()}
            {!loading && tab === 'armies' && renderArmies()}
            {!loading && tab === 'settlements' && renderSettlements()}
            {!loading && tab === 'encounters' && renderEncounters()}
          </div>
        </div>
      </div>
    </div>
  )
}
