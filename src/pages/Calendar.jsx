import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'mine', label: 'My Events' },
  { id: 'past', label: 'Past Events' },
  { id: 'manage', label: 'Manage' },
]

const EVENT_TYPES = ['tournament', 'feast', 'hunt', 'court', 'war_council', 'religious', 'market', 'general']
const EVENT_LABELS = { tournament: 'Tournament', feast: 'Feast', hunt: 'Hunt', court: 'Court', war_council: 'War Council', religious: 'Religious', market: 'Market', general: 'General' }
const REGIONS = ['North', 'Reach', 'Crownlands', 'Westerlands', 'Riverlands', 'Vale', 'Iron Islands', 'Dorne', 'Stormlands']
const STATUS_COLORS = { scheduled: 'text-gold', active: 'text-gold', completed: 'text-muted', cancelled: 'text-muted', registered: 'text-gold', maybe: 'text-muted', attended: 'text-gold', absent: 'text-muted' }

function fmtDate(s) {
  if (!s) return 'TBD'
  return new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Calendar() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upcoming, setUpcoming] = useState(null)
  const [myEvents, setMyEvents] = useState(null)
  const [pastEvents, setPastEvents] = useState(null)
  const [allEvents, setAllEvents] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showRegs, setShowRegs] = useState(false)
  const [regsData, setRegsData] = useState(null)
  const [regsEventId, setRegsEventId] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailData, setDetailData] = useState(null)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'upcoming') {
        const [r, m] = await Promise.all([api.calendarEventList(false, null, null), api.calendarMyEvents()])
        if (r.status === 'ok') setUpcoming(r.events)
        if (m.status === 'ok') setMyEvents(m.events)
      }
      if (which === 'mine') { const r = await api.calendarMyEvents(); if (r.status === 'ok') setMyEvents(r.events) }
      if (which === 'past') { const r = await api.calendarEventList(true, null, null); if (r.status === 'ok') setPastEvents(r.events) }
      if (which === 'manage') { const r = await api.calendarEventList(true, null, null); if (r.status === 'ok') setAllEvents(r.events) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  const registeredIds = new Set((myEvents || []).map(e => e.id))
  const filteredUpcoming = (upcoming || []).filter(e => !filterType || e.event_type === filterType)
  const filteredManage = (allEvents || []).filter(e => !filterType || e.event_type === filterType)

  const doRegister = async (id) => { try { await api.calendarEventRegister(id); load('upcoming') } catch (e) { setError(e.message) } }
  const doUnregister = async (id, reloadTab) => { try { await api.calendarEventUnregister(id); load(reloadTab || 'upcoming') } catch (e) { setError(e.message) } }

  const openDetail = async (id) => {
    setDetailData(null)
    setShowDetail(true)
    try { const r = await api.calendarEventDetail(id); if (r.status === 'ok') setDetailData(r) } catch (e) { setError(e.message) }
  }

  const openRegs = async (id) => {
    setRegsEventId(id)
    setRegsData(null)
    setShowRegs(true)
    try { const r = await api.calendarEventRegistrations(id); if (r.status === 'ok') setRegsData(r.registrations) } catch (e) { setError(e.message) }
  }

  const doAttend = async (key) => { try { await api.calendarEventAttend(regsEventId, key); openRegs(regsEventId) } catch (e) { setError(e.message) } }

  const doCancel = async (ev) => { if (confirm(`Cancel "${ev.title}"?`)) { try { await api.calendarEventCancel(ev.id); load('manage') } catch (e) { setError(e.message) } } }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Event Calendar</h1>
        <p className="text-muted">Tournaments, feasts, hunts, and gatherings across the Seven Kingdoms</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {TABS.map(t => (t.id === 'manage' && !adminLevel) ? null : (
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'upcoming' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <select className="form-input" style={{ width: '200px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
              </select>
            </div>
            {filteredUpcoming.length === 0 ? <EmptyState icon="&#128197;" title="No Upcoming Events" message="No events are currently scheduled." /> : (
              <div className="grid grid-2">
                {filteredUpcoming.map(e => (
                  <div key={e.id} className="card">
                    <div className="card-header"><h3><a onClick={() => openDetail(e.id)} style={{ cursor: 'pointer' }}>{e.title}</a></h3></div>
                    <div className="card-body">
                      <p><span className="text-gold">{EVENT_LABELS[e.event_type] || e.event_type}</span>{e.is_public == 0 && <span className="text-muted"> - Private</span>}</p>
                      {e.description && <p className="text-muted">{e.description.length > 120 ? e.description.slice(0, 120) + '...' : e.description}</p>}
                      <p><strong>Region:</strong> {e.region}</p>
                      <p><strong>Host:</strong> {e.host_name}{e.house_name ? ` (${e.house_name})` : ''}</p>
                      <p className="text-muted">{fmtDate(e.scheduled_at)}</p>
                      <p><strong>Duration:</strong> {e.duration_minutes} min | <strong>Max:</strong> {e.max_participants || 'Unlimited'}</p>
                      <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                        {registeredIds.has(e.id)
                          ? <button className="btn btn-outline btn-sm" onClick={() => doUnregister(e.id, 'upcoming')}>Unregister</button>
                          : <button className="btn btn-primary btn-sm" onClick={() => doRegister(e.id)}>Register</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'mine' && (
          <div>
            {!myEvents || myEvents.length === 0 ? <EmptyState icon="&#128203;" title="No Registrations" message="You are not registered for any events." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Event</th><th>Type</th><th>Scheduled</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {myEvents.map(e => (
                      <tr key={e.id}>
                        <td><a onClick={() => openDetail(e.id)} style={{ cursor: 'pointer' }}>{e.title}</a></td>
                        <td><span className="text-gold">{EVENT_LABELS[e.event_type] || e.event_type}</span></td>
                        <td className="text-muted">{fmtDate(e.scheduled_at)}</td>
                        <td><span className={STATUS_COLORS[e.status] || 'text-muted'}>{e.status}</span></td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => doUnregister(e.id, 'mine')}>Unregister</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}

        {tab === 'past' && (
          <div>
            {!pastEvents || pastEvents.length === 0 ? <EmptyState icon="&#128197;" title="No Past Events" message="No past events to display." /> : (
              <div className="grid grid-2">
                {pastEvents.map(e => (
                  <div key={e.id} className="card">
                    <div className="card-header"><h3><a onClick={() => openDetail(e.id)} style={{ cursor: 'pointer' }}>{e.title}</a></h3></div>
                    <div className="card-body">
                      <p><span className={STATUS_COLORS[e.status] || 'text-muted'}>{EVENT_LABELS[e.event_type] || e.event_type} - {e.status}</span></p>
                      {e.description && <p className="text-muted">{e.description.length > 120 ? e.description.slice(0, 120) + '...' : e.description}</p>}
                      <p><strong>Region:</strong> {e.region}</p>
                      <p><strong>Host:</strong> {e.host_name}</p>
                      <p className="text-muted">{fmtDate(e.scheduled_at)}</p>
                      <p><strong>Duration:</strong> {e.duration_minutes} min | <strong>Max:</strong> {e.max_participants || 'Unlimited'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'manage' && adminLevel && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Create Event</button>
              <select className="form-input" style={{ width: '200px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
              </select>
            </div>
            {filteredManage.length === 0 ? <EmptyState icon="&#128197;" title="No Events" message="No events have been created yet." /> : (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>#</th><th>Title</th><th>Type</th><th>Region</th><th>Host</th><th>Scheduled</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {filteredManage.map(e => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td><a onClick={() => openDetail(e.id)} style={{ cursor: 'pointer' }}>{e.title}</a></td>
                        <td><span className="text-gold">{EVENT_LABELS[e.event_type] || e.event_type}</span></td>
                        <td>{e.region}</td>
                        <td className="text-muted">{e.host_name}</td>
                        <td className="text-muted">{fmtDate(e.scheduled_at)}</td>
                        <td><span className={STATUS_COLORS[e.status] || 'text-muted'}>{e.status}</span></td>
                        <td style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openRegs(e.id)}>Registrations</button>
                          {e.status !== 'cancelled' && e.status !== 'completed' && <button className="btn btn-outline btn-sm" onClick={() => doCancel(e)}>Cancel</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onSubmit={async (data) => { try { await api.calendarEventCreate(data); setShowCreate(false); load('manage') } catch (e) { setError(e.message) } }} />}
      {showRegs && <RegistrationsModal regs={regsData} onClose={() => setShowRegs(false)} onAttend={doAttend} />}
      {showDetail && <EventDetailModal data={detailData} registered={detailData ? registeredIds.has(detailData.event?.id) : false} onClose={() => setShowDetail(false)} onRegister={doRegister} onUnregister={(id) => doUnregister(id, 'upcoming')} />}
    </div>
  )
}

function CreateEventModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('general')
  const [region, setRegion] = useState('Crownlands')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [maxParticipants, setMaxParticipants] = useState(0)
  const [isPublic, setIsPublic] = useState(true)
  return (
    <Modal title="Create Event" onClose={onClose}>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Event Type</label><select className="form-input" style={{ width: '100%' }} value={eventType} onChange={e => setEventType(e.target.value)}>{EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Region</label><select className="form-input" style={{ width: '100%' }} value={region} onChange={e => setRegion(e.target.value)}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
      <div className="form-group"><label className="form-label">Scheduled At</label><input className="form-input" type="datetime-local" style={{ width: '100%' }} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Duration (minutes)</label><input className="form-input" type="number" style={{ width: '100%' }} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Max Participants (0 = unlimited)</label><input className="form-input" type="number" style={{ width: '100%' }} value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label"><input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> Public Event</label></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ title, description, event_type: eventType, region, scheduled_at: scheduledAt, duration_minutes: durationMinutes, max_participants: maxParticipants, is_public: isPublic ? 1 : 0 })}>Create</button>
    </Modal>
  )
}

function RegistrationsModal({ regs, onClose, onAttend }) {
  return (
    <Modal title="Registrations" onClose={onClose}>
      {!regs || regs.length === 0 ? <p className="text-muted">No registrations yet.</p> : (
        <table className="stats-table">
          <thead><tr><th>Avatar</th><th>Status</th><th>Registered</th><th></th></tr></thead>
          <tbody>
            {regs.map((r, i) => (
              <tr key={i}>
                <td>{r.avatar_name}</td>
                <td><span className={STATUS_COLORS[r.status] || 'text-muted'}>{r.status}</span></td>
                <td className="text-muted">{r.registered_at?.slice(0, 16)}</td>
                <td>{r.status !== 'attended' && <button className="btn btn-outline btn-sm" onClick={() => onAttend(r.avatar_key)}>Attend</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

function EventDetailModal({ data, registered, onClose, onRegister, onUnregister }) {
  if (!data) return (
    <Modal title="Event Details" onClose={onClose}>
      <p className="text-muted">Loading...</p>
    </Modal>
  )
  const e = data.event
  const regs = data.registrations || []
  const isPast = e.status === 'completed' || e.status === 'cancelled'
  return (
    <Modal title={e.title} onClose={onClose}>
      <p><span className="text-gold">{EVENT_LABELS[e.event_type] || e.event_type}</span> <span className={STATUS_COLORS[e.status] || 'text-muted'}>{e.status}</span>{e.is_public == 0 && <span className="text-muted"> - Private</span>}</p>
      {e.description && <p>{e.description}</p>}
      <p><strong>Region:</strong> {e.region}</p>
      <p><strong>Host:</strong> {e.host_name}{e.house_name ? ` (${e.house_name})` : ''}</p>
      <p className="text-muted">{fmtDate(e.scheduled_at)}</p>
      <p><strong>Duration:</strong> {e.duration_minutes} min | <strong>Max:</strong> {e.max_participants || 'Unlimited'}</p>
      {!isPast && (
        <div style={{ marginTop: '.5rem' }}>
          {registered
            ? <button className="btn btn-outline btn-sm" onClick={() => onUnregister(e.id)}>Unregister</button>
            : <button className="btn btn-primary btn-sm" onClick={() => onRegister(e.id)}>Register</button>}
        </div>
      )}
      <h4 style={{ marginTop: '1rem' }}>Registrations ({regs.length})</h4>
      {regs.length === 0 ? <p className="text-muted">No registrations yet.</p> : (
        <table className="stats-table">
          <thead><tr><th>Avatar</th><th>Status</th><th>Registered</th></tr></thead>
          <tbody>
            {regs.map((r, i) => (
              <tr key={i}><td>{r.avatar_name}</td><td><span className={STATUS_COLORS[r.status] || 'text-muted'}>{r.status}</span></td><td className="text-muted">{r.registered_at?.slice(0, 16)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{title}</h3><button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}
