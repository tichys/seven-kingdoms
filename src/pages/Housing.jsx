import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const STATUS_COLORS = {
  available: 'var(--gold)',
  rented: '#2A3D1F',
  grace: '#8C6420',
  overdue: '#702618',
}

const CURRENCY_LABELS = {
  silver_stags: 'Silver Stags',
  gold_dragons: 'Gold Dragons',
  copper_stars: 'Copper Stars',
}

export default function Housing() {
  const { adminLevel, user } = useAuth()
  const [plots, setPlots] = useState(null)
  const [myPlots, setMyPlots] = useState(null)
  const [territories, setTerritories] = useState(null)
  const [selectedTerritory, setSelectedTerritory] = useState(null)
  const [payments, setPayments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showAssign, setShowAssign] = useState(null)
  const [assignKey, setAssignKey] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ territory_id: '', lot_number: '', rent_amount: 50, rent_currency: 'silver_stags' })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [plotData, myData, terrData] = await Promise.all([
        api.housingListPlots(selectedTerritory || null).catch(e => ({ error: e.message })),
        api.housingMyPlots().catch(e => ({ error: e.message })),
        api.housingListTerritories().catch(e => ({ error: e.message })),
      ])
      if (!plotData.error) setPlots(plotData.plots || [])
      if (!myData.error) setMyPlots(myData.plots || [])
      if (!terrData.error) setTerritories(terrData.territories || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [selectedTerritory])

  useEffect(() => { load() }, [load])

  const handlePayRent = async (plotId, days) => {
    try {
      const data = await api.housingPayRent(plotId, days)
      setMsg(`Rent paid: ${data.amount} ${CURRENCY_LABELS[data.currency] || data.currency} through ${data.paid_through?.split(' ')[0]}`)
      setTimeout(() => setMsg(null), 4000)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleAssign = async (plotId) => {
    if (!assignKey) { setError('Avatar key required'); return }
    try {
      await api.housingAssignPlot(plotId, assignKey)
      setShowAssign(null); setAssignKey('')
      setMsg('Plot assigned')
      setTimeout(() => setMsg(null), 2000)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleRelease = async (plotId) => {
    if (!confirm('Release this plot back to available? The tenant will lose access.')) return
    try {
      await api.housingReleasePlot(plotId)
      setMsg('Plot released')
      setTimeout(() => setMsg(null), 2000)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleCreate = async () => {
    try {
      await api.housingCreatePlot(createForm)
      setShowCreate(false)
      setCreateForm({ territory_id: '', lot_number: '', rent_amount: 50, rent_currency: 'silver_stags' })
      setMsg('Plot created')
      setTimeout(() => setMsg(null), 2000)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleHistory = async (plotId) => {
    try {
      const data = await api.housingPaymentHistory(plotId)
      setPayments(data.payments || [])
    } catch (err) { setError(err.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Housing & Rentals</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '.85rem' }}
            value={selectedTerritory || ''}
            onChange={(e) => setSelectedTerritory(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Territories</option>
            {(territories || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {adminLevel >= 2 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Plot</button>
          )}
        </div>
      </div>

      {/* My Plots */}
      {myPlots && myPlots.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">My Plots ({myPlots.length})</div>
          <div className="card-body">
            {myPlots.map(plot => (
              <RentalCard
                key={plot.id}
                plot={plot}
                onPayRent={handlePayRent}
                onHistory={handleHistory}
                adminLevel={adminLevel}
                onRelease={handleRelease}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Plots */}
      <div className="card mb-4">
        <div className="card-header">All Plots ({plots?.length || 0})</div>
        <div className="card-body">
          {(plots || []).length === 0 ? (
            <p className="text-muted">No plots found. {adminLevel >= 2 && 'Create one to get started.'}</p>
          ) : (
            (plots || []).map(plot => (
              <div key={plot.id} style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: '16px',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px dashed var(--border)',
              }}>
                {/* Lot badge */}
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.78rem', fontWeight: 700,
                  letterSpacing: '1.4px', textTransform: 'uppercase',
                  color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '2px',
                  padding: '4px 8px', textAlign: 'center', minWidth: '56px',
                }}>
                  {plot.lot_number}
                </div>

                {/* Address */}
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '.95rem' }}>
                    {plot.territory_name || `Territory ${plot.territory_id}`}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {plot.rent_amount} {CURRENCY_LABELS[plot.rent_currency] || plot.rent_currency} / 30 days
                    {plot.tenant_name && ' · ' + plot.tenant_name}
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: STATUS_COLORS[plot.status] || 'var(--text-muted)',
                    border: `1px solid ${STATUS_COLORS[plot.status] || 'var(--border)'}`,
                    borderRadius: '2px', padding: '2px 6px',
                  }}>{plot.status}</span>
                  {plot.paid_through && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.58rem', color: 'var(--text-muted)' }}>
                      Paid: {plot.paid_through?.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {plot.status === 'available' && adminLevel >= 2 && (
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAssign(plot.id)} style={{ fontSize: '10px', padding: '4px 8px' }}>Assign</button>
                  )}
                  {plot.status !== 'available' && adminLevel >= 2 && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleRelease(plot.id)} style={{ fontSize: '10px', padding: '4px 8px' }}>Release</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign modal */}
      {showAssign && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '12px' }}>Assign Plot</h3>
            <div className="form-group">
              <label className="form-label">Player Avatar Key</label>
              <input type="text" className="form-input" value={assignKey} onChange={(e) => setAssignKey(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setShowAssign(null); setAssignKey('') }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => handleAssign(showAssign)}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Create plot modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '12px' }}>Create Plot</h3>
            <div className="form-group">
              <label className="form-label">Territory</label>
              <select className="form-input" value={createForm.territory_id} onChange={(e) => setCreateForm({ ...createForm, territory_id: parseInt(e.target.value) })}>
                <option value="">Select...</option>
                {(territories || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lot Number</label>
              <input type="text" className="form-input" value={createForm.lot_number} onChange={(e) => setCreateForm({ ...createForm, lot_number: e.target.value })} placeholder="A-01" maxLength={16} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Rent Amount</label>
                <input type="number" className="form-input" value={createForm.rent_amount} onChange={(e) => setCreateForm({ ...createForm, rent_amount: parseInt(e.target.value) || 50 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={createForm.rent_currency} onChange={(e) => setCreateForm({ ...createForm, rent_currency: e.target.value })}>
                  <option value="silver_stags">Silver Stags</option>
                  <option value="gold_dragons">Gold Dragons</option>
                  <option value="copper_stars">Copper Stars</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history modal */}
      {payments && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Payment History</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setPayments(null)}>Close</button>
            </div>
            {(payments || []).length === 0 ? (
              <p className="text-muted">No payments recorded.</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr><th style={{ fontSize: '.75rem', textAlign: 'left' }}>Date</th><th style={{ fontSize: '.75rem', textAlign: 'right' }}>Amount</th><th style={{ fontSize: '.75rem', textAlign: 'right' }}>Period</th><th style={{ fontSize: '.75rem', textAlign: 'right' }}>Paid Until</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: '.8rem' }}>{p.created_at?.split(' ')[0]}</td>
                      <td style={{ fontSize: '.8rem', textAlign: 'right' }}>{p.amount} {p.currency}</td>
                      <td style={{ fontSize: '.8rem', textAlign: 'right' }}>{p.period_days}d</td>
                      <td style={{ fontSize: '.8rem', textAlign: 'right' }}>{p.paid_until?.split(' ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RentalCard({ plot, onPayRent, onHistory, adminLevel, onRelease }) {
  const status = plot.status || 'available'
  const statusColor = STATUS_COLORS[status] || 'var(--text-muted)'

  // Payment meter
  const paidDate = plot.paid_through ? new Date(plot.paid_through) : null
  const now = new Date()
  const totalDays = 30
  const remainingDays = paidDate ? Math.max(0, Math.ceil((paidDate - now) / (1000 * 60 * 60 * 24))) : 0
  const meterPct = paidDate ? Math.max(0, Math.min(100, (remainingDays / totalDays) * 100)) : 0
  const meterClass = remainingDays > 10 ? 'ok' : remainingDays > 3 ? 'warn' : 'over'

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 16px', marginBottom: '12px',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '16px', alignItems: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '.78rem', fontWeight: 700,
        letterSpacing: '1.4px', textTransform: 'uppercase',
        color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '2px',
        padding: '4px 8px', textAlign: 'center', minWidth: '56px',
      }}>{plot.lot_number}</div>

      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '.95rem' }}>
          {plot.territory_name || `Territory ${plot.territory_id}`}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-muted)' }}>
          {plot.rent_amount} {CURRENCY_LABELS[plot.rent_currency] || plot.rent_currency} / 30 days
          {remainingDays > 0 && ` · ${remainingDays} days remaining`}
        </div>
        {/* Payment meter */}
        {paidDate && (
          <div style={{ marginTop: '4px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${meterPct}%`, borderRadius: '2px',
              background: meterClass === 'ok' ? 'var(--gold)' : meterClass === 'warn' ? '#8C6420' : '#702618',
            }} />
          </div>
        )}
      </div>

      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1px',
        color: statusColor, border: `1px solid ${statusColor}`,
        borderRadius: '2px', padding: '2px 6px',
      }}>{status}</span>

      <div style={{ display: 'flex', gap: '4px' }}>
        {status !== 'available' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => onPayRent(plot.id, 30)} style={{ fontSize: '10px', padding: '4px 8px' }}>Pay 30d</button>
            <button className="btn btn-outline btn-sm" onClick={() => onHistory(plot.id)} style={{ fontSize: '10px', padding: '4px 8px' }}>History</button>
            {adminLevel >= 2 && (
              <button className="btn btn-outline btn-sm" onClick={() => onRelease(plot.id)} style={{ fontSize: '10px', padding: '4px 8px', color: 'var(--danger)' }}>Release</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
