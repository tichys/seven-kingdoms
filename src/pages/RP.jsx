import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function RP() {
  const [tab, setTab] = useState('mounts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const doAction = async (fn, msg) => {
    setError(null); setSuccess(null)
    try { const r = await fn(); setSuccess(r.message || msg || 'Done') }
    catch (err) { setError(err.message) }
  }

  const tabs = [
    { id: 'mounts', label: 'Mounts' },
    { id: 'training', label: 'Training' },
    { id: 'explore', label: 'Exploration' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'taverns', label: 'Taverns' },
    { id: 'cyvasse', label: 'Cyvasse' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Activities</h1>
        <p>Mounts, training, exploration, contracts, taverns, and cyvasse</p>
      </div>
      <div className="page-content">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="tabs">
          <div className="tab-nav">
            {tabs.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </div>
          <div className="tab-panel active">
            {tab === 'mounts' && <MountsTab doAction={doAction} />}
            {tab === 'training' && <TrainingTab doAction={doAction} />}
            {tab === 'explore' && <ExploreTab doAction={doAction} />}
            {tab === 'contracts' && <ContractsTab doAction={doAction} />}
            {tab === 'taverns' && <TavernsTab doAction={doAction} />}
            {tab === 'cyvasse' && <CyvasseTab doAction={doAction} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MountsTab({ doAction }) {
  const [mounts, setMounts] = useState([])
  const [myMounts, setMyMounts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [list, my] = await Promise.all([api.mountList(), api.mountMy().catch(() => ({ mounts: [] }))])
    setMounts(list.mounts || [])
    setMyMounts(my.mounts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Loading />
  return (
    <div>
      <h3 className="mb-2">Your Mounts</h3>
      {myMounts.length === 0 ? <p className="text-muted">No mounts owned. Buy one below.</p> : (
        <div className="grid grid-2 mb-4">
          {myMounts.map(m => (
            <div key={m.id} className="card" style={{ border: m.is_active === 1 ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.name} {m.is_active === 1 && <span style={{ color: 'var(--gold)' }}>★</span>}</span>
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.type}</span>
              </div>
              <div className="card-body" style={{ fontSize: '.85rem' }}>
                <p>Speed: {m.speed} | Combat: +{m.combat_bonus} | Endurance: {m.endurance}</p>
                {m.is_trained === 1 ? <span style={{ color: 'var(--green)', fontSize: '.75rem' }}>Trained</span> :
                  <button className="btn btn-sm" style={{ background: 'var(--gold)', color: 'var(--bg-dark)', border: 'none', marginRight: '.5rem' }} onClick={() => doAction(() => api.mountTrain(m.id), 'Mount trained!')}>Train (30 stags)</button>}
                {m.is_active !== 1 && <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.mountEquip(m.id), 'Mount equipped!')}>Equip</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <h3 className="mb-2">Buy a Mount</h3>
      <table className="stats-table">
        <thead><tr><th>Name</th><th>Type</th><th>Speed</th><th>Combat</th><th>Endurance</th><th>Cost</th><th>Action</th></tr></thead>
        <tbody>
          {mounts.map((m, i) => (
            <tr key={i}>
              <td><strong>{m.name}</strong></td>
              <td style={{ textTransform: 'capitalize' }}>{m.type}</td>
              <td>{m.speed}</td>
              <td>+{m.combat}</td>
              <td>{m.endurance}</td>
              <td>{m.cost} stags</td>
              <td><button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.mountBuy({ mount_type: m.type }), 'Mount purchased!').then(load)}>Buy</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrainingTab({ doAction }) {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await api.myTrainers().catch(() => ({ trainers: [] }))
    setTrainers(data.trainers || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Loading />
  return (
    <div>
      <h3 className="mb-2">Skill Trainers</h3>
      <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>Pay silver stags to train skills with canonical trainers across Westeros.</p>
      <table className="stats-table">
        <thead><tr><th>Trainer</th><th>Region</th><th>Skill</th><th>Your Lvl</th><th>Max</th><th>Cost</th><th>Action</th></tr></thead>
        <tbody>
          {trainers.map(t => (
            <tr key={t.id}>
              <td><strong>{t.name}</strong><br /><span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{t.description}</span></td>
              <td>{t.region}</td>
              <td>{t.skill}</td>
              <td style={{ color: 'var(--gold)' }}>{t.current_level}</td>
              <td>{t.max_level}</td>
              <td>{t.cost} stags</td>
              <td>{t.can_train ? <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.trainSkill(t.id), 'Trained!').then(load)}>Train</button> : <span className="text-muted" style={{ fontSize: '.75rem' }}>Maxed</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExploreTab({ doAction }) {
  const [landmarks, setLandmarks] = useState([])
  const [discoveries, setDiscoveries] = useState({})
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('')

  const load = async () => {
    setLoading(true)
    const [lm, ds, st] = await Promise.all([
      api.landmarks(region || null).catch(() => ({ landmarks: [] })),
      api.myDiscoveries().catch(() => ({ discoveries: [] })),
      api.explorationStats().catch(() => null)
    ])
    setLandmarks(lm.landmarks || [])
    setDiscoveries(ds.discoveries || [])
    setStats(st)
    setLoading(false)
  }
  useEffect(() => { load() }, [region])

  const discoveredNames = new Set(discoveries.map(d => d.name))

  if (loading) return <Loading />
  return (
    <div>
      {stats && (
        <div className="card mb-3">
          <div className="card-header">Exploration Progress</div>
          <div className="card-body">
            <p style={{ fontSize: '.9rem' }}>Discovered: <strong style={{ color: 'var(--gold)' }}>{stats.discovered}</strong> / {stats.total} ({stats.completion_pct}%)</p>
            <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stats.completion_pct}%`, background: 'var(--gold)', transition: 'width .3s' }} />
            </div>
            {stats.by_region && Object.keys(stats.by_region).length > 0 && (
              <div className="grid grid-3 mt-2" style={{ fontSize: '.75rem' }}>
                {Object.entries(stats.by_region).map(([r, d]) => (
                  <div key={r}><strong>{r}:</strong> {d.discovered}/{d.total}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="filter-bar mb-2">
        <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All Regions</option>
          <option value="North">North</option><option value="Crownlands">Crownlands</option>
          <option value="Reach">Reach</option><option value="Riverlands">Riverlands</option>
          <option value="Stormlands">Stormlands</option><option value="Vale">Vale</option>
          <option value="Dorne">Dorne</option><option value="Westerlands">Westerlands</option>
          <option value="Iron Islands">Iron Islands</option>
        </select>
      </div>
      <div className="grid grid-2">
        {landmarks.map(l => {
          const found = discoveredNames.has(l.name)
          return (
            <div key={l.id} className="card" style={{ opacity: found ? 0.6 : 1, border: found ? '1px solid var(--green)' : '1px solid var(--border)' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{found ? `${l.name} ✓` : l.name}</span>
                <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{l.type}</span>
              </div>
              <div className="card-body" style={{ fontSize: '.85rem' }}>
                <p className="text-muted" style={{ marginBottom: '.5rem' }}>{found ? l.description : 'Undiscovered. Visit this location to learn its secrets.'}</p>
                <p style={{ fontSize: '.75rem' }}>Region: {l.region} | Rewards: +{l.discover_xp} RP, +{l.discover_stars} stars</p>
                {!found && <button className="btn btn-primary btn-sm mt-1" onClick={() => doAction(() => api.discover(l.id), 'Discovered!').then(load)}>Discover</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ContractsTab({ doAction }) {
  const [contracts, setContracts] = useState([])
  const [mine, setMine] = useState({ posted: [], accepted: [] })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    setLoading(true)
    const [list, my] = await Promise.all([
      api.contractList().catch(() => ({ contracts: [] })),
      api.contractMy().catch(() => ({ posted: [], accepted: [] }))
    ])
    setContracts(list.contracts || [])
    setMine(my)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Loading />
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Player Contracts</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Post Contract'}</button>
      </div>

      {showForm && <ContractForm doAction={doAction} onDone={() => { setShowForm(false); load() }} />}

      <h4 className="mb-1">Your Posted Contracts</h4>
      {(mine.postted || []).length === 0 ? <p className="text-muted mb-3">None posted.</p> : (
        <div className="grid grid-2 mb-3">
          {(mine.posted || []).map(c => <ContractCard key={c.id} c={c} doAction={doAction} isOwner onDone={load} />)}
        </div>
      )}

      <h4 className="mb-1">Contracts You Accepted</h4>
      {(mine.accepted || []).length === 0 ? <p className="text-muted mb-3">None accepted.</p> : (
        <div className="grid grid-2 mb-3">
          {(mine.accepted || []).map(c => <ContractCard key={c.id} c={c} doAction={doAction} onDone={load} />)}
        </div>
      )}

      <h4 className="mb-1">Open Contracts</h4>
      {contracts.length === 0 ? <p className="text-muted">No open contracts.</p> : (
        <div className="grid grid-2">
          {contracts.map(c => <ContractCard key={c.id} c={c} doAction={doAction} onDone={load} />)}
        </div>
      )}
    </div>
  )
}

function ContractCard({ c, doAction, isOwner, onDone }) {
  const typeColors = { mercenary: 'var(--danger)', escort: 'var(--gold)', protection: '#4a9', trade_guard: '#8ac', bounty: '#c44', duel_challenge: '#a4a' }
  return (
    <div className="card" style={{ borderLeft: `3px solid ${typeColors[c.type] || 'var(--border)'}` }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ textTransform: 'capitalize' }}>{c.type.replace(/_/g, ' ')}</span>
        <span style={{ fontSize: '.75rem', color: c.status === 'open' ? 'var(--gold)' : c.status === 'completed' ? 'var(--green)' : 'var(--text-muted)' }}>{c.status}</span>
      </div>
      <div className="card-body" style={{ fontSize: '.85rem' }}>
        <p style={{ marginBottom: '.5rem' }}>{c.description}</p>
        <p className="text-muted" style={{ fontSize: '.75rem', marginBottom: '.5rem' }}>
          Posted by: {c.contractor} | Expires: {new Date(c.expires_at).toLocaleDateString()}
        </p>
        <p style={{ fontSize: '.8rem' }}>
          Reward: {c.reward_gold > 0 && `${c.reward_gold} gold `}{c.reward_stags > 0 && `${c.reward_stags} stags `}{c.reward_stars > 0 && `${c.reward_stars} stars`}
        </p>
        <div className="mt-1 d-flex gap-1">
          {c.status === 'open' && !isOwner && <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.contractAccept(c.id), 'Accepted!').then(onDone)}>Accept</button>}
          {c.status === 'assigned' && isOwner && <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.contractComplete(c.id), 'Completed!').then(onDone)}>Mark Complete</button>}
          {(c.status === 'open' || c.status === 'assigned') && isOwner && <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.contractCancel(c.id), 'Cancelled').then(onDone)}>Cancel</button>}
        </div>
      </div>
    </div>
  )
}

function ContractForm({ doAction, onDone }) {
  const [type, setType] = useState('mercenary')
  const [desc, setDesc] = useState('')
  const [gold, setGold] = useState(0)
  const [stags, setStags] = useState(0)
  const [stars, setStars] = useState(0)
  const [days, setDays] = useState(7)

  return (
    <div className="card mb-3" style={{ border: '1px solid var(--gold)' }}>
      <div className="card-header">Post a Contract</div>
      <div className="card-body">
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="mercenary">Mercenary</option>
              <option value="escort">Escort</option>
              <option value="protection">Protection</option>
              <option value="trade_guard">Trade Guard</option>
              <option value="bounty">Bounty</option>
              <option value="duel_challenge">Duel Challenge</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (days)</label>
            <input type="number" className="form-input" min="1" max="30" value={days} onChange={e => setDays(parseInt(e.target.value) || 7)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="2" placeholder="Describe the contract..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-3">
          <div className="form-group"><label className="form-label">Gold Dragons</label><input type="number" className="form-input" min="0" value={gold} onChange={e => setGold(parseInt(e.target.value) || 0)} /></div>
          <div className="form-group"><label className="form-label">Silver Stags</label><input type="number" className="form-input" min="0" value={stags} onChange={e => setStags(parseInt(e.target.value) || 0)} /></div>
          <div className="form-group"><label className="form-label">Copper Stars</label><input type="number" className="form-input" min="0" value={stars} onChange={e => setStars(parseInt(e.target.value) || 0)} /></div>
        </div>
        <button className="btn btn-primary" onClick={async () => {
          await doAction(() => api.contractCreate({ contract_type: type, description: desc, reward_gold: gold, reward_stags: stags, reward_stars: stars, duration_days: days }), 'Contract posted!')
          onDone()
        }}>Post Contract</button>
      </div>
    </div>
  )
}

function TavernsTab({ doAction }) {
  const [taverns, setTaverns] = useState([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('')

  const load = async () => {
    setLoading(true)
    const data = await api.tavernList(region || null).catch(() => ({ taverns: [] }))
    setTaverns(data.taverns || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [region])

  if (loading) return <Loading />
  return (
    <div>
      <div className="filter-bar mb-2">
        <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All Regions</option>
          <option value="North">North</option><option value="Crownlands">Crownlands</option>
          <option value="Reach">Reach</option><option value="Riverlands">Riverlands</option>
          <option value="Stormlands">Stormlands</option><option value="Vale">Vale</option>
          <option value="Dorne">Dorne</option><option value="Westerlands">Westerlands</option>
          <option value="Iron Islands">Iron Islands</option>
        </select>
      </div>
      <div className="grid grid-2">
        {taverns.map(t => (
          <div key={t.id} className="card">
            <div className="card-header">{t.name}</div>
            <div className="card-body" style={{ fontSize: '.85rem' }}>
              <p className="text-muted" style={{ marginBottom: '.5rem' }}>{t.description}</p>
              <p style={{ fontSize: '.75rem', marginBottom: '.5rem' }}>Innkeeper: {t.innkeeper} | Region: {t.region}</p>
              <div className="d-flex gap-1">
                <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.tavernRest(t.id), 'Rested!')}>Rest ({t.rest_cost}s)</button>
                <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.tavernMeal(t.id), 'Ate!')}>Meal ({t.meal_cost}s)</button>
                <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.tavernDrink(t.id), 'Drank!')}>Drink ({t.drink_cost}s)</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CyvasseTab({ doAction }) {
  const [stats, setStats] = useState(null)
  const [board, setBoard] = useState([])
  const [wager, setWager] = useState(0)
  const [opponent, setOpponent] = useState('Tyrion Lannister')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [s, lb] = await Promise.all([
      api.cyvasseStats().catch(() => ({})),
      api.cyvasseLeaderboard().catch(() => ({ leaderboard: [] }))
    ])
    setStats(s)
    setBoard(lb.leaderboard || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Loading />
  const opponents = ['Tyrion Lannister', 'Morro the Braavosi', 'Daenerys Targaryen', 'Petyr Baelish', 'Samwell Tarly', 'Oberyn Martell', 'Bloodbeard']
  return (
    <div>
      <div className="card mb-3">
        <div className="card-header">Cyvasse - The Game of Strategy</div>
        <div className="card-body">
          {stats && (
            <div className="grid grid-4 mb-2" style={{ fontSize: '.85rem' }}>
              <div><strong>Rating:</strong> {stats.rating || 1000}</div>
              <div><strong>Rank:</strong> {stats.rank || 'Novice'}</div>
              <div><strong>W/L/D:</strong> {stats.games_won || 0}/{stats.games_lost || 0}/{stats.games_draw || 0}</div>
              <div><strong>Net Gold:</strong> {(stats.gold_won || 0) - (stats.gold_lost || 0)}</div>
            </div>
          )}
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Opponent</label>
              <select className="form-input" value={opponent} onChange={e => setOpponent(e.target.value)}>
                {opponents.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Wager (silver stags)</label>
              <input type="number" className="form-input" min="0" value={wager} onChange={e => setWager(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => doAction(() => api.cyvassePlay(wager, opponent), 'Game played!').then(load)}>Play Cyvasse</button>
        </div>
      </div>
      <h3 className="mb-2">Cyvasse Rankings</h3>
      {board.length === 0 ? <p className="text-muted">No ranked players yet.</p> : (
        <table className="stats-table">
          <thead><tr><th>#</th><th>Player</th><th>Rating</th><th>Rank</th><th>W/L/D</th></tr></thead>
          <tbody>
            {board.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><strong>{p.name}</strong></td>
                <td style={{ color: 'var(--gold)' }}>{p.rating}</td>
                <td>{p.rank}</td>
                <td>{p.won}/{p.lost}/{p.draw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
