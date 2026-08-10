import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'encounters', label: 'Encounters' },
  { id: 'history', label: 'History' },
  { id: 'npcs', label: 'Wandering Souls' },
  { id: 'storylines', label: 'Storylines' },
  { id: 'admin_events', label: 'Event Templates', admin: true },
  { id: 'admin_npcs', label: 'NPC Registry', admin: true },
  { id: 'admin_story', label: 'Storyline Control', admin: true },
]

const CATEGORIES = ['encounter', 'ambush', 'discovery', 'rumor', 'quest_hook', 'environmental', 'social', 'mystery']
const TRIGGER_TYPES = ['random', 'timed', 'location', 'season', 'level', 'house']
const NPC_TYPES = ['wanderer', 'merchant', 'guard', 'beggar', 'child', 'soldier', 'servant', 'bard']
const REGIONS = ['North', 'Reach', 'Crownlands', 'Westerlands', 'Riverlands', 'Vale', 'Iron Islands', 'Dorne', 'Stormlands']

const RESULT_LABELS = { resolved: 'Resolved', escaped: 'Escaped', failed: 'Failed', ignored: 'Ignored' }
const STATUS_COLORS = { resolved: 'text-gold', escaped: 'text-muted', failed: 'text-danger', ignored: 'text-muted', active: 'text-gold' }

export default function StoryEvents() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('encounters')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeEvents, setActiveEvents] = useState(null)
  const [history, setHistory] = useState(null)
  const [encounter, setEncounter] = useState(null)
  const [npcMeet, setNpcMeet] = useState(null)
  const [storylines, setStorylines] = useState(null)
  const [eventTemplates, setEventTemplates] = useState(null)
  const [npcList, setNpcList] = useState(null)
  const [region, setRegion] = useState('')

  const visibleTabs = TABS.filter(t => !t.admin || adminLevel >= 2)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'encounters') { const r = await api.storyMyEvents(); if (r.status === 'ok') setActiveEvents(r.events) }
      if (which === 'history') { const r = await api.storyEventHistory(); if (r.status === 'ok') setHistory(r.history) }
      if (which === 'storylines') { const r = await api.storyStorylineList(); if (r.status === 'ok') setStorylines(r.storylines) }
      if (which === 'admin_events') { const r = await api.storyEventList(); if (r.status === 'ok') setEventTemplates(r.events) }
      if (which === 'admin_npcs') { const r = await api.storyNpcList(); if (r.status === 'ok') setNpcList(r.npcs) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  const handleScout = async () => {
    setError(null)
    try {
      const r = await api.storyCheckEvents(region || null, 0)
      if (r.status === 'ok' && r.event) {
        setEncounter(r.event)
        load('encounters')
      } else {
        setEncounter({ empty: true })
      }
    } catch (e) { setError(e.message) }
  }

  const handleResolve = async (instanceId, result, choiceText) => {
    setError(null)
    try {
      const r = await api.storyResolveEvent(instanceId, result, choiceText || '')
      if (r.status === 'ok') {
        setEncounter(null)
        load('encounters')
        if (r.rewards && (r.rewards.xp || r.rewards.gold || r.rewards.stars)) {
          alert(`Event ${RESULT_LABELS[result] || result}!\nRewards: ${r.rewards.xp} XP, ${r.rewards.gold} gold, ${r.rewards.stars} stars`)
        }
      }
    } catch (e) { setError(e.message) }
  }

  const handleNpcEncounter = async () => {
    setError(null)
    try {
      const r = await api.storyNpcEncounter(region || null)
      if (r.status === 'ok') {
        setNpcMeet(r.npc)
      }
    } catch (e) { setError(e.message) }
  }

  const handleActivateStoryline = async (id) => {
    try { await api.storyStorylineActivate(id); load('storylines') } catch (e) { setError(e.message) }
  }

  const handleAdvanceStoryline = async (id, chapter) => {
    try { await api.storyStorylineAdvance(id, chapter); load('storylines') } catch (e) { setError(e.message) }
  }

  const handleToggleEvent = async (id, current) => {
    try { await api.storyEventToggle(id, !current); load('admin_events') } catch (e) { setError(e.message) }
  }

  if (loading && !activeEvents && !history && !storylines) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error && !activeEvents) return <div className="page-content"><ErrorState message={error} onRetry={() => { setError(null); load(tab) }} /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Chronicles &amp; Encounters</h1>
        <p className="text-muted">Random events, wandering souls, and regional storylines across Westeros</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="tabs">
        <div className="tab-nav">
          {visibleTabs.map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => { setTab(t.id); setLoading(true); setEncounter(null); setNpcMeet(null) }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {/* ENCOUNTERS TAB */}
        {tab === 'encounters' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: '200px' }} value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">Any Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleScout}>Scout for Events</button>
            </div>

            {encounter && !encounter.empty && (
              <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                <div className="card-header"><h3>{encounter.title}</h3> <span className="badge">{encounter.category}</span></div>
                <div className="card-body">
                  <p style={{ marginBottom: '1rem' }}>{encounter.description}</p>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {encounter.choices && encounter.choices.map((c, i) => (
                      <button key={i} className="btn btn-outline btn-sm" onClick={() => {
                        const resultMap = { resolve: 'resolved', ignore: 'ignored', escape: 'escaped' }
                        handleResolve(encounter.instance_id, resultMap[c.result] || 'resolved', c.text)
                      }}>{c.text}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {encounter && encounter.empty && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body"><p className="text-muted">The road is quiet. Nothing stirs in the shadows.</p></div>
              </div>
            )}

            <h3>Active Events</h3>
            {!activeEvents || activeEvents.length === 0 ? (
              <EmptyState icon="&#127745;" title="No Active Events" message="Scout the area to discover what the world has in store." />
            ) : (
              <div className="grid grid-2">
                {activeEvents.map(ev => (
                  <div key={ev.id} className="card">
                    <div className="card-header">
                      <h3>{ev.title}</h3>
                      <span className={`badge ${STATUS_COLORS[ev.status] || ''}`}>{ev.status}</span>
                    </div>
                    <div className="card-body">
                      <p>{ev.description}</p>
                      <p className="text-muted">Category: {ev.event_category} | Triggered: {ev.triggered_at?.slice(0, 16)}</p>
                      <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleResolve(ev.id, 'resolved', 'Investigated')}>Investigate</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleResolve(ev.id, 'ignored', 'Ignored')}>Ignore</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleResolve(ev.id, 'escaped', 'Fled')}>Flee</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            {!history || history.length === 0 ? (
              <EmptyState icon="&#128218;" title="No History" message="Your past encounters will be recorded here." />
            ) : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Event</th><th>Category</th><th>Result</th><th>Triggered</th><th>Resolved</th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td>{h.id}</td>
                        <td>{h.title}</td>
                        <td>{h.event_category}</td>
                        <td><span className={STATUS_COLORS[h.status] || ''}>{RESULT_LABELS[h.status] || h.status}</span></td>
                        <td className="text-muted">{h.triggered_at?.slice(0, 16)}</td>
                        <td className="text-muted">{h.resolved_at?.slice(0, 16) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {/* WANDERING NPCs TAB */}
        {tab === 'npcs' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: '200px' }} value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">Any Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleNpcEncounter}>Look for Travelers</button>
            </div>

            {npcMeet && (
              <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                <div className="card-header">
                  <h3>{npcMeet.name}</h3>
                  <span className="badge">{npcMeet.type}</span>
                </div>
                <div className="card-body">
                  <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{npcMeet.greeting}</p>
                  {npcMeet.dialogue && npcMeet.dialogue.length > 0 && (
                    <div>
                      {npcMeet.dialogue.map((d, i) => (
                        <div key={i} style={{ marginBottom: '1rem' }}>
                          <p style={{ marginBottom: '.5rem' }}>{d.text}</p>
                          {d.choices && d.choices.map((c, j) => (
                            <div key={j} style={{ marginLeft: '1rem', padding: '.5rem', borderLeft: '2px solid var(--border)', marginBottom: '.25rem' }}>
                              <p className="text-muted" style={{ fontSize: '.85rem' }}>"{c.text}"</p>
                              <p>{c.response}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!npcMeet && (
              <EmptyState icon="&#129488;" title="No One About" message="Search the roads and villages for wandering travelers." />
            )}
          </div>
        )}

        {/* STORYLINES TAB */}
        {tab === 'storylines' && (
          <div>
            {!storylines || storylines.length === 0 ? (
              <EmptyState icon="&#128214;" title="No Storylines" message="No regional storylines have been recorded." />
            ) : (
              <div className="grid grid-2">
                {storylines.map(sl => (
                  <div key={sl.id} className="card">
                    <div className="card-header">
                      <h3>{sl.title}</h3>
                      <span className={`badge ${sl.status === 'active' ? 'text-gold' : sl.status === 'concluded' ? 'text-muted' : ''}`}>{sl.status}</span>
                    </div>
                    <div className="card-body">
                      <p>{sl.description}</p>
                      <p className="text-muted">Region: {sl.region} | Chapter {sl.chapter} of {sl.total_chapters}{sl.house_name ? ` | ${sl.house_name}` : ''}</p>
                      {sl.chapters && sl.chapters.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          {sl.chapters.map(ch => (
                            <div key={ch.id} style={{ padding: '.5rem', marginBottom: '.25rem', borderLeft: ch.is_active ? '3px solid var(--accent)' : '3px solid transparent', opacity: ch.completed_at ? .5 : 1 }}>
                              <p style={{ fontWeight: ch.is_active ? 'bold' : 'normal' }}>
                                Ch. {ch.chapter_number}: {ch.title}
                                {ch.is_active && <span className="badge text-gold" style={{ marginLeft: '.5rem' }}>Active</span>}
                                {ch.completed_at && <span className="text-muted" style={{ marginLeft: '.5rem' }}>Done</span>}
                              </p>
                              <p className="text-muted" style={{ fontSize: '.85rem' }}>{ch.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {adminLevel >= 2 && sl.status === 'upcoming' && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: '.5rem' }} onClick={() => handleActivateStoryline(sl.id)}>Activate</button>
                      )}
                      {adminLevel >= 1 && sl.status === 'active' && (
                        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                          {sl.chapter < sl.total_chapters && (
                            <button className="btn btn-outline btn-sm" onClick={() => handleAdvanceStoryline(sl.id, sl.chapter + 1)}>Advance to Ch. {sl.chapter + 1}</button>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => handleAdvanceStoryline(sl.id, 0)}>Conclude</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN: EVENT TEMPLATES */}
        {tab === 'admin_events' && eventTemplates && (
          <div>
            <CreateEventModal onCreated={() => load('admin_events')} />
            <div className="card" style={{ marginTop: '1rem' }}><div className="card-body">
              <table className="stats-table">
                <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Region</th><th>Trigger</th><th>Chance</th><th>Cooldown</th><th>Active</th><th></th></tr></thead>
                <tbody>
                  {eventTemplates.map(ev => (
                    <tr key={ev.id}>
                      <td>{ev.id}</td>
                      <td>{ev.title}</td>
                      <td>{ev.event_category}</td>
                      <td>{ev.region || 'Any'}</td>
                      <td>{ev.trigger_type}</td>
                      <td>{ev.trigger_chance}%</td>
                      <td>{ev.cooldown_hours}h</td>
                      <td><span className={ev.is_active == 1 ? 'text-gold' : 'text-muted'}>{ev.is_active == 1 ? 'Yes' : 'No'}</span></td>
                      <td><button className="btn btn-outline btn-sm" onClick={() => handleToggleEvent(ev.id, ev.is_active == 1)}>{ev.is_active == 1 ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          </div>
        )}

        {/* ADMIN: NPC REGISTRY */}
        {tab === 'admin_npcs' && npcList && (
          <div>
            <CreateNpcModal onCreated={() => load('admin_npcs')} />
            <div className="card" style={{ marginTop: '1rem' }}><div className="card-body">
              <table className="stats-table">
                <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Region</th><th>Spawn %</th><th>Active</th></tr></thead>
                <tbody>
                  {npcList.map(n => (
                    <tr key={n.id}>
                      <td>{n.id}</td>
                      <td>{n.npc_name}</td>
                      <td>{n.npc_type}</td>
                      <td>{n.region || 'Any'}</td>
                      <td>{n.spawn_chance}%</td>
                      <td><span className={n.is_active == 1 ? 'text-gold' : 'text-muted'}>{n.is_active == 1 ? 'Yes' : 'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          </div>
        )}

        {/* ADMIN: STORYLINE CONTROL */}
        {tab === 'admin_story' && (
          <CreateStorylineModal onCreated={() => load('storylines')} />
        )}
      </div>
    </div>
  )
}

function CreateEventModal({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_category: 'encounter', region: '', trigger_type: 'random', trigger_chance: 10, min_level: 1, cooldown_hours: 24, reward_xp: 0, reward_gold: 0, reward_stars: 0, outcome_text: '' })
  const [err, setErr] = useState(null)

  const submit = async () => {
    setErr(null)
    try {
      await api.storyEventCreate({ ...form, region: form.region || null })
      setOpen(false)
      setForm({ title: '', description: '', event_category: 'encounter', region: '', trigger_type: 'random', trigger_chance: 10, min_level: 1, cooldown_hours: 24, reward_xp: 0, reward_gold: 0, reward_stars: 0, outcome_text: '' })
      onCreated()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Create Event Template</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>Create Event Template</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
            <div className="card-body">
              {err && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{err}</div>}
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Category</label><select className="form-input" style={{ width: '100%' }} value={form.event_category} onChange={e => setForm({ ...form, event_category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Region</label><select className="form-input" style={{ width: '100%' }} value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}><option value="">Any</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Trigger Type</label><select className="form-input" style={{ width: '100%' }} value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>{TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Trigger Chance %</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.trigger_chance} onChange={e => setForm({ ...form, trigger_chance: Number(e.target.value) })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Min Level</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.min_level} onChange={e => setForm({ ...form, min_level: Number(e.target.value) })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Cooldown (hours)</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.cooldown_hours} onChange={e => setForm({ ...form, cooldown_hours: Number(e.target.value) })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Reward XP</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.reward_xp} onChange={e => setForm({ ...form, reward_xp: Number(e.target.value) })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Reward Gold</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.reward_gold} onChange={e => setForm({ ...form, reward_gold: Number(e.target.value) })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Reward Stars</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.reward_stars} onChange={e => setForm({ ...form, reward_stars: Number(e.target.value) })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Outcome Text</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={form.outcome_text} onChange={e => setForm({ ...form, outcome_text: e.target.value })} /></div>
              <button className="btn btn-primary" onClick={submit}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateNpcModal({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ npc_name: '', npc_type: 'wanderer', region: '', greeting: '', spawn_chance: 15 })
  const [err, setErr] = useState(null)

  const submit = async () => {
    setErr(null)
    try {
      await api.storyNpcCreate({ ...form, region: form.region || null, dialogue: [] })
      setOpen(false)
      setForm({ npc_name: '', npc_type: 'wanderer', region: '', greeting: '', spawn_chance: 15 })
      onCreated()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Create Ambient NPC</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>Create Ambient NPC</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
            <div className="card-body">
              {err && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{err}</div>}
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" style={{ width: '100%' }} value={form.npc_name} onChange={e => setForm({ ...form, npc_name: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Type</label><select className="form-input" style={{ width: '100%' }} value={form.npc_type} onChange={e => setForm({ ...form, npc_type: e.target.value })}>{NPC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Region</label><select className="form-input" style={{ width: '100%' }} value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}><option value="">Any</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Greeting</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={form.greeting} onChange={e => setForm({ ...form, greeting: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Spawn Chance %</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.spawn_chance} onChange={e => setForm({ ...form, spawn_chance: Number(e.target.value) })} /></div>
              <button className="btn btn-primary" onClick={submit}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateStorylineModal({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', region: '', total_chapters: 3, house_id: 0 })
  const [chapters, setChapters] = useState([{ chapter_number: 1, title: '', description: '' }])
  const [err, setErr] = useState(null)

  const updateChapter = (i, field, val) => {
    const next = [...chapters]
    next[i] = { ...next[i], [field]: val }
    setChapters(next)
  }

  const addChapter = () => {
    setChapters([...chapters, { chapter_number: chapters.length + 1, title: '', description: '' }])
    setForm({ ...form, total_chapters: chapters.length + 1 })
  }

  const submit = async () => {
    setErr(null)
    try {
      await api.storyStorylineCreate({ ...form, house_id: form.house_id || 0, chapters })
      setOpen(false)
      setForm({ title: '', description: '', region: '', total_chapters: 3, house_id: 0 })
      setChapters([{ chapter_number: 1, title: '', description: '' }])
      onCreated()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Create Storyline</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={() => setOpen(false)}>
          <div className="card" style={{ maxWidth: '650px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>Create Regional Storyline</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
            <div className="card-body">
              {err && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{err}</div>}
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Region</label><select className="form-input" style={{ width: '100%' }} value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}><option value="">Select...</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">House ID (optional)</label><input className="form-input" type="number" style={{ width: '100%' }} value={form.house_id} onChange={e => setForm({ ...form, house_id: Number(e.target.value) })} /></div>
              </div>
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <h4>Chapters</h4>
              {chapters.map((ch, i) => (
                <div key={i} style={{ marginBottom: '1rem', padding: '.5rem', borderLeft: '3px solid var(--accent)' }}>
                  <p className="text-muted" style={{ fontSize: '.85rem' }}>Chapter {ch.chapter_number}</p>
                  <div className="form-group"><input className="form-input" style={{ width: '100%' }} placeholder="Chapter title" value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} /></div>
                  <div className="form-group"><textarea className="form-input" style={{ width: '100%', minHeight: '50px' }} placeholder="Chapter description" value={ch.description} onChange={e => updateChapter(i, 'description', e.target.value)} /></div>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={addChapter}>Add Chapter</button>
              <div style={{ marginTop: '1rem' }}><button className="btn btn-primary" onClick={submit}>Create Storyline</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
