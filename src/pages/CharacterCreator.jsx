import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const STAT_INFO = [
  { key: 'might', label: 'Might', desc: 'Physical strength, melee damage', color: '#c44' },
  { key: 'agility', label: 'Agility', desc: 'Speed, dodging, ranged accuracy', color: '#4a9' },
  { key: 'endurance', label: 'Endurance', desc: 'Stamina, wound recovery, HP', color: '#fc8' },
  { key: 'wits', label: 'Wits', desc: 'Intelligence, initiative, crafting', color: '#8ac' },
  { key: 'will', label: 'Will', desc: 'Mental resilience, magic power', color: '#a4a' },
  { key: 'presence', label: 'Presence', desc: 'Social influence, leadership', color: '#dc8' }
]

const RANKS = ['Smallfolk', 'Man-at-Arms', 'Knight', 'Guest']
const REGIONS = ['', 'North', 'Westerlands', 'Reach', 'Stormlands', 'Vale', 'Riverlands', 'Iron Islands', 'Dorne', 'Crownlands']

export default function CharacterCreator() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [options, setOptions] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    character_name: '',
    gender: '',
    age: 18,
    appearance: '',
    background: '',
    personality: '',
    house_id: null,
    house_rank: 'Smallfolk',
    archetype_id: null,
    religion_id: null,
    might: 3, agility: 3, endurance: 3, wits: 3, will: 3, presence: 3
  })

  const [houseSearch, setHouseSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [houseRegion, setHouseRegion] = useState('')

  const totalSteps = 7
  const stepLabels = ['Identity', 'House', 'Archetype', 'Attributes', 'Faith', 'Background', 'Review']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [opt, st] = await Promise.all([
        api.creatorOptions().catch(e => ({ error: e.message })),
        api.creatorStatus().catch(e => ({ error: e.message }))
      ])
      if (opt.error) { setError(opt.error); setLoading(false); return }
      setOptions(opt)
      if (st.error) { setError(st.error); setLoading(false); return }
      setStatus(st)

      if (st.character_approved === 1 && st.has_archetype) {
        navigate('/character', { replace: true })
        return
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])

  const statPointsSpent = (form.might - 3) + (form.agility - 3) + (form.endurance - 3) +
                          (form.wits - 3) + (form.will - 3) + (form.presence - 3)
  const statPointsRemaining = 12 - statPointsSpent

  const selectedArchetype = options?.archetypes?.find(a => a.id === form.archetype_id)
  const selectedHouse = options?.houses?.find(h => h.id === form.house_id)
  const selectedReligion = options?.religions?.find(r => r.id === form.religion_id)

  const filteredHouses = (options?.houses || []).filter(h => {
    if (houseSearch && !h.name.toLowerCase().includes(houseSearch.toLowerCase())) return false
    if (houseRegion && h.region !== houseRegion) return false
    return true
  })

  const canProceed = () => {
    switch (step) {
      case 0: return form.character_name.trim().length >= 2 && form.gender && form.age >= 14 && form.age <= 90
      case 1: return true
      case 2: return form.archetype_id !== null
      case 3: return statPointsSpent === 12
      case 4: return true
      case 5: return form.background.trim().length >= 50
      case 6: return true
      default: return false
    }
  }

  const handleStatChange = (stat, delta) => {
    setForm(prev => {
      const newVal = prev[stat] + delta
      if (newVal < 3 || newVal > 7) return prev
      const newSpent = statPointsSpent + delta
      if (newSpent > 12) return prev
      return { ...prev, [stat]: newVal }
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const hasPending = status?.applications?.some(a => a.status === 'pending')
      const fn = hasPending ? api.creatorResubmit : api.creatorSubmit
      const r = await fn(form)
      setResult({ success: true, message: r.message })
      await load()
    } catch (err) {
      setResult({ success: false, message: err.message })
    }
    setSubmitting(false)
  }

  if (loading) return <div className="page-content"><Loading /></div>
  if (error) return <div className="page-content"><div className="alert alert-danger">{error}</div></div>

  const pendingApp = status?.applications?.find(a => a.status === 'pending')
  const deniedApps = status?.applications?.filter(a => a.status === 'denied') || []

  if (pendingApp && !submitting && !editing) {
    return (
      <div className="page-content">
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <div className="card-header" style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--gold)' }}>
            Application Pending Review
          </div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              Your character <strong style={{ color: 'var(--gold)' }}>{pendingApp.character_name}</strong> is awaiting admin approval.
            </p>
            <div style={{ textAlign: 'left', background: 'var(--bg-card)', padding: '1rem', borderRadius: '4px', margin: '1rem 0', fontSize: '.85rem' }}>
              <p><strong>Archetype:</strong> {pendingApp.archetype_name}</p>
              <p><strong>House:</strong> {pendingApp.house_name || 'None'}</p>
              <p><strong>Age:</strong> {pendingApp.age}</p>
              <p><strong>Gender:</strong> {pendingApp.gender}</p>
              <p><strong>Stats:</strong> M{pendingApp.might} A{pendingApp.agility} E{pendingApp.endurance} W{pendingApp.wits} I{pendingApp.will} P{pendingApp.presence}</p>
              {pendingApp.religion_name && <p><strong>Religion:</strong> {pendingApp.religion_name}</p>}
            </div>
            <p className="text-muted" style={{ fontSize: '.85rem' }}>
              Submitted: {new Date(pendingApp.submitted_at).toLocaleString()}
            </p>
            <p style={{ marginTop: '1rem' }}>
      <button className="btn btn-primary" onClick={() => {
        setStep(0); setResult(null); setEditing(true)
        if (pendingApp) {
          setForm({
            character_name: pendingApp.character_name || '',
            gender: pendingApp.gender || '',
            age: pendingApp.age || 18,
            appearance: pendingApp.appearance || '',
            background: pendingApp.background || '',
            personality: pendingApp.personality || '',
            house_id: pendingApp.house_id || null,
            house_rank: pendingApp.house_rank || 'Smallfolk',
            archetype_id: pendingApp.archetype_id || null,
            religion_id: pendingApp.religion_id || null,
            might: pendingApp.might || 3, agility: pendingApp.agility || 3, endurance: pendingApp.endurance || 3,
            wits: pendingApp.wits || 3, will: pendingApp.will || 3, presence: pendingApp.presence || 3
          })
        }
      }}>
                Edit & Resubmit
              </button>
            </p>
          </div>
        </div>

        {deniedApps.length > 0 && (
          <div className="card" style={{ maxWidth: '600px', margin: '1rem auto' }}>
            <div className="card-header" style={{ color: 'var(--danger)' }}>Previous Denials</div>
            <div className="card-body">
              {deniedApps.map(d => (
                <div key={d.id} className="alert alert-danger" style={{ marginBottom: '.5rem' }}>
                  <strong>{d.character_name}</strong> - {new Date(d.submitted_at).toLocaleDateString()}
                  <br />Reason: {d.review_note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Character Creation</h1>
        <p>Create your character for the Seven Kingdoms. All submissions require admin approval.</p>
      </div>

      <div className="page-content">
        {result && !result.success && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{result.message}</div>
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '14px', left: '5%', right: '5%', height: '2px', background: 'var(--border)' }} />
          {stepLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto .5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.75rem', fontWeight: 'bold',
                background: i === step ? 'var(--gold)' : i < step ? 'var(--green)' : 'var(--bg-card)',
                color: i === step || i < step ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: '2px solid ' + (i === step ? 'var(--gold)' : i < step ? 'var(--green)' : 'var(--border)')
              }}>
                {i < step ? '\u2713' : i + 1}
              </div>
              <div style={{ fontSize: '.7rem', color: i === step ? 'var(--gold)' : 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card" style={{ minHeight: '400px' }}>
          <div className="card-body">
            {step === 0 && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--gold)' }}>Character Identity</h3>
                <div className="form-group">
                  <label className="form-label">Character Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text" className="form-input" maxLength="64"
                    placeholder="e.g. Eddard Stark"
                    value={form.character_name}
                    onChange={e => setForm({ ...form, character_name: e.target.value })}
                  />
                  <small className="text-muted">Your in-character name (not your SL name)</small>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select className="form-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age ({form.age}) <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="range" min="14" max="90"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: parseInt(e.target.value) })}
                      style={{ width: '100%', marginTop: '.5rem' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text-muted)' }}>
                      <span>14</span><span>90</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Appearance</label>
                  <textarea
                    className="form-input" rows="4" maxLength="2000"
                    placeholder="Describe your character's physical appearance: height, build, hair, eyes, distinctive features, clothing style..."
                    value={form.appearance}
                    onChange={e => setForm({ ...form, appearance: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                  <small className="text-muted">{form.appearance.length}/2000 characters (optional)</small>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>House Allegiance</h3>
                <p className="text-muted" style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>
                  Join a noble house to unlock house-required archetypes, earn territory income, and participate in house politics. You can also skip this and join later.
                </p>

                {form.house_id ? (
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    <strong>Selected:</strong> {selectedHouse?.name} ({selectedHouse?.region})
                    <button className="btn btn-sm" style={{ marginLeft: '1rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                      onClick={() => setForm({ ...form, house_id: null })}>
                      Remove
                    </button>
                    <div style={{ marginTop: '.75rem' }}>
                      <label style={{ fontSize: '.85rem', marginRight: '.5rem' }}>Join as:</label>
                      <select className="form-input" style={{ width: 'auto', display: 'inline-block' }}
                        value={form.house_rank} onChange={e => setForm({ ...form, house_rank: e.target.value })}>
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="filter-bar" style={{ marginBottom: '1rem' }}>
                      <input type="text" className="filter-input" placeholder="Search houses..."
                        value={houseSearch} onChange={e => setHouseSearch(e.target.value)} />
                      <select className="filter-select" value={houseRegion} onChange={e => setHouseRegion(e.target.value)}>
                        {REGIONS.map(r => <option key={r} value={r}>{r || 'All Regions'}</option>)}
                      </select>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {filteredHouses.slice(0, 50).map(h => (
                        <div key={h.id} onClick={() => setForm({ ...form, house_id: h.id })}
                          style={{
                            cursor: 'pointer', padding: '.75rem', marginBottom: '.5rem',
                            background: form.house_id === h.id ? 'rgba(218,165,32,0.1)' : 'transparent',
                            border: `1px solid ${form.house_id === h.id ? 'rgba(218,165,32,0.3)' : 'var(--border)'}`,
                            borderRadius: '4px'
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <strong>{h.name}</strong>
                              {h.words && <span style={{ fontSize: '.8rem', fontStyle: 'italic', color: 'var(--text-muted)', marginLeft: '.5rem' }}>"{h.words}"</span>}
                            </div>
                            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              {h.region} | {h.type} | {h.members} members
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredHouses.length === 0 && <p className="text-muted">No houses found</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Choose Your Archetype</h3>
                <p className="text-muted" style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>
                  Your archetype defines your role and starting skills. This is a permanent choice. Admin-locked archetypes are excluded.
                </p>
                <div className="grid grid-2">
                  {(options?.archetypes || []).filter(a => a.admin_locked !== 1).map(a => {
                    const locked = a.house_required === 1 && !form.house_id
                    return (
                      <div key={a.id} className="card" style={{
                        cursor: 'pointer',
                        border: form.archetype_id === a.id ? '2px solid var(--gold)' : '1px solid var(--border)',
                        opacity: locked ? 0.5 : 1
                      }} onClick={() => !locked && setForm({ ...form, archetype_id: a.id })}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
                          <span>{a.name}</span>
                          {form.archetype_id === a.id && <span style={{ color: 'var(--gold)' }}>&#9733;</span>}
                        </div>
                        <div className="card-body" style={{ fontSize: '.8rem' }}>
                          <div style={{ marginBottom: '.3rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Primary:</span> <span style={{ textTransform: 'capitalize' }}>{a.primary_stat}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '.5rem' }}>Secondary:</span> <span style={{ textTransform: 'capitalize' }}>{a.secondary_stat}</span>
                            {a.hp_bonus > 0 && <span style={{ color: 'var(--green)', marginLeft: '.5rem' }}>+{a.hp_bonus} HP</span>}
                          </div>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '.3rem' }}>{a.description}</p>
                          {a.starting_skills?.length > 0 && (
                            <div style={{ fontSize: '.75rem', color: 'var(--gold)' }}>
                              Skills: {a.starting_skills.map(s => `${s.name} L${s.level}`).join(', ')}
                            </div>
                          )}
                          {locked && <div style={{ color: 'var(--danger)', fontSize: '.75rem' }}>Requires house membership</div>}
                          {a.faction && <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Faction: {a.faction}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Attribute Allocation</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '.9rem' }}>
                  <span>Each stat starts at <strong>3</strong>, max is <strong>7</strong></span>
                  <span style={{ color: statPointsRemaining > 0 ? 'var(--gold)' : 'var(--green)' }}>
                    Points remaining: <strong>{statPointsRemaining}</strong>/12
                  </span>
                </div>
                <div className="grid grid-2">
                  {STAT_INFO.map(s => (
                    <div key={s.key} className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{s.label}</span>
                        <strong style={{ color: s.color, fontSize: '1.3rem' }}>{form[s.key]}</strong>
                      </div>
                      <div className="card-body">
                        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>{s.desc}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div style={{ flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(form[s.key] / 7) * 100}%`, background: s.color, transition: 'width .3s' }} />
                          </div>
                          <button className="btn btn-sm" style={{ background: 'var(--border)', border: 'none', padding: '.15rem .4rem', cursor: form[s.key] > 3 ? 'pointer' : 'not-allowed', opacity: form[s.key] > 3 ? 1 : 0.3 }}
                            onClick={() => handleStatChange(s.key, -1)}>-</button>
                          <button className="btn btn-sm" style={{ background: statPointsRemaining > 0 && form[s.key] < 7 ? 'var(--gold)' : 'var(--border)', color: statPointsRemaining > 0 && form[s.key] < 7 ? 'var(--bg-dark)' : 'var(--text-muted)', border: 'none', padding: '.15rem .4rem', cursor: statPointsRemaining > 0 && form[s.key] < 7 ? 'pointer' : 'not-allowed', opacity: statPointsRemaining > 0 && form[s.key] < 7 ? 1 : 0.3 }}
                            onClick={() => handleStatChange(s.key, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', padding: '.75rem', background: 'var(--bg-card)', borderRadius: '4px', fontSize: '.85rem' }}>
                  <strong>HP Preview:</strong> {15 + (form.endurance * 4) + form.might + (selectedArchetype?.hp_bonus || 0)}
                  <span className="text-muted"> (15 + End x4 + Might{selectedArchetype ? ` + ${selectedArchetype.hp_bonus} archetype` : ''})</span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Faith & Religion</h3>
                <p className="text-muted" style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>
                  Choose your character's faith. This affects prayer abilities and devotion progression. You can skip and choose later.
                </p>
                <div className="grid grid-2">
                  <div className="card" style={{
                    cursor: 'pointer',
                    border: form.religion_id === null ? '2px solid var(--gold)' : '1px solid var(--border)'
                  }} onClick={() => setForm({ ...form, religion_id: null })}>
                    <div className="card-header">No Religion</div>
                    <div className="card-body" style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      Skip religion selection. You can choose a faith later.
                    </div>
                  </div>
                  {(options?.religions || []).map(r => (
                    <div key={r.id} className="card" style={{
                      cursor: 'pointer',
                      border: form.religion_id === r.id ? '2px solid var(--gold)' : '1px solid var(--border)'
                    }} onClick={() => setForm({ ...form, religion_id: r.id })}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{r.name}</span>
                        {form.religion_id === r.id && <span style={{ color: 'var(--gold)' }}>&#9733;</span>}
                      </div>
                      <div className="card-body" style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        {r.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--gold)' }}>Background & Personality</h3>
                <div className="form-group">
                  <label className="form-label">Backstory <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea
                    className="form-input" rows="8" maxLength="5000"
                    placeholder="Tell the story of your character. Where did they come from? What drives them? Key events in their life? Their goals and motivations? (minimum 50 characters)"
                    value={form.background}
                    onChange={e => setForm({ ...form, background: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                  <small className="text-muted">{form.background.length}/5000 characters (min 50)</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Personality Traits</label>
                  <textarea
                    className="form-input" rows="4" maxLength="2000"
                    placeholder="Describe your character's personality: temperament, quirks, fears, ambitions, moral compass, social tendencies..."
                    value={form.personality}
                    onChange={e => setForm({ ...form, personality: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                  <small className="text-muted">{form.personality.length}/2000 characters (optional)</small>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--gold)' }}>Review & Submit</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Name</h4>
                    <p style={{ marginBottom: '.75rem' }}>{form.character_name || '---'}</p>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Gender / Age</h4>
                    <p style={{ marginBottom: '.75rem' }}>{form.gender || '---'} / {form.age}</p>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>House</h4>
                    <p style={{ marginBottom: '.75rem' }}>{selectedHouse ? `${selectedHouse.name} (${form.house_rank})` : 'None'}</p>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Archetype</h4>
                    <p style={{ marginBottom: '.75rem' }}>{selectedArchetype?.name || '---'}</p>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Religion</h4>
                    <p>{selectedReligion?.name || 'None'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Attributes ({statPointsSpent}/12 spent)</h4>
                    {STAT_INFO.map(s => (
                      <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem', fontSize: '.85rem' }}>
                        <span>{s.label}</span>
                        <span style={{ color: s.color, fontWeight: 'bold' }}>{form[s.key]}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                        <span>HP</span>
                        <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>{15 + (form.endurance * 4) + form.might + (selectedArchetype?.hp_bonus || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {form.appearance && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Appearance</h4>
                    <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap' }}>{form.appearance}</p>
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Background</h4>
                  <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap' }}>{form.background}</p>
                </div>
                {form.personality && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Personality</h4>
                    <p style={{ fontSize: '.85rem', whiteSpace: 'pre-wrap' }}>{form.personality}</p>
                  </div>
                )}

                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  By submitting, you confirm this is your character concept. An admin will review it before it becomes active. You will not be able to play until approved.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Previous
          </button>
          {step < totalSteps - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
