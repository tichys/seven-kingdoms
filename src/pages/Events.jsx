import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonCard } from '../components/Skeleton.jsx'

const EVENT_TYPES = ['tournament', 'feast', 'war', 'council', 'seasonal', 'pve', 'custom']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const TYPE_COLORS = {
  tournament: '#8C6420',
  feast: '#2A3D1F',
  war: '#702618',
  council: '#3a5a8a',
  seasonal: '#4a6a4a',
  pve: '#8B4513',
  custom: '#555',
}

const TYPE_LABELS = {
  tournament: 'Tournament',
  feast: 'Feast',
  war: 'War',
  council: 'Council',
  seasonal: 'Seasonal',
  pve: 'PvE',
  custom: 'Event',
}

export default function Events() {
  const { adminLevel } = useAuth()
  const [events, setEvents] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [filterType, setFilterType] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '', description: '', event_type: 'custom', region: '', location: '',
    start_time: '', end_time: '', organizer_name: '',
  })

  const loadEvents = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const month = viewDate.getMonth() + 1
      const year = viewDate.getFullYear()
      const data = await api.eventList(month, year, filterType)
      setEvents(data.events || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [viewDate, filterType])

  useEffect(() => { loadEvents() }, [loadEvents])

  const handleCreate = async () => {
    if (!createForm.title || !createForm.start_time || !createForm.end_time) {
      setError('Title, start time, and end time are required')
      return
    }
    try {
      await api.eventCreate(createForm)
      setShowCreate(false)
      setCreateForm({ title: '', description: '', event_type: 'custom', region: '', location: '', start_time: '', end_time: '', organizer_name: '' })
      loadEvents()
    } catch (err) { setError(err.message) }
  }

  // Calendar grid
  const renderMonthGrid = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ minHeight: '80px', border: '1px solid var(--border)' }} />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = (events || []).filter(e => e.start_time?.startsWith(dateStr))
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

      cells.push(
        <div
          key={day}
          style={{
            minHeight: '80px',
            border: `1px solid ${isToday ? 'var(--gold)' : 'var(--border)'}`,
            padding: '4px',
            background: isToday ? 'rgba(176,141,87,0.05)' : 'transparent',
            overflow: 'hidden',
          }}
        >
          <div style={{
            fontSize: '.75rem', fontFamily: 'var(--font-mono)', color: isToday ? 'var(--gold)' : 'var(--text-muted)',
            marginBottom: '2px', fontWeight: isToday ? 700 : 400,
          }}>{day}</div>
          {dayEvents.map(ev => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              style={{
                fontSize: '.7rem', padding: '2px 4px', marginBottom: '2px',
                borderLeft: `3px solid ${TYPE_COLORS[ev.event_type] || '#555'}`,
                background: 'rgba(176,141,87,0.06)', borderRadius: '2px',
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: 'var(--text)',
              }}
              title={ev.title}
            >
              {ev.title}
            </div>
          ))}
        </div>
      )
    }

    return (
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0',
        border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden',
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{
            padding: '8px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)',
            background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          }}>{d}</div>
        ))}
        {cells}
      </div>
    )
  }

  const renderListView = () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      {(events || []).length === 0 ? (
        <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No events scheduled.</p>
      ) : (
        (events || []).map(ev => (
          <div
            key={ev.id}
            onClick={() => setSelectedEvent(ev)}
            className="card"
            style={{ cursor: 'pointer', borderLeft: `4px solid ${TYPE_COLORS[ev.event_type] || '#555'}` }}
          >
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>{ev.title}</h3>
                  <span style={{
                    fontSize: '.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    letterSpacing: '1px', color: TYPE_COLORS[ev.event_type] || 'var(--text-muted)',
                  }}>{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                  <div>{new Date(ev.start_time).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                  <div>{new Date(ev.start_time).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              </div>
              {ev.region && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{ev.region}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (loading) return <div className="page-content"><SkeletonCard /><div style={{ height: '12px' }} /><SkeletonCard /><div style={{ height: '12px' }} /><SkeletonCard /></div>

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Header + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>&larr; Prev</button>
          <button className="btn btn-outline btn-sm" onClick={() => setViewDate(new Date())}>Today</button>
          <button className="btn btn-outline btn-sm" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>Next &rarr;</button>
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '.8rem' }}
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
          >
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <button
            className={viewMode === 'month' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setViewMode('month')}
          >Month</button>
          <button
            className={viewMode === 'list' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setViewMode('list')}
          >List</button>
          {adminLevel >= 1 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Event</button>
          )}
        </div>
      </div>

      {/* Calendar or List */}
      {viewMode === 'month' ? renderMonthGrid() : renderListView()}

      {/* Event detail modal */}
      {selectedEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', overflow: 'auto',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--gold)', maxWidth: '500px', width: '100%',
            borderRadius: '4px', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <span style={{
                  fontSize: '.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  letterSpacing: '1px', color: TYPE_COLORS[selectedEvent.event_type] || 'var(--text-muted)',
                }}>{TYPE_LABELS[selectedEvent.event_type] || selectedEvent.event_type}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '4px' }}>{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)', padding: '4px 10px' }}>Close</button>
            </div>
            {selectedEvent.description && <p style={{ fontSize: '.9rem', lineHeight: 1.6, marginBottom: '12px', color: 'var(--text-muted)' }}>{selectedEvent.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '.85rem' }}>
              <div>
                <span className="text-muted">Start: </span><span className="text-gold">{new Date(selectedEvent.start_time).toLocaleString('en')}</span>
              </div>
              <div>
                <span className="text-muted">End: </span><span className="text-gold">{new Date(selectedEvent.end_time).toLocaleString('en')}</span>
              </div>
              {selectedEvent.region && <div><span className="text-muted">Region: </span><span className="text-gold">{selectedEvent.region}</span></div>}
              {selectedEvent.location && <div><span className="text-muted">Location: </span><span className="text-gold">{selectedEvent.location}</span></div>}
              {selectedEvent.organizer_name && <div><span className="text-muted">Organizer: </span><span className="text-gold">{selectedEvent.organizer_name}</span></div>}
            </div>
            {adminLevel >= 2 && selectedEvent.house_id && (
              <button
                className="btn btn-outline btn-sm mt-3"
                onClick={async () => {
                  try { await api.eventNotify(selectedEvent.id); setError('Ravens sent to online members'); }
                  catch (err) { setError(err.message) }
                }}
              >Notify Online Members (Raven)</button>
            )}
          </div>
        </div>
      )}

      {/* Create event modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', overflow: 'auto',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--gold)', maxWidth: '500px', width: '100%',
            borderRadius: '4px', padding: '24px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '16px' }}>Create Event</h3>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} maxLength={128} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} maxLength={5000} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={createForm.event_type} onChange={(e) => setCreateForm({ ...createForm, event_type: e.target.value })}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <input type="text" className="form-input" value={createForm.region} onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })} maxLength={64} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input type="text" className="form-input" value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} maxLength={128} />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="datetime-local" className="form-input" value={createForm.start_time} onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="datetime-local" className="form-input" value={createForm.end_time} onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Organizer Name</label>
              <input type="text" className="form-input" value={createForm.organizer_name} onChange={(e) => setCreateForm({ ...createForm, organizer_name: e.target.value })} maxLength={64} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
