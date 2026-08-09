import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const LAW_CATEGORIES = { civil: 'Civil', criminal: 'Criminal', military: 'Military', economic: 'Economic', religious: 'Religious', foreign: 'Foreign' }
const LAW_STATUSES = { proposed: 'Proposed', debated: 'Debated', passed: 'Passed', rejected: 'Rejected', vetoed: 'Vetoed', repealed: 'Repealed' }
const STATUS_COLORS = { proposed: '#b08d57', debated: '#5b7db1', passed: '#4d7c5b', rejected: '#702618', vetoed: '#4a1a0e', repealed: '#5a5550' }
const DECREE_TYPES = { proclamation: 'Proclamation', edict: 'Edict', appointment: 'Appointment', pardon: 'Pardon', sentence: 'Sentence', banishment: 'Banishment', title_grant: 'Title Grant' }
const PETITION_TYPES = { grievance: 'Grievance', request: 'Request', title: 'Title', mercy: 'Mercy', land: 'Land Dispute', dispute: 'Dispute' }

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'laws', label: 'Laws' },
  { id: 'decrees', label: 'Decrees' },
  { id: 'council', label: 'Small Council' },
  { id: 'petitions', label: 'Petitions' },
]

export default function Politics() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [laws, setLaws] = useState(null)
  const [decrees, setDecrees] = useState(null)
  const [council, setCouncil] = useState(null)
  const [petitions, setPetitions] = useState(null)
  const [mySeat, setMySeat] = useState(null)
  const [showPropose, setShowPropose] = useState(false)
  const [showDecree, setShowDecree] = useState(false)
  const [showPetition, setShowPetition] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const canDecree = mySeat === 'King' || mySeat === 'Hand of the King' || adminLevel >= 2

  const loadAll = useCallback(async () => {
    setError(null)
    try {
      const [s, seat] = await Promise.all([api.politicsStats(), api.councilMySeat()])
      if (s.status === 'ok') setStats(s.stats)
      if (seat.status === 'ok') setMySeat(seat.seat)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    if (tab === 'laws') loadLaws()
    if (tab === 'decrees') loadDecrees()
    if (tab === 'council') loadCouncil()
    if (tab === 'petitions') loadPetitions()
  }, [tab])

  const loadLaws = async () => {
    try { const r = await api.lawList(filterStatus); if (r.status === 'ok') setLaws(r.laws) } catch (e) { setError(e.message) }
  }
  const loadDecrees = async () => {
    try { const r = await api.decreeList(true); if (r.status === 'ok') setDecrees(r.decrees) } catch (e) { setError(e.message) }
  }
  const loadCouncil = async () => {
    try { const r = await api.councilList(); if (r.status === 'ok') setCouncil(r.council) } catch (e) { setError(e.message) }
  }
  const loadPetitions = async () => {
    try { const r = await api.petitionList(''); if (r.status === 'ok') setPetitions(r.petitions) } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="page-content"><SkeletonTable rows={6} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={loadAll} /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Politics &amp; Governance</h1>
        <p className="text-muted">Laws of the Realm, Royal Decrees, Small Council, and Petitions</p>
        {mySeat && <p className="text-gold">Your seat: {mySeat}</p>}
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {TABS.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'dashboard' && stats && (
          <div className="grid grid-4">
            <div className="card"><div className="card-header"><h3>Laws</h3></div><div className="card-body">
              {Object.entries(LAW_STATUSES).map(([k, v]) => <p key={k}>{v}: <span className="text-gold">{stats.laws[k] || 0}</span></p>)}
            </div></div>
            <div className="card"><div className="card-header"><h3>Active Decrees</h3></div><div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--gold)' }}>{stats.active_decrees}</p></div></div>
            <div className="card"><div className="card-header"><h3>Council Seats</h3></div><div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--gold)' }}>{stats.council_seats_filled}</p></div></div>
            <div className="card"><div className="card-header"><h3>Petitions</h3></div><div className="card-body">
              <p>Pending: <span className="text-gold">{stats.petitions.pending || 0}</span></p>
              <p>Granted: <span style={{ color: 'var(--green)' }}>{stats.petitions.granted || 0}</span></p>
              <p>Denied: <span style={{ color: 'var(--red)' }}>{stats.petitions.denied || 0}</span></p>
            </div></div>
          </div>
        )}

        {tab === 'laws' && (
          <div>
            <div className="filter-bar" style={{ marginBottom: '1rem' }}>
              <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setTimeout(loadLaws, 50) }}>
                <option value="">All Status</option>
                {Object.entries(LAW_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPropose(true)}>Propose Law</button>
            </div>
            {!laws || laws.length === 0 ? <EmptyState icon="&#9876;" title="No Laws" message="No laws have been proposed." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Status</th><th>Votes</th><th>Proposed By</th></tr></thead>
                  <tbody>
                    {laws.map(l => (
                      <tr key={l.id} style={{ cursor: 'pointer' }} onClick={async () => { const r = await api.lawGet(l.id); if (r.status === 'ok') alert(JSON.stringify(r.law, null, 2)) }}>
                        <td>{l.id}</td>
                        <td>{l.title}</td>
                        <td className="text-muted">{LAW_CATEGORIES[l.category]}</td>
                        <td><span className="wound-badge" style={{ background: STATUS_COLORS[l.status], fontSize: '.75rem' }}>{LAW_STATUSES[l.status]}</span></td>
                        <td className="text-gold">{l.votes_for} / {l.votes_against}</td>
                        <td className="text-muted">{l.proposed_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'decrees' && (
          <div>
            {canDecree && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowDecree(true)}>Issue Decree</button></div>}
            {!decrees || decrees.length === 0 ? <EmptyState icon="&#128220;" title="No Active Decrees" message="No royal decrees are in effect." /> : (
              decrees.map(d => (
                <div key={d.id} className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>{d.title}</h3>
                    <span className="wound-badge" style={{ background: 'var(--bg-elevated)', fontSize: '.75rem' }}>{DECREE_TYPES[d.decree_type] || d.decree_type}</span>
                  </div>
                  <div className="card-body">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{d.body}</p>
                    <p className="text-muted" style={{ fontSize: '.85rem' }}>Issued by {d.issued_by_name} on {d.created_at?.slice(0, 10)}</p>
                    {d.target_name && <p className="text-muted">Target: {d.target_name}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'council' && (
          <div>
            {!council || council.length === 0 ? <EmptyState icon="&#9876;" title="Empty Council" message="No Small Council members have been appointed." /> : (
              <div className="grid grid-2">
                {council.map(c => (
                  <div key={c.id} className="card">
                    <div className="card-header"><h3>{c.seat_name}</h3></div>
                    <div className="card-body">
                      <p><strong>Holder:</strong> {c.avatar_name || 'Vacant'}</p>
                      {c.house_name && <p><strong>House:</strong> {c.house_name}</p>}
                      <p className="text-muted" style={{ fontSize: '.85rem' }}>Appointed: {c.appointed_at?.slice(0, 10)}</p>
                      {canDecree && <button className="btn btn-outline btn-sm" onClick={async () => { if (confirm('Remove from council?')) { await api.councilRemove(c.id); loadCouncil() } }}>Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'petitions' && (
          <div>
            <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowPetition(true)}>Submit Petition</button></div>
            {!petitions || petitions.length === 0 ? <EmptyState icon="&#9999;" title="No Petitions" message="No petitions have been submitted." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Title</th><th>Type</th><th>Status</th><th>Signatures</th><th>Submitted</th></tr></thead>
                  <tbody>
                    {petitions.map(p => (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={async () => { const r = await api.petitionGet(p.id); if (r.status === 'ok') alert(JSON.stringify(r.petition, null, 2)) }}>
                        <td>{p.id}</td>
                        <td>{p.title}</td>
                        <td className="text-muted">{PETITION_TYPES[p.petition_type]}</td>
                        <td><span className="text-gold">{p.status}</span></td>
                        <td className="text-gold">{p.signature_count}</td>
                        <td className="text-muted">{p.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showPropose && <ProposeLawModal onClose={() => setShowPropose(false)} onSubmit={async (data) => { try { await api.lawPropose(data); setShowPropose(false); loadLaws() } catch (e) { setError(e.message) } }} />}
      {showDecree && <IssueDecreeModal onClose={() => setShowDecree(false)} onSubmit={async (data) => { try { await api.decreeIssue(data); setShowDecree(false); loadDecrees() } catch (e) { setError(e.message) } }} />}
      {showPetition && <SubmitPetitionModal onClose={() => setShowPetition(false)} onSubmit={async (data) => { try { await api.petitionSubmit(data); setShowPetition(false); loadPetitions() } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function ProposeLawModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('civil')
  return (
    <Modal title="Propose Law" onClose={onClose}>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} maxLength={128} /></div>
      <div className="form-group"><label className="form-label">Category</label><select className="form-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(LAW_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" style={{ width: '100%', minHeight: '100px' }} value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ title, description, category })}>Propose</button>
    </Modal>
  )
}

function IssueDecreeModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [decreeType, setDecreeType] = useState('proclamation')
  const [targetName, setTargetName] = useState('')
  return (
    <Modal title="Issue Royal Decree" onClose={onClose}>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} maxLength={128} /></div>
      <div className="form-group"><label className="form-label">Type</label><select className="form-input" style={{ width: '100%' }} value={decreeType} onChange={e => setDecreeType(e.target.value)}>{Object.entries(DECREE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Target Name (optional)</label><input className="form-input" style={{ width: '100%' }} value={targetName} onChange={e => setTargetName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Decree Text</label><textarea className="form-input" style={{ width: '100%', minHeight: '120px' }} value={body} onChange={e => setBody(e.target.value)} maxLength={5000} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ title, body, decree_type: decreeType, target_name: targetName })}>Issue Decree</button>
    </Modal>
  )
}

function SubmitPetitionModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [petBody, setPetBody] = useState('')
  const [petitionType, setPetitionType] = useState('grievance')
  return (
    <Modal title="Submit Petition" onClose={onClose}>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} maxLength={128} /></div>
      <div className="form-group"><label className="form-label">Type</label><select className="form-input" style={{ width: '100%' }} value={petitionType} onChange={e => setPetitionType(e.target.value)}>{Object.entries(PETITION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Petition Text</label><textarea className="form-input" style={{ width: '100%', minHeight: '120px' }} value={petBody} onChange={e => setPetBody(e.target.value)} maxLength={5000} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ title, body: petBody, petition_type: petitionType })}>Submit</button>
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
