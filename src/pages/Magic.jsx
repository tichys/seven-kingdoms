import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'abilities', label: 'My Abilities' },
  { id: 'warging', label: 'Warging' },
  { id: 'visions', label: 'Visions' },
  { id: 'rituals', label: "R'hllor Rituals" },
  { id: 'dragonglass', label: 'Dragonglass' },
  { id: 'valyrian', label: 'Valyrian Steel' },
]

const ABILITY_LABELS = {
  warging: 'Warging',
  greenseeing: 'Greenseeing',
  rhllor: "R'hllor Magic",
  dragonglass: 'Dragonglass Crafting',
  valyrian: 'Valyrian Steel',
  iron_will: 'Iron Will',
  poison_resist: 'Poison Resistance',
}

const WARGING_TARGETS = ['wolf', 'bird', 'cat', 'hound', 'other']

const VISION_LABELS = { past: 'Past', future: 'Future', distant: 'Distant', dream: 'Dream' }

const RITUAL_TYPES = ['resurrection', 'blessing', 'vision_curse', 'shadow_binding']

export default function Magic() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('abilities')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [abilities, setAbilities] = useState(null)
  const [wargingActive, setWargingActive] = useState(null)
  const [visions, setVisions] = useState(null)
  const [rituals, setRituals] = useState(null)
  const [dragonglassRecipes, setDragonglassRecipes] = useState(null)
  const [valyrianRecipes, setValyrianRecipes] = useState(null)
  const [wargTargetType, setWargTargetType] = useState(WARGING_TARGETS[0])
  const [wargTargetName, setWargTargetName] = useState('')
  const [wargDuration, setWargDuration] = useState(60)
  const [showStartRitual, setShowStartRitual] = useState(false)
  const [completeRitual, setCompleteRitual] = useState(null)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'abilities') { const r = await api.magicMyAbilities(); if (r.status === 'ok') setAbilities(r.abilities) }
      if (which === 'warging') { const r = await api.magicWargingActive(); if (r.status === 'ok') setWargingActive(r.session) }
      if (which === 'visions') { const r = await api.magicVisionList(); if (r.status === 'ok') setVisions(r.visions) }
      if (which === 'rituals') { const r = await api.magicRitualList(); if (r.status === 'ok') setRituals(r.rituals) }
      if (which === 'dragonglass') { const r = await api.magicDragonglassRecipes(); if (r.status === 'ok') setDragonglassRecipes(r.recipes) }
      if (which === 'valyrian') { const r = await api.magicValyrianRecipes(); if (r.status === 'ok') setValyrianRecipes(r.recipes) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  const renderPips = (level) => '★'.repeat(level) + '☆'.repeat(5 - level)
  const isOnCooldown = (a) => a.cooldown_until && new Date(a.cooldown_until) > new Date()

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Ancient Powers</h1>
        <p className="text-muted">Warging, greenseeing, R'hllor rituals, and the secrets of dragonglass and Valyrian steel</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {TABS.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'abilities' && (
          <div>
            {!abilities || abilities.length === 0 ? <EmptyState icon="&#9883;" title="No Abilities" message="You have not unlocked any abilities." /> : (
              <div className="grid grid-2">
                {abilities.map((a, i) => (
                  <div key={i} className="card">
                    <div className="card-header"><h3>{ABILITY_LABELS[a.ability_type] || a.ability_type}</h3></div>
                    <div className="card-body">
                      <p><strong>Level:</strong> <span className="text-gold">{renderPips(a.ability_level)}</span></p>
                      <p><strong>Unlocked:</strong> {a.is_unlocked ? 'Yes' : 'No'}</p>
                      {a.last_used_at && <p className="text-muted">Last used: {a.last_used_at?.slice(0, 16)}</p>}
                      {isOnCooldown(a) && <p className="text-muted">Cooldown until: {a.cooldown_until?.slice(0, 16)}</p>}
                      <div style={{ marginTop: '.5rem' }}>
                        <button className="btn btn-primary btn-sm" disabled={!a.is_unlocked || isOnCooldown(a)} onClick={async () => {
                          try { await api.magicAbilityUse(a.ability_type); load('abilities') } catch (e) { setError(e.message) }
                        }}>Use Ability</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'warging' && (
          <div>
            {wargingActive ? (
              <div className="card">
                <div className="card-header"><h3>Active Warging Session</h3></div>
                <div className="card-body">
                  <p><strong>Target Type:</strong> {wargingActive.target_type}</p>
                  <p><strong>Target Name:</strong> {wargingActive.target_name}</p>
                  <p><strong>Started:</strong> {wargingActive.started_at?.slice(0, 16)}</p>
                  <p><strong>Duration:</strong> {wargingActive.duration_secs}s</p>
                  <div style={{ marginTop: '.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={async () => {
                      try { await api.magicWargingEnd(); load('warging') } catch (e) { setError(e.message) }
                    }}>End Warging</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header"><h3>Begin Warging</h3></div>
                <div className="card-body">
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Target Type</label>
                      <select className="form-input" style={{ width: '100%' }} value={wargTargetType} onChange={e => setWargTargetType(e.target.value)}>
                        {WARGING_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Name</label>
                      <input className="form-input" style={{ width: '100%' }} value={wargTargetName} onChange={e => setWargTargetName(e.target.value)} placeholder="Name of target" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration (seconds)</label>
                      <input className="form-input" type="number" style={{ width: '100%' }} value={wargDuration} onChange={e => setWargDuration(Number(e.target.value))} />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    if (!wargTargetName) return
                    try { await api.magicWargingStart(wargTargetType, wargTargetName, wargDuration); load('warging') } catch (e) { setError(e.message) }
                  }}>Begin Warging</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'visions' && (
          <div>
            {!visions || visions.length === 0 ? <EmptyState icon="&#128302;" title="No Visions" message="You have not received any visions." /> : (
              <div className="grid grid-2">
                {visions.map(v => (
                  <div key={v.id} className="card">
                    <div className="card-header"><h3><span className="text-gold">{VISION_LABELS[v.vision_type] || v.vision_type}</span></h3></div>
                    <div className="card-body">
                      <p>{v.vision_content}</p>
                      {v.region && <p><strong>Region:</strong> {v.region}</p>}
                      <p className="text-muted">Seen: {v.seen_at?.slice(0, 16)}</p>
                      {v.is_interpreted ? (
                        <div style={{ marginTop: '.5rem' }}>
                          <p><strong>Interpretation:</strong></p>
                          <p>{v.interpretation}</p>
                        </div>
                      ) : (
                        <div style={{ marginTop: '.5rem' }}>
                          <textarea className="form-input" id={`interp-${v.id}`} rows={3} placeholder="Your interpretation..." style={{ width: '100%' }} />
                          <div style={{ marginTop: '.5rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={async () => {
                              const interp = document.getElementById(`interp-${v.id}`).value
                              if (interp) { try { await api.magicVisionInterpret(v.id, interp); load('visions') } catch (e) { setError(e.message) } }
                            }}>Submit Interpretation</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'rituals' && (
          <div>
            {adminLevel > 0 && <div style={{ marginBottom: '1rem' }}><button className="btn btn-primary btn-sm" onClick={() => setShowStartRitual(true)}>Start Ritual</button></div>}
            {!rituals || rituals.length === 0 ? <EmptyState icon="&#128293;" title="No Rituals" message="No R'hllor rituals have been performed." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Priest</th><th>Target</th><th>Type</th><th>Status</th><th>Performed</th>{adminLevel > 0 && <th></th>}</tr></thead>
                  <tbody>
                    {rituals.map(r => (
                      <tr key={r.id}>
                        <td>{r.priest_name}</td>
                        <td>{r.target_name}</td>
                        <td className="text-gold">{r.ritual_type}</td>
                        <td>{r.status}</td>
                        <td className="text-muted">{r.performed_at?.slice(0, 16)}</td>
                        {adminLevel > 0 && <td>{r.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => setCompleteRitual(r)}>Complete</button>}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'dragonglass' && (
          <div>
            {!dragonglassRecipes || dragonglassRecipes.length === 0 ? <EmptyState icon="&#128142;" title="No Recipes" message="No dragonglass crafting recipes are available." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Recipe</th><th>Result</th><th>Dragonglass</th><th>Min Level</th><th></th></tr></thead>
                  <tbody>
                    {dragonglassRecipes.map(r => (
                      <tr key={r.id}>
                        <td>{r.recipe_name}</td>
                        <td className="text-gold">{r.result_item_name}</td>
                        <td>{r.dragonglass_needed}</td>
                        <td>{r.min_level}</td>
                        <td><button className="btn btn-outline btn-sm" onClick={async () => { try { await api.magicDragonglassCraft(r.id); load('dragonglass') } catch (e) { setError(e.message) } }}>Craft</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'valyrian' && (
          <div>
            {!valyrianRecipes || valyrianRecipes.length === 0 ? <EmptyState icon="&#9876;" title="No Recipes" message="No Valyrian reforging recipes are available." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Recipe</th><th>Source</th><th>Result</th><th>Gold Cost</th><th>Success</th><th>Min Level</th><th></th></tr></thead>
                  <tbody>
                    {valyrianRecipes.map(r => (
                      <tr key={r.id}>
                        <td>{r.recipe_name}</td>
                        <td>{r.source_item_name}</td>
                        <td className="text-gold">{r.result_item_name}</td>
                        <td>{r.gold_cost}</td>
                        <td>{r.success_chance}%</td>
                        <td>{r.min_level}</td>
                        <td><button className="btn btn-outline btn-sm" onClick={async () => {
                          if (confirm(`Reforge for ${r.gold_cost} gold? Success chance: ${r.success_chance}%`)) {
                            try { await api.magicValyrianReforge(r.id); load('valyrian') } catch (e) { setError(e.message) }
                          }
                        }}>Reforge</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showStartRitual && <StartRitualModal onClose={() => setShowStartRitual(false)} onSubmit={async (data) => { try { await api.magicRitualStart(data); setShowStartRitual(false); load('rituals') } catch (e) { setError(e.message) } }} />}
      {completeRitual && <CompleteRitualModal ritual={completeRitual} onClose={() => setCompleteRitual(null)} onSubmit={async (id, result, notes) => { try { await api.magicRitualComplete(id, result, notes); setCompleteRitual(null); load('rituals') } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function StartRitualModal({ onClose, onSubmit }) {
  const [targetKey, setTargetKey] = useState('')
  const [targetName, setTargetName] = useState('')
  const [ritualType, setRitualType] = useState(RITUAL_TYPES[0])
  const [sacrificeItem, setSacrificeItem] = useState('')
  return (
    <Modal title="Start Ritual" onClose={onClose}>
      <div className="form-group"><label className="form-label">Target Key</label><input className="form-input" style={{ width: '100%' }} value={targetKey} onChange={e => setTargetKey(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Target Name</label><input className="form-input" style={{ width: '100%' }} value={targetName} onChange={e => setTargetName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Ritual Type</label><select className="form-input" style={{ width: '100%' }} value={ritualType} onChange={e => setRitualType(e.target.value)}>{RITUAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Sacrifice Item</label><input className="form-input" style={{ width: '100%' }} value={sacrificeItem} onChange={e => setSacrificeItem(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ target_key: targetKey, target_name: targetName, ritual_type: ritualType, sacrifice_item: sacrificeItem })}>Start</button>
    </Modal>
  )
}

function CompleteRitualModal({ ritual, onClose, onSubmit }) {
  const [result, setResult] = useState('success')
  const [notes, setNotes] = useState('')
  return (
    <Modal title="Complete Ritual" onClose={onClose}>
      <p className="text-muted">Ritual for {ritual?.target_name} ({ritual?.ritual_type})</p>
      <div className="form-group"><label className="form-label">Result</label><select className="form-input" style={{ width: '100%' }} value={result} onChange={e => setResult(e.target.value)}><option value="success">Success</option><option value="failed">Failed</option></select></div>
      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={3} style={{ width: '100%' }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit(ritual.id, result, notes)}>Complete</button>
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
