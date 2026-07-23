import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function Trade() {
  const { user } = useAuth()
  const [tab, setTab] = useState('goods')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [myGoods, setMyGoods] = useState([])
  const [allGoods, setAllGoods] = useState([])
  const [myTrades, setMyTrades] = useState({ incoming: [], outgoing: [] })
  const [market, setMarket] = useState([])
  const [houses, setHouses] = useState([])
  const [showPropose, setShowPropose] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mg, ag, mt, mk] = await Promise.all([
        api.tradeMyGoods().catch(() => ({ goods: [], summary: {} })),
        api.tradeAllGoods().catch(() => ({ goods: [] })),
        api.tradeMyTrades().catch(() => ({ incoming: [], outgoing: [] })),
        api.tradeMarket().catch(() => ({ trades: [] }))
      ])
      setMyGoods(mg.goods || [])
      setAllGoods(ag.goods || [])
      setMyTrades(mt)
      setMarket(mk.trades || [])
      const housesData = await api.getHouses().catch(() => ({ houses: [] }))
      setHouses((housesData.houses || []).filter(h => h.id !== user?.house_id))
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [user?.house_id])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, msg) => {
    setError(null); setSuccess(null)
    try { const r = await fn(); setSuccess(r.message || msg || 'Done'); load() }
    catch (err) { setError(err.message) }
  }

  const tabs = [
    { id: 'goods', label: 'My Goods' },
    { id: 'trades', label: `Trade Proposals (${(myTrades.incoming || []).length})` },
    { id: 'market', label: 'Market' },
    { id: 'all', label: 'All Goods' }
  ]

  // Summarize my goods by type
  const goodsSummary = {}
  ;(myGoods || []).forEach(g => {
    if (!goodsSummary[g.good]) goodsSummary[g.good] = { stored: 0, production: 0, territories: [] }
    goodsSummary[g.good].stored += g.stored
    goodsSummary[g.good].production += g.production
    goodsSummary[g.good].territories.push(g.territory)
  })

  return (
    <div>
      <div className="page-header">
        <h1>Trade & Goods</h1>
        <p>Manage your house's canonical goods production and negotiate trades with other houses</p>
      </div>
      <div className="page-content">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tabs">
          <div className="tab-nav">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="tab-panel active">
            {loading ? <Loading /> : tab === 'goods' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Goods Produced by Your House</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPropose(!showPropose)}>
                    {showPropose ? 'Cancel' : 'Propose Trade'}
                  </button>
                </div>

                {showPropose && <ProposeTradeForm houses={houses} goods={Object.keys(goodsSummary)} doAction={doAction} setShowPropose={setShowPropose} />}

                {Object.keys(goodsSummary).length === 0 ? (
                  <p className="text-muted">Your house has no goods. Ensure your house owns territories.</p>
                ) : (
                  <div className="grid grid-3">
                    {Object.entries(goodsSummary).sort((a, b) => b[1].stored - a[1].stored).map(([good, data]) => (
                      <div key={good} className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{good}</span>
                          <span style={{ color: 'var(--gold)' }}>{data.stored}</span>
                        </div>
                        <div className="card-body" style={{ fontSize: '.8rem' }}>
                          <p className="text-muted">Production: {data.production}/day</p>
                          <p className="text-muted">From: {data.territories.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {myGoods.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Detailed Production by Territory</h4>
                    <table className="stats-table">
                      <thead><tr><th>Good</th><th>Territory</th><th>Region</th><th>Production/day</th><th>Stored</th></tr></thead>
                      <tbody>
                        {myGoods.map((g, i) => (
                          <tr key={i}>
                            <td><strong>{g.good}</strong></td>
                            <td>{g.territory}</td>
                            <td>{g.region}</td>
                            <td>{g.production}</td>
                            <td style={{ color: 'var(--gold)' }}>{g.stored}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : tab === 'trades' ? (
              <div>
                <h3 className="mb-2">Incoming Trade Proposals</h3>
                {(myTrades.incoming || []).length === 0 ? <p className="text-muted mb-4">No incoming trade proposals.</p> : (
                  <div className="grid grid-2 mb-4">
                    {myTrades.incoming.map(t => (
                      <div key={t.id} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{t.from_house} → {t.to_house}</span>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{new Date(t.proposed_at).toLocaleDateString()}</span>
                        </div>
                        <div className="card-body" style={{ fontSize: '.85rem' }}>
                          <p><strong>Offering:</strong> {t.offer_qty} {t.offer_good}</p>
                          <p><strong>Requesting:</strong> {t.request_good ? `${t.request_qty} ${t.request_good}` : ''}{t.request_gold > 0 ? `${t.request_good ? ' + ' : ''}${t.request_gold} stags` : ''}</p>
                          {t.message && <p className="text-muted" style={{ fontStyle: 'italic' }}>"{t.message}"</p>}
                          <p style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Expires: {new Date(t.expires_at).toLocaleDateString()}</p>
                          <div className="d-flex gap-1 mt-2">
                            <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.tradeAccept(t.id), 'Trade accepted!')}>Accept</button>
                            <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.tradeReject(t.id), 'Trade rejected')}>Reject</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="mb-2">Outgoing Trade Proposals</h3>
                {(myTrades.outgoing || []).length === 0 ? <p className="text-muted">No outgoing trade proposals.</p> : (
                  <div className="grid grid-2">
                    {myTrades.outgoing.map(t => (
                      <div key={t.id} className="card" style={{ borderLeft: '3px solid var(--border)' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{t.from_house} → {t.to_house}</span>
                          <span style={{ fontSize: '.75rem', color: t.status === 'pending' ? 'var(--gold)' : 'var(--text-muted)' }}>{t.status}</span>
                        </div>
                        <div className="card-body" style={{ fontSize: '.85rem' }}>
                          <p><strong>Offering:</strong> {t.offer_qty} {t.offer_good}</p>
                          <p><strong>Requesting:</strong> {t.request_good ? `${t.request_qty} ${t.request_good}` : ''}{t.request_gold > 0 ? `${t.request_good ? ' + ' : ''}${t.request_gold} stags` : ''}</p>
                          {t.message && <p className="text-muted" style={{ fontStyle: 'italic' }}>"{t.message}"</p>}
                          {t.status === 'pending' && (
                            <button className="btn btn-danger btn-sm mt-2" onClick={() => doAction(() => api.tradeCancel(t.id), 'Trade cancelled')}>Cancel</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : tab === 'market' ? (
              <div>
                <h3 className="mb-2">Active Trade Market</h3>
                {market.length === 0 ? <p className="text-muted">No active trade proposals in the market.</p> : (
                  <table className="stats-table">
                    <thead><tr><th>From House</th><th>To House</th><th>Offering</th><th>Requesting</th><th>Message</th><th>Expires</th></tr></thead>
                    <tbody>
                      {market.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.from_house}</strong></td>
                          <td>{t.to_house}</td>
                          <td>{t.offer_qty} {t.offer_good}</td>
                          <td>{t.request_good ? `${t.request_qty} ${t.request_good}` : ''}{t.request_gold > 0 ? `${t.request_good ? ' + ' : ''}${t.request_gold} stags` : ''}</td>
                          <td style={{ fontSize: '.8rem', maxWidth: '200px' }}>{t.message || '-'}</td>
                          <td style={{ fontSize: '.75rem' }}>{new Date(t.expires_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div>
                <h3 className="mb-2">All Goods in Westeros</h3>
                <table className="stats-table">
                  <thead><tr><th>Good</th><th>Total Stored</th><th>Production/day</th><th>Territories</th><th>Regions</th></tr></thead>
                  <tbody>
                    {allGoods.map((g, i) => (
                      <tr key={i}>
                        <td><strong>{g.good}</strong></td>
                        <td style={{ color: 'var(--gold)' }}>{g.total_stored}</td>
                        <td>{g.total_production}</td>
                        <td>{g.territories}</td>
                        <td style={{ fontSize: '.75rem' }}>{g.regions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposeTradeForm({ houses, goods, doAction, setShowPropose }) {
  const [toHouse, setToHouse] = useState('')
  const [offerGood, setOfferGood] = useState('')
  const [offerQty, setOfferQty] = useState(1)
  const [requestGood, setRequestGood] = useState('')
  const [requestQty, setRequestQty] = useState(0)
  const [requestGold, setRequestGold] = useState(0)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!toHouse || !offerGood || offerQty < 1) return
    if (!requestGood && requestGold <= 0) return
    await doAction(() => api.tradePropose({
      to_house_id: toHouse, offer_good: offerGood, offer_qty: offerQty,
      request_good: requestGood || null, request_qty: requestQty || 0,
      request_gold: requestGold || 0, message: message || null
    }), 'Trade proposed!')
    setShowPropose(false)
  }

  return (
    <div className="card mb-4" style={{ border: '1px solid var(--gold)' }}>
      <div className="card-header">Propose New Trade</div>
      <div className="card-body">
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Target House</label>
            <select className="form-input" value={toHouse} onChange={e => setToHouse(e.target.value)}>
              <option value="">Select house...</option>
              {houses.slice(0, 100).map(h => <option key={h.id} value={h.id}>{h.name} ({h.region})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Offer Good</label>
            <select className="form-input" value={offerGood} onChange={e => setOfferGood(e.target.value)}>
              <option value="">Select good...</option>
              {goods.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Offer Quantity</label>
            <input type="number" className="form-input" min="1" value={offerQty} onChange={e => setOfferQty(parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-group">
            <label className="form-label">Request Good (optional)</label>
            <input type="text" className="form-input" placeholder="e.g. Gold, Wine, Timber" value={requestGood} onChange={e => setRequestGood(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Request Quantity</label>
            <input type="number" className="form-input" min="0" value={requestQty} onChange={e => setRequestQty(parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Request Gold (stags)</label>
            <input type="number" className="form-input" min="0" value={requestGold} onChange={e => setRequestGold(parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <textarea className="form-input" rows="2" placeholder="Add a note for the receiving house..." value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit}>Submit Trade Proposal</button>
      </div>
    </div>
  )
}
