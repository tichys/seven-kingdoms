import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function Admin() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('overview')
  const [error, setError] = useState(null)

  const tabs = [
    { id: 'overview', label: 'Overview', minLevel: 1 },
    { id: 'players', label: 'Players', minLevel: 1 },
    { id: 'grant', label: 'Grant', minLevel: 2 },
    { id: 'houses', label: 'Houses', minLevel: 1 },
    { id: 'economy', label: 'Economy', minLevel: 1 },
    { id: 'creatures', label: 'Creatures', minLevel: 1 },
    { id: 'applications', label: 'Applications', minLevel: 1 },
    { id: 'tools', label: 'Tools', minLevel: 2 },
    { id: 'requests', label: 'Requests', minLevel: 1 },
    { id: 'audit', label: 'Audit Logs', minLevel: 1 },
    { id: 'broadcast', label: 'Broadcast', minLevel: 2 }
  ].filter(t => adminLevel >= t.minLevel)

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Level {adminLevel} {adminLevel >= 3 ? '(Admin)' : adminLevel >= 2 ? '(GM)' : '(Mod)'}</p>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-danger" onClick={() => setError(null)}>{error}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn btn-sm"
              style={{
                background: tab === t.id ? 'var(--gold)' : 'transparent',
                color: tab === t.id ? 'var(--bg-dark)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px 4px 0 0',
                borderBottom: 'none',
                padding: '.5rem 1rem',
                cursor: 'pointer',
                fontSize: '.85rem'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab adminLevel={adminLevel} />}
        {tab === 'players' && <PlayersTab adminLevel={adminLevel} setError={setError} />}
        {tab === 'grant' && <GrantTab setError={setError} />}
        {tab === 'houses' && <HousesTab setError={setError} />}
        {tab === 'economy' && <EconomyTab />}
        {tab === 'creatures' && <CreaturesTab adminLevel={adminLevel} setError={setError} />}
        {tab === 'applications' && <ApplicationsTab adminLevel={adminLevel} setError={setError} />}
        {tab === 'tools' && <ToolsTab setError={setError} />}
        {tab === 'requests' && <RequestsTab adminLevel={adminLevel} setError={setError} />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'broadcast' && <BroadcastTab setError={setError} />}
      </div>
    </div>
  )
}

// =====================================================
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [online, setOnline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [s, o] = await Promise.all([api.adminServerStats(), api.getOnlinePlayers()])
      setStats(s)
      setOnline(o.players || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading) return <Loading />
  if (!stats) return <p className="text-muted">Failed to load stats</p>

  return (
    <div>
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <StatCard label="Total Players" value={stats.players.total} sub={`${stats.players.online} online`} color="var(--text)" />
        <StatCard label="Houses" value={stats.houses.total} sub={`${stats.houses.great} great houses`} color="var(--gold)" />
        <StatCard label="Admins" value={stats.admins} sub="active" color="var(--danger)" />
        <StatCard label="Combat (24h)" value={stats.combat_24h} sub="encounters" color="var(--danger)" />
        <StatCard label="Economy (24h)" value={stats.economy_24h.transactions} sub={`${stats.economy_24h.total_amount} moved`} color="var(--gold)" />
        <StatCard label="Ravens" value={stats.ravens.total} sub={`${stats.ravens.unread} unread`} color="var(--text-muted)" />
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Online Players ({online.length})</span>
          <button className="btn btn-sm btn-outline" onClick={load}>Refresh</button>
        </div>
        <div className="card-body">
          {online.length === 0 ? <p className="text-muted">No players online</p> : (
            <table style={{ width: '100%', fontSize: '.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--gold)' }}>
                <th style={{ textAlign: 'left', padding: '.5rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '.5rem' }}>House</th>
                <th style={{ textAlign: 'left', padding: '.5rem' }}>IC Status</th>
              </tr></thead>
              <tbody>
                {online.map(p => (
                  <tr key={p.avatar_key} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '.5rem' }}>{p.avatar_name}</td>
                    <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{p.house_name || '-'}</td>
                    <td style={{ padding: '.5rem' }}>{p.ic_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color }}>{value}</div>
        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  )
}

// =====================================================
function PlayersTab({ adminLevel, setError }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async () => {
    if (search.length < 2) return
    setLoading(true)
    try {
      const data = await api.adminPlayerSearch(search)
      setResults(data.players || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const viewDetail = async (key) => {
    setSelected(key)
    setDetail(null)
    try {
      const d = await api.adminPlayerDetail(key)
      setDetail(d)
    } catch (err) { setError(err.message) }
  }

  const handleBan = async (key, banned) => {
    try {
      await api.adminPlayerBan(key, banned ? 1 : 0)
      viewDetail(key)
    } catch (err) { setError(err.message) }
  }

  const handleSetAdmin = async (key, level) => {
    try {
      await api.adminSetAdmin(key, level)
      viewDetail(key)
    } catch (err) { setError(err.message) }
  }

  const handleHeal = async (key) => {
    try {
      await api.adminHeal(key)
      viewDetail(key)
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="grid grid-2">
      <div>
        <div className="card">
          <div className="card-header">Player Search</div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              <input type="text" className="filter-input" placeholder="Name or UUID..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
              <button className="btn btn-primary btn-sm" onClick={doSearch}>Search</button>
            </div>
            {loading && <Loading />}
            {!loading && results.length === 0 && search.length >= 2 && <p className="text-muted">No results</p>}
            {!loading && results.map(p => (
              <div key={p.avatar_key} onClick={() => viewDetail(p.avatar_key)} style={{
                cursor: 'pointer', padding: '.5rem', marginBottom: '.25rem',
                background: selected === p.avatar_key ? 'rgba(218,165,32,0.1)' : 'transparent',
                border: '1px solid var(--border)', borderRadius: '4px'
              }}>
                <div style={{ fontWeight: selected === p.avatar_key ? 'bold' : 'normal' }}>
                  {p.avatar_name}
                  {p.admin_level > 0 && <span style={{ color: 'var(--danger)', fontSize: '.75rem', marginLeft: '.5rem' }}>Admin L{p.admin_level}</span>}
                  {p.is_banned && <span style={{ color: 'var(--danger)', fontSize: '.75rem', marginLeft: '.5rem' }}>BANNED</span>}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  {p.house_name || 'No house'} | {p.status} | RP: {p.rp_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        {selected ? (
          detail ? (
            <div className="card">
              <div className="card-header">{detail.avatar_name}</div>
              <div className="card-body" style={{ fontSize: '.85rem' }}>
                <InfoRow label="UUID" value={detail.avatar_key} />
                <InfoRow label="House" value={detail.house_name || 'None'} />
                <InfoRow label="Archetype" value={detail.archetype || 'Not assigned'} />
                <InfoRow label="Title" value={detail.title || 'None'} />
                <InfoRow label="HP" value={`${detail.hp_current} / ${detail.hp_max}`} color={detail.hp_current < detail.hp_max / 2 ? 'var(--danger)' : 'var(--green)'} />
                <InfoRow label="Currency" value={`${detail.gold_dragons}g / ${detail.silver_stags}s / ${detail.copper_stars}c`} color="var(--gold)" />
                <InfoRow label="RP Score" value={detail.rp_score} />
                <InfoRow label="Wounds" value={detail.wound_count} color={detail.wound_count > 0 ? 'var(--danger)' : 'var(--green)'} />
                <InfoRow label="Inventory" value={`${detail.inventory_count} items (${detail.inventory_total_qty} qty)`} />
                <InfoRow label="Skills" value={detail.skill_count} />
                <InfoRow label="Admin Level" value={detail.admin_level || 'None'} color={detail.admin_level > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
                <InfoRow label="Status" value={detail.status} color={detail.status === 'online' ? 'var(--green)' : 'var(--text-muted)'} />
                <InfoRow label="Banned" value={detail.is_banned ? 'Yes' : 'No'} color={detail.is_banned ? 'var(--danger)' : 'var(--green)'} />
                <InfoRow label="Joined" value={new Date(detail.created_at).toLocaleDateString()} />
                {detail.stats && (
                  <div style={{ marginTop: '.5rem', padding: '.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--gold)', marginBottom: '.25rem' }}>Stats (unspent: {detail.stats.unspent_points})</div>
                    M:{detail.stats.might} A:{detail.stats.agility} E:{detail.stats.endurance} W:{detail.stats.wits} I:{detail.stats.will} P:{detail.stats.presence}
                  </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleHeal(selected)}>Heal</button>
                  {detail.is_banned ? (
                    <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'var(--bg-dark)' }} onClick={() => handleBan(selected, 0)}>Unban</button>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => handleBan(selected, 1)}>Ban</button>
                  )}
                  {adminLevel >= 3 && (
                    <>
                      <select className="filter-select" defaultValue="" onChange={e => e.target.value && handleSetAdmin(selected, parseInt(e.target.value))}>
                        <option value="">Set Admin...</option>
                        <option value="0">Revoke Admin</option>
                        <option value="1">Mod (L1)</option>
                        <option value="2">GM (L2)</option>
                        <option value="3">Admin (L3)</option>
                      </select>
                    </>
                  )}
                  {adminLevel >= 2 && (
                    <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(selected); setError('UUID copied to clipboard') }}>Copy UUID</button>
                  )}
                </div>
              </div>
            </div>
          ) : <Loading />) : (
          <div className="card"><div className="card-body"><p className="text-muted">Select a player to view details</p></div></div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.3rem 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)', fontWeight: 'bold' }}>{value}</span>
    </div>
  )
}

// =====================================================
function GrantTab({ setError }) {
  const [targetKey, setTargetKey] = useState('')
  const [grantType, setGrantType] = useState('gold')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('dragon')
  const [result, setResult] = useState(null)

  const handleGrant = async (e) => {
    e.preventDefault()
    setResult(null)
    try {
      await api.adminGrant(targetKey, grantType, value, currency)
      setResult({ success: true, message: 'Grant successful' })
      setTargetKey(''); setValue('')
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <div className="card-header">Grant Reward</div>
      <div className="card-body">
        <form onSubmit={handleGrant}>
          <div className="form-group">
            <input className="form-input" placeholder="Target avatar key (UUID)" value={targetKey} onChange={e => setTargetKey(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
            <select className="filter-select" value={grantType} onChange={e => setGrantType(e.target.value)} style={{ flex: 1 }}>
              <option value="gold">Currency</option>
              <option value="item">Item (by ID)</option>
              <option value="xp">XP (to skill)</option>
              <option value="stat">Stat Points</option>
            </select>
            <input className="form-input" placeholder="Amount / Item ID" value={value} onChange={e => setValue(e.target.value)} required style={{ flex: 1 }} />
          </div>
          {grantType === 'gold' && (
            <select className="filter-select" value={currency} onChange={e => setCurrency(e.target.value)} style={{ marginBottom: '.5rem' }}>
              <option value="dragon">Gold Dragons</option>
              <option value="stag">Silver Stags</option>
              <option value="star">Copper Stars</option>
            </select>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Grant</button>
        </form>
        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
function HousesTab({ setError }) {
  const [houseSearch, setHouseSearch] = useState('')
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const searchHouses = async () => {
    try {
      const data = await api.getHouses(houseSearch || null, null)
      setHouses(data.houses || [])
    } catch (err) { setError(err.message) }
  }

  const viewMembers = async (houseId, houseName) => {
    setSelectedHouse({ id: houseId, name: houseName })
    setLoading(true)
    try {
      const data = await api.adminHouseMembers(houseId)
      setMembers(data.members || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleSetLord = async (avatarKey) => {
    if (!confirm(`Make this player the Lord of ${selectedHouse.name}?`)) return
    try {
      await api.adminSetLord(selectedHouse.id, avatarKey)
      viewMembers(selectedHouse.id, selectedHouse.name)
    } catch (err) { setError(err.message) }
  }

  useEffect(() => { searchHouses() }, [])

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header">Find House</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
            <input type="text" className="filter-input" placeholder="House name..." value={houseSearch} onChange={e => setHouseSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchHouses()} />
            <button className="btn btn-primary btn-sm" onClick={searchHouses}>Search</button>
          </div>
          {houses.slice(0, 20).map(h => (
            <div key={h.id} onClick={() => viewMembers(h.id, h.name)} style={{
              cursor: 'pointer', padding: '.5rem', marginBottom: '.25rem',
              background: selectedHouse?.id === h.id ? 'rgba(218,165,32,0.1)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: '4px'
            }}>
              <div style={{ fontWeight: 'bold' }}>{h.name}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{h.region} | {h.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedHouse ? (
          <div className="card">
            <div className="card-header">{selectedHouse.name} — Members</div>
            <div className="card-body">
              {loading ? <Loading /> : members.length === 0 ? <p className="text-muted">No members</p> : (
                <table style={{ width: '100%', fontSize: '.85rem' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--gold)' }}>
                    <th style={{ textAlign: 'left', padding: '.5rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '.5rem' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '.5rem' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '.5rem' }}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.avatar_key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '.5rem' }}>
                          {m.avatar_name}
                          {m.is_lord && <span style={{ color: 'var(--gold)', fontSize: '.75rem', marginLeft: '.5rem' }}>★ Lord</span>}
                          {m.is_banned && <span style={{ color: 'var(--danger)', fontSize: '.75rem', marginLeft: '.5rem' }}>BANNED</span>}
                        </td>
                        <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{m.rank}</td>
                        <td style={{ padding: '.5rem' }}>{m.status}</td>
                        <td style={{ padding: '.5rem', textAlign: 'right' }}>
                          {!m.is_lord && <button className="btn btn-sm btn-outline" onClick={() => handleSetLord(m.avatar_key)}>Make Lord</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : <div className="card"><div className="card-body"><p className="text-muted">Select a house to manage members</p></div></div>}
      </div>
    </div>
  )
}

// =====================================================
function EconomyTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setStats(await api.adminEconomyStats()) } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading) return <Loading />
  if (!stats) return <p className="text-muted">Failed to load economy stats</p>

  return (
    <div>
      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <StatCard label="Gold Dragons" value={stats.total_dragons} sub="in circulation" color="var(--gold)" />
        <StatCard label="Silver Stags" value={stats.total_stags} sub="in circulation" color="var(--text-muted)" />
        <StatCard label="Copper Stars" value={stats.total_stars} sub="in circulation" color="var(--text-muted)" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">Wealthiest Players</div>
          <div className="card-body">
            <table style={{ width: '100%', fontSize: '.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--gold)' }}>
                <th style={{ textAlign: 'left', padding: '.5rem' }}>Player</th>
                <th style={{ textAlign: 'right', padding: '.5rem' }}>Total (stars equiv.)</th>
              </tr></thead>
              <tbody>
                {(stats.wealthiest || []).map((w, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '.5rem' }}>{w.avatar_name}</td>
                    <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>{parseInt(w.total_stars).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Recent Transactions</div>
          <div className="card-body">
            {(stats.recent_transactions || []).length === 0 ? <p className="text-muted">No recent transactions</p> : (
              <table style={{ width: '100%', fontSize: '.8rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '.25rem' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Currency</th>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Reason</th>
                </tr></thead>
                <tbody>
                  {(stats.recent_transactions || []).slice(0, 15).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '.25rem' }}>{t.entry_type}</td>
                      <td style={{ padding: '.25rem', textAlign: 'right', color: 'var(--gold)' }}>{t.amount}</td>
                      <td style={{ padding: '.25rem', color: 'var(--text-muted)' }}>{t.currency}</td>
                      <td style={{ padding: '.25rem', color: 'var(--text-muted)', fontSize: '.75rem' }}>{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
function AuditTab() {
  const [logType, setLogType] = useState('admin')
  const [target, setTarget] = useState('')
  const [logs, setLogs] = useState([])
  const [loaded, setLoaded] = useState(false)

  const viewLogs = async () => {
    try {
      const data = await api.adminAudit(logType, target || null, 50)
      setLogs(data.logs || [])
      setLoaded(true)
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        <select className="filter-select" value={logType} onChange={e => setLogType(e.target.value)}>
          <option value="admin">Admin Actions</option>
          <option value="combat">Combat Log</option>
          <option value="economy">Economy Log</option>
        </select>
        <input className="filter-input" placeholder="Target UUID (optional)" value={target} onChange={e => setTarget(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={viewLogs}>View</button>
      </div>

      {!loaded ? <p className="text-muted">Select a log type and click View</p> : logs.length === 0 ? <p className="text-muted">No logs found</p> : (
        <table style={{ width: '100%', fontSize: '.85rem' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--gold)' }}>
            <th style={{ textAlign: 'left', padding: '.5rem' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '.5rem' }}>Admin/Actor</th>
            <th style={{ textAlign: 'left', padding: '.5rem' }}>Action</th>
            <th style={{ textAlign: 'left', padding: '.5rem' }}>Target</th>
            <th style={{ textAlign: 'left', padding: '.5rem' }}>Details</th>
          </tr></thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.5rem', fontSize: '.8rem' }}>{new Date(l.created_at || l.timestamp).toLocaleString()}</td>
                <td style={{ padding: '.5rem' }}>{l.admin_name || l.attacker_name || l.admin_key?.slice(0, 8) || '-'}</td>
                <td style={{ padding: '.5rem' }}>{l.action || l.entry_type}</td>
                <td style={{ padding: '.5rem', fontSize: '.8rem' }}>{l.target_key?.slice(0, 8) || l.defender_name || '-'}</td>
                <td style={{ padding: '.5rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>{l.details || l.reason || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// =====================================================
function BroadcastTab({ setError }) {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)

  const handleBroadcast = async () => {
    if (!message.trim()) return
    setResult(null)
    try {
      await api.adminBroadcast(message)
      setResult({ success: true, message: 'Broadcast sent' })
      setMessage('')
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <div className="card-header">Broadcast Message</div>
      <div className="card-body">
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Send a message to all online players via the HUD. (Requires in-world relay)
        </p>
        <textarea
          className="form-input"
          placeholder="Enter broadcast message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows="4"
          style={{ width: '100%', marginBottom: '.5rem' }}
        />
        <button className="btn btn-primary" onClick={handleBroadcast} style={{ width: '100%' }}>Broadcast</button>
        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
function RequestsTab({ adminLevel, setError }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.adminPendingRequests()
      setRequests(r.requests || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    try {
      await api.adminApproveRequest(id, note[id] || '')
      await load()
    } catch (err) { setError(err.message) }
  }

  const handleDeny = async (id) => {
    try {
      await api.adminDenyRequest(id, note[id] || '')
      await load()
    } catch (err) { setError(err.message) }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h3>Pending Approval Requests ({requests.length})</h3>
      {requests.length === 0 ? (
        <p className="text-muted">No pending requests</p>
      ) : (
        <table className="stats-table">
          <thead>
            <tr><th>Player</th><th>Type</th><th>Reason</th><th>Submitted</th><th>Note</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td><strong>{r.avatar_name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{r.type.replace(/_/g, ' ')}</td>
                <td>{r.reason}</td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <input
                    className="form-input"
                    style={{ width: '150px', fontSize: '.8rem' }}
                    placeholder="Optional note..."
                    value={note[r.id] || ''}
                    onChange={e => setNote({ ...note, [r.id]: e.target.value })}
                  />
                </td>
                <td>
                  {adminLevel >= 2 ? (
                    <div className="d-flex gap-1">
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeny(r.id)}>Deny</button>
                    </div>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '.8rem' }}>View only (need L2+)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// =====================================================
function CreaturesTab({ adminLevel, setError }) {
  const [creatures, setCreatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', type: 'beast', hp: 20, damage: 5, armor: 0,
    might: 3, agility: 3, endurance: 3, difficulty: 3, region: '',
    rewards_xp: 10, rewards_gold: 0, rewards_stars: 20, is_boss: 0, min_level: 1
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.creatureList(search)
      setCreatures(data.creatures || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setForm({ name: '', description: '', type: 'beast', hp: 20, damage: 5, armor: 0, might: 3, agility: 3, endurance: 3, difficulty: 3, region: '', rewards_xp: 10, rewards_gold: 0, rewards_stars: 20, is_boss: 0, min_level: 1 })
    setEditing(null)
    setShowForm(false)
  }

  const startEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, description: c.description || '', type: c.type, hp: c.hp, damage: c.damage, armor: c.armor, might: c.might, agility: c.agility, endurance: c.endurance, difficulty: c.difficulty, region: c.region || '', rewards_xp: c.rewards_xp, rewards_gold: c.rewards_gold, rewards_stars: c.rewards_stars, is_boss: c.is_boss, min_level: c.min_level })
    setShowForm(true)
  }

  const submit = async () => {
    try {
      if (editing) {
        await api.creatureUpdate(editing.id, form)
      } else {
        await api.creatureCreate(form)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const del = async (id) => {
    if (!confirm('Delete this creature? This cannot be undone.')) return
    try {
      await api.creatureDelete(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="filter-bar mb-2">
        <input className="filter-input" placeholder="Search creatures..." value={search} onChange={e => setSearch(e.target.value)} />
        {adminLevel >= 2 && (
          <button className="btn btn-primary btn-sm" onClick={() => editing ? resetForm() : setShowForm(!showForm)}>
            {showForm ? 'Cancel' : editing ? 'Cancel Edit' : 'New Creature'}
          </button>
        )}
      </div>

      {showForm && adminLevel >= 2 && (
        <div className="card mb-3">
          <div className="card-header">{editing ? `Edit: ${editing.name}` : 'New Creature'}</div>
          <div className="card-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="beast">Beast</option>
                  <option value="humanoid">Humanoid</option>
                  <option value="undead">Undead</option>
                  <option value="dragon">Dragon</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Region (blank = any)</label>
                <input className="form-input" value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">HP</label>
                <input className="form-input" type="number" value={form.hp} onChange={e => setForm({...form, hp: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Damage</label>
                <input className="form-input" type="number" value={form.damage} onChange={e => setForm({...form, damage: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Armor</label>
                <input className="form-input" type="number" value={form.armor} onChange={e => setForm({...form, armor: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty (1-10)</label>
                <input className="form-input" type="number" min="1" max="10" value={form.difficulty} onChange={e => setForm({...form, difficulty: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Might</label>
                <input className="form-input" type="number" value={form.might} onChange={e => setForm({...form, might: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Agility</label>
                <input className="form-input" type="number" value={form.agility} onChange={e => setForm({...form, agility: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Endurance</label>
                <input className="form-input" type="number" value={form.endurance} onChange={e => setForm({...form, endurance: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Min Level</label>
                <input className="form-input" type="number" value={form.min_level} onChange={e => setForm({...form, min_level: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">XP Reward</label>
                <input className="form-input" type="number" value={form.rewards_xp} onChange={e => setForm({...form, rewards_xp: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Gold Reward (stags)</label>
                <input className="form-input" type="number" value={form.rewards_gold} onChange={e => setForm({...form, rewards_gold: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Stars Reward</label>
                <input className="form-input" type="number" value={form.rewards_stars} onChange={e => setForm({...form, rewards_stars: +e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Is Boss?</label>
                <select className="form-select" value={form.is_boss} onChange={e => setForm({...form, is_boss: +e.target.value})}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-sm mt-2" onClick={submit}>{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> : creatures.length === 0 ? (
        <p className="text-muted">No creatures found</p>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Type</th><th>HP</th><th>DMG</th>
              <th>Arm</th><th>Diff</th><th>Region</th><th>Boss</th>
              {adminLevel >= 2 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {creatures.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                <td>{c.hp}</td>
                <td>{c.damage}</td>
                <td>{c.armor}</td>
                <td>{c.difficulty}/10</td>
                <td>{c.region || 'Any'}</td>
                <td>{c.is_boss ? 'YES' : ''}</td>
                {adminLevel >= 2 && (
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(c.id)}>Del</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// =====================================================
// Tools Tab - spawn, weather, season, titles, infect, quest force-complete
// =====================================================
function ToolsTab({ setError }) {
  const [success, setSuccess] = useState(null)
  const [subTab, setSubTab] = useState('spawn')
  const [spawnForm, setSpawnForm] = useState({ creature_type_id: '', region: '', count: 1 })
  const [weatherForm, setWeatherForm] = useState({ region: 'North', weather_type: 'rain', severity: 1, duration: 60 })
  const [seasonForm, setSeasonForm] = useState({ season: 'winter', intensity: 3 })
  const [titleForm, setTitleForm] = useState({ avatar_key: '', title_id: '' })
  const [infectForm, setInfectForm] = useState({ avatar_key: '', disease_id: '' })
  const [questForm, setQuestForm] = useState({ avatar_key: '', quest_id: '' })

  const doAction = async (fn, label) => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fn()
      setSuccess(res.message || label || 'Done')
    } catch (err) {
      setError(err.message)
    }
  }

  const regions = ['North', 'Riverlands', 'Westerlands', 'Reach', 'Stormlands', 'Dorne', 'Vale', 'Iron Islands', 'Crownlands']
  const weatherTypes = ['clear', 'rain', 'storm', 'snow', 'blizzard', 'fog', 'heatwave', 'drought', 'sandstorm']
  const seasons = ['spring', 'summer', 'autumn', 'winter']

  return (
    <div>
      {success && <div className="alert alert-success mb-2">{success}</div>}
      <div className="tab-nav mb-3">
        <button className={`tab-btn${subTab === 'spawn' ? ' active' : ''}`} onClick={() => setSubTab('spawn')}>Spawn</button>
        <button className={`tab-btn${subTab === 'weather' ? ' active' : ''}`} onClick={() => setSubTab('weather')}>Weather</button>
        <button className={`tab-btn${subTab === 'season' ? ' active' : ''}`} onClick={() => setSubTab('season')}>Season</button>
        <button className={`tab-btn${subTab === 'title' ? ' active' : ''}`} onClick={() => setSubTab('title')}>Title</button>
        <button className={`tab-btn${subTab === 'infect' ? ' active' : ''}`} onClick={() => setSubTab('infect')}>Disease</button>
        <button className={`tab-btn${subTab === 'quest' ? ' active' : ''}`} onClick={() => setSubTab('quest')}>Force Quest</button>
      </div>

      {subTab === 'spawn' && (
        <div className="card"><div className="card-header">Spawn Creature Encounter</div><div className="card-body">
          <div className="grid grid-3">
            <div className="form-group"><label className="form-label">Creature Type ID</label><input className="form-input" type="number" value={spawnForm.creature_type_id} onChange={e => setSpawnForm({...spawnForm, creature_type_id: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Region</label><select className="form-select" value={spawnForm.region} onChange={e => setSpawnForm({...spawnForm, region: e.target.value})}><option value="">Any</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Count</label><input className="form-input" type="number" min="1" max="50" value={spawnForm.count} onChange={e => setSpawnForm({...spawnForm, count: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.spawnCreature(+spawnForm.creature_type_id, spawnForm.region, +spawnForm.count), 'Creature spawned')}>Spawn</button>
        </div></div>
      )}

      {subTab === 'weather' && (
        <div className="card"><div className="card-header">Set Weather</div><div className="card-body">
          <div className="grid grid-3">
            <div className="form-group"><label className="form-label">Region</label><select className="form-select" value={weatherForm.region} onChange={e => setWeatherForm({...weatherForm, region: e.target.value})}>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Weather Type</label><select className="form-select" value={weatherForm.weather_type} onChange={e => setWeatherForm({...weatherForm, weather_type: e.target.value})}>{weatherTypes.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Severity (1-5)</label><input className="form-input" type="number" min="1" max="5" value={weatherForm.severity} onChange={e => setWeatherForm({...weatherForm, severity: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Duration (min)</label><input className="form-input" type="number" value={weatherForm.duration} onChange={e => setWeatherForm({...weatherForm, duration: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.setWeather(weatherForm.region, weatherForm.weather_type, +weatherForm.severity, +weatherForm.duration), 'Weather set')}>Set Weather</button>
        </div></div>
      )}

      {subTab === 'season' && (
        <div className="card"><div className="card-header">Change Season</div><div className="card-body">
          <div className="grid grid-2">
            <div className="form-group"><label className="form-label">Season</label><select className="form-select" value={seasonForm.season} onChange={e => setSeasonForm({...seasonForm, season: e.target.value})}>{seasons.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Intensity (1-5)</label><input className="form-input" type="number" min="1" max="5" value={seasonForm.intensity} onChange={e => setSeasonForm({...seasonForm, intensity: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.setSeason(seasonForm.season, +seasonForm.intensity), 'Season changed')}>Change Season</button>
        </div></div>
      )}

      {subTab === 'title' && (
        <div className="card"><div className="card-header">Grant Title</div><div className="card-body">
          <div className="grid grid-2">
            <div className="form-group"><label className="form-label">Avatar Key</label><input className="form-input" value={titleForm.avatar_key} onChange={e => setTitleForm({...titleForm, avatar_key: e.target.value})} placeholder="UUID" /></div>
            <div className="form-group"><label className="form-label">Title ID</label><input className="form-input" type="number" value={titleForm.title_id} onChange={e => setTitleForm({...titleForm, title_id: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.grantTitle(titleForm.avatar_key, +titleForm.title_id), 'Title granted')}>Grant Title</button>
        </div></div>
      )}

      {subTab === 'infect' && (
        <div className="card"><div className="card-header">Infect Player</div><div className="card-body">
          <div className="grid grid-2">
            <div className="form-group"><label className="form-label">Avatar Key</label><input className="form-input" value={infectForm.avatar_key} onChange={e => setInfectForm({...infectForm, avatar_key: e.target.value})} placeholder="UUID" /></div>
            <div className="form-group"><label className="form-label">Disease ID</label><input className="form-input" type="number" value={infectForm.disease_id} onChange={e => setInfectForm({...infectForm, disease_id: e.target.value})} /></div>
          </div>
          <button className="btn btn-danger btn-sm mt-2" onClick={() => doAction(() => api.infectPlayer(infectForm.avatar_key, +infectForm.disease_id), 'Player infected')}>Infect</button>
        </div></div>
      )}

      {subTab === 'quest' && (
        <div className="card"><div className="card-header">Force-Complete Quest</div><div className="card-body">
          <div className="grid grid-2">
            <div className="form-group"><label className="form-label">Avatar Key</label><input className="form-input" value={questForm.avatar_key} onChange={e => setQuestForm({...questForm, avatar_key: e.target.value})} placeholder="UUID" /></div>
            <div className="form-group"><label className="form-label">Quest ID</label><input className="form-input" type="number" value={questForm.quest_id} onChange={e => setQuestForm({...questForm, quest_id: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.forceQuestComplete(questForm.avatar_key, +questForm.quest_id), 'Quest completed')}>Force Complete</button>
        </div></div>
      )}
    </div>
  )
}

// =====================================================
// CHARACTER APPLICATIONS TAB
// =====================================================
function ApplicationsTab({ adminLevel, setError }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedApp, setSelectedApp] = useState(null)
  const [detail, setDetail] = useState(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.adminApplicationList(statusFilter)
      setApplications(r.applications || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const viewDetail = async (app) => {
    setSelectedApp(app.id)
    setNote('')
    try {
      const r = await api.adminApplicationDetail(app.id)
      setDetail(r.application)
    } catch (err) { setError(err.message) }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await api.adminApplicationApprove(selectedApp, note)
      setSelectedApp(null)
      setDetail(null)
      setNote('')
      await load()
    } catch (err) { setError(err.message) }
    setActionLoading(false)
  }

  const handleDeny = async () => {
    if (!note.trim()) { setError('Denial reason is required'); return }
    setActionLoading(true)
    try {
      await api.adminApplicationDeny(selectedApp, note)
      setSelectedApp(null)
      setDetail(null)
      setNote('')
      await load()
    } catch (err) { setError(err.message) }
    setActionLoading(false)
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        {['pending', 'approved', 'denied', 'all'].map(s => (
          <button key={s} className="btn btn-sm" style={{
            background: statusFilter === s ? 'var(--gold)' : 'transparent',
            color: statusFilter === s ? 'var(--bg-dark)' : 'var(--text)',
            border: '1px solid var(--border)', padding: '.25rem .75rem', cursor: 'pointer',
            textTransform: 'capitalize', fontSize: '.8rem'
          }} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      {selectedApp && detail ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Application: {detail.character_name}</span>
            <button className="btn btn-sm" style={{ background: 'var(--border)', border: 'none' }} onClick={() => { setSelectedApp(null); setDetail(null) }}>Close</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p><strong>SL Name:</strong> {detail.avatar_name}</p>
                <p><strong>Character:</strong> {detail.character_name}</p>
                <p><strong>Gender:</strong> {detail.gender}</p>
                <p><strong>Age:</strong> {detail.age}</p>
                <p><strong>House:</strong> {detail.house_name || 'None'} {detail.house_region ? `(${detail.house_region})` : ''} - {detail.house_rank}</p>
                <p><strong>Archetype:</strong> {detail.archetype_name}</p>
                <p><strong>Religion:</strong> {detail.religion_name || 'None'}</p>
              </div>
              <div>
                <p><strong>Attributes ({detail.stat_points_spent}/12):</strong></p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.25rem', fontSize: '.85rem' }}>
                  <span>Might: <strong style={{ color: '#c44' }}>{detail.might}</strong></span>
                  <span>Agility: <strong style={{ color: '#4a9' }}>{detail.agility}</strong></span>
                  <span>Endurance: <strong style={{ color: '#fc8' }}>{detail.endurance}</strong></span>
                  <span>Wits: <strong style={{ color: '#8ac' }}>{detail.wits}</strong></span>
                  <span>Will: <strong style={{ color: '#a4a' }}>{detail.will}</strong></span>
                  <span>Presence: <strong style={{ color: '#dc8' }}>{detail.presence}</strong></span>
                </div>
                <p style={{ marginTop: '.5rem' }}><strong>HP:</strong> {15 + (detail.endurance * 4) + detail.might + detail.hp_bonus}</p>
                <p><strong>Archetype Bonus:</strong> +{detail.hp_bonus} HP</p>
                {detail.starting_skills?.length > 0 && (
                  <div style={{ fontSize: '.8rem', marginTop: '.25rem' }}>
                    <strong>Starting Skills:</strong> {detail.starting_skills.map(s => `${s.name} L${s.level}`).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {detail.appearance && (
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Appearance:</strong>
                <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap', marginTop: '.25rem' }}>{detail.appearance}</p>
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Background:</strong>
              <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap', marginTop: '.25rem' }}>{detail.background}</p>
            </div>
            {detail.personality && (
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Personality:</strong>
                <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap', marginTop: '.25rem' }}>{detail.personality}</p>
              </div>
            )}

            {detail.app_status === 'pending' && (
              <>
                <div className="form-group">
                  <label className="form-label">Review Note (required for denial, optional for approval)</label>
                  <textarea className="form-input" rows="2" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Feedback for the player..." style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {adminLevel >= 2 ? (
                    <>
                      <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                        {actionLoading ? 'Processing...' : 'Approve & Apply'}
                      </button>
                      <button className="btn btn-danger" onClick={handleDeny} disabled={actionLoading}>
                        Deny
                      </button>
                    </>
                  ) : (
                    <span className="text-muted">View only (need L2+ to approve/deny)</span>
                  )}
                </div>
              </>
            )}
            {detail.app_status === 'approved' && (
              <div className="alert alert-success">
                Approved on {detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString() : 'N/A'}
                {detail.review_note && <br />} {detail.review_note}
              </div>
            )}
            {detail.app_status === 'denied' && (
              <div className="alert alert-danger">
                Denied on {detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString() : 'N/A'}
                <br />Reason: {detail.review_note}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {applications.length === 0 ? (
            <p className="text-muted">No {statusFilter} applications</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Character</th>
                  <th>SL Name</th>
                  <th>Archetype</th>
                  <th>House</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => viewDetail(a)}>
                    <td><strong>{a.character_name}</strong></td>
                    <td>{a.avatar_name}</td>
                    <td>{a.archetype_name}</td>
                    <td>{a.house_name || '-'}</td>
                    <td>{a.age}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <span style={{ color: a.status === 'pending' ? 'var(--gold)' : a.status === 'approved' ? 'var(--green)' : 'var(--danger)' }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{new Date(a.submitted_at).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm" style={{ background: 'var(--border)', border: 'none' }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
