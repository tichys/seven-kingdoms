import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'regions', label: 'Regions' },
  { id: 'routes', label: 'Trade Routes' },
  { id: 'banks', label: 'Banks' },
  { id: 'loans', label: 'My Loans' },
  { id: 'all_loans', label: 'All Loans', admin: true },
  { id: 'events', label: 'Economic Events' },
]

const REGIONS = ['North', 'Reach', 'Crownlands', 'Westerlands', 'Riverlands', 'Vale', 'Iron Islands', 'Dorne', 'Stormlands']
const EVENT_TYPES = ['harvest', 'drought', 'plague', 'trade_boom', 'trade_disruption', 'war_damage']
const DANGER_LABELS = { 1: 'Safe', 2: 'Low Risk', 3: 'Moderate', 4: 'Dangerous', 5: 'Deadly' }

function prosperityColor(p) {
  if (p >= 75) return '#4a6a3a'
  if (p >= 50) return '#8a7a2a'
  if (p >= 25) return '#8a6a2a'
  return '#8b1538'
}

export default function Economy() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('regions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [economies, setEconomies] = useState(null)
  const [routes, setRoutes] = useState(null)
  const [banks, setBanks] = useState(null)
  const [myLoans, setMyLoans] = useState(null)
  const [allLoans, setAllLoans] = useState(null)
  const [events, setEvents] = useState(null)
  const [editRegion, setEditRegion] = useState(null)
  const [showRouteCreate, setShowRouteCreate] = useState(false)
  const [showBankCreate, setShowBankCreate] = useState(false)
  const [showLoanRequest, setShowLoanRequest] = useState(false)
  const [showEventTrigger, setShowEventTrigger] = useState(false)

  const visibleTabs = TABS.filter(t => !t.admin || adminLevel >= 1)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'regions') { const r = await api.economyRegionList(); if (r.status === 'ok') setEconomies(r.economies) }
      if (which === 'routes') { const r = await api.economyRoutesList(); if (r.status === 'ok') setRoutes(r.routes) }
      if (which === 'banks') { const r = await api.economyBanksList(); if (r.status === 'ok') setBanks(r.banks) }
      if (which === 'loans') { const r = await api.economyMyLoans(); if (r.status === 'ok') setMyLoans(r.loans) }
      if (which === 'all_loans') { const r = await api.economyLoanList(); if (r.status === 'ok') setAllLoans(r.loans) }
      if (which === 'events') { const r = await api.economyEventList(); if (r.status === 'ok') setEvents(r.events) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Economy &amp; Banking</h1>
        <p className="text-muted">Regional economies, trade routes, and bank loans across the Seven Kingdoms</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {visibleTabs.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'regions' && (
          <div>
            {!economies || economies.length === 0 ? <EmptyState icon="&#127961;" title="No Regional Economies" message="No economic data has been initialized." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Region</th><th>Population</th><th>Treasury</th><th>Tax Rate</th><th>Inflation</th><th>Prosperity</th>{adminLevel >= 1 && <th></th>}</tr></thead>
                  <tbody>
                    {economies.map(e => (
                      <tr key={e.region}>
                        <td><strong>{e.region}</strong></td>
                        <td>{e.population?.toLocaleString()}</td>
                        <td className="text-gold">{e.treasury_gold?.toLocaleString()}</td>
                        <td>{e.tax_rate}%</td>
                        <td>{e.inflation}%</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${e.prosperity}%`, height: '100%', background: prosperityColor(e.prosperity) }} />
                            </div>
                            <span>{e.prosperity}</span>
                          </div>
                        </td>
                        {adminLevel >= 1 && <td><button className="btn btn-outline btn-sm" onClick={() => setEditRegion(e)}>Edit</button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'routes' && (
          <div>
            {adminLevel >= 1 && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowRouteCreate(true)}>Create Trade Route</button></div>}
            {!routes || routes.length === 0 ? <EmptyState icon="&#128666;" title="No Trade Routes" message="No trade routes have been established." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Name</th><th>Route</th><th>Commodity</th><th>Base Profit</th><th>Danger</th><th>Status</th></tr></thead>
                  <tbody>
                    {routes.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.origin_name} &rarr; {r.destination_name}</td>
                        <td>{r.commodity}</td>
                        <td className="text-gold">{r.base_profit}</td>
                        <td className={r.danger_level >= 4 ? 'text-warning' : 'text-muted'}>{r.danger_level}/5 &mdash; {DANGER_LABELS[r.danger_level] || 'Unknown'}</td>
                        <td>{r.is_active ? <span className="text-gold">Active</span> : <span className="text-muted">Inactive</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'banks' && (
          <div>
            {adminLevel >= 1 && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowBankCreate(true)}>Create Bank</button></div>}
            {!banks || banks.length === 0 ? <EmptyState icon="&#127974;" title="No Banks" message="No banks have been established yet." /> : (
              <div className="grid grid-3">
                {banks.map(b => (
                  <div key={b.id} className="card">
                    <div className="card-header"><h3>{b.name}</h3></div>
                    <div className="card-body">
                      <p><strong>House:</strong> {b.house_name || '—'}</p>
                      <p><strong>Gold Reserve:</strong> <span className="text-gold">{b.gold_reserve?.toLocaleString()}</span></p>
                      <p><strong>Interest Rate:</strong> {b.interest_rate}%</p>
                      <p><strong>Status:</strong> {b.is_active ? <span className="text-gold">Active</span> : <span className="text-muted">Inactive</span>}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'loans' && (
          <div>
            <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowLoanRequest(true)}>Request Loan</button></div>
            {!myLoans || myLoans.length === 0 ? <EmptyState icon="&#128176;" title="No Loans" message="You have no outstanding loans." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Bank</th><th>Principal</th><th>Total Due</th><th>Repaid</th><th>Status</th><th>Due Date</th><th></th></tr></thead>
                  <tbody>
                    {myLoans.map(l => (
                      <tr key={l.id}>
                        <td><strong>{l.bank_name}</strong></td>
                        <td className="text-gold">{l.principal}</td>
                        <td>{l.total_due}</td>
                        <td>{l.amount_repaid}</td>
                        <td><span className={l.status === 'active' ? 'text-gold' : 'text-muted'}>{l.status}</span></td>
                        <td className="text-muted">{l.due_at?.slice(0, 16)}</td>
                        <td>
                          {l.status === 'active' && (
                            <div style={{ display: 'flex', gap: '.5rem' }}>
                              <input id={`repay-${l.id}`} className="form-input" style={{ width: '100px' }} type="number" placeholder="Amount" />
                              <button className="btn btn-outline btn-sm" onClick={async () => {
                                const amt = parseInt(document.getElementById(`repay-${l.id}`).value)
                                if (amt > 0) { try { await api.economyLoanRepay(l.id, amt); load('loans') } catch (e) { setError(e.message) } }
                              }}>Repay</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'all_loans' && adminLevel >= 1 && (
          <div>
            {!allLoans || allLoans.length === 0 ? <EmptyState icon="&#128176;" title="No Loans" message="No loans exist in the system." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Borrower</th><th>Bank</th><th>Principal</th><th>Total Due</th><th>Repaid</th><th>Status</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {allLoans.map(l => (
                      <tr key={l.id}>
                        <td>{l.id}</td>
                        <td>{l.borrower_name || l.character_name || '—'}</td>
                        <td><strong>{l.bank_name}</strong></td>
                        <td className="text-gold">{l.principal}</td>
                        <td>{l.total_due}</td>
                        <td>{l.amount_repaid}</td>
                        <td><span className={l.status === 'active' ? 'text-gold' : 'text-muted'}>{l.status}</span></td>
                        <td className="text-muted">{l.due_at?.slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div>
            {adminLevel >= 1 && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowEventTrigger(true)}>Trigger Event</button></div>}
            {!events || events.length === 0 ? <EmptyState icon="&#9889;" title="No Economic Events" message="No economic events have been recorded." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Region</th><th>Type</th><th>Description</th><th>Prosperity &Delta;</th><th>Inflation &Delta;</th><th>Date</th></tr></thead>
                  <tbody>
                    {events.map((ev, i) => (
                      <tr key={i}>
                        <td><strong>{ev.region}</strong></td>
                        <td className="text-gold">{ev.event_type}</td>
                        <td>{ev.description}</td>
                        <td className={ev.prosperity_change >= 0 ? 'text-gold' : 'text-warning'}>{ev.prosperity_change >= 0 ? '+' : ''}{ev.prosperity_change}</td>
                        <td className={ev.inflation_change > 0 ? 'text-warning' : 'text-gold'}>{ev.inflation_change >= 0 ? '+' : ''}{ev.inflation_change}</td>
                        <td className="text-muted">{ev.created_at?.slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {editRegion && <EditRegionModal region={editRegion} onClose={() => setEditRegion(null)} onSubmit={async (data) => { try { await api.economyRegionUpdate(editRegion.region, data); setEditRegion(null); load('regions') } catch (e) { setError(e.message) } }} />}
      {showRouteCreate && <CreateRouteModal onClose={() => setShowRouteCreate(false)} onSubmit={async (data) => { try { await api.economyRouteCreate(data); setShowRouteCreate(false); load('routes') } catch (e) { setError(e.message) } }} />}
      {showBankCreate && <CreateBankModal onClose={() => setShowBankCreate(false)} onSubmit={async (data) => { try { await api.economyBankCreate(data); setShowBankCreate(false); load('banks') } catch (e) { setError(e.message) } }} />}
      {showLoanRequest && <RequestLoanModal onClose={() => setShowLoanRequest(false)} onSubmit={async (bankId, principal, termDays) => { try { await api.economyLoanRequest(bankId, principal, termDays); setShowLoanRequest(false); load('loans') } catch (e) { setError(e.message) } }} />}
      {showEventTrigger && <TriggerEventModal onClose={() => setShowEventTrigger(false)} onSubmit={async (data) => { try { await api.economyEventTrigger(data); setShowEventTrigger(false); load('events') } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function EditRegionModal({ region, onClose, onSubmit }) {
  const [taxRate, setTaxRate] = useState(region.tax_rate || 10)
  const [prosperity, setProsperity] = useState(region.prosperity || 50)
  return (
    <Modal title={`Edit ${region.region}`} onClose={onClose}>
      <div className="form-group"><label className="form-label">Tax Rate (%)</label><input className="form-input" type="number" style={{ width: '100%' }} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Prosperity (0-100)</label><input className="form-input" type="number" min="0" max="100" style={{ width: '100%' }} value={prosperity} onChange={e => setProsperity(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ tax_rate: taxRate, prosperity })}>Save</button>
    </Modal>
  )
}

function CreateRouteModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [originId, setOriginId] = useState(1)
  const [destId, setDestId] = useState(2)
  const [commodity, setCommodity] = useState('grain')
  const [baseProfit, setBaseProfit] = useState(100)
  const [danger, setDanger] = useState(1)
  return (
    <Modal title="Create Trade Route" onClose={onClose}>
      <div className="form-group"><label className="form-label">Route Name</label><input className="form-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Origin Territory ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={originId} onChange={e => setOriginId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Destination Territory ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={destId} onChange={e => setDestId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Commodity</label><input className="form-input" style={{ width: '100%' }} value={commodity} onChange={e => setCommodity(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Base Profit</label><input className="form-input" type="number" style={{ width: '100%' }} value={baseProfit} onChange={e => setBaseProfit(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Danger Level (1-5)</label><input className="form-input" type="number" min="1" max="5" style={{ width: '100%' }} value={danger} onChange={e => setDanger(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ name, origin_territory_id: originId, destination_territory_id: destId, commodity, base_profit: baseProfit, danger_level: danger })}>Create</button>
    </Modal>
  )
}

function CreateBankModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [houseId, setHouseId] = useState(1)
  const [territoryId, setTerritoryId] = useState(1)
  const [goldReserve, setGoldReserve] = useState(10000)
  const [interestRate, setInterestRate] = useState(5)
  return (
    <Modal title="Create Bank" onClose={onClose}>
      <div className="form-group"><label className="form-label">Bank Name</label><input className="form-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">House ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseId} onChange={e => setHouseId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Territory ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={territoryId} onChange={e => setTerritoryId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Gold Reserve</label><input className="form-input" type="number" style={{ width: '100%' }} value={goldReserve} onChange={e => setGoldReserve(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Interest Rate (%)</label><input className="form-input" type="number" style={{ width: '100%' }} value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ name, house_id: houseId, territory_id: territoryId, gold_reserve: goldReserve, interest_rate: interestRate })}>Create</button>
    </Modal>
  )
}

function RequestLoanModal({ onClose, onSubmit }) {
  const [bankList, setBankList] = useState(null)
  const [bankId, setBankId] = useState(0)
  const [principal, setPrincipal] = useState(1000)
  const [termDays, setTermDays] = useState(30)
  useEffect(() => {
    api.economyBanksList().then(r => {
      if (r.status === 'ok' && r.banks) {
        const active = r.banks.filter(b => b.is_active)
        setBankList(active)
        if (active.length > 0) setBankId(active[0].id)
      }
    }).catch(() => {})
  }, [])
  return (
    <Modal title="Request Loan" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Bank</label>
        <select className="form-input" style={{ width: '100%' }} value={bankId} onChange={e => setBankId(Number(e.target.value))}>
          {bankList ? bankList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.interest_rate}% &mdash; {b.gold_reserve?.toLocaleString()} gold)</option>) : <option>Loading...</option>}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Principal (gold)</label><input className="form-input" type="number" style={{ width: '100%' }} value={principal} onChange={e => setPrincipal(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Term (days)</label><input className="form-input" type="number" style={{ width: '100%' }} value={termDays} onChange={e => setTermDays(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit(bankId, principal, termDays)}>Request</button>
    </Modal>
  )
}

function TriggerEventModal({ onClose, onSubmit }) {
  const [region, setRegion] = useState(REGIONS[0])
  const [eventType, setEventType] = useState(EVENT_TYPES[0])
  const [description, setDescription] = useState('')
  const [prosperityChange, setProsperityChange] = useState(0)
  const [inflationChange, setInflationChange] = useState(0)
  return (
    <Modal title="Trigger Economic Event" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Region</label>
        <select className="form-input" style={{ width: '100%' }} value={region} onChange={e => setRegion(e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Event Type</label>
        <select className="form-input" style={{ width: '100%' }} value={eventType} onChange={e => setEventType(e.target.value)}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Description</label><input className="form-input" style={{ width: '100%' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Prosperity Change</label><input className="form-input" type="number" style={{ width: '100%' }} value={prosperityChange} onChange={e => setProsperityChange(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Inflation Change</label><input className="form-input" type="number" style={{ width: '100%' }} value={inflationChange} onChange={e => setInflationChange(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ region, event_type: eventType, description, prosperity_change: prosperityChange, inflation_change: inflationChange })}>Trigger</button>
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
