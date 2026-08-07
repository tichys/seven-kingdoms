import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import '../styles/raven.css'

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

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (activeChannel) {
      setMessages([])
      setLastMsgId(0)
      loadMessages(activeChannel.id, 0)
    }
  }, [activeChannel?.id])

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

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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
      <div className="raven-page-header">
        <h1 className="raven-page-title">Raven Network</h1>
        <div className="raven-page-actions">
          {adminLevel >= 2 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(true)}>+ New Rookery</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={loadAvailableChannels}>Join Rookery</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '12px' }}>{error}</div>}

      <div className="raven-layout">
        {/* Left pane — Channel list */}
        <div className="raven-sidebar">
          <div className="raven-sidebar-header">Rookeries</div>
          {channels?.map(ch => (
            <div
              key={ch.id}
              className={`raven-channel ${activeChannel?.id === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch)}
            >
              <span className="raven-channel-icon" style={{ color: CHANNEL_TYPE_COLORS[ch.channel_type] || '#888' }}>
                {CHANNEL_TYPE_ICONS[ch.channel_type] || '\u2709'}
              </span>
              <div className="raven-channel-info">
                <div className="raven-channel-name">{ch.name}</div>
                <div className="raven-channel-meta">
                  {ch.member_count || 0} members
                  {ch.my_role && ch.my_role !== 'member' && ` \u00B7 ${ROLE_LABELS[ch.my_role]}`}
                </div>
              </div>
              {ch.unread_count > 0 && (
                <span className="raven-unread-badge">
                  {ch.unread_count > 99 ? '99+' : ch.unread_count}
                </span>
              )}
            </div>
          ))}
          {allChannels && allChannels.length > 0 && (
            <div className="raven-available">
              <div className="raven-available-label">Available to join:</div>
              {allChannels.map(ch => (
                <div key={ch.id} className="raven-available-item">
                  <span className="raven-channel-icon" style={{ fontSize: '1rem', color: CHANNEL_TYPE_COLORS[ch.channel_type] || '#888' }}>
                    {CHANNEL_TYPE_ICONS[ch.channel_type] || '\u2709'}
                  </span>
                  <span>{ch.name}</span>
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
        <div className="raven-main">
          {activeChannel ? (
            <>
              {/* Channel header */}
              <div className="raven-channel-header">
                <div className="raven-channel-title">
                  <span className="raven-channel-title-icon" style={{ color: CHANNEL_TYPE_COLORS[activeChannel.channel_type] }}>
                    {CHANNEL_TYPE_ICONS[activeChannel.channel_type]}
                  </span>
                  <span className="raven-channel-title-name">{activeChannel.name}</span>
                  {activeChannel.description && (
                    <span className="raven-channel-title-desc">{activeChannel.description}</span>
                  )}
                </div>
                <div className="raven-channel-actions">
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
              <div className="raven-feed">
                {messages.length === 0 ? (
                  <div className="raven-empty">No ravens have arrived at this rookery.</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`raven-message ${msg.is_own ? 'own' : ''}`}>
                      <div className="raven-message-header">
                        <span className="raven-message-sender">{msg.sender_name || 'Unknown'}</span>
                        <span className="raven-message-time">{formatTime(msg.created_at)}</span>
                      </div>
                      <div className="raven-message-body">{msg.body}</div>
                      {msg.mentions && (
                        <div className="raven-message-mentions">Mentioned: {msg.mentions}</div>
                      )}
                      {adminLevel >= 1 && (
                        <button
                          className="btn btn-outline btn-sm raven-message-strike"
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
              <div className="raven-send-bar">
                <div className="raven-send-row">
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
                <div className="raven-send-charcount">
                  {msgInput.length}/500 {msgInput.length >= 450 && '\u26A0'}
                </div>
              </div>
            </>
          ) : (
            <div className="raven-no-channel">Select a rookery to read its ravens.</div>
          )}
        </div>
      </div>

      {/* Members modal */}
      {showMembers && members && (
        <div className="raven-modal-overlay">
          <div className="raven-modal">
            <h3 className="raven-modal-title">
              {activeChannel?.name} &mdash; Members
            </h3>
            {members.map(m => (
              <div key={m.avatar_key} className="raven-member-row">
                <div>
                  <span className="raven-member-name">{m.avatar_name || 'Unknown'}</span>
                  <span className="raven-member-role">{ROLE_LABELS[m.role] || 'Member'}</span>
                  {m.is_muted == 1 && <span className="raven-member-muted">(muted)</span>}
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
            <div className="raven-modal-close">
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
    <div className="raven-modal-overlay">
      <div className="raven-modal raven-modal-wide">
        <h3 className="raven-modal-title">Establish New Rookery</h3>
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
