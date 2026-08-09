import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const ROLE_LABELS = { head: 'Head of House', consort: 'Consort', child: 'Child', bastard: 'Bastard', ward: 'Ward', knight: 'Knight', sept: 'Septon/Septa', maester: 'Maester' }
const EVENT_LABELS = { birth: 'Birth', death: 'Death', marriage: 'Marriage', divorce: 'Divorce', coronation: 'Coronation', exile: 'Exile', return: 'Return', adoption: 'Adoption' }
const BASTARD_SURNAMES = ['Snow', 'Sand', 'Stone', 'Rivers', 'Lakes', 'Flowers', 'Waters', 'Storm', 'Hill']

export default function Lineage() {
  const { user, adminLevel } = useAuth()
  const [houses, setHouses] = useState(null)
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChar, setSelectedChar] = useState(null)
  const [showAddChar, setShowAddChar] = useState(false)

  const loadHouses = useCallback(async () => {
    try {
      const res = await api.lineageHouseList()
      if (res.status === 'ok') {
        setHouses(res.houses)
        if (res.houses.length > 0 && !selectedHouse) {
          setSelectedHouse(res.houses[0].id)
        }
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  const loadTree = useCallback(async (houseId) => {
    if (!houseId) return
    setLoading(true)
    try {
      const res = await api.lineageTree(houseId)
      if (res.status === 'ok') setTree(res)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadHouses() }, [loadHouses])
  useEffect(() => { if (selectedHouse) loadTree(selectedHouse) }, [selectedHouse, loadTree])

  if (loading && !tree) return <div className="page-content"><SkeletonTable rows={6} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => { setError(null); loadHouses() }} /></div>

  const currentHouse = tree?.house || houses?.find(h => h.id === selectedHouse)

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Lineage &amp; Family Trees</h1>
        <p className="text-muted">Bloodlines, succession, and house histories</p>
      </div>

      {houses && houses.length > 0 && (
        <div className="filter-bar" style={{ marginBottom: '1rem' }}>
          <select className="filter-select" value={selectedHouse || ''} onChange={e => setSelectedHouse(Number(e.target.value))}>
            {houses.map(h => <option key={h.id} value={h.id}>{h.name} ({h.member_count} members)</option>)}
          </select>
        </div>
      )}

      {!tree || !tree.characters || tree.characters.length === 0 ? (
        <EmptyState icon="&#127970;" title="No Family Tree" message="This house has no recorded lineage. Add the first ancestor to begin.">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddChar(true)}>Add First Character</button>
        </EmptyState>
      ) : (
        <>
          {/* House banner */}
          {currentHouse && (
            <div className="house-banner" style={{ background: `linear-gradient(135deg, ${currentHouse.primary_color || '#333'}, ${currentHouse.secondary_color || '#111'})`, marginBottom: '1.5rem' }}>
              <div className="house-banner-name">{currentHouse.name}</div>
              {currentHouse.words && <div className="house-banner-words">"{currentHouse.words}"</div>}
            </div>
          )}

          <div className="grid grid-2">
            {/* Family members */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Family Members ({tree.characters.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddChar(true)}>Add Member</button>
              </div>
              <div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Name</th><th>Role</th><th>Born</th><th>Died</th><th>Status</th></tr></thead>
                  <tbody>
                    {tree.characters.map(c => (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedChar(c)}>
                        <td>
                          {c.is_house_head === 1 && <span className="text-gold">&#9876; </span>}
                          {c.title && <span className="text-muted">{c.title} </span>}
                          {c.character_name}
                        </td>
                        <td><span className="text-muted">{ROLE_LABELS[c.role] || c.role}</span></td>
                        <td className="text-muted">{c.birth_year || '?'}</td>
                        <td className="text-muted">{c.death_year || (c.is_alive === 1 ? '-' : '?')}</td>
                        <td>{c.is_alive === 1 ? <span style={{ color: 'var(--green)' }}>Alive</span> : <span style={{ color: 'var(--red)' }}>Deceased</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Succession line */}
            <div className="card">
              <div className="card-header"><h3>Line of Succession</h3></div>
              <div className="card-body">
                {tree.succession && tree.succession.length > 0 ? (
                  <ol>
                    {tree.succession.map((s, i) => (
                      <li key={s.id} style={{ marginBottom: '.5rem' }}>
                        <span className="text-gold">{s.character_name}</span>
                        <span className="text-muted" style={{ marginLeft: '.5rem' }}>({s.claim_type})</span>
                        {s.notes && <p className="text-muted" style={{ fontSize: '.85rem' }}>{s.notes}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted">No succession line established.</p>
                )}
              </div>
            </div>
          </div>

          {/* Events timeline */}
          {tree.events && tree.events.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header"><h3>House History</h3></div>
              <div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Year</th><th>Event</th><th>Description</th></tr></thead>
                  <tbody>
                    {tree.events.map(e => (
                      <tr key={e.id}>
                        <td className="text-gold">{e.event_year || '?'}</td>
                        <td><span className="wound-badge" style={{ background: 'var(--bg-elevated)', fontSize: '.75rem' }}>{EVENT_LABELS[e.event_type] || e.event_type}</span></td>
                        <td>{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bastards */}
          {tree.bastards && tree.bastards.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header"><h3>Bastards</h3></div>
              <div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>Name</th><th>Surname</th><th>Acknowledged</th><th>Notes</th></tr></thead>
                  <tbody>
                    {tree.bastards.map(b => (
                      <tr key={b.id}>
                        <td>{b.bastard_name || b.character_name}</td>
                        <td className="text-muted">{b.bastard_surname}</td>
                        <td>{b.acknowledged == 1 ? <span style={{ color: 'var(--green)' }}>Yes</span> : <span style={{ color: 'var(--red)' }}>No</span>}</td>
                        <td className="text-muted">{b.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedChar && (
        <CharacterDetail char={selectedChar} onClose={() => setSelectedChar(null)} adminLevel={adminLevel} houseId={selectedHouse} onUpdate={() => loadTree(selectedHouse)} />
      )}

      {showAddChar && (
        <AddCharacterModal onClose={() => setShowAddChar(false)} houseId={selectedHouse} onSubmit={async (data) => { try { await api.lineageCharacterAdd(data); setShowAddChar(false); loadTree(selectedHouse) } catch (e) { setError(e.message) } }} />
      )}
    </div>
  )
}

function CharacterDetail({ char, onClose, adminLevel, houseId, onUpdate }) {
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    api.lineageCharacterGet(char.id).then(res => { if (res.status === 'ok') setDetail(res.character) }).catch(() => {})
  }, [char.id])

  if (!detail) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{char.is_house_head === 1 && '&#9876; '}{detail.title && detail.title + ' '}{char.character_name}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div><strong>Gender:</strong> {detail.gender}</div>
            <div><strong>Role:</strong> {ROLE_LABELS[detail.role] || detail.role}</div>
            <div><strong>Born:</strong> {detail.birth_year || '?'}</div>
            <div><strong>Died:</strong> {detail.death_year || (detail.is_alive === 1 ? 'Living' : '?')}</div>
          </div>

          {detail.bio && <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: '1rem', padding: '1rem' }}><p>{detail.bio}</p></div>}

          {detail.father && <p><strong>Father:</strong> {detail.father.character_name} {detail.father.is_alive == 1 ? '' : '(deceased)'}</p>}
          {detail.mother && <p><strong>Mother:</strong> {detail.mother.character_name} {detail.mother.is_alive == 1 ? '' : '(deceased)'}</p>}
          {detail.spouse && <p><strong>Spouse:</strong> {detail.spouse.character_name} {detail.spouse.is_alive == 1 ? '' : '(deceased)'}</p>}

          {detail.children && detail.children.length > 0 && (
            <div style={{ marginTop: '.5rem' }}>
              <strong>Children:</strong>
              {detail.children.map(c => <div key={c.id} className="text-muted" style={{ marginLeft: '1rem' }}>{c.character_name} ({c.gender}, b. {c.birth_year || '?'}) {c.is_alive === 1 ? '' : '(deceased)'}</div>)}
            </div>
          )}

          {detail.events && detail.events.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Life Events:</strong>
              <table className="stats-table" style={{ marginTop: '.5rem' }}>
                <thead><tr><th>Year</th><th>Event</th><th>Description</th></tr></thead>
                <tbody>
                  {detail.events.map(e => <tr key={e.id}><td className="text-gold">{e.event_year || '?'}</td><td>{EVENT_LABELS[e.event_type] || e.event_type}</td><td>{e.description}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddCharacterModal({ onClose, houseId, onSubmit }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('male')
  const [role, setRole] = useState('child')
  const [title, setTitle] = useState('')
  const [birthYear, setBirthYear] = useState(280)
  const [isAlive, setIsAlive] = useState(1)
  const [isHead, setIsHead] = useState(0)
  const [bio, setBio] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Add Family Member</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Gender</label><select className="form-input" style={{ width: '100%' }} value={gender} onChange={e => setGender(e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></div>
          <div className="form-group"><label className="form-label">Role</label><select className="form-input" style={{ width: '100%' }} value={role} onChange={e => setRole(e.target.value)}>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Title (optional)</label><input className="form-input" style={{ width: '100%' }} placeholder="Lord, Lady, Ser..." value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Birth Year</label><input className="form-input" type="number" style={{ width: '100%' }} value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Bio (optional)</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={bio} onChange={e => setBio(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" checked={isAlive === 1} onChange={e => setIsAlive(e.target.checked ? 1 : 0)} /> Alive</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" checked={isHead === 1} onChange={e => setIsHead(e.target.checked ? 1 : 0)} /> House Head</label>
          </div>
          <button className="btn btn-primary" onClick={() => onSubmit({ house_id: houseId, character_name: name, gender, role, title, birth_year: birthYear, is_alive: isAlive, is_house_head: isHead, bio })}>Add Member</button>
        </div>
      </div>
    </div>
  )
}
