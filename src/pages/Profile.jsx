import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState(null)
  const [titles, setTitles] = useState([])
  const [ravens, setRavens] = useState([])
  const [ravenFolder, setRavenFolder] = useState('inbox')
  const [selectedRaven, setSelectedRaven] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [error, setError] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, t, r] = await Promise.all([
        api.getProfile(),
        api.getTitles().catch(() => null),
        api.getRavens('inbox', 20, 0).catch(() => null)
      ])
      setProfile(p)
      if (t) setTitles(t.titles || [])
      if (r) setRavens(r.messages || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const loadRavens = async (folder) => {
    setRavenFolder(folder)
    setSelectedRaven(null)
    try {
      const r = await api.getRavens(folder, 20, 0)
      setRavens(r.messages || [])
    } catch (err) { setError(err.message) }
  }

  const handleSetStatus = async (status) => {
    try {
      await api.updateProfile(status)
      const p = await api.getProfile()
      setProfile(p)
    } catch (err) { setError(err.message) }
  }

  const handleEquipTitle = async (titleId) => {
    try {
      await api.setTitle(titleId)
      const t = await api.getTitles()
      setTitles(t.titles || [])
      const p = await api.getProfile()
      setProfile(p)
    } catch (err) { setError(err.message) }
  }

  const handleReadRaven = async (ravenId) => {
    try {
      const r = await api.readRaven(ravenId)
      setSelectedRaven(r)
      // Refresh raven list to update read status
      const updated = await api.getRavens(ravenFolder, 20, 0)
      setRavens(updated.messages || [])
    } catch (err) { setError(err.message) }
  }

  const handleDeleteRaven = async (ravenId) => {
    if (!confirm('Delete this raven?')) return
    try {
      await api.deleteRaven(ravenId)
      setSelectedRaven(null)
      const updated = await api.getRavens(ravenFolder, 20, 0)
      setRavens(updated.messages || [])
    } catch (err) { setError(err.message) }
  }

  if (loading) return <Loading />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (!profile) return <div className="alert alert-danger">Profile not found</div>

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'titles', label: 'Titles' },
    { id: 'ravens', label: `Ravens${profile.unread_ravens > 0 ? ` (${profile.unread_ravens})` : ''}` }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Account</h1>
        <p>{profile.avatar_name}</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn btn-sm"
              style={{
                background: tab === t.id ? 'var(--gold)' : 'transparent',
                color: tab === t.id ? 'var(--bg-dark)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px 4px 0 0',
                borderBottom: 'none',
                padding: '.5rem 1rem',
                cursor: 'pointer',
                fontSize: '.85rem'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab profile={profile} onSetStatus={handleSetStatus} />}
        {tab === 'titles' && <TitlesTab titles={titles} onEquip={handleEquipTitle} />}
        {tab === 'ravens' && (
          <RavensTab
            ravens={ravens}
            folder={ravenFolder}
            onFolder={loadRavens}
            onRead={handleReadRaven}
            onDelete={handleDeleteRaven}
            selected={selectedRaven}
            onClose={() => setSelectedRaven(null)}
          />
        )}
      </div>
    </div>
  )
}

// =====================================================
function OverviewTab({ profile, onSetStatus }) {
  const [status, setStatus] = useState(profile.ic_status || 'OOC')

  const statuses = ['IC', 'OOC', 'AFK', 'DND']
  const statusColors = { IC: 'var(--green)', OOC: 'var(--text-muted)', AFK: 'var(--gold)', DND: 'var(--danger)' }

  const handleStatusChange = (s) => {
    setStatus(s)
    onSetStatus(s)
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header">Character Info</div>
        <div className="card-body" style={{ fontSize: '.9rem' }}>
          <InfoRow label="Name" value={profile.avatar_name} />
          <InfoRow label="Title" value={profile.title_name || 'None'} />
          <InfoRow label="House" value={profile.house_name ? `${profile.house_name} (${profile.house_rank})` : 'None'} />
          <InfoRow label="Archetype" value={profile.archetype || 'Not assigned'} />
          <InfoRow label="Religion" value={profile.religion || 'None'} />
          {profile.devotion > 0 && <InfoRow label="Devotion" value={`${profile.devotion}/100`} />}
          <InfoRow label="Spouse" value={profile.spouse || 'Unmarried'} />
          <InfoRow label="Banned" value={profile.is_banned ? 'Yes' : 'No'} />
          <InfoRow label="Joined" value={new Date(profile.created_at).toLocaleDateString()} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">Status & Resources</div>
        <div className="card-body" style={{ fontSize: '.9rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.5rem' }}>IC/OOC Status</label>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="btn btn-sm"
                  style={{
                    background: status === s ? statusColors[s] : 'transparent',
                    color: status === s ? 'var(--bg-dark)' : 'var(--text)',
                    border: `1px solid ${statusColors[s]}`,
                    padding: '.3rem .8rem',
                    cursor: 'pointer',
                    fontWeight: status === s ? 'bold' : 'normal'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <InfoRow label="HP" value={`${profile.hp_current} / ${profile.hp_max}`} color={profile.hp_current < profile.hp_max / 2 ? 'var(--danger)' : 'var(--green)'} />
          <InfoRow label="RP Score" value={profile.rp_score} color="var(--gold)" />
          <InfoRow label="Gold Dragons" value={profile.gold_dragons} color="var(--gold)" />
          <InfoRow label="Silver Stags" value={profile.silver_stags} color="var(--text-muted)" />
          <InfoRow label="Copper Stars" value={profile.copper_stars} color="var(--text-muted)" />
          <InfoRow label="Unread Ravens" value={profile.unread_ravens} color={profile.unread_ravens > 0 ? 'var(--gold)' : 'var(--text-muted)'} />
          <InfoRow label="Player Status" value={profile.player_status} color={profile.player_status === 'online' ? 'var(--green)' : 'var(--text-muted)'} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.3rem 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)', fontWeight: 'bold' }}>{value}</span>
    </div>
  )
}

// =====================================================
function TitlesTab({ titles, onEquip }) {
  const categoryColors = { noble: 'var(--gold)', military: 'var(--danger)', religious: 'var(--text-muted)', common: 'var(--text)', scholar: '#8ac' }
  return (
    <div>
      <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Equip a title to display alongside your name. Some titles require house membership or admin granting.
      </p>
      <div className="grid grid-2">
        {titles.length === 0 && <p className="text-muted">No titles available. Ask an admin to grant you a title.</p>}
        {titles.map(t => (
          <div key={t.id} className={`card${t.equipped ? ' equipped' : ''}`} style={{ border: t.equipped ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.title}</span>
              <span style={{ fontSize: '.75rem', color: categoryColors[t.category] || 'var(--text-muted)', textTransform: 'capitalize' }}>{t.category}</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{t.description || 'No description.'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.75rem' }}>
                  {t.house_required === 1 && <span style={{ color: 'var(--gold)', marginRight: '.5rem' }}>House Required</span>}
                  {t.admin_granted === 1 && <span style={{ color: 'var(--danger)' }}>Admin Granted</span>}
                </div>
                {t.equipped ? (
                  <span style={{ fontSize: '.8rem', color: 'var(--green)', fontWeight: 'bold' }}>Equipped</span>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => onEquip(t.id)}>Equip</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
function RavensTab({ ravens, folder, onFolder, onRead, onDelete, selected, onClose }) {
  if (selected) {
    return (
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{selected.subject}</span>
          <button className="btn btn-sm btn-outline" onClick={onClose}>Close</button>
        </div>
        <div className="card-body">
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <div>From: {selected.from}</div>
            <div>Sent: {new Date(selected.sent_at).toLocaleString()}</div>
            <div>Arrived: {new Date(selected.arrives_at).toLocaleString()}</div>
            <div>Type: {selected.type}</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(218,165,32,0.05)', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', fontSize: '.9rem' }}>
            {selected.body || '(No message body)'}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(ravens.find(r => r.subject === selected.subject)?.id)}>Delete</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${folder === 'inbox' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onFolder('inbox')}>Inbox</button>
        <button className={`btn btn-sm ${folder === 'sent' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onFolder('sent')}>Sent</button>
      </div>

      {ravens.length === 0 ? (
        <p className="text-muted">{folder === 'inbox' ? 'No ravens in your inbox.' : 'No sent ravens.'}</p>
      ) : (
        <div>
          {ravens.map(r => (
            <div
              key={r.id}
              onClick={() => onRead(r.id)}
              style={{
                cursor: 'pointer',
                padding: '.75rem',
                marginBottom: '.5rem',
                background: r.read ? 'transparent' : 'rgba(218,165,32,0.05)',
                border: `1px solid ${r.read ? 'var(--border)' : 'rgba(218,165,32,0.3)'}`,
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: r.read ? 'normal' : 'bold', fontSize: '.9rem' }}>
                  {!r.read && <span style={{ color: 'var(--gold)', marginRight: '.5rem' }}>●</span>}
                  {r.subject}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                  {folder === 'inbox' ? `From ${r.from}` : `To ${r.to}`} | {new Date(r.arrives_at).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {r.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
