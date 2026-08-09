import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'auctions', label: 'Auctions' },
  { id: 'trades', label: 'Trade Offers' },
  { id: 'caravans', label: 'Caravans' },
  { id: 'stalls', label: 'Merchant Stalls' },
  { id: 'mine', label: 'My Listings' },
]

export default function Marketplace() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('auctions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [auctions, setAuctions] = useState(null)
  const [trades, setTrades] = useState(null)
  const [caravans, setCaravans] = useState(null)
  const [stalls, setStalls] = useState(null)
  const [myListings, setMyListings] = useState(null)
  const [showAuction, setShowAuction] = useState(false)
  const [showTrade, setShowTrade] = useState(false)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'auctions') { const r = await api.auctionList(); if (r.status === 'ok') setAuctions(r.auctions) }
      if (which === 'trades') { const r = await api.tradeList(); if (r.status === 'ok') setTrades(r.trades) }
      if (which === 'caravans') { const r = await api.caravanList(); if (r.status === 'ok') setCaravans(r.caravans) }
      if (which === 'stalls') { const r = await api.stallList(); if (r.status === 'ok') setStalls(r.stalls) }
      if (which === 'mine') { const [a, t] = await Promise.all([api.myAuctions(), api.myTrades()]); setMyListings({ auctions: a.status === 'ok' ? a.auctions : [], trades: t.status === 'ok' ? t.trades : [] }) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Marketplace</h1>
        <p className="text-muted">Auctions, trade offers, caravans, and merchant stalls</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {TABS.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'auctions' && (
          <div>
            <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowAuction(true)}>Create Auction</button></div>
            {!auctions || auctions.length === 0 ? <EmptyState icon="&#128231;" title="No Auctions" message="No items are up for auction." /> : (
              <div className="grid grid-2">
                {auctions.filter(a => a.status === 'active').map(a => (
                  <div key={a.id} className="card">
                    <div className="card-header"><h3>{a.item_name || `Item #${a.item_id}`} x{a.quantity}</h3></div>
                    <div className="card-body">
                      <p><strong>Seller:</strong> {a.seller_name}</p>
                      <p><strong>Starting:</strong> {a.starting_price} stars</p>
                      <p><strong>Current Bid:</strong> <span className="text-gold">{a.current_bid || a.starting_price}</span> stars</p>
                      {a.buyout_price > 0 && <p><strong>Buyout:</strong> {a.buyout_price} stars</p>}
                      <p className="text-muted">Expires: {a.expires_at?.slice(0, 16)}</p>
                      {a.current_bidder_name && <p className="text-muted">Top bidder: {a.current_bidder_name}</p>}
                      <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                        <input id={`bid-${a.id}`} className="form-input" style={{ width: '100px' }} type="number" placeholder="Bid amount" />
                        <button className="btn btn-outline btn-sm" onClick={async () => {
                          const amt = parseInt(document.getElementById(`bid-${a.id}`).value)
                          if (amt > 0) { try { await api.auctionBid(a.id, amt); load('auctions') } catch (e) { setError(e.message) } }
                        }}>Bid</button>
                        {a.buyout_price > 0 && <button className="btn btn-primary btn-sm" onClick={async () => { if (confirm(`Buyout for ${a.buyout_price} stars?`)) { try { await api.auctionBuyout(a.id); load('auctions') } catch (e) { setError(e.message) } } }}>Buyout</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'trades' && (
          <div>
            <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowTrade(true)}>Create Trade Offer</button></div>
            {!trades || trades.length === 0 ? <EmptyState icon="&#128260;" title="No Trade Offers" message="No trade offers have been posted." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Offering</th><th>Want</th><th>By</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {trades.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.item_name} x{t.quantity}</td>
                        <td className="text-gold">{t.wanted_item_name} x{t.wanted_quantity}</td>
                        <td className="text-muted">{t.offerer_name}</td>
                        <td><span className="text-gold">{t.status}</span></td>
                        <td>{t.status === 'open' && <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.tradeAccept(t.id); load('trades') } catch (e) { setError(e.message) } }}>Accept</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'caravans' && (
          <div>
            {!caravans || caravans.length === 0 ? <EmptyState icon="&#128674;" title="No Caravans" message="No trade caravans are active." /> : (
              <div className="grid grid-2">
                {caravans.map(c => (
                  <div key={c.id} className="card">
                    <div className="card-header"><h3>Caravan #{c.id}</h3></div>
                    <div className="card-body">
                      <p><strong>From:</strong> Territory #{c.origin_territory_id}</p>
                      <p><strong>To:</strong> Territory #{c.destination_territory_id}</p>
                      <p><strong>Escorts:</strong> {c.escort_count}</p>
                      <p><strong>Status:</strong> <span className="text-gold">{c.status}</span></p>
                      <p><strong>Reward:</strong> {c.reward} stars</p>
                      <p className="text-muted">Departs: {c.departure_at?.slice(0, 16)} | Arrives: {c.arrival_at?.slice(0, 16)}</p>
                      {c.status === 'forming' && <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.caravanDispatch(c.id); load('caravans') } catch (e) { setError(e.message) } }}>Dispatch</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'stalls' && (
          <div>
            {!stalls || stalls.length === 0 ? <EmptyState icon="&#127978;" title="No Stalls" message="No merchant stalls have been set up." /> : (
              <div className="grid grid-3">
                {stalls.map(s => (
                  <div key={s.id} className="card">
                    <div className="card-header"><h3>{s.merchant_name}</h3></div>
                    <div className="card-body">
                      <p><strong>Specialty:</strong> {s.specialty}</p>
                      <p><strong>Territory:</strong> #{s.territory_id}</p>
                      <p><strong>Active:</strong> {s.is_active == 1 ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'mine' && myListings && (
          <div>
            <h3>My Auctions</h3>
            {!myListings.auctions || myListings.auctions.length === 0 ? <p className="text-muted">No auctions.</p> : (
              <div className="card" style={{ marginBottom: '1rem' }}><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Item</th><th>Current Bid</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {myListings.auctions.map(a => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.item_name} x{a.quantity}</td>
                        <td className="text-gold">{a.current_bid || a.starting_price}</td>
                        <td>{a.status}</td>
                        <td>{a.status === 'active' && <button className="btn btn-outline btn-sm" onClick={async () => { await api.auctionCancel(a.id); load('mine') }}>Cancel</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
            <h3>My Trade Offers</h3>
            {!myListings.trades || myListings.trades.length === 0 ? <p className="text-muted">No trade offers.</p> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Offering</th><th>Want</th><th>Status</th></tr></thead>
                  <tbody>
                    {myListings.trades.map(t => (
                      <tr key={t.id}><td>{t.id}</td><td>{t.item_name} x{t.quantity}</td><td>{t.wanted_item_name} x{t.wanted_quantity}</td><td>{t.status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showAuction && <CreateAuctionModal onClose={() => setShowAuction(false)} onSubmit={async (data) => { try { await api.auctionCreate(data); setShowAuction(false); load('auctions') } catch (e) { setError(e.message) } }} />}
      {showTrade && <CreateTradeModal onClose={() => setShowTrade(false)} onSubmit={async (data) => { try { await api.tradeCreate(data); setShowTrade(false); load('trades') } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function CreateAuctionModal({ onClose, onSubmit }) {
  const [itemId, setItemId] = useState(1)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [startingPrice, setStartingPrice] = useState(100)
  const [buyoutPrice, setBuyoutPrice] = useState(0)
  return (
    <Modal title="Create Auction" onClose={onClose}>
      <div className="form-group"><label className="form-label">Item ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={itemId} onChange={e => setItemId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Item Name</label><input className="form-input" style={{ width: '100%' }} value={itemName} onChange={e => setItemName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" style={{ width: '100%' }} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Starting Price (stars)</label><input className="form-input" type="number" style={{ width: '100%' }} value={startingPrice} onChange={e => setStartingPrice(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Buyout Price (0 = none)</label><input className="form-input" type="number" style={{ width: '100%' }} value={buyoutPrice} onChange={e => setBuyoutPrice(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ item_id: itemId, item_name: itemName, quantity, starting_price: startingPrice, buyout_price: buyoutPrice })}>Create</button>
    </Modal>
  )
}

function CreateTradeModal({ onClose, onSubmit }) {
  const [itemId, setItemId] = useState(1)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [wantedItemId, setWantedItemId] = useState(1)
  const [wantedItemName, setWantedItemName] = useState('')
  const [wantedQty, setWantedQty] = useState(1)
  return (
    <Modal title="Create Trade Offer" onClose={onClose}>
      <div className="form-group"><label className="form-label">Offering Item ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={itemId} onChange={e => setItemId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Offering Item Name</label><input className="form-input" style={{ width: '100%' }} value={itemName} onChange={e => setItemName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" style={{ width: '100%' }} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Wanted Item ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={wantedItemId} onChange={e => setWantedItemId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Wanted Item Name</label><input className="form-input" style={{ width: '100%' }} value={wantedItemName} onChange={e => setWantedItemName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Wanted Quantity</label><input className="form-input" type="number" style={{ width: '100%' }} value={wantedQty} onChange={e => setWantedQty(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ item_id: itemId, item_name: itemName, quantity, wanted_item_id: wantedItemId, wanted_item_name: wantedItemName, wanted_quantity: wantedQty })}>Create</button>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{title}</h3><button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}
