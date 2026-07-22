import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function CharacterSetup() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [archetypes, setArchetypes] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('stats')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [myRequests, setMyRequests] = useState([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, a, p, r] = await Promise.all([
        api.getStats().catch(e => ({ error: e.message })),
        api.getAvailableArchetypes().catch(e => ({ error: e.message })),
        api.getProfile().catch(e => ({ error: e.message })),
        api.myRequests().catch(() => ({ requests: [] }))
      ])
      if (s.error) setError(s.error)
      else setStats(s)
      if (a.error) setError(a.error)
      else setArchetypes(a)
      if (p.error) { /* profile optional */ }
      else setProfile(p)
      setMyRequests(r.requests || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const reload = async () => {
    try {
      const [s, a, p, r] = await Promise.all([
        api.getStats(),
        api.getAvailableArchetypes(),
        api.getProfile(),
        api.myRequests().catch(() => ({ requests: [] }))
      ])
      setStats(s)
      setArchetypes(a)
      setProfile(p)
      setMyRequests(r.requests || [])
    } catch (err) { setError(err.message) }
  }

  const handleAllocate = async (statName, points) => {
    setResult(null)
    try {
      const r = await api.allocateStat(statName, points)
      setResult({ success: true, message: `${statName} +${points} → ${r.new_value}. ${r.remaining_points} points remaining.` })
      const s = await api.getStats()
      setStats(s)
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  const pendingReset = myRequests.some(r => r.type === 'reset_stats' && r.status === 'pending')
  const pendingLeave = myRequests.some(r => r.type === 'leave_house' && r.status === 'pending')

  const handleReset = async () => {
    if (pendingReset) return
    if (!confirm('Request admin approval to reset ALL stats to 3 and refund all points?')) return
    setResetting(true)
    setResult(null)
    try {
      const r = await api.resetStats()
      setResult({ success: true, message: r.message })
      await reload()
    } catch (err) { setResult({ success: false, message: err.message }) }
    setResetting(false)
  }

  const handleJoinHouse = async (houseId, rank) => {
    setResult(null)
    try {
      const r = await api.joinHouse(houseId, rank)
      setResult({ success: true, message: r.message })
      await reload()
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  const handleLeaveHouse = async () => {
    if (pendingLeave) return
    if (!confirm('Request admin approval to leave your current house?')) return
    setResult(null)
    try {
      const r = await api.leaveHouse()
      setResult({ success: true, message: r.message })
      await reload()
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  const handleChooseArchetype = async (archetypeId, archetypeName) => {
    if (!confirm(`Choose "${archetypeName}" as your permanent archetype? This CANNOT be undone.`)) return
    setResult(null)
    try {
      const r = await api.chooseArchetype(archetypeId)
      setResult({ success: true, message: r.message })
      await reload()
    } catch (err) { setResult({ success: false, message: err.message }) }
  }

  if (loading) return <Loading />
  if (error) return <div className="alert alert-danger">{error}</div>

  const hasHouse = profile?.house_name || archetypes?.has_house

  const tabs = [
    { id: 'stats', label: `Stats${stats?.unspent_points > 0 ? ` (${stats.unspent_points})` : ''}` },
    { id: 'house', label: hasHouse ? 'House' : 'Join House' },
    { id: 'archetype', label: 'Archetype' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Character Setup</h1>
        <p>Allocate stats, join a house, and choose your archetype</p>
      </div>

      <div className="page-content">
        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
            {result.message}
          </div>
        )}

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

        {tab === 'stats' && stats && (
          <StatAllocation stats={stats} onAllocate={handleAllocate} onReset={handleReset} resetting={resetting} pendingReset={pendingReset} />
        )}

        {tab === 'house' && (
          <HouseSelection
            profile={profile}
            onJoin={handleJoinHouse}
            onLeave={handleLeaveHouse}
            pendingLeave={pendingLeave}
          />
        )}

        {tab === 'archetype' && archetypes && (
          <ArchetypeSelection archetypes={archetypes} onChoose={handleChooseArchetype} />
        )}
      </div>
    </div>
  )
}

// =====================================================
function StatAllocation({ stats, onAllocate, onReset, resetting, pendingReset }) {
  const statBonus = (v) => v <= 1 ? -2 : v === 2 ? -1 : v === 3 ? 0 : v === 4 ? 1 : v === 5 ? 2 : v === 6 ? 3 : 4
  const hp = 10 + (stats.endurance * 3) + stats.might

  const statInfo = [
    { key: 'might', label: 'Might', desc: 'Physical strength, melee damage, HP bonus', color: '#c44' },
    { key: 'agility', label: 'Agility', desc: 'Speed, dodging, ranged accuracy, stealth', color: '#4a9' },
    { key: 'endurance', label: 'Endurance', desc: 'Stamina, wound recovery, HP (x3 multiplier)', color: '#fc8' },
    { key: 'wits', label: 'Wits', desc: 'Intelligence, initiative, crafting, knowledge', color: '#8ac' },
    { key: 'will', label: 'Will', desc: 'Mental resilience, magic power, concentration', color: '#a4a' },
    { key: 'presence', label: 'Presence', desc: 'Social influence, leadership, charisma', color: '#dc8' }
  ]

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SPECIAL Stat Allocation</span>
          <span style={{ fontSize: '1.1rem', color: stats.unspent_points > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
            Unspent: <strong>{stats.unspent_points}</strong>
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', fontSize: '.85rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
            <span>HP: <strong style={{ color: 'var(--green)' }}>{hp}</strong> (10 + End×3 + Might)</span>
            <span>Stats start at 3, max 7</span>
            <span>Stat bonus at 7: +4</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {statInfo.map(s => {
          const value = stats[s.key]
          const bonus = statBonus(value)
          const canInc1 = stats.unspent_points >= 1 && value < 7
          const canInc2 = stats.unspent_points >= 2 && value <= 5
          const canInc3 = stats.unspent_points >= 3 && value <= 4
          const canInc4 = stats.unspent_points >= 4 && value <= 3

          return (
            <div key={s.key} className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.label}</span>
                <span>
                  <strong style={{ color: s.color, fontSize: '1.2rem' }}>{value}</strong>
                  <span style={{ color: bonus >= 0 ? 'var(--green)' : 'var(--danger)', fontSize: '.85rem', marginLeft: '.5rem' }}>
                    {bonus >= 0 ? '+' : ''}{bonus}
                  </span>
                </span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{s.desc}</p>

                {/* Stat bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                  <div style={{ flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(value / 7) * 100}%`, background: s.color, transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{value}/7</span>
                </div>

                {/* Allocation buttons */}
                <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm"
                    disabled={!canInc1}
                    onClick={() => onAllocate(s.key, 1)}
                    style={{ opacity: canInc1 ? 1 : 0.4, background: canInc1 ? 'var(--gold)' : 'var(--border)', color: canInc1 ? 'var(--bg-dark)' : 'var(--text-muted)', border: 'none', padding: '.25rem .5rem', cursor: canInc1 ? 'pointer' : 'not-allowed' }}
                  >+1</button>
                  <button
                    className="btn btn-sm"
                    disabled={!canInc2}
                    onClick={() => onAllocate(s.key, 2)}
                    style={{ opacity: canInc2 ? 1 : 0.4, background: canInc2 ? 'var(--gold)' : 'var(--border)', color: canInc2 ? 'var(--bg-dark)' : 'var(--text-muted)', border: 'none', padding: '.25rem .5rem', cursor: canInc2 ? 'pointer' : 'not-allowed' }}
                  >+2</button>
                  <button
                    className="btn btn-sm"
                    disabled={!canInc3}
                    onClick={() => onAllocate(s.key, 3)}
                    style={{ opacity: canInc3 ? 1 : 0.4, background: canInc3 ? 'var(--gold)' : 'var(--border)', color: canInc3 ? 'var(--bg-dark)' : 'var(--text-muted)', border: 'none', padding: '.25rem .5rem', cursor: canInc3 ? 'pointer' : 'not-allowed' }}
                  >+3</button>
                  <button
                    className="btn btn-sm"
                    disabled={!canInc4}
                    onClick={() => onAllocate(s.key, 4)}
                    style={{ opacity: canInc4 ? 1 : 0.4, background: canInc4 ? 'var(--gold)' : 'var(--border)', color: canInc4 ? 'var(--bg-dark)' : 'var(--text-muted)', border: 'none', padding: '.25rem .5rem', cursor: canInc4 ? 'pointer' : 'not-allowed' }}
                  >+4</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {pendingReset ? (
          <div className="alert alert-warning" style={{ margin: 0 }}>
            Stat reset request pending admin approval.
          </div>
        ) : (
          <>
            <button className="btn btn-danger" onClick={onReset} disabled={resetting}>
              {resetting ? 'Submitting...' : 'Request Stat Reset'}
            </button>
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
              Requires admin approval. Resets all stats to 3 and refunds 12 points.
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// =====================================================
function HouseSelection({ profile, onJoin, onLeave, pendingLeave }) {
  const [houses, setHouses] = useState([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [joinRank, setJoinRank] = useState('Smallfolk')

  const regions = ['', 'North', 'Westerlands', 'Reach', 'Stormlands', 'Vale', 'Riverlands', 'Iron Islands', 'Dorne', 'Crownlands']
  const ranks = ['Smallfolk', 'Man-at-Arms', 'Knight', 'Guest']

  useEffect(() => { searchHouses() }, [])

  const searchHouses = async () => {
    setLoading(true)
    try {
      const data = await api.housesList(search || null, region || null)
      setHouses(data.houses || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  // If player already has a house, show current house info
  if (profile?.house_name) {
    return (
      <div>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header" style={{ color: 'var(--gold)' }}>Your House</div>
          <div className="card-body">
            <div style={{ fontSize: '1.1rem', marginBottom: '.5rem' }}>
              <strong>{profile.house_name}</strong>
              {profile.house_rank && <span style={{ color: 'var(--text-muted)', marginLeft: '.5rem' }}>({profile.house_rank})</span>}
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              You are a member of {profile.house_name}. Some archetypes require house membership.
            </p>
            {pendingLeave ? (
              <div className="alert alert-warning" style={{ margin: 0 }}>
                House leave request pending admin approval.
              </div>
            ) : (
              <button className="btn btn-danger" onClick={onLeave}>Request to Leave House</button>
            )}
          </div>
        </div>
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
          To change your rank within the house (e.g., to Knight or Castellan), ask an admin or the house lord.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Join a House</div>
        <div className="card-body">
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Join a house to unlock archetypes that require house membership, earn territory income, and participate in house politics.
            You can self-join as Smallfolk, Man-at-Arms, Knight, or Guest. For Lord/Lady/Castellan, ask an admin.
          </p>
          <div className="filter-bar" style={{ marginBottom: '1rem' }}>
            <input type="text" className="filter-input" placeholder="Search houses..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchHouses()} />
            <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r || 'All Regions'}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={searchHouses}>Search</button>
          </div>

          {loading && <Loading />}

          {!loading && houses.length === 0 && <p className="text-muted">No houses found</p>}

          {!loading && houses.length > 0 && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {houses.slice(0, 50).map(h => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHouse(selectedHouse === h.id ? null : h.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '.75rem',
                    marginBottom: '.5rem',
                    background: selectedHouse === h.id ? 'rgba(218,165,32,0.1)' : 'transparent',
                    border: `1px solid ${selectedHouse === h.id ? 'rgba(218,165,32,0.3)' : 'var(--border)'}`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{h.name}</strong>
                      {h.words && <span style={{ fontSize: '.8rem', fontStyle: 'italic', color: 'var(--text-muted)', marginLeft: '.5rem' }}>"{h.words}"</span>}
                    </div>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                      {h.region} | {h.type} | {h.members} members
                    </span>
                  </div>
                  {selectedHouse === h.id && (
                    <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.5rem' }}>
                        <label style={{ fontSize: '.85rem' }}>Join as:</label>
                        <select className="filter-select" value={joinRank} onChange={e => setJoinRank(e.target.value)}>
                          {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => { e.stopPropagation(); onJoin(h.id, joinRank) }}
                        >
                          Join {h.name}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
function ArchetypeSelection({ archetypes, onChoose }) {
  const statColors = { might: '#c44', agility: '#4a9', endurance: '#fc8', wits: '#8ac', will: '#a4a', presence: '#dc8' }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Choose Your Archetype</div>
        <div className="card-body">
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
            Your archetype defines your character's role and starting skills. Choose carefully — this is a permanent choice.
            {archetypes.current_archetype_id && <span style={{ color: 'var(--gold)' }}> You already have an archetype assigned.</span>}
          </p>
          {!archetypes.has_house && (
            <p style={{ fontSize: '.85rem', color: 'var(--danger)' }}>
              You are not in a house. Some archetypes require house membership.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        {archetypes.archetypes.map(a => (
          <div key={a.id} className="card" style={{
            border: a.is_current ? '1px solid var(--gold)' : '1px solid var(--border)',
            opacity: a.can_choose || a.is_current ? 1 : 0.6
          }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{a.name}</span>
              {a.is_current && <span style={{ color: 'var(--gold)', fontSize: '.75rem' }}>★ Current</span>}
              {!a.can_choose && !a.is_current && <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>Locked</span>}
            </div>
            <div className="card-body" style={{ fontSize: '.85rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '.5rem' }}>
                <span>Primary: <span style={{ color: statColors[a.primary_stat] || '#888', fontWeight: 'bold', textTransform: 'capitalize' }}>{a.primary_stat}</span></span>
                <span>Secondary: <span style={{ color: statColors[a.secondary_stat] || '#888', fontWeight: 'bold', textTransform: 'capitalize' }}>{a.secondary_stat}</span></span>
                {a.hp_bonus > 0 && <span style={{ color: 'var(--green)' }}>+{a.hp_bonus} HP</span>}
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '.5rem' }}>{a.description || 'No description available.'}</p>
              {a.starting_skills?.length > 0 && (
                <div style={{ fontSize: '.8rem', marginBottom: '.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Starting skills: </span>
                  {a.starting_skills.map(s => `${s.name} L${s.level}`).join(', ')}
                </div>
              )}
              <div style={{ fontSize: '.75rem' }}>
                {a.faction && <span style={{ color: 'var(--text-muted)', marginRight: '.5rem' }}>Faction: {a.faction}</span>}
                {a.admin_locked && <span style={{ color: 'var(--danger)', marginRight: '.5rem' }}>Admin-locked</span>}
                {a.house_required && <span style={{ color: 'var(--gold)', marginRight: '.5rem' }}>House Required</span>}
              </div>
              {!a.can_choose && !a.is_current && (
                <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: 'var(--danger)' }}>
                  {a.reason}
                </div>
              )}
              {a.can_choose && !a.is_current && (
                <div style={{ marginTop: '.5rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onChoose(a.id, a.name)}
                  >
                    Choose {a.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
