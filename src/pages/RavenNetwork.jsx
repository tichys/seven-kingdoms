import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const CHANNEL_TYPE_ICONS = {
  house: '\u269B', region: '\u2691', maester: '\u269A', public: '\u2709', admin: '\u269C',
}
const CHANNEL_TYPE_COLORS = {
  house: '#b08d57', region: '#6b8f3e', maester: '#5a7a9a', public: '#8a7a6a', admin: '#702618',
}
const ROLE_LABELS = { member: 'Member', moderator: 'Maester', lord: 'Lord' }

export default function RavenNetwork() {
  const { adminLevel } = useAuth()
  const [channels, setChannels] = useState(null)
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [allChannels, setAllChannels] = useState(null)
  const [subscribeTarget, setSubscribeTarget] = useState('')
  const [lastMsgId, setLastMsgId] = useState(0)
  const pollRef = useRef(null)
  const feedEndRef = useRef(null)

  const loadChannels = useCallback(async () => {
    try {
      const res = await api.ravenChannels()
      if (res.status === 'ok') {
        setChannels(res.channels)
        if (!activeChannel && res.channels.length > 0) {
          setActiveChannel(res.channels[0])
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeChannel])

  const loadMessages = useCallback(async (channelId, sinceId) => {
    try {
      const res = await api.ravenMessages(channelId, sinceId)
      if (res.status === 'ok') {
        if (sinceId > 0) {
          if (res.messages.length > 0) {
            setMessages(prev => [...prev, ...res.messages])
            setLastMsgId(res.messages[res.messages.length - 1].id)
          }
        } else {
          setMessages(res.messages)
          if (res.messages.length > 0) {
            setLastMsgId(res.messages[res.messages.length - 1].id)
          } else {
            setLastMsgId(0)
          }
        }
      }
    } catch (e) {
      setError(e.message)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadChannels()
  }, [])

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      setMessages([])
      setLastMsgId(0)
      loadMessages(activeChannel.id, 0)
    }
  }, [activeChannel?.id])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!activeChannel) return
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      loadMessages(activeChannel.id, lastMsgId)
    }, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeChannel?.id, lastMsgId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Refresh channel list every 30 seconds for unread counts
  useEffect(() => {
    const interval = setInterval(loadChannels, 30000)
    return () => clearInterval(interval)
  }, [loadChannels])

  const handleSend = async () => {
    if (!msgInput.trim() || !activeChannel) return
    setSending(true)
    setError(null)
    try {
      const res = await api.ravenSend(activeChannel.id, msgInput.trim())
      if (res.status === 'ok') {
        setMsgInput('')
        loadMessages(activeChannel.id, lastMsgId)
        loadChannels()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const handleSubscribe = async () => {
    if (!subscribeTarget) return
    try {
      const res = await api.ravenSubscribe(parseInt(subscribeTarget))
      if (res.status === 'ok') {
        setSubscribeTarget('')
        loadChannels()
        if (allChannels) {
          setAllChannels(allChannels.filter(c => c.id !== parseInt(subscribeTarget)))
        }
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const handleUnsubscribe = async (channelId) => {
    if (!confirm('Leave this rookery?')) return
    try {
      const res = await api.ravenUnsubscribe(channelId)
      if (res.status === 'ok') {
        if (activeChannel?.id === channelId) setActiveChannel(null)
        loadChannels()
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const handleToggleMute = async (channelId) => {
    try {
      await api.ravenToggleMute(channelId)
      loadChannels()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('Strike this raven from the record?')) return
    try {
      const res = await api.ravenDeleteMessage(msgId)
      if (res.status === 'ok') {
        setMessages(prev => prev.filter(m => m.id !== msgId))
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const handleShowMembers = async (channelId) => {
    setShowMembers(!showMembers)
    if (!showMembers) {
      try {
        const res = await api.ravenMembers(channelId)
        if (res.status === 'ok') setMembers(res.members)
      } catch (e) {
        setError(e.message)
      }
    }
  }

  const handleCreateChannel = async (formData) => {
    try {
      const res = await api.ravenCreateChannel(formData)
      if (res.status === 'ok') {
        setShowCreate(false)
        loadChannels()
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const loadAvailableChannels = async () => {
    try {
      const res = await api.ravenAllChannels()
      if (res.status === 'ok') {
        const subscribedIds = new Set(channels?.map(c => c.id) || [])
        setAllChannels(res.channels.filter(c => !subscribedIds.has(c.id) && c.channel_type !== 'admin'))
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts + 'Z')
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>Raven Network</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {adminLevel >= 2 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(true)}>+ New Rookery</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={loadAvailableChannels}>Join Rookery</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 220px)', minHeight: '400px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Left pane — Channel list */}
        <div style={{ width: '240px', minWidth: '240px', borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-card)' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
            Rookeries
          </div>
          {channels?.map(ch => (
            <div
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-faint)',
                background: activeChannel?.id === ch.id ? 'var(--bg-hover)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', color: CHANNEL_TYPE_COLORS[ch.channel_type] || '#888' }}>
                {CHANNEL_TYPE_ICONS[ch.channel_type] || '\u2709'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ch.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: '0.6' }}>
                  {ch.member_count || 0} members
                  {ch.my_role && ch.my_role !== 'member' && ` \u00B7 ${ROLE_LABELS[ch.my_role]}`}
                </div>
              </div>
              {ch.unread_count > 0 && (
                <span style={{
                  background: '#702618', color: '#fff', fontSize: '0.7rem',
                  borderRadius: '10px', padding: '2px 6px', minWidth: '18px', textAlign: 'center',
                }}>
                  {ch.unread_count > 99 ? '99+' : ch.unread_count}
                </span>
              )}
            </div>
          ))}
          {allChannels && allChannels.length > 0 && (
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', opacity: '0.6', marginBottom: '6px' }}>Available to join:</div>
              {allChannels.map(ch => (
                <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1rem', color: CHANNEL_TYPE_COLORS[ch.channel_type] || '#888' }}>
                    {CHANNEL_TYPE_ICONS[ch.channel_type] || '\u2709'}
                  </span>
                  <span style={{ fontSize: '0.8rem', flex: 1 }}>{ch.name}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    onClick={() => setSubscribeTarget(String(ch.id))}
                    disabled={subscribeTarget === String(ch.id)}
                  >
                    {subscribeTarget === String(ch.id) ? '...' : 'Join'}
                  </button>
                </div>
              ))}
              {subscribeTarget && (
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '6px' }} onClick={handleSubscribe}>
                  Confirm Join
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right pane — Message feed */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeChannel ? (
            <>
              {/* Channel header */}
              <div style={{
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)',
              }}>
                <div>
                  <span style={{ fontSize: '1.3rem', marginRight: '8px', color: CHANNEL_TYPE_COLORS[activeChannel.channel_type] }}>
                    {CHANNEL_TYPE_ICONS[activeChannel.channel_type]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {activeChannel.name}
                  </span>
                  {activeChannel.description && (
                    <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: '0.6' }}>
                      {activeChannel.description}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleToggleMute(activeChannel.id)}
                  >
                    {channels?.find(c => c.id === activeChannel.id)?.is_muted ? '\u238B Unmute' : '\u238B Mute'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleShowMembers(activeChannel.id)}
                  >
                    Members
                  </button>
                  {activeChannel.my_role !== 'lord' && activeChannel.channel_type !== 'house' && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', color: '#702618' }}
                      onClick={() => handleUnsubscribe(activeChannel.id)}
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: '0.5', marginTop: '40px', fontFamily: 'var(--font-serif)' }}>
                    No ravens have arrived at this rookery.
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: '12px',
                        padding: '8px 12px',
                        background: 'var(--bg-faint)',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${msg.sender_key === activeChannel?.id ? 'var(--gold)' : 'transparent'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--gold)' }}>
                          {msg.sender_name || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.body}
                      </div>
                      {msg.mentions && (
                        <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: '0.5' }}>
                          Mentioned: {msg.mentions}
                        </div>
                      )}
                      {adminLevel >= 1 && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: '4px', color: '#702618' }}
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          Strike
                        </button>
                      )}
                    </div>
                  ))
                )}
                <div ref={feedEndRef} />
              </div>

              {/* Send bar */}
              <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Compose a raven..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    maxLength={500}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSend}
                    disabled={sending || !msgInput.trim()}
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', opacity: '0.4', marginTop: '4px' }}>
                  {msgInput.length}/500 {msgInput.length >= 450 && '\u26A0'}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)' }}>
              Select a rookery to read its ravens.
            </div>
          )}
        </div>
      </div>

      {/* Members modal */}
      {showMembers && members && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '100%', maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>
              {activeChannel?.name} — Members
            </h3>
            {members.map(m => (
              <div key={m.avatar_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-faint)' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{m.avatar_name || 'Unknown'}</span>
                  <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--gold)' }}>
                    {ROLE_LABELS[m.role] || 'Member'}
                  </span>
                  {m.is_muted == 1 && <span style={{ marginLeft: '4px', fontSize: '0.7rem', opacity: '0.5' }}>(muted)</span>}
                </div>
                {adminLevel >= 2 && (
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.75rem', padding: '2px 4px' }}
                    value={m.role}
                    onChange={(e) => {
                      api.ravenSetRole(activeChannel.id, m.avatar_key, e.target.value).then(() => handleShowMembers(activeChannel.id))
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Maester</option>
                    <option value="lord">Lord</option>
                  </select>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowMembers(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create channel modal */}
      {showCreate && (
        <CreateChannelModal onCreate={handleCreateChannel} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  )
}

function CreateChannelModal({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [channelType, setChannelType] = useState('public')
  const [region, setRegion] = useState('')
  const [icon, setIcon] = useState('raven')

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      description: description.trim(),
      channel_type: channelType,
      region: region.trim() || null,
      icon: icon.trim() || 'raven',
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Establish New Rookery</h3>
        <div className="form-group">
          <label className="form-label">Rookery Name</label>
          <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} placeholder="e.g. The Whispering Wood" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input type="text" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={256} placeholder="Purpose of this rookery" />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={channelType} onChange={(e) => setChannelType(e.target.value)}>
              <option value="public">Public</option>
              <option value="region">Regional</option>
              <option value="house">House</option>
              <option value="maester">Maester</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Region (if regional)</label>
            <input type="text" className="form-input" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={32} placeholder="e.g. north" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!name.trim()}>Establish</button>
        </div>
      </div>
    </div>
  )
}
