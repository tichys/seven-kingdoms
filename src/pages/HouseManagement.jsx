import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function HouseManagement() {
  const { user, adminLevel } = useAuth()
  const [tab, setTab] = useState('myhouse')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [myHouse, setMyHouse] = useState(null)
  const [members, setMembers] = useState([])
  const [alliances, setAlliances] = useState([])
  const [marriages, setMarriages] = useState([])
  const [showFound, setShowFound] = useState(false)
  const [foundForm, setFoundForm] = useState({ name: '', words: '', seat: '', region: 'Crownlands', primary_color: '#444444', secondary_color: '#888888' })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const house = await api.myHouse().catch(e => ({ house: null, error: e.message }))
      if (house.error) { setError(house.error); setLoading(false); return }
      setMyHouse(house.house)

      if (house.house) {
        const hid = house.house.id
        const [mems, alls, marrs] = await Promise.all([
          api.houseMembers(hid).catch(e => ({ members: [], error: e.message })),
          api.houseAlliances(hid).catch(e => ({ alliances: [], error: e.message })),
          api.houseMarriages(hid).catch(e => ({ marriages: [], error: e.message }))
        ])
        setMembers(mems.members || [])
        setAlliances(alls.alliances || [])
        setMarriages(marrs.marriages || [])
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (fn, label) => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fn()
      setSuccess(res.message || label || 'Done')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const ranks = ['Lord', 'Lady', 'Castellan', 'Knight', 'Man-at-Arms', 'Smallfolk', 'Guest']
  const isLord = myHouse?.is_lord

  return (
    <div>
      <div className="page-header">
        <h1>House Management</h1>
        <p>Manage your house, members, alliances, and marriages</p>
      </div>
      <div className="page-content">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? <Loading /> : !myHouse ? (
          <div className="card">
            <div className="card-header">No House</div>
            <div className="card-body">
              <p className="text-muted mb-2">You are not a member of any house.</p>
              {!showFound ? (
                <>
                  <p className="text-muted" style={{ fontSize: '.85rem' }}>
                    Found a new house (requires {1000} gold dragons and {50} influence) or join an existing one from the Setup page.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowFound(true)}>Found a House</button>
                </>
              ) : (
                <div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">House Name</label>
                      <input className="form-input" value={foundForm.name} onChange={e => setFoundForm({...foundForm, name: e.target.value})} placeholder="House Stark" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Words</label>
                      <input className="form-input" value={foundForm.words} onChange={e => setFoundForm({...foundForm, words: e.target.value})} placeholder="Winter is Coming" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Seat</label>
                      <input className="form-input" value={foundForm.seat} onChange={e => setFoundForm({...foundForm, seat: e.target.value})} placeholder="Winterfell" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Region</label>
                      <select className="form-select" value={foundForm.region} onChange={e => setFoundForm({...foundForm, region: e.target.value})}>
                        <option>Crownlands</option><option>North</option><option>Riverlands</option>
                        <option>Westerlands</option><option>Reach</option><option>Stormlands</option>
                        <option>Dorne</option><option>Vale</option><option>Iron Islands</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Primary Color</label>
                      <input className="form-input" type="color" value={foundForm.primary_color} onChange={e => setFoundForm({...foundForm, primary_color: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Secondary Color</label>
                      <input className="form-input" type="color" value={foundForm.secondary_color} onChange={e => setFoundForm({...foundForm, secondary_color: e.target.value})} />
                    </div>
                  </div>
                  <div className="d-flex gap-1 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={() => doAction(() => api.houseFound(foundForm), 'House founded!')}>Found House</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowFound(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tabs">
            <div className="tab-nav">
              <button className={`tab-btn${tab === 'myhouse' ? ' active' : ''}`} onClick={() => setTab('myhouse')}>Overview</button>
              <button className={`tab-btn${tab === 'members' ? ' active' : ''}`} onClick={() => setTab('members')}>Members ({members.length})</button>
              <button className={`tab-btn${tab === 'alliances' ? ' active' : ''}`} onClick={() => setTab('alliances')}>Alliances ({alliances.length})</button>
              <button className={`tab-btn${tab === 'marriages' ? ' active' : ''}`} onClick={() => setTab('marriages')}>Marriages ({marriages.length})</button>
            </div>
            <div className="tab-panel active">
              {tab === 'myhouse' && (
                <div className="card">
                  <div className="card-header">{myHouse.name}</div>
                  <div className="card-body">
                    <table className="stats-table">
                      <tbody>
                        <tr><th>Words</th><td>{myHouse.words || 'None'}</td></tr>
                        <tr><th>Seat</th><td>{myHouse.seat || 'None'}</td></tr>
                        <tr><th>Region</th><td>{myHouse.region}</td></tr>
                        <tr><th>Type</th><td style={{ textTransform: 'capitalize' }}>{myHouse.house_type}</td></tr>
                        <tr><th>Your Rank</th><td>{myHouse.rank}</td></tr>
                        <tr><th>Members</th><td>{myHouse.member_count}</td></tr>
                        <tr><th>Influence</th><td>{myHouse.influence}</td></tr>
                        <tr><th>Colors</th><td>
                          <span style={{ display: 'inline-block', width: '20px', height: '20px', background: myHouse.primary_color, marginRight: '5px', verticalAlign: 'middle', border: '1px solid var(--border)' }} />
                          <span style={{ display: 'inline-block', width: '20px', height: '20px', background: myHouse.secondary_color, verticalAlign: 'middle', border: '1px solid var(--border)' }} />
                        </td></tr>
                      </tbody>
                    </table>
                    {isLord && <p className="text-gold mt-2">You are the {myHouse.rank} of this house.</p>}
                  </div>
                </div>
              )}

              {tab === 'members' && (
                <table className="stats-table">
                  <thead>
                    <tr><th>Name</th><th>Rank</th><th>Status</th><th>Last Seen</th>{isLord && <th>Actions</th>}</tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.avatar_key}>
                        <td><strong>{m.avatar_name}</strong></td>
                        <td>{m.rank}</td>
                        <td style={{ textTransform: 'capitalize' }}>{m.status}</td>
                        <td style={{ fontSize: '.8rem' }}>{new Date(m.last_seen).toLocaleDateString()}</td>
                        {isLord && (
                          <td>
                            <select
                              className="filter-select"
                              value={m.rank}
                              onChange={e => {
                                if (e.target.value !== m.rank && e.target.value !== 'Lord' && e.target.value !== 'Lady') {
                                  doAction(() => api.housePromote(m.avatar_key, e.target.value), 'Rank updated')
                                }
                              }}
                              style={{ fontSize: '.8rem' }}
                            >
                              {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'alliances' && (
                alliances.length === 0 ? <p className="text-muted">No active alliances.</p> : (
                  <table className="stats-table">
                    <thead><tr><th>House 1</th><th>House 2</th><th>Status</th><th>Date</th>{(isLord || adminLevel >= 2) && <th>Actions</th>}</tr></thead>
                    <tbody>
                      {alliances.map(a => (
                        <tr key={a.id}>
                          <td>{a.house1}</td>
                          <td>{a.house2}</td>
                          <td style={{ textTransform: 'capitalize' }}>{a.status}</td>
                          <td style={{ fontSize: '.8rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                          {(isLord || adminLevel >= 2) && (
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.houseAllianceBreak(a.id), 'Alliance broken')}>Break</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {tab === 'marriages' && (
                marriages.length === 0 ? <p className="text-muted">No active marriages.</p> : (
                  <table className="stats-table">
                    <thead><tr><th>Spouse 1</th><th>Spouse 2</th><th>House 1</th><th>House 2</th><th>Date</th>{adminLevel >= 2 && <th>Actions</th>}</tr></thead>
                    <tbody>
                      {marriages.map(m => (
                        <tr key={m.id}>
                          <td>{m.spouse1}</td>
                          <td>{m.spouse2}</td>
                          <td>{m.house1}</td>
                          <td>{m.house2}</td>
                          <td style={{ fontSize: '.8rem' }}>{m.married_at ? new Date(m.married_at).toLocaleDateString() : '-'}</td>
                          {adminLevel >= 2 && (
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => doAction(() => api.houseAnnul(m.id), 'Marriage annulled')}>Annul</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
