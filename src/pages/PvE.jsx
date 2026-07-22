import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function PvE() {
  const { user } = useAuth()
  const [tab, setTab] = useState('dungeons')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const [dungeons, setDungeons] = useState([])
  const [selectedDungeon, setSelectedDungeon] = useState(null)
  const [dungeonRun, setDungeonRun] = useState(null)
  const [bounties, setBounties] = useState([])
  const [myBounties, setMyBounties] = useState([])
  const [bestiary, setBestiary] = useState([])
  const [selectedCreature, setSelectedCreature] = useState(null)
  const [npcs, setNpcs] = useState([])
  const [npcDialogue, setNpcDialogue] = useState(null)
  const [vendorItems, setVendorItems] = useState([])
  const [showVendor, setShowVendor] = useState(false)

  const tabs = [
    { id: 'dungeons', label: 'Dungeons' },
    { id: 'bounties', label: 'Bounties' },
    { id: 'bestiary', label: 'Bestiary' },
    { id: 'npcs', label: 'NPCs' },
  ]

  const loadData = useCallback(async (tabId) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (tabId === 'dungeons') {
        const [d, s] = await Promise.all([api.dungeonList(), api.dungeonStatus()])
        setDungeons(d.dungeons || [])
        if (s.run) setDungeonRun(s.run)
      } else if (tabId === 'bounties') {
        const [b, m] = await Promise.all([api.bountyList(), api.bountyMy()])
        setBounties(b.bounties || [])
        setMyBounties(m.bounties || [])
      } else if (tabId === 'bestiary') {
        const c = await api.bestiary()
        setBestiary(c.creatures || [])
      } else if (tabId === 'npcs') {
        const n = await api.npcList()
        setNpcs(n.npcs || [])
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData(tab) }, [tab, loadData])

  const doAction = async (fn, successMsg) => {
    setError(null)
    setMessage(null)
    try {
      const res = await fn()
      setMessage(res.message || successMsg || 'Done')
      if (tab === 'dungeons' && res.dungeon_completed) setDungeonRun(null)
      loadData(tab)
    } catch (err) {
      setError(err.message)
    }
  }

  const renderDungeons = () => (
    <div>
      {dungeonRun && (
        <div className="card mb-3" style={{ borderColor: 'var(--gold)' }}>
          <div className="card-header">Active Run: {dungeonRun.dungeon_name}</div>
          <div className="card-body">
            <table className="stats-table">
              <tbody>
                <tr><th>Room</th><td>{dungeonRun.current_room} / {dungeonRun.total_rooms}</td></tr>
                <tr><th>Rooms Cleared</th><td>{dungeonRun.rooms_cleared}</td></tr>
                <tr><th>Party HP</th><td>{dungeonRun.hp_remaining}%</td></tr>
                <tr><th>XP Earned</th><td>{dungeonRun.total_xp}</td></tr>
                <tr><th>Gold Earned</th><td>{dungeonRun.total_gold}</td></tr>
                <tr><th>Status</th><td style={{ textTransform: 'capitalize' }}>{dungeonRun.run_status}</td></tr>
              </tbody>
            </table>
            {dungeonRun.run_status === 'active' && (
              <div className="mt-2 d-flex gap-1">
                <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.dungeonAdvance(dungeonRun.id), 'Advanced')}>Advance</button>
                <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.dungeonRetreat(dungeonRun.id), 'Retreated')}>Retreat</button>
              </div>
            )}
            {(dungeonRun.run_status === 'completed' || dungeonRun.run_status === 'abandoned') && dungeonRun.loot?.length > 0 && (
              <div className="mt-2">
                <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.dungeonLoot(dungeonRun.id), 'Loot claimed')}>Claim Loot</button>
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="mb-2">Available Dungeons</h3>
      {dungeons.length === 0 ? <p className="text-muted">No dungeons available</p> : (
        <div className="grid grid-2">
          {dungeons.map(d => (
            <div key={d.id} className="card">
              <div className="card-header">{d.name} <span className="text-muted">({d.region})</span></div>
              <div className="card-body">
                <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{d.description}</p>
                <table className="stats-table">
                  <tbody>
                    <tr><th>Min Level</th><td>{d.min_level}</td></tr>
                    <tr><th>Rooms</th><td>{d.rooms}</td></tr>
                    <tr><th>Max Party</th><td>{d.max_party}</td></tr>
                    <tr><th>Boss</th><td>{d.boss} (Diff {d.boss_difficulty}/10){d.is_boss ? ' ★' : ''}</td></tr>
                    <tr><th>Rewards</th><td>{d.rewards.xp}xp, {d.rewards.gold}g, {d.rewards.stars}s</td></tr>
                  </tbody>
                </table>
                <div className="mt-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedDungeon(selectedDungeon === d.id ? null : d.id)}>
                    {selectedDungeon === d.id ? 'Hide' : 'Details'}
                  </button>
                  {!dungeonRun && <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.dungeonEnter(d.id), 'Entered')}>Enter</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderBounties = () => (
    <div>
      {myBounties.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">My Bounties</div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>Bounty</th><th>Creature</th><th>Progress</th><th>Status</th><th>Rewards</th><th>Action</th></tr></thead>
              <tbody>
                {myBounties.map(b => (
                  <tr key={b.bounty_id}>
                    <td>{b.title}</td>
                    <td>{b.creature}</td>
                    <td>{b.kills} / {b.required}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {b.status === 'completed' && <span className="text-gold">Completed</span>}
                      {b.status === 'active' && <span className="text-warning">Active</span>}
                      {b.status === 'claimed' && <span className="text-muted">Claimed</span>}
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{b.rewards.gold}g, {b.rewards.xp}xp</td>
                    <td>
                      {b.status === 'active' && <button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.bountyCheck(b.bounty_id), 'Checked')}>Check</button>}
                      {b.status === 'completed' && <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.bountyComplete(b.bounty_id), 'Claimed')}>Claim</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="mb-2">Available Bounties</h3>
      {bounties.length === 0 ? <p className="text-muted">No bounties available</p> : (
        <table className="stats-table">
          <thead><tr><th>Title</th><th>Creature</th><th>Region</th><th>Kills</th><th>Difficulty</th><th>Rewards</th><th>Action</th></tr></thead>
          <tbody>
            {bounties.map(b => (
              <tr key={b.id}>
                <td><strong>{b.title}</strong></td>
                <td>{b.creature}</td>
                <td>{b.region}</td>
                <td>{b.required_kills}</td>
                <td>{b.difficulty}/10</td>
                <td style={{ fontSize: '.8rem' }}>{b.rewards.gold}g, {b.rewards.xp}xp, {b.rewards.stars}s{b.rewards.item ? `, ${b.rewards.item}` : ''}</td>
                <td><button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.bountyAccept(b.id), 'Accepted')}>Accept</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderBestiary = () => (
    <div>
      <h3 className="mb-2">Creature Bestiary ({bestiary.length} creatures)</h3>
      {bestiary.length === 0 ? <p className="text-muted">No creatures found</p> : (
        <div className="grid grid-2">
          {bestiary.map(c => (
            <div key={c.id} className="card" style={{ borderColor: c.is_boss ? 'var(--red)' : 'var(--border)' }}>
              <div className="card-header">
                {c.name}{c.is_boss ? ' ★ BOSS' : ''} <span className="text-muted">({c.type})</span>
              </div>
              <div className="card-body">
                <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{c.description}</p>
                <table className="stats-table">
                  <tbody>
                    <tr><th>Difficulty</th><td>{c.difficulty}/10</td></tr>
                    <tr><th>HP / DMG / Armor</th><td>{c.stats.hp} / {c.stats.damage} / {c.stats.armor}</td></tr>
                    <tr><th>Stats</th><td>M:{c.stats.might} A:{c.stats.agility} E:{c.stats.endurance}</td></tr>
                    <tr><th>Region</th><td>{c.region}</td></tr>
                    <tr><th>Min Level</th><td>{c.min_level}</td></tr>
                    <tr><th>Rewards</th><td>{c.rewards.xp}xp, {c.rewards.gold}g, {c.rewards.stars}s</td></tr>
                  </tbody>
                </table>
                {c.loot.length > 0 && (
                  <div className="mt-2">
                    <strong style={{ fontSize: '.8rem', color: 'var(--gold)' }}>Loot Table:</strong>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      {c.loot.map((l, i) => (
                        <span key={i}>{l.name} ({l.guaranteed ? 'guaranteed' : l.chance + '%'}){i < c.loot.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  </div>
                )}
                {c.boss_phases.length > 0 && (
                  <div className="mt-2">
                    <strong style={{ fontSize: '.8rem', color: 'var(--red)' }}>Boss Phases:</strong>
                    {c.boss_phases.map((p, i) => (
                      <div key={i} style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        Phase {p.phase} ({p.hp}% HP): <strong>{p.ability}</strong> ({p.type}) — {p.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderNPCs = () => (
    <div>
      <h3 className="mb-2">NPCs</h3>
      {npcs.length === 0 ? <p className="text-muted">No NPCs found</p> : (
        <div className="grid grid-2">
          {npcs.map(n => (
            <div key={n.name} className="card">
              <div className="card-header">{n.name} <span className="text-muted">({n.type})</span></div>
              <div className="card-body">
                <p className="text-muted mb-2" style={{ fontSize: '.85rem' }}>{n.greeting}</p>
                <p style={{ fontSize: '.8rem' }}>Region: {n.region}</p>
                <button className="btn btn-outline btn-sm mt-2" onClick={async () => {
                  try {
                    const r = await api.npcTalk(n.name)
                    setNpcDialogue({ npc: n.name, text: r.text, options: r.options || [] })
                  } catch (err) { setError(err.message) }
                }}>Talk</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {npcDialogue && (
        <div className="card mt-3" style={{ borderColor: 'var(--gold)' }}>
          <div className="card-header">Dialogue: {npcDialogue.npc}</div>
          <div className="card-body">
            <p className="mb-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>{npcDialogue.text}</p>
            {npcDialogue.options.map((opt, i) => (
              <button key={i} className="btn btn-outline btn-sm mt-1" style={{ display: 'block', width: '100%', textAlign: 'left' }}
                onClick={async () => {
                  if (opt.action === 'exit') { setNpcDialogue(null); return }
                  if (opt.action === 'shop' || opt.action === 'vendor') {
                    setShowVendor(true)
                    const r = await api.npcVendor(opt.params?.type)
                    setVendorItems(r.items || [])
                    return
                  }
                  if (opt.next) {
                    try {
                      const r = await api.npcRespond(npcDialogue.npc, opt.next)
                      setNpcDialogue({ npc: npcDialogue.npc, text: r.text, options: r.options || [] })
                    } catch (err) { setError(err.message) }
                  }
                }}>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {showVendor && vendorItems.length > 0 && (
        <div className="card mt-3">
          <div className="card-header">Vendor Inventory</div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>Item</th><th>Type</th><th>Price</th><th>Action</th></tr></thead>
              <tbody>
                {vendorItems.map(i => (
                  <tr key={i.id}>
                    <td><strong>{i.name}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{i.type}</td>
                    <td>{i.price} stags</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => doAction(() => api.npcBuy(i.id), 'Purchased')}>Buy</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-sm mt-2" onClick={() => setShowVendor(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Adventures</h1>
        <p>Dungeons, bounties, bestiary, and NPC interactions</p>
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
            {!loading && tab === 'dungeons' && renderDungeons()}
            {!loading && tab === 'bounties' && renderBounties()}
            {!loading && tab === 'bestiary' && renderBestiary()}
            {!loading && tab === 'npcs' && renderNPCs()}
          </div>
        </div>
      </div>
    </div>
  )
}
