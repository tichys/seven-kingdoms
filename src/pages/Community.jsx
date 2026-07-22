import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function Community() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('leaderboards')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const [lbTab, setLbTab] = useState('rp')
  const [lbData, setLbData] = useState([])
  const [achievements, setAchievements] = useState([])
  const [myAch, setMyAch] = useState([])
  const [trades, setTrades] = useState([])
  const [marketListings, setMarketListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [marketCat, setMarketCat] = useState('all')
  const [marketSearch, setMarketSearch] = useState('')

  const tabs = [
    { id: 'leaderboards', label: 'Leaderboards' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'trading', label: 'Trading' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'tournaments', label: 'Tournaments' },
  ]

  const loadData = useCallback(async (tabId) => {
    setLoading(true); setError(null); setMessage(null)
    try {
      if (tabId === 'leaderboards') {
        const r = lbTab === 'rp' ? await api.leaderboardRP()
          : lbTab === 'combat' ? await api.leaderboardCombat()
          : lbTab === 'wealth' ? await api.leaderboardWealth()
          : await api.leaderboardHouses()
        setLbData(r.leaderboard || [])
      } else if (tabId === 'achievements') {
        const [a, m] = await Promise.all([api.achievementList(), api.myAchievements()])
        setAchievements(a.achievements || [])
        setMyAch(m.achievements || [])
      } else if (tabId === 'trading') {
        const t = await api.tradeList()
        setTrades(t.trades || [])
      } else if (tabId === 'marketplace') {
        const [m, ml] = await Promise.all([api.marketList(marketCat, marketSearch), api.marketMyListings()])
        setMarketListings(m.listings || [])
        setMyListings(ml.listings || [])
      } else if (tabId === 'tournaments') {
        const [t, mt] = await Promise.all([api.tournamentList(), api.tournamentMy()])
        setTournaments(t.tournaments || [])
        setMyTournaments(mt.tournaments || [])
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [lbTab, marketCat, marketSearch])

  useEffect(() => { loadData(tab) }, [tab, loadData])

  const doAction = async (fn, successMsg) => {
    setError(null); setMessage(null)
    try { const r = await fn(); setMessage(r.message || successMsg || 'Done'); loadData(tab) }
    catch (err) { setError(err.message) }
  }

  const renderLeaderboards = () => {
    const lbTabs = [{id:'rp',label:'RP Score'},{id:'combat',label:'Combat'},{id:'wealth',label:'Wealth'},{id:'houses',label:'Houses'}]
    const cols = lbTab === 'rp' ? ['Rank','Name','RP Score','House']
      : lbTab === 'combat' ? ['Rank','Name','Wins','House']
      : lbTab === 'wealth' ? ['Rank','Name','Stags','Stars','Dragons']
      : ['Rank','House','Members','Total RP','Battle Wins']

    return (
      <div>
        <div className="filter-bar mb-2">
          {lbTabs.map(t => (
            <button key={t.id} className={`btn btn-sm ${lbTab===t.id?'btn-primary':'btn-outline'}`} onClick={() => setLbTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {lbData.length === 0 ? <p className="text-muted">No data</p> : (
          <table className="stats-table">
            <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {lbData.map((r, i) => (
                <tr key={i}>
                  <td><strong className="text-gold">#{r.rank}</strong></td>
                  <td>{r.name || r.house_name || '-'}</td>
                  {lbTab === 'rp' && <td>{r.rp_score}</td>}
                  {lbTab === 'rp' && <td>{r.house || '-'}</td>}
                  {lbTab === 'combat' && <td>{r.wins}</td>}
                  {lbTab === 'combat' && <td>{r.house || '-'}</td>}
                  {lbTab === 'wealth' && <td>{r.stags}</td>}
                  {lbTab === 'wealth' && <td>{r.stars}</td>}
                  {lbTab === 'wealth' && <td>{r.dragons}</td>}
                  {lbTab === 'houses' && <td>{r.members}</td>}
                  {lbTab === 'houses' && <td>{r.total_rp}</td>}
                  {lbTab === 'houses' && <td>{r.battle_wins}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  const renderAchievements = () => {
    const earnedIds = myAch.map(a => a.id)
    const byCategory = {}
    achievements.forEach(a => { if (!byCategory[a.category]) byCategory[a.category] = []; byCategory[a.category].push(a) })

    return (
      <div>
        <div className="d-flex justify-between align-center mb-2">
          <h3>Achievements ({myAch.length}/{achievements.length} earned)</h3>
          <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.checkAchievements(), 'Checked')}>Check for New</button>
        </div>
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} className="mb-3">
            <h4 style={{ textTransform: 'capitalize', color: 'var(--gold)' }}>{cat}</h4>
            <div className="grid grid-3">
              {items.map(a => {
                const earned = earnedIds.includes(a.id)
                return (
                  <div key={a.id} className="card" style={{ opacity: earned ? 1 : 0.5, borderColor: earned ? 'var(--gold)' : 'var(--border)' }}>
                    <div className="card-header">
                      {a.name} {earned ? '✓' : '🔒'}
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-1" style={{ fontSize: '.85rem' }}>{a.description}</p>
                      <p style={{ fontSize: '.8rem' }}>
                        <span className="text-muted">Requires:</span> {a.requirement.value} {a.requirement.type.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontSize: '.8rem' }}>
                        <span className="text-muted">Rewards:</span> {a.rewards.xp > 0 && `${a.rewards.xp}xp `}{a.rewards.gold > 0 && `${a.rewards.gold}g `}{a.rewards.stars > 0 && `${a.rewards.stars}s`}
                      </p>
                      {earned && myAch.find(m => m.id === a.id) && (
                        <p style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>Earned: {new Date(myAch.find(m => m.id === a.id).earned_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTrading = () => (
    <div>
      <h3 className="mb-2">Pending Trade Offers ({trades.length})</h3>
      {trades.length === 0 ? <p className="text-muted">No pending trades</p> : (
        <table className="stats-table">
          <thead><tr><th>From</th><th>To</th><th>Items</th><th>Gold</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id}>
                <td>{t.from}</td>
                <td>{t.to}</td>
                <td style={{ fontSize: '.8rem' }}>
                  {t.from_items.length > 0 ? `Offering: ${t.from_items.map(i => i.qty+'x item#'+i.item_id).join(', ')}` : '-'}
                  {t.to_items.length > 0 ? ` | Want: ${t.to_items.map(i => i.qty+'x item#'+i.item_id).join(', ')}` : ''}
                </td>
                <td>{t.from_gold > 0 ? `${t.from_gold}g` : '-'}{t.to_gold > 0 ? ` / ${t.to_gold}g` : ''}</td>
                <td style={{ textTransform: 'capitalize' }}>{t.status}</td>
                <td>
                  {!t.is_sender ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.tradeAccept(t.id), 'Trade accepted')}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.tradeReject(t.id), 'Rejected')}>Reject</button>
                    </>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.tradeCancel(t.id), 'Cancelled')}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderMarketplace = () => (
    <div>
      <div className="filter-bar mb-2">
        <select className="filter-select" value={marketCat} onChange={e => setMarketCat(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="weapon">Weapons</option>
          <option value="armor">Armor</option>
          <option value="shield">Shields</option>
          <option value="consumable">Consumables</option>
          <option value="material">Materials</option>
          <option value="misc">Misc</option>
        </select>
        <input className="filter-input" placeholder="Search items..." value={marketSearch} onChange={e => setMarketSearch(e.target.value)} />
      </div>

      {myListings.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">My Listings ({myListings.length})</div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {myListings.map(m => (
                  <tr key={m.id}>
                    <td>{m.item_name}</td><td>{m.qty}</td><td>{m.price}g</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.status}</td>
                    <td>{m.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.marketCancel(m.id), 'Cancelled')}>Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="mb-2">Marketplace ({marketListings.length})</h3>
      {marketListings.length === 0 ? <p className="text-muted">No listings found</p> : (
        <table className="stats-table">
          <thead><tr><th>Item</th><th>Seller</th><th>Qty</th><th>Price/ea</th><th>Total</th><th>Action</th></tr></thead>
          <tbody>
            {marketListings.map(m => (
              <tr key={m.id}>
                <td><strong>{m.item_name}</strong></td>
                <td>{m.seller}</td><td>{m.qty}</td><td>{m.price}g</td><td>{m.price * m.qty}g</td>
                <td><button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.marketBuy(m.id, 1), 'Purchased')}>Buy 1</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderTournaments = () => (
    <div>
      {myTournaments.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">My Tournaments</div>
          <div className="card-body">
            <table className="stats-table">
              <thead><tr><th>Tournament</th><th>Type</th><th>Status</th><th>Placement</th></tr></thead>
              <tbody>
                {myTournaments.map(t => (
                  <tr key={t.tournament_id}>
                    <td><strong>{t.name}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.status}</td>
                    <td>{t.placement > 0 ? `#${t.placement}` : t.eliminated > 0 ? `Round ${t.eliminated}` : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3 className="mb-2">Tournaments ({tournaments.length})</h3>
      {tournaments.length === 0 ? <p className="text-muted">No tournaments scheduled</p> : (
        <div className="grid grid-2">
          {tournaments.map(t => (
            <div key={t.id} className="card">
              <div className="card-header">{t.name} <span className="text-muted">({t.type})</span></div>
              <div className="card-body">
                {t.description && <p className="text-muted mb-1" style={{ fontSize: '.85rem' }}>{t.description}</p>}
                <table className="stats-table">
                  <tbody>
                    <tr><th>Status</th><td style={{ textTransform: 'capitalize' }}>{t.status}</td></tr>
                    <tr><th>Participants</th><td>{t.participants}/{t.max_participants}</td></tr>
                    <tr><th>Region</th><td>{t.region || 'Any'}</td></tr>
                    <tr><th>Prize</th><td>{t.prize_gold}g + {t.prize_xp}xp</td></tr>
                  </tbody>
                </table>
                {t.status === 'upcoming' && t.participants < t.max_participants && (
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => doAction(() => api.tournamentRegister(t.id), 'Registered')}>Register</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Community</h1>
        <p>Leaderboards, achievements, trading, marketplace, and tournaments</p>
      </div>
      <div className="page-content">
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="tabs">
          <div className="tab-nav">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="tab-panel active">
            {loading && <Loading />}
            {!loading && tab === 'leaderboards' && renderLeaderboards()}
            {!loading && tab === 'achievements' && renderAchievements()}
            {!loading && tab === 'trading' && renderTrading()}
            {!loading && tab === 'marketplace' && renderMarketplace()}
            {!loading && tab === 'tournaments' && renderTournaments()}
          </div>
        </div>
      </div>
    </div>
  )
}
