import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import HouseCrest from '../components/house/HouseCrest.jsx'

export default function Roster() {
  const { user } = useAuth()
  const [house, setHouse] = useState(null)
  const [crest, setCrest] = useState(null)
  const [members, setMembers] = useState(null)
  const [groupLink, setGroupLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    if (!user?.house_id) {
      setLoading(false)
      return
    }
    try {
      const [houseData, crestData, rosterData, linkData] = await Promise.all([
        api.getHouse(user.house_id).catch(e => ({ error: e.message })),
        api.crestGet(user.house_id).catch(e => ({ error: e.message })),
        api.rosterGet(user.house_id).catch(e => ({ error: e.message })),
        api.groupLinkGet(user.house_id).catch(e => ({ error: e.message })),
      ])
      if (houseData && !houseData.error) setHouse(houseData.house || houseData)
      if (crestData && !crestData.error) setCrest(crestData.crest)
      if (rosterData && !rosterData.error) setMembers(rosterData.members || [])
      if (linkData && !linkData.error) setGroupLink(linkData.link)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [user?.house_id])

  useEffect(() => { load() }, [load])

  const handleSync = async () => {
    if (!user?.house_id) return
    setSyncing(true); setError(null)
    try {
      await api.rosterSync(user.house_id)
      await load()
    } catch (err) { setError(err.message) }
    setSyncing(false)
  }

  if (loading) return <div className="page-content"><Loading /></div>
  if (!user?.house_id) return (
    <div className="page-content">
      <p className="text-muted">You are not a member of any house.</p>
    </div>
  )

  const onlineCount = (members || []).filter(m => m.is_online == 1).length

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* House header with crest */}
      <div className="card mb-4">
        <div className="card-header">{house?.name || 'Unknown House'}</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {crest && <HouseCrest crest={crest} size={80} showMotto />}
            <div>
              <p>Region: <span className="text-gold">{house?.region || 'Unknown'}</span></p>
              <p>Members (SL): <span className="text-gold">{members?.length || 0}</span> ({onlineCount} online)</p>
              {groupLink ? (
                <p className="text-muted" style={{ fontSize: '.85rem' }}>SL Group: {groupLink.group_name || groupLink.group_uuid?.slice(0, 8) + '...'}</p>
              ) : (
                <p className="text-muted" style={{ fontSize: '.85rem' }}>No SL group linked. Ask an admin to link one.</p>
              )}
            </div>
            {groupLink && (
              <button className="btn btn-outline btn-sm" onClick={handleSync} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync Roster from SL'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Roster list */}
      <div className="card mb-4">
        <div className="card-header">Roster ({members?.length || 0})</div>
        <div className="card-body">
          {(members || []).length === 0 ? (
            <p className="text-muted">
              {groupLink ? 'No cached roster. Click "Sync Roster from SL" to fetch.' : 'No SL group linked to this house.'}
            </p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ textAlign: 'left', fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</th>
                  <th style={{ textAlign: 'left', fontSize: '.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {(members || []).map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: m.is_online == 1 ? 'var(--gold)' : 'var(--border)',
                        display: 'inline-block',
                      }} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-serif)', fontSize: '.9rem' }}>{m.member_name || 'Unknown'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{m.role_title || 'Member'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
