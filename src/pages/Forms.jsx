import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const FORM_TYPE_LABELS = {
  house_application: 'House Application',
  bounty_contract: 'Bounty Contract',
  marriage_proposal: 'Marriage Proposal',
  alliance_proposal: 'Alliance Proposal',
  player_quest: 'Player Quest',
  custom: 'Custom',
}
const STATUS_COLORS = { pending: '#8C6420', approved: '#2A3D1F', rejected: '#702618' }

export default function Forms() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('available')
  const [forms, setForms] = useState(null)
  const [submissions, setSubmissions] = useState(null)
  const [mySubs, setMySubs] = useState(null)
  const [activeForm, setActiveForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState(null)
  const [reviewSub, setReviewSub] = useState(null)

  const loadForms = useCallback(async () => {
    try {
      const res = await api.formsList(false)
      if (res.status === 'ok') setForms(res.forms)
    } catch (e) { setError(e.message) }
  }, [])

  const loadMySubs = useCallback(async () => {
    try {
      const res = await api.formMySubmissions()
      if (res.status === 'ok') setMySubs(res.submissions)
    } catch (e) { setError(e.message) }
  }, [])

  const loadAllSubs = useCallback(async () => {
    try {
      const res = await api.formListSubmissions()
      if (res.status === 'ok') setSubmissions(res.submissions)
    } catch (e) { setError(e.message) }
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([loadForms(), loadMySubs()])
    if (adminLevel >= 1) await loadAllSubs()
    setLoading(false)
  }, [loadForms, loadMySubs, loadAllSubs, adminLevel])

  useEffect(() => { loadAll() }, [loadAll])

  const handleOpenForm = async (formId) => {
    setError(null)
    try {
      const res = await api.formGet(formId)
      if (res.status === 'ok') setActiveForm(res.form)
    } catch (e) { setError(e.message) }
  }

  const handleSubmit = async (formId, data) => {
    setError(null)
    try {
      const res = await api.formSubmit(formId, data)
      if (res.status === 'ok') {
        setActiveForm(null)
        loadMySubs()
      }
    } catch (e) { setError(e.message) }
  }

  const handleReview = async (subId, status, notes) => {
    setError(null)
    try {
      const res = await api.formReview(subId, status, notes)
      if (res.status === 'ok') {
        setReviewSub(null)
        loadAllSubs()
      }
    } catch (e) { setError(e.message) }
  }

  const handleDeleteForm = async (formId) => {
    if (!confirm('Delete this form and all its submissions?')) return
    try {
      const res = await api.formDelete(formId)
      if (res.status === 'ok') loadForms()
    } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>Forms & Petitions</h1>
        {adminLevel >= 2 && (
          <button className="btn btn-outline btn-sm" onClick={() => { setEditingForm(null); setShowBuilder(true) }}>+ Create Form</button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'available', label: 'Available Forms' },
          { key: 'mysubs', label: 'My Submissions' },
          ...(adminLevel >= 1 ? [{ key: 'review', label: 'Review Queue' }] : []),
          ...(adminLevel >= 2 ? [{ key: 'manage', label: 'Manage Forms' }] : []),
        ].map(t => (
          <button key={t.key} className="btn btn-sm" style={{
            background: tab === t.key ? 'var(--gold)' : 'transparent',
            color: tab === t.key ? '#fff' : 'var(--text)',
            border: '1px solid var(--border)', borderBottom: tab === t.key ? '1px solid var(--gold)' : '1px solid var(--border)',
            borderRadius: '4px 4px 0 0', padding: '8px 16px',
          }} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="grid grid-2">
          {forms?.filter(f => f.is_active == 1).map(f => (
            <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '16px', background: 'var(--bg-card)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>{f.title}</h3>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-faint)' }}>
                  {FORM_TYPE_LABELS[f.form_type] || f.form_type}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '12px' }}>{f.description}</p>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenForm(f.id)}>Fill Out</button>
            </div>
          ))}
          {forms?.filter(f => f.is_active == 1).length === 0 && (
            <div style={{ textAlign: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)', gridColumn: '1 / -1' }}>
              No forms available at this time.
            </div>
          )}
        </div>
      )}

      {tab === 'mysubs' && (
        <div>
          {mySubs?.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)', marginTop: '40px' }}>
              You have not submitted any forms.
            </div>
          ) : (
            mySubs?.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{s.form_title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.5' }}>Submitted: {s.submitted_at?.slice(0, 16)}</div>
                  {s.review_notes && <div style={{ fontSize: '0.75rem', opacity: '0.6', marginTop: '4px' }}>Notes: {s.review_notes}</div>}
                </div>
                <span style={{ fontSize: '0.8rem', padding: '2px 12px', borderRadius: '10px', background: STATUS_COLORS[s.status], color: '#fff', textTransform: 'capitalize' }}>{s.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'review' && adminLevel >= 1 && (
        <div>
          {submissions?.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)', marginTop: '40px' }}>
              No submissions to review.
            </div>
          ) : (
            submissions?.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{s.form_title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>{s.submitter_name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.7rem', opacity: '0.5' }}>{s.submitted_at?.slice(0, 16)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', padding: '2px 12px', borderRadius: '10px', background: STATUS_COLORS[s.status], color: '#fff', textTransform: 'capitalize' }}>{s.status}</span>
                  {s.status === 'pending' && (
                    <button className="btn btn-outline btn-sm" onClick={() => setReviewSub(s)}>Review</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'manage' && adminLevel >= 2 && (
        <div>
          {forms?.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.75rem', opacity: '0.5' }}>
                  {FORM_TYPE_LABELS[f.form_type] || f.form_type} | {f.is_active == 1 ? 'Active' : 'Inactive'} | {f.allow_multiple == 1 ? 'Multiple OK' : 'One per player'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditingForm(f); setShowBuilder(true) }}>Edit</button>
                <button className="btn btn-outline btn-sm" style={{ color: '#702618' }} onClick={() => handleDeleteForm(f.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeForm && (
        <FormFillModal form={activeForm} onSubmit={handleSubmit} onCancel={() => setActiveForm(null)} />
      )}

      {showBuilder && (
        <FormBuilderModal form={editingForm} onSave={async (data) => {
          try {
            if (editingForm) {
              const res = await api.formUpdate(editingForm.id, data)
              if (res.status === 'ok') { setShowBuilder(false); loadForms() }
            } else {
              const res = await api.formCreate(data)
              if (res.status === 'ok') { setShowBuilder(false); loadForms() }
            }
          } catch (e) { setError(e.message) }
        }} onCancel={() => setShowBuilder(false)} />
      )}

      {reviewSub && (
        <ReviewModal submission={reviewSub} onReview={handleReview} onCancel={() => setReviewSub(null)} />
      )}
    </div>
  )
}

function FormFillModal({ form, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({})
  const schema = form.schema || JSON.parse(form.schema_json || '{}')

  const handleSubmit = () => {
    let valid = true
    for (const sec of schema.sections || []) {
      for (const q of sec.questions || []) {
        if (q.required && !answers[q.id]) { valid = false }
      }
    }
    if (!valid) { alert('Please fill all required fields'); return }
    onSubmit(form.id, answers)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '8px' }}>{form.title}</h3>
        <p style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '16px' }}>{form.description}</p>
        {(schema.sections || []).map((sec, si) => (
          <div key={si} style={{ marginBottom: '20px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '12px' }}>
              {sec.title}
            </h4>
            {(sec.questions || []).map((q, qi) => (
              <div key={q.id} className="form-group">
                <label className="form-label">{q.label}{q.required && <span style={{ color: '#702618' }}> *</span>}</label>
                {q.type === 'text' && (
                  <input type="text" className="form-input" value={answers[q.id] || ''} maxLength={q.maxLen || 500} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                )}
                {q.type === 'textarea' && (
                  <textarea className="form-input" rows={4} value={answers[q.id] || ''} maxLength={q.maxLen || 5000} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                )}
                {q.type === 'number' && (
                  <input type="number" className="form-input" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                )}
                {q.type === 'select' && (
                  <select className="form-input" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                    <option value="">-- Choose --</option>
                    {(q.options || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                  </select>
                )}
                {q.type === 'checkbox' && (
                  <label className="form-label"><input type="checkbox" checked={!!answers[q.id]} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.checked })} /> {q.label}</label>
                )}
                {q.maxLen && q.type !== 'checkbox' && (
                  <div style={{ fontSize: '0.7rem', opacity: '0.4', marginTop: '2px' }}>{(answers[q.id] || '').length}/{q.maxLen}</div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  )
}

function FormBuilderModal({ form, onSave, onCancel }) {
  const [title, setTitle] = useState(form?.title || '')
  const [description, setDescription] = useState(form?.description || '')
  const [formType, setFormType] = useState(form?.form_type || 'custom')
  const [allowMultiple, setAllowMultiple] = useState(form?.allow_multiple == 1)
  const [isActive, setIsActive] = useState(form ? form.is_active == 1 : true)
  const [sections, setSections] = useState(() => {
    if (form) {
      const s = form.schema || (typeof form.schema_json === 'string' ? JSON.parse(form.schema_json) : form.schema_json) || {}
      return s.sections || []
    }
    return [{ title: 'Section I', questions: [{ id: 'q1', type: 'text', label: '', required: false }] }]
  })

  const addSection = () => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
    setSections([...sections, { title: 'Section ' + roman[sections.length] || 'New', questions: [] }])
  }

  const addQuestion = (si) => {
    const newSecs = [...sections]
    const qid = 'q' + Date.now()
    newSecs[si].questions.push({ id: qid, type: 'text', label: '', required: false })
    setSections(newSecs)
  }

  const updateQuestion = (si, qi, field, value) => {
    const newSecs = [...sections]
    newSecs[si].questions[qi][field] = value
    setSections(newSecs)
  }

  const removeQuestion = (si, qi) => {
    const newSecs = [...sections]
    newSecs[si].questions.splice(qi, 1)
    setSections(newSecs)
  }

  const updateOptions = (si, qi, optsText) => {
    const opts = optsText.split('\n').filter(o => o.trim())
    updateQuestion(si, qi, 'options', opts)
  }

  const handleSave = () => {
    if (!title.trim()) { alert('Title required'); return }
    onSave({
      title: title.trim(),
      description: description.trim(),
      form_type: formType,
      allow_multiple: allowMultiple,
      is_active: isActive,
      schema: { sections },
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>{form ? 'Edit Form' : 'Create Form'}</h3>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={128} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Form Type</label>
            <select className="form-input" value={formType} onChange={(e) => setFormType(e.target.value)}>
              {Object.entries(FORM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
            <label className="form-label"><input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} style={{ marginRight: '6px' }} />Allow multiple submissions</label>
            <label className="form-label"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ marginRight: '6px' }} />Active (accepts submissions)</label>
          </div>
        </div>

        {sections.map((sec, si) => (
          <div key={si} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
            <input type="text" className="form-input" value={sec.title} onChange={(e) => { const ns = [...sections]; ns[si].title = e.target.value; setSections(ns) }} style={{ fontWeight: 'bold', marginBottom: '8px' }} />
            {sec.questions.map((q, qi) => (
              <div key={qi} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <input type="text" className="form-input" placeholder="Question text" value={q.label} onChange={(e) => updateQuestion(si, qi, 'label', e.target.value)} maxLength={500} />
                  </div>
                  <select className="form-input" style={{ width: 'auto' }} value={q.type} onChange={(e) => updateQuestion(si, qi, 'type', e.target.value)}>
                    <option value="text">Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  <button className="btn btn-outline btn-sm" style={{ color: '#702618' }} onClick={() => removeQuestion(si, qi)}>X</button>
                </div>
                {q.type === 'select' && (
                  <textarea className="form-input" rows={3} placeholder="One option per line" value={(q.options || []).join('\n')} onChange={(e) => updateOptions(si, qi, e.target.value)} style={{ marginTop: '6px' }} />
                )}
                <label style={{ fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  <input type="checkbox" checked={!!q.required} onChange={(e) => updateQuestion(si, qi, 'required', e.target.checked)} style={{ marginRight: '6px' }} />
                  Required
                </label>
                <input type="text" className="form-input" placeholder="Max length (optional)" value={q.maxLen || ''} onChange={(e) => updateQuestion(si, qi, 'maxLen', e.target.value ? parseInt(e.target.value) : undefined)} style={{ marginTop: '4px', fontSize: '0.8rem' }} />
              </div>
            ))}
            <button className="btn btn-outline btn-sm" onClick={() => addQuestion(si)}>+ Add Question</button>
          </div>
        ))}
        <button className="btn btn-outline btn-sm" onClick={addSection} style={{ marginBottom: '16px' }}>+ Add Section</button>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>{form ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ submission, onReview, onCancel }) {
  const [notes, setNotes] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '8px' }}>{submission.form_title}</h3>
        <div style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '16px' }}>
          Submitted by <strong>{submission.submitter_name || 'Unknown'}</strong> on {submission.submitted_at?.slice(0, 16)}
        </div>

        <div style={{ marginBottom: '16px' }}>
          {Object.entries(submission.data || {}).map(([key, val]) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', opacity: '0.6' }}>{key}</div>
              <div style={{ fontSize: '0.9rem', padding: '6px 10px', background: 'var(--bg-faint)', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Review Notes</label>
          <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Optional notes for the submitter" />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sm" style={{ background: STATUS_COLORS.rejected, color: '#fff' }} onClick={() => onReview(submission.id, 'rejected', notes)}>Reject</button>
          <button className="btn btn-sm" style={{ background: STATUS_COLORS.approved, color: '#fff' }} onClick={() => onReview(submission.id, 'approved', notes)}>Approve</button>
        </div>
      </div>
    </div>
  )
}
