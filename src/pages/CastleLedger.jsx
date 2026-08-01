import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const SEVERITY_LABELS = { 1: 'Minor', 2: 'Moderate', 3: 'Severe' }
const SEVERITY_COLORS = { 1: '#8C6420', 2: '#b5642a', 3: '#702618' }
const CATEGORIES = [
  { value: 'kings_peace', label: "Breach of the King's Peace" },
  { value: 'trial_combat', label: 'Trial by Combat Dispute' },
  { value: 'land_dispute', label: 'Land Dispute' },
  { value: 'oathbreaking', label: 'Oathbreaking' },
]
const STATUS_COLORS = {
  open: '#702618',
  investigating: '#8C6420',
  resolved: '#2A3D1F',
  sealed: '#555',
}

export default function CastleLedger() {
  const { adminLevel } = useAuth()
  const [incidents, setIncidents] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showFile, setShowFile] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [fileForm, setFileForm] = useState({
    title: '', description: '', severity: 1, category: 'kings_peace',
    subject_key: '', subject_name: '',
  })
  const [noteText, setNoteText] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (adminLevel >= 1) {
        const data = await api.ledgerList(filterStatus || null, filterCategory || null)
        setIncidents(data.incidents || [])
      } else {
        const data = await api.ledgerMyIncidents()
        setIncidents(data.incidents || [])
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [adminLevel, filterStatus, filterCategory])

  useEffect(() => { load() }, [load])

  const loadDetail = useCallback(async (id) => {
    try {
      const data = await api.ledgerGet(id)
      setSelected(data.incident)
    } catch (err) { setError(err.message) }
  }, [])

  const handleFile = async () => {
    if (!fileForm.title || !fileForm.description) {
      setError('Title and description required'); return
    }
    try {
      await api.ledgerFile(fileForm)
      setShowFile(false)
      setFileForm({ title: '', description: '', severity: 1, category: 'kings_peace', subject_key: '', subject_name: '' })
      setMsg('Incident filed')
      setTimeout(() => setMsg(null), 3000)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleAddNote = async () => {
    if (!noteText || !selected) return
    try {
      await api.ledgerAddNote(selected.id, noteText, adminLevel >= 1)
      setNoteText('')
      loadDetail(selected.id)
    } catch (err) { setError(err.message) }
  }

  const handleAddEvidence = async () => {
    if (!evidenceUrl || !selected) return
    try {
      await api.ledgerAddEvidence(selected.id, evidenceUrl)
      setEvidenceUrl('')
      loadDetail(selected.id)
    } catch (err) { setError(err.message) }
  }

  const handleStatusChange = async (newStatus) => {
    if (!selected) return
    try {
      await api.ledgerUpdateStatus(selected.id, newStatus)
      loadDetail(selected.id)
      load()
    } catch (err) { setError(err.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Castle Ledger</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {adminLevel >= 1 && (
            <>
              <select className="form-input" style={{ width: 'auto', fontSize: '.8rem' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="sealed">Sealed</option>
              </select>
              <select className="form-input" style={{ width: 'auto', fontSize: '.8rem' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowFile(true)}>+ File Incident</button>
        </div>
      </div>

      {/* Incident list */}
      <div className="card mb-4">
        <div className="card-header">Incidents ({incidents?.length || 0})</div>
        <div className="card-body">
          {(incidents || []).length === 0 ? (
            <p className="text-muted">No incidents reported.</p>
          ) : (
            (incidents || []).map(inc => (
              <div
                key={inc.id}
                onClick={() => loadDetail(inc.id)}
                style={{
                  padding: '12px 16px', margin: '4px 0', cursor: 'pointer',
                  border: `1px solid var(--border)`, borderRadius: '4px',
                  borderLeft: `4px solid ${SEVERITY_COLORS[inc.severity] || '#555'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        color: SEVERITY_COLORS[inc.severity], border: `1px solid ${SEVERITY_COLORS[inc.severity]}`,
                        borderRadius: '2px', padding: '2px 6px',
                      }}>{SEVERITY_LABELS[inc.severity] || inc.severity}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-muted)',
                      }}>{CATEGORIES.find(c => c.value === inc.category)?.label || inc.category}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>{inc.title}</h3>
                    {inc.reporter_name && <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>By {inc.reporter_name}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '1px',
                      color: STATUS_COLORS[inc.status] || 'var(--text-muted)',
                      border: `1px solid ${STATUS_COLORS[inc.status] || 'var(--border)'}`,
                      borderRadius: '2px', padding: '2px 6px',
                    }}>{inc.status}</span>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {inc.created_at?.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflow: 'auto',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px',
            maxWidth: '600px', width: '100%', maxHeight: 'calc(100vh - 80px)', overflow: 'auto', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: SEVERITY_COLORS[selected.severity], border: `1px solid ${SEVERITY_COLORS[selected.severity]}`, borderRadius: '2px', padding: '2px 6px' }}>
                    {SEVERITY_LABELS[selected.severity]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', color: 'var(--text-muted)' }}>
                    {CATEGORIES.find(c => c.value === selected.category)?.label || selected.category}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLORS[selected.status], border: `1px solid ${STATUS_COLORS[selected.status]}`, borderRadius: '2px', padding: '2px 6px' }}>
                    {selected.status}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginTop: '8px' }}>{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)', padding: '4px 10px' }}>Close</button>
            </div>

            <p style={{ fontSize: '.9rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '12px' }}>{selected.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '.85rem', marginBottom: '16px' }}>
              <div><span className="text-muted">Reporter: </span><span className="text-gold">{selected.reporter_name || 'Unknown'}</span></div>
              <div><span className="text-muted">Subject: </span><span className="text-gold">{selected.subject_name || 'Not specified'}</span></div>
              <div><span className="text-muted">Filed: </span><span className="text-gold">{selected.created_at?.split(' ')[0]}</span></div>
              {selected.resolution && <div><span className="text-muted">Resolution: </span><span className="text-gold">{selected.resolution}</span></div>}
            </div>

            {/* Admin status controls */}
            {adminLevel >= 1 && (
              <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <span style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Change Status:</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {['open', 'investigating', 'resolved', 'sealed'].map(s => (
                    <button
                      key={s}
                      className={selected.status === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                      onClick={() => handleStatusChange(s)}
                      style={{ fontSize: '10px', padding: '4px 10px' }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Evidence</span>
              {(selected.evidence || []).map(ev => (
                <div key={ev.id} style={{ marginTop: '4px' }}>
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.85rem', color: 'var(--gold)', textDecoration: 'underline', textDecorationStyle: 'dashed' }}>{ev.description || ev.url}</a>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <input type="text" className="form-input" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https:// evidence URL..." style={{ flex: 1, fontSize: '.85rem' }} />
                <button className="btn btn-outline btn-sm" onClick={handleAddEvidence} disabled={!evidenceUrl}>Add</button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <span style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Notes</span>
              {(selected.notes || []).map(n => (
                <div key={n.id} style={{
                  padding: '8px 12px', margin: '4px 0', border: '1px solid var(--border)', borderRadius: '4px',
                  borderLeft: n.is_internal == 1 ? '3px solid #702618' : '3px solid var(--gold)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 600 }}>{n.author_name || 'Admin'}</span>
                    <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{n.created_at?.split(' ')[0]}</span>
                  </div>
                  <p style={{ fontSize: '.85rem', marginTop: '4px', color: 'var(--text-muted)' }}>{n.note}</p>
                  {n.is_internal == 1 && <span style={{ fontSize: '.65rem', color: '#702618', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Internal</span>}
                </div>
              ))}
              {adminLevel >= 1 && (
                <div style={{ marginTop: '8px' }}>
                  <textarea className="form-input" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Add a note..." maxLength={2000} style={{ fontSize: '.85rem' }} />
                  <button className="btn btn-outline btn-sm mt-1" onClick={handleAddNote} disabled={!noteText}>Add Note</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File incident modal */}
      {showFile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '16px' }}>File Incident</h3>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" value={fileForm.title} onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })} maxLength={128} />
            </div>
            <div className="form-group">
              <label className="form-label">Account of Events</label>
              <textarea className="form-input" value={fileForm.description} onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })} rows={4} maxLength={5000} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-input" value={fileForm.severity} onChange={(e) => setFileForm({ ...fileForm, severity: parseInt(e.target.value) })}>
                  <option value={1}>Minor</option>
                  <option value={2}>Moderate</option>
                  <option value={3}>Severe</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={fileForm.category} onChange={(e) => setFileForm({ ...fileForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Subject Avatar Key (optional)</label>
                <input type="text" className="form-input" value={fileForm.subject_key} onChange={(e) => setFileForm({ ...fileForm, subject_key: e.target.value })} placeholder="00000000-..." />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name (optional)</label>
                <input type="text" className="form-input" value={fileForm.subject_name} onChange={(e) => setFileForm({ ...fileForm, subject_name: e.target.value })} maxLength={64} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowFile(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleFile}>Submit to Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
