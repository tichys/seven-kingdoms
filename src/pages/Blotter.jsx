import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const SEVERITY_LABELS = { 1: 'Minor', 2: 'Moderate', 3: 'Severe' }
const SEVERITY_COLORS = { 1: '#6b8f3e', 2: '#b5642a', 3: '#702618' }
const CATEGORY_LABELS = { conduct: 'Conduct', combat_dispute: 'Combat Dispute', platform: 'Platform', estate: 'Estate' }
const STATUS_LABELS = { open: 'Open', investigating: 'Investigating', resolved: 'Resolved', closed: 'Closed' }
const STATUS_COLORS = { open: '#4d7c5b', investigating: '#b08d57', resolved: '#6b8f3e', closed: '#5a5550' }
const SANCTION_LABELS = { warning: 'Warning', mute: 'Mute', temp_ban: 'Temporary Ban', perm_ban: 'Permanent Ban', kick: 'Kick' }

function SeverityBadge({ severity }) {
  return <span className="wound-badge" style={{ background: SEVERITY_COLORS[severity], fontSize: '.75rem', padding: '2px 8px' }}>{SEVERITY_LABELS[severity]}</span>
}

function StatusBadge({ status }) {
  return <span className="wound-badge" style={{ background: STATUS_COLORS[status], fontSize: '.75rem', padding: '2px 8px' }}>{STATUS_LABELS[status]}</span>
}

function CategoryBadge({ category }) {
  return <span className="text-muted" style={{ fontSize: '.8rem' }}>{CATEGORY_LABELS[category] || category}</span>
}

export default function Blotter() {
  const { adminLevel } = useAuth()
  const isAdmin = adminLevel >= 1
  const [tab, setTab] = useState(isAdmin ? 'dashboard' : 'my')
  const [incidents, setIncidents] = useState(null)
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState(0)
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [showFile, setShowFile] = useState(false)
  const [showSanction, setShowSanction] = useState(null)
  const [notes, setNotes] = useState('')
  const [newNote, setNewNote] = useState('')
  const [noteInternal, setNoteInternal] = useState(false)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceDesc, setEvidenceDesc] = useState('')

  const loadList = useCallback(async () => {
    setError(null)
    try {
      if (isAdmin) {
        const res = await api.blotterList({ status: filterStatus, severity: filterSeverity, category: filterCategory, search, limit: 50 })
        if (res.status === 'ok') { setIncidents(res.incidents); setStats(res.stats) }
      } else {
        const [mine, against] = await Promise.all([api.blotterMyIncidents(), api.blotterAgainstMe()])
        if (mine.status === 'ok') setIncidents(mine.incidents)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [isAdmin, filterStatus, filterSeverity, filterCategory, search])

  const loadStats = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await api.blotterStats()
      if (res.status === 'ok') { setStats(res.stats); setRecent(res.recent) }
    } catch (e) { setError(e.message) }
  }, [isAdmin])

  useEffect(() => {
    if (tab === 'dashboard') loadStats()
    if (tab === 'all' || tab === 'my' || tab === 'against') loadList()
    if (tab === 'sanctions') loadSanctions()
  }, [tab, loadList, loadStats])

  const [sanctions, setSanctions] = useState(null)
  const loadSanctions = useCallback(async () => {
    try {
      const res = await api.blotterListSanctions(true)
      if (res.status === 'ok') setSanctions(res.sanctions)
    } catch (e) { setError(e.message) }
  }, [])

  const loadIncident = async (id) => {
    try {
      const res = await api.blotterGet(id)
      if (res.status === 'ok') { setSelected(res.incident); setNotes('') }
    } catch (e) { setError(e.message) }
  }

  const handleFile = async (data) => {
    try {
      const res = await api.blotterFile(data)
      if (res.status === 'ok') { setShowFile(false); loadList() }
    } catch (e) { setError(e.message) }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.blotterUpdateStatus(id, status)
      loadIncident(id)
      loadList()
    } catch (e) { setError(e.message) }
  }

  const handleResolve = async (id, notes) => {
    try {
      await api.blotterResolve(id, notes)
      loadIncident(id)
      loadList()
    } catch (e) { setError(e.message) }
  }

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this incident? This cannot be undone.')) return
    try {
      await api.blotterWithdraw(id)
      setSelected(null)
      loadList()
    } catch (e) { setError(e.message) }
  }

  const handleAddNote = async (id) => {
    if (newNote.trim().length < 5) return
    try {
      await api.blotterAddNote(id, newNote, noteInternal)
      setNewNote('')
      setNoteInternal(false)
      loadIncident(id)
    } catch (e) { setError(e.message) }
  }

  const handleAddEvidence = async (id) => {
    if (!evidenceUrl.startsWith('https://')) { setError('Evidence URL must be HTTPS'); return }
    try {
      await api.blotterAddEvidence(id, evidenceUrl, evidenceDesc)
      setEvidenceUrl('')
      setEvidenceDesc('')
      loadIncident(id)
    } catch (e) { setError(e.message) }
  }

  const handleAssign = async (id) => {
    try {
      await api.blotterAssign(id)
      loadIncident(id)
      loadList()
    } catch (e) { setError(e.message) }
  }

  const handleReopen = async (id, reason) => {
    try {
      await api.blotterReopen(id, reason)
      loadIncident(id)
      loadList()
    } catch (e) { setError(e.message) }
  }

  const handleSanction = async (data) => {
    try {
      await api.blotterApplySanction(data)
      setShowSanction(null)
      loadSanctions()
    } catch (e) { setError(e.message) }
  }

  const handleLiftSanction = async (id) => {
    if (!confirm('Lift this sanction?')) return
    try {
      await api.blotterLiftSanction(id)
      loadSanctions()
    } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="page-content"><SkeletonTable rows={6} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => { setError(null); setLoading(true); loadList() }} /></div>

  const tabs = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'all', label: 'All Incidents' },
        { id: 'my', label: 'My Filed' },
        { id: 'against', label: 'Against Me' },
        { id: 'sanctions', label: 'Sanctions' },
      ]
    : [
        { id: 'my', label: 'My Filed' },
        { id: 'against', label: 'Against Me' },
      ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Blotter</h1>
        <p className="text-muted">Incident reports and moderation records</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'dashboard' && isAdmin && stats && (
          <Dashboard stats={stats} recent={recent} onSelect={loadIncident} />
        )}

        {(tab === 'all' || tab === 'my' || tab === 'against') && (
          <>
            {tab === 'all' && isAdmin && (
              <div className="filter-bar" style={{ marginBottom: '1rem' }}>
                <input className="filter-input" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="filter-select" value={filterSeverity} onChange={e => setFilterSeverity(Number(e.target.value))}>
                  <option value={0}>All Severity</option>
                  {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => setShowFile(true)}>File Incident</button>
              </div>
            )}
            {tab !== 'all' && (
              <div style={{ marginBottom: '1rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowFile(true)}>File New Incident</button>
              </div>
            )}
            {!incidents || incidents.length === 0 ? (
              <EmptyState icon="&#128214;" title="No Incidents" message="No incident reports found." />
            ) : (
              <div className="card">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Filed</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => loadIncident(inc.id)}>
                        <td>{inc.id}</td>
                        <td>
                          {inc.title}
                          {inc.withdrawn === 1 && <span className="text-muted" style={{ marginLeft: '.5rem' }}>(withdrawn)</span>}
                        </td>
                        <td><SeverityBadge severity={inc.severity} /></td>
                        <td><CategoryBadge category={inc.category} /></td>
                        <td><StatusBadge status={inc.status} /></td>
                        <td className="text-muted" style={{ fontSize: '.85rem' }}>{inc.created_at?.slice(0, 10)}</td>
                        <td><button className="btn btn-outline btn-sm">View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'sanctions' && isAdmin && (
          <SanctionsTab sanctions={sanctions} onLift={handleLiftSanction} />
        )}
      </div>

      {selected && (
        <IncidentDetail
          incident={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onResolve={handleResolve}
          onWithdraw={handleWithdraw}
          onAssign={handleAssign}
          onReopen={handleReopen}
          onAddNote={handleAddNote}
          onAddEvidence={handleAddEvidence}
          newNote={newNote}
          setNewNote={setNewNote}
          noteInternal={noteInternal}
          setNoteInternal={setNoteInternal}
          evidenceUrl={evidenceUrl}
          setEvidenceUrl={setEvidenceUrl}
          evidenceDesc={evidenceDesc}
          setEvidenceDesc={setEvidenceDesc}
          onSanction={setShowSanction}
        />
      )}

      {showFile && (
        <FileIncidentModal onClose={() => setShowFile(false)} onSubmit={handleFile} />
      )}

      {showSanction && (
        <SanctionModal incident={showSanction} onClose={() => setShowSanction(null)} onSubmit={handleSanction} />
      )}
    </div>
  )
}

function Dashboard({ stats, recent, onSelect }) {
  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header"><h3>Total Incidents</h3></div>
          <div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--gold)' }}>{stats.total}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Open</h3></div>
          <div className="card-body"><p style={{ fontSize: '2rem', color: STATUS_COLORS.open }}>{stats.by_status.open || 0}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Investigating</h3></div>
          <div className="card-body"><p style={{ fontSize: '2rem', color: STATUS_COLORS.investigating }}>{stats.by_status.investigating || 0}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Active Sanctions</h3></div>
          <div className="card-body"><p style={{ fontSize: '2rem', color: 'var(--red)' }}>{stats.active_sanctions}</p></div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header"><h3>By Severity</h3></div>
          <div className="card-body">
            {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <SeverityBadge severity={Number(k)} />
                <span className="text-gold">{stats.by_severity[Number(k)] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>By Status</h3></div>
          <div className="card-body">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <StatusBadge status={k} />
                <span className="text-gold">{stats.by_status[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>By Category</h3></div>
          <div className="card-body">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <CategoryBadge category={k} />
                <span className="text-gold">{stats.by_category[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Recent Incidents</h3></div>
        <div className="card-body">
          {!recent || recent.length === 0 ? (
            <p className="text-muted">No incidents filed yet.</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr><th>#</th><th>Title</th><th>Severity</th><th>Status</th><th>Filed</th></tr>
              </thead>
              <tbody>
                {recent.map(inc => (
                  <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(inc.id)}>
                    <td>{inc.id}</td>
                    <td>{inc.title}</td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td className="text-muted" style={{ fontSize: '.85rem' }}>{inc.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

function SanctionsTab({ sanctions, onLift }) {
  if (!sanctions || sanctions.length === 0) {
    return <EmptyState icon="&#9876;" title="No Active Sanctions" message="No sanctions are currently active." />
  }
  return (
    <div className="card">
      <div className="card-header"><h3>Active Sanctions</h3></div>
      <div className="card-body">
        <table className="stats-table">
          <thead>
            <tr><th>#</th><th>Player</th><th>Type</th><th>Reason</th><th>Admin</th><th>Issued</th><th>Expires</th><th></th></tr>
          </thead>
          <tbody>
            {sanctions.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.avatar_name || s.avatar_key.slice(0, 8)}</td>
                <td><span className="wound-badge" style={{ background: s.sanction_type === 'perm_ban' ? '#4a1a0e' : '#702618' }}>{SANCTION_LABELS[s.sanction_type] || s.sanction_type}</span></td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.reason}</td>
                <td>{s.admin_name || 'Admin'}</td>
                <td className="text-muted" style={{ fontSize: '.85rem' }}>{s.created_at?.slice(0, 10)}</td>
                <td className="text-muted" style={{ fontSize: '.85rem' }}>{s.expires_at ? s.expires_at.slice(0, 10) : 'Permanent'}</td>
                <td><button className="btn btn-outline btn-sm" onClick={() => onLift(s.id)}>Lift</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IncidentDetail({ incident, isAdmin, onClose, onStatusChange, onResolve, onWithdraw, onAssign, onReopen, onAddNote, onAddEvidence, newNote, setNewNote, noteInternal, setNoteInternal, evidenceUrl, setEvidenceUrl, evidenceDesc, setEvidenceDesc, onSanction }) {
  const [resolveNotes, setResolveNotes] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const [showReopen, setShowReopen] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '800px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Incident #{incident.id}: {incident.title}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <CategoryBadge category={incident.category} />
            {incident.withdrawn === 1 && <span className="text-muted">(Withdrawn)</span>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Filed by:</strong> {incident.reporter_name || incident.reporter_key.slice(0, 8)}<br />
            <strong>Subject:</strong> {incident.subject_name || incident.subject_key.slice(0, 8)}<br />
            <strong>Date:</strong> {incident.created_at}<br />
            {incident.assigned_admin && <><strong>Assigned:</strong> {incident.assigned_admin.slice(0, 8)}</>}
          </div>

          <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-elevated)' }}>
            <div className="card-body">
              <strong>Description:</strong>
              <p style={{ marginTop: '.5rem', whiteSpace: 'pre-wrap' }}>{incident.description}</p>
            </div>
          </div>

          {incident.resolution_notes && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <strong>Resolution:</strong>
              <p style={{ marginTop: '.5rem', whiteSpace: 'pre-wrap' }}>{incident.resolution_notes}</p>
            </div>
          )}

          {incident.can_withdraw && (
            <button className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }} onClick={() => onWithdraw(incident.id)}>Withdraw Incident</button>
          )}

          {isAdmin && (
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {incident.status === 'open' && <button className="btn btn-outline btn-sm" onClick={() => onAssign(incident.id)}>Assign to Me</button>}
              {incident.status !== 'investigating' && incident.status !== 'resolved' && incident.status !== 'closed' && <button className="btn btn-outline btn-sm" onClick={() => onStatusChange(incident.id, 'investigating')}>Mark Investigating</button>}
              {incident.status !== 'resolved' && incident.status !== 'closed' && <button className="btn btn-primary btn-sm" onClick={() => setShowResolve(true)}>Resolve</button>}
              {(incident.status === 'resolved' || incident.status === 'closed') && <button className="btn btn-outline btn-sm" onClick={() => setShowReopen(true)}>Reopen</button>}
              {incident.status !== 'closed' && <button className="btn btn-outline btn-sm" onClick={() => onStatusChange(incident.id, 'closed')}>Close</button>}
              <button className="btn btn-outline btn-sm" onClick={() => onSanction(incident)}>Apply Sanction</button>
            </div>
          )}

          {showResolve && (
            <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-elevated)' }}>
              <div className="card-body">
                <h4>Resolve Incident</h4>
                <textarea className="form-input" style={{ width: '100%', minHeight: '80px', marginTop: '.5rem' }} placeholder="Resolution notes (min 10 chars)..." value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} />
                <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { onResolve(incident.id, resolveNotes); setShowResolve(false); setResolveNotes('') }}>Confirm Resolve</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowResolve(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showReopen && (
            <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-elevated)' }}>
              <div className="card-body">
                <h4>Reopen Incident</h4>
                <input className="form-input" style={{ width: '100%', marginTop: '.5rem' }} placeholder="Reason for reopening..." value={reopenReason} onChange={e => setReopenReason(e.target.value)} />
                <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { onReopen(incident.id, reopenReason); setShowReopen(false); setReopenReason('') }}>Confirm Reopen</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowReopen(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {incident.evidence && incident.evidence.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Evidence</h4>
              {incident.evidence.map(ev => (
                <div key={ev.id} style={{ marginBottom: '.5rem' }}>
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-gold">{ev.description || ev.url}</a>
                </div>
              ))}
            </div>
          )}

          {incident.notes && incident.notes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Notes</h4>
              {incident.notes.map(n => (
                <div key={n.id} className="card" style={{ marginBottom: '.5rem', background: 'var(--bg-elevated)', padding: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                    <strong>{n.admin_name || 'Unknown'}</strong>
                    <span className="text-muted" style={{ fontSize: '.8rem' }}>{n.created_at?.slice(0, 16)}</span>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{n.note}</p>
                  {n.is_internal == 1 && <span className="text-muted" style={{ fontSize: '.75rem' }}>[Staff Only]</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <h4>Add Note</h4>
            <textarea className="form-input" style={{ width: '100%', minHeight: '60px', marginTop: '.5rem' }} placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
            {isAdmin && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem', fontSize: '.85rem' }}>
                <input type="checkbox" checked={noteInternal} onChange={e => setNoteInternal(e.target.checked)} /> Staff only (not visible to reporter)
              </label>
            )}
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.5rem' }} onClick={() => onAddNote(incident.id)}>Post Note</button>
          </div>

          <div>
            <h4>Add Evidence</h4>
            <input className="form-input" style={{ width: '100%', marginTop: '.5rem' }} placeholder="HTTPS URL (image/screenshot link)" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} />
            <input className="form-input" style={{ width: '100%', marginTop: '.25rem' }} placeholder="Description (optional)" value={evidenceDesc} onChange={e => setEvidenceDesc(e.target.value)} />
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.5rem' }} onClick={() => onAddEvidence(incident.id)}>Add Evidence</button>
          </div>

          {incident.sanctions && incident.sanctions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Sanctions Applied</h4>
              {incident.sanctions.map(s => (
                <div key={s.id} className="card" style={{ marginBottom: '.5rem', background: 'var(--bg-elevated)', padding: '.75rem' }}>
                  <strong>{SANCTION_LABELS[s.sanction_type] || s.sanction_type}</strong> - {s.avatar_name || 'Unknown'}
                  <p className="text-muted" style={{ fontSize: '.85rem' }}>{s.reason}</p>
                  <span className="text-muted" style={{ fontSize: '.75rem' }}>By {s.admin_name} on {s.created_at?.slice(0, 10)} {s.is_active == 1 ? '(Active)' : '(Lifted)'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileIncidentModal({ onClose, onSubmit }) {
  const [subjectKey, setSubjectKey] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState(1)
  const [category, setCategory] = useState('conduct')

  const submit = () => {
    if (title.length < 5 || description.length < 20 || !subjectKey) return
    onSubmit({ subject_key: subjectKey, subject_name: subjectName, title, description, severity, category })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>File an Incident</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Subject Avatar Key (UUID)</label>
            <input className="form-input" style={{ width: '100%' }} placeholder="00000000-0000-0000-0000-000000000000" value={subjectKey} onChange={e => setSubjectKey(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Subject Name (optional)</label>
            <input className="form-input" style={{ width: '100%' }} placeholder="Avatar name" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" style={{ width: '100%' }} placeholder="Brief title (min 5 chars)" value={title} onChange={e => setTitle(e.target.value)} maxLength={128} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" style={{ width: '100%', minHeight: '120px' }} placeholder="Describe the incident in detail (min 20 chars)" value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} />
          </div>
          <div className="form-group">
            <label className="form-label">Severity</label>
            <select className="form-input" style={{ width: '100%' }} value={severity} onChange={e => setSeverity(Number(e.target.value))}>
              {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={submit}>Submit Incident</button>
        </div>
      </div>
    </div>
  )
}

function SanctionModal({ incident, onClose, onSubmit }) {
  const [avatarKey, setAvatarKey] = useState(incident?.subject_key || '')
  const [avatarName, setAvatarName] = useState(incident?.subject_name || '')
  const [type, setType] = useState('warning')
  const [duration, setDuration] = useState(24)
  const [reason, setReason] = useState('')

  const submit = () => {
    if (reason.length < 5 || !avatarKey) return
    onSubmit({
      incident_id: incident?.id || 0,
      avatar_key: avatarKey,
      avatar_name: avatarName,
      sanction_type: type,
      duration_hours: type === 'temp_ban' ? duration : null,
      reason,
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Apply Sanction</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Avatar Key</label>
            <input className="form-input" style={{ width: '100%' }} value={avatarKey} onChange={e => setAvatarKey(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Avatar Name</label>
            <input className="form-input" style={{ width: '100%' }} value={avatarName} onChange={e => setAvatarName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Sanction Type</label>
            <select className="form-input" style={{ width: '100%' }} value={type} onChange={e => setType(e.target.value)}>
              {Object.entries(SANCTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {type === 'temp_ban' && (
            <div className="form-group">
              <label className="form-label">Duration (hours)</label>
              <input className="form-input" type="number" style={{ width: '100%' }} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} placeholder="Reason for sanction (min 5 chars)" value={reason} onChange={e => setReason(e.target.value)} maxLength={256} />
          </div>
          <button className="btn btn-primary" onClick={submit}>Apply Sanction</button>
        </div>
      </div>
    </div>
  )
}
