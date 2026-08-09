import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { usePolling } from '../hooks/usePolling.js'

const TYPE_LABELS = {
  raven: 'Raven', war: 'War', auction: 'Auction', decree: 'Decree',
  law: 'Law', quest: 'Quest', house: 'House', combat: 'Combat',
  marketplace: 'Marketplace', petition: 'Petition', system: 'System',
  settlement: 'Settlement', outbreak: 'Outbreak',
}
const PRIORITY_COLORS = { 1: 'var(--gold)', 2: '#b5642a', 3: '#702618' }

export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState(null)
  const ref = useRef(null)
  const navigate = useNavigate()

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const r = await api.notificationUnreadCount()
      if (r.status === 'ok') setUnread(r.count)
    } catch {}
  }, [isAuthenticated])

  const fetchList = useCallback(async () => {
    try {
      const r = await api.notificationList(false)
      if (r.status === 'ok') { setNotifications(r.notifications); setUnread(r.unread_count) }
    } catch {}
  }, [])

  useEffect(() => { fetchUnread() }, [fetchUnread])
  usePolling(fetchUnread, 30000)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (!open) fetchList()
    setOpen(!open)
  }

  const handleClick = async (n) => {
    if (!n.is_read) { await api.notificationMarkRead(n.id); fetchUnread() }
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  const handleMarkAll = async () => {
    await api.notificationMarkAllRead()
    fetchList()
    fetchUnread()
  }

  const handlePrefToggle = async (type, enabled) => {
    await api.notificationSetPref(type, !enabled)
    const r = await api.notificationGetPrefs()
    if (r.status === 'ok') setPrefs(r.prefs)
  }

  if (!isAuthenticated) return null

  return (
    <div className="nav-notification-bell" ref={ref} style={{ position: 'relative' }}>
      <button className="theme-toggle" onClick={handleOpen} title="Notifications" style={{ position: 'relative' }}>
        {'\u{1F514}'}
        {unread > 0 && (
          <span className="badge-count" style={{ position: 'absolute', top: '-4px', right: '-4px' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '.5rem',
          width: '380px', maxHeight: '500px', overflowY: 'auto',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 9999,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <strong className="text-gold" style={{ fontFamily: 'var(--font-heading)', fontSize: '.85rem', letterSpacing: '.1em' }}>NOTIFICATIONS</strong>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={handleMarkAll} style={{ fontSize: '.7rem' }}>Mark All Read</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setShowPrefs(!showPrefs); if (!showPrefs) { api.notificationGetPrefs().then(r => { if (r.status === 'ok') setPrefs(r.prefs) }) } }} style={{ fontSize: '.7rem' }}>{showPrefs ? 'Feed' : 'Settings'}</button>
            </div>
          </div>

          {showPrefs && prefs ? (
            <div style={{ padding: '.5rem 1rem' }}>
              <p className="text-muted" style={{ fontSize: '.8rem', marginBottom: '.5rem' }}>Toggle which notifications you receive:</p>
              {Object.entries(prefs).map(([type, enabled]) => (
                <label key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '.85rem' }}>{TYPE_LABELS[type] || type}</span>
                  <input type="checkbox" checked={enabled === 1} onChange={() => handlePrefToggle(type, enabled === 1)} />
                </label>
              ))}
            </div>
          ) : (
            <div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '.9rem' }}>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '.75rem 1rem', borderBottom: '1px solid var(--border-light)',
                      cursor: n.link ? 'pointer' : 'default', transition: 'background .2s',
                      background: n.is_read ? 'transparent' : 'rgba(176,141,87,.06)',
                      opacity: n.is_read ? .7 : 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,141,87,.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(176,141,87,.06)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          {n.icon && <span style={{ fontSize: '.9rem' }} dangerouslySetInnerHTML={{ __html: n.icon }} />}
                          <span style={{ fontSize: '.85rem', fontWeight: n.is_read ? 400 : 600, color: 'var(--text)' }}>{n.title}</span>
                        </div>
                        {n.body && <p className="text-muted" style={{ fontSize: '.78rem', marginTop: '.25rem', lineHeight: 1.4 }}>{n.body.length > 100 ? n.body.slice(0, 100) + '...' : n.body}</p>}
                        <span className="text-muted" style={{ fontSize: '.7rem' }}>{n.created_at?.slice(0, 16)}</span>
                      </div>
                      {n.priority >= 2 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLORS[n.priority], flexShrink: 0, marginTop: '.25rem' }} />}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
