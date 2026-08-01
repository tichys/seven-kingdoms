import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const STANDING_LABELS = { fit: 'Fit for Duty', recovering: 'Recovering', bedridden: 'Bedridden', quarantined: 'Quarantined' }
const STANDING_COLORS = { fit: '#2A3D1F', recovering: '#8C6420', bedridden: '#702618', quarantined: '#4a1a0e' }
const SEVERITY_COLORS = { minor: '#6b8f3e', moderate: '#b5642a', severe: '#702618', critical: '#4a1a0e' }
const DISEASE_STAGES = { incubating: 'Incubating', active: 'Active', recovering: 'Recovering', cured: 'Cured' }

export default function Health() {
  const { adminLevel } = useAuth()
  const [health, setHealth] = useState(null)
  const [consent, setConsent] = useState(null)
  const [treatments, setTreatments] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [quarantines, setQuarantines] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingStanding, setEditingStanding] = useState(false)
  const [editingConsent, setEditingConsent] = useState(false)
  const [showAddTreatment, setShowAddTreatment] = useState(false)
  const [showQuarantine, setShowQuarantine] = useState(false)
  const [patientView, setPatientView] = useState(null)

  const loadAll = useCallback(async () => {
    setError(null)
    try {
      const [h, c, t, cy] = await Promise.all([
        api.healthGet(),
        api.healthGetConsent(),
        api.healthGetTreatments(),
        api.healthGetCycle(),
      ])
      if (h.status === 'ok') setHealth(h.health)
      if (c.status === 'ok') setConsent(c.consent)
      if (t.status === 'ok') setTreatments(t.treatments)
      if (cy.status === 'ok') setCycle(cy.cycle)
      if (adminLevel >= 1) {
        const q = await api.healthListQuarantines()
        if (q.status === 'ok') setQuarantines(q.quarantines)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [adminLevel])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSetStanding = async (standing, notes) => {
    try {
      const res = await api.healthSetStanding(standing, notes)
      if (res.status === 'ok') { setEditingStanding(false); loadAll() }
    } catch (e) { setError(e.message) }
  }

  const handleSetConsent = async (data) => {
    try {
      const res = await api.healthSetConsent(data)
      if (res.status === 'ok') { setEditingConsent(false); loadAll() }
    } catch (e) { setError(e.message) }
  }

  const handleAddTreatment = async (patientKey, type, desc, performCheck) => {
    try {
      const res = await api.healthAddTreatment(patientKey, type, desc, performCheck)
      if (res.status === 'ok') { setShowAddTreatment(false); loadAll() }
    } catch (e) { setError(e.message) }
  }

  const handleQuarantine = async (avatarKey, reason) => {
    try {
      const res = await api.healthQuarantine(avatarKey, reason)
      if (res.status === 'ok') { setShowQuarantine(false); loadAll() }
    } catch (e) { setError(e.message) }
  }

  const handleLiftQuarantine = async (avatarKey) => {
    if (!confirm('Lift quarantine for this character?')) return
    try {
      const res = await api.healthLiftQuarantine(avatarKey)
      if (res.status === 'ok') loadAll()
    } catch (e) { setError(e.message) }
  }

  const handleSetCycle = async (enabled, data) => {
    try {
      const res = await api.healthSetCycle(enabled, data)
      if (res.status === 'ok') loadAll()
    } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  const hpPct = health ? Math.round((health.hp_current / health.hp_max) * 100) : 0

  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '16px' }}>Health Record</h1>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      {/* Health Status Card */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '20px', background: 'var(--bg-card)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', margin: 0 }}>
              {health?.character_name || health?.avatar_name || 'Unknown'}
            </h2>
            <span style={{
              display: 'inline-block', fontSize: '0.8rem', padding: '3px 12px', borderRadius: '10px',
              background: STANDING_COLORS[health?.standing || 'fit'], color: '#fff', marginTop: '4px',
            }}>
              {STANDING_LABELS[health?.standing || 'fit']}
            </span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setEditingStanding(true)}>Update Standing</button>
        </div>

        {/* HP Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
            <span>Health</span>
            <span>{health?.hp_current || 0} / {health?.hp_max || 0}</span>
          </div>
          <div style={{ height: '12px', background: 'var(--bg-faint)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: hpPct + '%',
              background: hpPct > 60 ? '#2A3D1F' : hpPct > 30 ? '#8C6420' : '#702618',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Survival Status */}
        {health?.survival && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', opacity: '0.7' }}>
            <span>Hunger: {health.survival.hunger}/100</span>
            <span>Thirst: {health.survival.thirst}/100</span>
            <span>Endurance: {health.endurance}</span>
          </div>
        )}

        {health?.notes && (
          <p style={{ fontSize: '0.85rem', opacity: '0.6', marginTop: '8px', borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
            {health.notes}
          </p>
        )}

        {health?.quarantine && (
          <div style={{ marginTop: '12px', padding: '10px', background: '#4a1a0e', borderRadius: '4px', border: '1px solid #702618' }}>
            <strong style={{ color: '#ff6b6b' }}>Quarantine Active</strong>
            <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Reason: {health.quarantine.reason}</p>
            <p style={{ fontSize: '0.75rem', opacity: '0.6', margin: '2px 0 0 0' }}>Ordered by {health.quarantine.admin_name || 'Admin'} on {health.quarantine.created_at?.slice(0, 16)}</p>
          </div>
        )}
      </div>

      {/* Active Wounds */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '8px' }}>Active Wounds</h3>
        {health?.wounds?.length === 0 ? (
          <div style={{ fontSize: '0.85rem', opacity: '0.5' }}>No active wounds.</div>
        ) : (
          health?.wounds?.map(w => {
            const daysLeft = w.heal_date ? Math.ceil((new Date(w.heal_date + 'Z') - new Date()) / 86400000) : null
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                  background: SEVERITY_COLORS[w.severity] || '#555', color: '#fff', textTransform: 'capitalize',
                }}>{w.severity}</span>
                <span style={{ fontSize: '0.85rem' }}>Wound to {w.body_part}</span>
                <span style={{ fontSize: '0.75rem', opacity: '0.5' }}>-{w.hp_loss} HP</span>
                {daysLeft !== null && daysLeft > 0 && (
                  <span style={{ fontSize: '0.75rem', opacity: '0.6' }}>Heals in ~{daysLeft}d</span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Active Diseases */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '8px' }}>Active Afflictions</h3>
        {health?.diseases?.length === 0 ? (
          <div style={{ fontSize: '0.85rem', opacity: '0.5' }}>No active afflictions.</div>
        ) : (
          health?.diseases?.map(d => (
            <div key={d.id} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{d.disease_name || 'Unknown Affliction'}</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: '#8C6420', color: '#fff' }}>
                  {DISEASE_STAGES[d.stage] || d.stage}
                </span>
              </div>
              {d.recovery_at && (
                <div style={{ fontSize: '0.75rem', opacity: '0.5', marginTop: '4px' }}>Expected recovery: {d.recovery_at?.slice(0, 10)}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Consent Settings */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>Privacy & Consent</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setEditingConsent(true)}>Edit</button>
        </div>
        <div style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <span>Maesters: <strong style={{ color: consent?.allow_maester == 1 ? '#6b8f3e' : '#702618' }}>{consent?.allow_maester == 1 ? 'Allowed' : 'Blocked'}</strong></span>
            <span>House Lord: <strong style={{ color: consent?.allow_house_lord == 1 ? '#6b8f3e' : '#702618' }}>{consent?.allow_house_lord == 1 ? 'Allowed' : 'Blocked'}</strong></span>
            <span>Admins: <strong style={{ color: consent?.allow_admin == 1 ? '#6b8f3e' : '#702618' }}>{consent?.allow_admin == 1 ? 'Allowed' : 'Blocked'}</strong></span>
            <span>Public Standing: <strong style={{ color: consent?.public_standing == 1 ? '#6b8f3e' : '#702618' }}>{consent?.public_standing == 1 ? 'Visible' : 'Hidden'}</strong></span>
          </div>
          <div style={{ fontSize: '0.75rem', opacity: '0.5', marginTop: '8px' }}>
            Consent Level: {consent?.consent_level || 0} (0=Self, 1=+Maester, 2=+Lord, 3=+Admin)
          </div>
        </div>
      </div>

      {/* Treatment Log */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>Treatment Log</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAddTreatment(true)}>+ Add Treatment</button>
        </div>
        {treatments?.length === 0 ? (
          <div style={{ fontSize: '0.85rem', opacity: '0.5' }}>No treatments recorded.</div>
        ) : (
          treatments?.map(t => (
            <div key={t.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.treatment_type}</span>
                <span style={{ fontSize: '0.7rem', opacity: '0.5' }}>{t.created_at?.slice(0, 16)}</span>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: '0.7', margin: '4px 0' }}>{t.description}</p>
              <div style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                By {t.maester_name || 'Unknown'} (Healing lvl {t.healer_skill_level})
                {t.skill_check_result && <> | Check: {t.skill_check_result}</>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reproductive Health (self only, opt-in) */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '8px' }}>Private Health Tracking</h3>
        <div style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-card)' }}>
          {cycle?.enabled ? (
            <div>
              <span style={{ fontSize: '0.85rem', color: '#6b8f3e' }}>\u2713 Enabled</span>
              <span style={{ fontSize: '0.8rem', opacity: '0.6', marginLeft: '8px' }}>Last updated: {cycle.last_updated?.slice(0, 16)}</span>
              {cycle.data && (
                <pre style={{ fontSize: '0.8rem', background: 'var(--bg-faint)', padding: '8px', borderRadius: '4px', marginTop: '8px', overflowX: 'auto' }}>
                  {JSON.stringify(cycle.data, null, 2)}
                </pre>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => {
                  const data = prompt('Enter cycle data (JSON):', JSON.stringify(cycle.data || {}))
                  if (data !== null) handleSetCycle(1, JSON.parse(data))
                }}>Update Data</button>
                <button className="btn btn-outline btn-sm" style={{ color: '#702618' }} onClick={() => handleSetCycle(0, null)}>Disable</button>
              </div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '0.85rem', opacity: '0.5' }}>Disabled — This data is never visible to anyone except you.</span>
              <div style={{ marginTop: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleSetCycle(1, { note: 'Initial entry' })}>Enable Private Tracking</button>
              </div>
            </div>
          )}
          <div style={{ fontSize: '0.7rem', opacity: '0.4', marginTop: '8px', fontStyle: 'italic' }}>
            This data is encrypted and visible only to you. Maesters, admins, and other players cannot access it.
          </div>
        </div>
      </div>

      {/* Admin: Quarantine Management */}
      {adminLevel >= 1 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>Quarantine Management</h3>
            {adminLevel >= 2 && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowQuarantine(true)}>+ Order Quarantine</button>
            )}
          </div>
          {quarantines?.length === 0 ? (
            <div style={{ fontSize: '0.85rem', opacity: '0.5' }}>No active quarantines.</div>
          ) : (
            quarantines?.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #702618', borderRadius: '4px', background: 'var(--bg-card)', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{q.character_name || q.avatar_name || 'Unknown'}</span>
                  <span style={{ fontSize: '0.8rem', opacity: '0.6', marginLeft: '6px' }}>Reason: {q.reason}</span>
                  <div style={{ fontSize: '0.7rem', opacity: '0.5' }}>Ordered by {q.admin_name} on {q.created_at?.slice(0, 16)}</div>
                </div>
                {adminLevel >= 2 && (
                  <button className="btn btn-outline btn-sm" style={{ color: '#6b8f3e' }} onClick={() => handleLiftQuarantine(q.avatar_key)}>Lift</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {editingStanding && (
        <StandingModal current={health?.standing || 'fit'} notes={health?.notes || ''} onSave={handleSetStanding} onCancel={() => setEditingStanding(false)} />
      )}

      {editingConsent && (
        <ConsentModal consent={consent} onSave={handleSetConsent} onCancel={() => setEditingConsent(false)} />
      )}

      {showAddTreatment && (
        <TreatmentModal onSave={handleAddTreatment} onCancel={() => setShowAddTreatment(false)} defaultPatient={health?.avatar_key} />
      )}

      {showQuarantine && (
        <QuarantineModal onSave={handleQuarantine} onCancel={() => setShowQuarantine(false)} />
      )}
    </div>
  )
}

function StandingModal({ current, notes, onSave, onCancel }) {
  const [standing, setStanding] = useState(current)
  const [notesVal, setNotesVal] = useState(notes)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Update Health Standing</h3>
        <div className="form-group">
          <label className="form-label">Standing</label>
          <select className="form-input" value={standing} onChange={(e) => setStanding(e.target.value)}>
            {Object.entries(STANDING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-input" rows={3} value={notesVal} onChange={(e) => setNotesVal(e.target.value)} maxLength={500} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(standing, notesVal)}>Save</button>
        </div>
      </div>
    </div>
  )
}

function ConsentModal({ consent, onSave, onCancel }) {
  const [allowMaester, setAllowMaester] = useState(consent?.allow_maester == 1)
  const [allowHouseLord, setAllowHouseLord] = useState(consent?.allow_house_lord == 1)
  const [allowAdmin, setAllowAdmin] = useState(consent?.allow_admin == 1)
  const [publicStanding, setPublicStanding] = useState(consent?.public_standing == 1)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '440px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '12px' }}>Privacy & Consent Settings</h3>
        <div style={{ fontSize: '0.8rem', opacity: '0.6', marginBottom: '16px', padding: '8px', background: 'var(--bg-faint)', borderRadius: '4px' }}>
          Control who can view your health record. You can revoke access at any time.
        </div>
        <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>
          <input type="checkbox" checked={allowMaester} onChange={(e) => setAllowMaester(e.target.checked)} style={{ marginRight: '8px' }} />
          Allow Maesters to view my health record
        </label>
        <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>
          <input type="checkbox" checked={allowHouseLord} onChange={(e) => setAllowHouseLord(e.target.checked)} style={{ marginRight: '8px' }} />
          Allow my House Lord to view my health record
        </label>
        <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>
          <input type="checkbox" checked={allowAdmin} onChange={(e) => setAllowAdmin(e.target.checked)} style={{ marginRight: '8px' }} />
          Allow Admins to view my health record
        </label>
        <label className="form-label" style={{ display: 'block', marginBottom: '16px' }}>
          <input type="checkbox" checked={publicStanding} onChange={(e) => setPublicStanding(e.target.checked)} style={{ marginRight: '8px' }} />
          Show my health standing publicly (fit/recovering/bedridden)
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave({ allow_maester: allowMaester, allow_house_lord: allowHouseLord, allow_admin: allowAdmin, public_standing: publicStanding })}>Save</button>
        </div>
      </div>
    </div>
  )
}

function TreatmentModal({ onSave, onCancel, defaultPatient }) {
  const [patientKey, setPatientKey] = useState(defaultPatient || '')
  const [type, setType] = useState('')
  const [desc, setDesc] = useState('')
  const [performCheck, setPerformCheck] = useState(false)

  const treatmentTypes = ['Wound Treatment', 'Herbal Remedy', 'Surgery', 'Diagnosis', 'Medication', 'Rest Order', 'Other']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '460px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Record Treatment</h3>
        <div className="form-group">
          <label className="form-label">Patient Avatar Key</label>
          <input type="text" className="form-input" value={patientKey} onChange={(e) => setPatientKey(e.target.value)} placeholder="UUID" />
        </div>
        <div className="form-group">
          <label className="form-label">Treatment Type</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">-- Choose --</option>
            {treatmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description ({desc.length}/2000)</label>
          <textarea className="form-input" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000} />
        </div>
        <label className="form-label" style={{ display: 'block', marginBottom: '16px' }}>
          <input type="checkbox" checked={performCheck} onChange={(e) => setPerformCheck(e.target.checked)} style={{ marginRight: '8px' }} />
          Perform healing skill check (DC 15)
        </label>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(patientKey, type, desc, performCheck)} disabled={!patientKey || !type || !desc}>Record</button>
        </div>
      </div>
    </div>
  )
}

function QuarantineModal({ onSave, onCancel }) {
  const [avatarKey, setAvatarKey] = useState('')
  const [reason, setReason] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Order Quarantine</h3>
        <div className="form-group">
          <label className="form-label">Character Avatar Key</label>
          <input type="text" className="form-input" value={avatarKey} onChange={(e) => setAvatarKey(e.target.value)} placeholder="UUID" />
        </div>
        <div className="form-group">
          <label className="form-label">Reason</label>
          <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={256} placeholder="e.g. Greyscale infection, contagious disease containment" />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sm" style={{ background: '#702618', color: '#fff' }} onClick={() => onSave(avatarKey, reason)} disabled={!avatarKey || !reason}>Order Quarantine</button>
        </div>
      </div>
    </div>
  )
}
