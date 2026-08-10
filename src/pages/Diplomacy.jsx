import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { SkeletonTable, EmptyState, ErrorState } from '../components/Skeleton.jsx'

const TABS = [
  { id: 'treaties', label: 'Treaties' },
  { id: 'marriages', label: 'Marriage Pacts' },
  { id: 'hostages', label: 'Hostages' },
  { id: 'relations', label: 'Relations' },
  { id: 'admin', label: 'Admin' },
]

const TREATY_TYPES = ['peace', 'alliance', 'trade', 'defensive', 'marriage', 'hostage']
const RELATION_TYPES = ['war', 'hostile', 'neutral', 'friendly', 'allied', 'vassal']
const TREATY_STATUSES = ['proposed', 'active', 'broken', 'expired']
const MARRIAGE_STATUSES = ['proposed', 'accepted', 'married', 'broken']
const HOSTAGE_STATUSES = ['held', 'released', 'escaped']

function statusColor(status) {
  switch (status) {
    case 'active': case 'signed': case 'accepted': case 'married': return '#27ae60'
    case 'proposed': case 'pending': case 'held': return '#f39c12'
    case 'broken': case 'rejected': case 'dead': case 'annulled': return '#c0392b'
    default: return '#888'
  }
}

function relationColor(level) {
  if (level < 0) return '#c0392b'
  if (level > 0) return '#27ae60'
  return '#888'
}

export default function Diplomacy() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('treaties')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [treaties, setTreaties] = useState(null)
  const [marriages, setMarriages] = useState(null)
  const [hostages, setHostages] = useState(null)
  const [relations, setRelations] = useState(null)
  const [treatyFilter, setTreatyFilter] = useState('')
  const [marriageFilter, setMarriageFilter] = useState('')
  const [hostageFilter, setHostageFilter] = useState('')
  const [relationFilter, setRelationFilter] = useState('')
  const [showTreaty, setShowTreaty] = useState(false)
  const [showMarriage, setShowMarriage] = useState(false)
  const [showHostage, setShowHostage] = useState(false)
  const [breakTreatyId, setBreakTreatyId] = useState(null)

  const load = useCallback(async (which) => {
    setError(null)
    try {
      if (which === 'treaties') { const r = await api.diplomacyTreatyList(); if (r.status === 'ok') setTreaties(r.treaties) }
      if (which === 'marriages') { const r = await api.diplomacyMarriageList(); if (r.status === 'ok') setMarriages(r.marriages) }
      if (which === 'hostages') { const r = await api.diplomacyHostageList(); if (r.status === 'ok') setHostages(r.hostages) }
      if (which === 'relations') { const r = await api.diplomacyRelationsList(); if (r.status === 'ok') setRelations(r.relations) }
      if (which === 'admin') { const r = await api.diplomacyRelationsList(); if (r.status === 'ok') setRelations(r.relations) }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  if (loading) return <div className="page-content"><SkeletonTable rows={5} /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={() => load(tab)} /></div>

  const visibleTabs = TABS.filter(t => t.id !== 'admin' || adminLevel >= 1)
  const filteredTreaties = treatyFilter ? treaties?.filter(t => t.status === treatyFilter) : treaties
  const filteredMarriages = marriageFilter ? marriages?.filter(m => m.status === marriageFilter) : marriages
  const filteredHostages = hostageFilter ? hostages?.filter(h => h.status === hostageFilter) : hostages
  const filteredRelations = relationFilter ? relations?.filter(r => r.relation_type === relationFilter) : relations

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Diplomacy & Treaties</h1>
        <p className="text-muted">Treaties, marriage pacts, hostage exchanges, and diplomatic relations between the Great Houses</p>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          {visibleTabs.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'treaties' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTreaty(true)}>Propose Treaty</button>
              <FilterSelect label="Status" value={treatyFilter} onChange={setTreatyFilter} options={TREATY_STATUSES} />
              {treaties && treaties.length > 0 && <span className="text-muted">{filteredTreaties.length} of {treaties.length}</span>}
            </div>
            {!treaties || treaties.length === 0 ? <EmptyState icon="&#9878;" title="No Treaties" message="No treaties have been proposed or signed." /> : (
              filteredTreaties.length === 0 ? <EmptyState icon="&#9878;" title="No Matching Treaties" message={`No treaties with status "${treatyFilter}".`} /> : (
                <div className="card"><div className="card-body">
                  <table className="stats-table">
                    <thead><tr><th>#</th><th>Houses</th><th>Type</th><th>Title</th><th>Terms</th><th>Status</th><th>Signed</th><th>Expires</th><th></th></tr></thead>
                    <tbody>
                      {filteredTreaties.map(t => (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td><strong>{t.house_a_name}</strong> &amp; <strong>{t.house_b_name}</strong></td>
                          <td><span className="text-gold">{t.treaty_type}</span></td>
                          <td>{t.title}</td>
                          <td className="text-muted" title={t.terms}>{t.terms?.length > 60 ? t.terms.slice(0, 60) + '\u2026' : t.terms}</td>
                          <td><span style={{ color: statusColor(t.status), fontWeight: 'bold' }}>{t.status}</span></td>
                          <td className="text-muted">{t.signed_at?.slice(0, 10) || '\u2014'}</td>
                          <td className="text-muted">{t.expires_at?.slice(0, 10) || '\u2014'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                              {t.status === 'proposed' && (
                                <>
                                  <input id={`exp-${t.id}`} className="form-input" style={{ width: '130px' }} type="date" />
                                  <button className="btn btn-outline btn-sm" onClick={async () => {
                                    const exp = document.getElementById(`exp-${t.id}`).value
                                    try { await api.diplomacyTreatySign(t.id, exp); load('treaties') } catch (e) { setError(e.message) }
                                  }}>Sign</button>
                                </>
                              )}
                              {t.status === 'active' && <button className="btn btn-outline btn-sm" onClick={() => setBreakTreatyId(t.id)}>Break</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
              )
            )}
          </div>
        )}

        {tab === 'marriages' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMarriage(true)}>Propose Marriage</button>
              <FilterSelect label="Status" value={marriageFilter} onChange={setMarriageFilter} options={MARRIAGE_STATUSES} />
              {marriages && marriages.length > 0 && <span className="text-muted">{filteredMarriages.length} of {marriages.length}</span>}
            </div>
            {!marriages || marriages.length === 0 ? <EmptyState icon="&#10084;" title="No Marriage Pacts" message="No marriage pacts have been proposed." /> : (
              filteredMarriages.length === 0 ? <EmptyState icon="&#10084;" title="No Matching Pacts" message={`No marriage pacts with status "${marriageFilter}".`} /> : (
                <div className="grid grid-2">
                  {filteredMarriages.map(m => (
                    <div key={m.id} className="card">
                      <div className="card-header"><h3>{m.house_a_name} &amp; {m.house_b_name} <span className="text-muted" style={{ fontSize: '.85em' }}>#{m.id}</span></h3></div>
                      <div className="card-body">
                        <p><strong>Groom:</strong> {m.groom_name || 'TBD'}</p>
                        <p><strong>Bride:</strong> {m.bride_name || 'TBD'}</p>
                        <p><strong>Dowry:</strong> <span className="text-gold">{m.dowry_gold}</span> gold</p>
                        <p><strong>Status:</strong> <span style={{ color: statusColor(m.status), fontWeight: 'bold' }}>{m.status}</span></p>
                        <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem' }}>
                          {m.status === 'proposed' && <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.diplomacyMarriageAccept(m.id); load('marriages') } catch (e) { setError(e.message) } }}>Accept</button>}
                          {adminLevel >= 1 && m.status === 'accepted' && <button className="btn btn-primary btn-sm" onClick={async () => { try { await api.diplomacyMarriageCeremony(m.id); load('marriages') } catch (e) { setError(e.message) } }}>Ceremony</button>}
                          {(m.status === 'proposed' || m.status === 'accepted' || m.status === 'married') && <button className="btn btn-outline btn-sm" onClick={async () => { if (confirm('Break this marriage pact?')) { try { await api.diplomacyMarriageBreak(m.id); load('marriages') } catch (e) { setError(e.message) } } }}>Break</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {tab === 'hostages' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {adminLevel >= 1 && <button className="btn btn-primary btn-sm" onClick={() => setShowHostage(true)}>Take Hostage</button>}
              <FilterSelect label="Status" value={hostageFilter} onChange={setHostageFilter} options={HOSTAGE_STATUSES} />
              {hostages && hostages.length > 0 && <span className="text-muted">{filteredHostages.length} of {hostages.length}</span>}
            </div>
            {!hostages || hostages.length === 0 ? <EmptyState icon="&#128274;" title="No Hostages" message="No hostages are currently being held." /> : (
              filteredHostages.length === 0 ? <EmptyState icon="&#128274;" title="No Matching Hostages" message={`No hostages with status "${hostageFilter}".`} /> : (
                <div className="card"><div className="card-body">
                  <table className="stats-table">
                    <thead><tr><th>#</th><th>Hostage</th><th>House</th><th>Holder</th><th>Reason</th><th>Status</th><th>Seized</th><th></th></tr></thead>
                    <tbody>
                      {filteredHostages.map(h => (
                        <tr key={h.id}>
                          <td>{h.id}</td>
                          <td><strong>{h.hostage_name}</strong></td>
                          <td>{h.hostage_house_name}</td>
                          <td className="text-gold">{h.holder_house_name}</td>
                          <td className="text-muted">{h.reason}</td>
                          <td><span style={{ color: statusColor(h.status), fontWeight: 'bold' }}>{h.status}</span></td>
                          <td className="text-muted">{h.seized_at?.slice(0, 10) || '\u2014'}</td>
                          <td>{h.status === 'held' && <button className="btn btn-outline btn-sm" onClick={async () => { try { await api.diplomacyHostageRelease(h.id); load('hostages') } catch (e) { setError(e.message) } }}>Release</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
              )
            )}
          </div>
        )}

        {tab === 'relations' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <FilterSelect label="Type" value={relationFilter} onChange={setRelationFilter} options={RELATION_TYPES} />
              {relations && relations.length > 0 && <span className="text-muted">{filteredRelations.length} of {relations.length}</span>}
            </div>
            {!relations || relations.length === 0 ? <EmptyState icon="&#9878;" title="No Relations" message="No diplomatic relations have been recorded." /> : (
              filteredRelations.length === 0 ? <EmptyState icon="&#9878;" title="No Matching Relations" message={`No relations of type "${relationFilter}".`} /> : (
                <div className="card"><div className="card-body">
                  <table className="stats-table">
                    <thead><tr><th>House A</th><th>House B</th><th>Level</th><th>Type</th></tr></thead>
                    <tbody>
                      {filteredRelations.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.house_a_name}</strong></td>
                          <td><strong>{r.house_b_name}</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                              <div style={{ width: '80px', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.abs(r.relation_level)}%`, height: '100%', background: relationColor(r.relation_level) }} />
                              </div>
                              <span style={{ color: relationColor(r.relation_level), fontWeight: 'bold' }}>{r.relation_level > 0 ? '+' : ''}{r.relation_level}</span>
                            </div>
                          </td>
                          <td><span className="text-gold">{r.relation_type}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
              )
            )}
          </div>
        )}

        {tab === 'admin' && adminLevel >= 1 && (
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header"><h3>Update Diplomatic Relations</h3></div>
              <div className="card-body">
                <RelationsForm onSubmit={async (data) => { try { await api.diplomacyRelationsUpdate(data); load('admin') } catch (e) { setError(e.message) } }} />
              </div>
            </div>
            {relations && relations.length > 0 && (
              <div className="card"><div className="card-body">
                <table className="stats-table">
                  <thead><tr><th>House A</th><th>House B</th><th>Level</th><th>Type</th></tr></thead>
                  <tbody>
                    {relations.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.house_a_name}</strong></td>
                        <td><strong>{r.house_b_name}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            <div style={{ width: '80px', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.abs(r.relation_level)}%`, height: '100%', background: relationColor(r.relation_level) }} />
                            </div>
                            <span style={{ color: relationColor(r.relation_level), fontWeight: 'bold' }}>{r.relation_level > 0 ? '+' : ''}{r.relation_level}</span>
                          </div>
                        </td>
                        <td><span className="text-gold">{r.relation_type}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        )}
      </div>

      {showTreaty && <ProposeTreatyModal onClose={() => setShowTreaty(false)} onSubmit={async (data) => { try { await api.diplomacyTreatyPropose(data); setShowTreaty(false); load('treaties') } catch (e) { setError(e.message) } }} />}
      {showMarriage && <ProposeMarriageModal onClose={() => setShowMarriage(false)} onSubmit={async (data) => { try { await api.diplomacyMarriagePropose(data); setShowMarriage(false); load('marriages') } catch (e) { setError(e.message) } }} />}
      {showHostage && <TakeHostageModal onClose={() => setShowHostage(false)} onSubmit={async (data) => { try { await api.diplomacyHostageTake(data); setShowHostage(false); load('hostages') } catch (e) { setError(e.message) } }} />}
      {breakTreatyId && <BreakTreatyModal onClose={() => setBreakTreatyId(null)} onSubmit={async (reason) => { try { await api.diplomacyTreatyBreak(breakTreatyId, reason); setBreakTreatyId(null); load('treaties') } catch (e) { setError(e.message) } }} />}
    </div>
  )
}

function FilterSelect({ value, onChange, options, label }) {
  return (
    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
      {label && <span className="text-muted">{label}:</span>}
      <select className="form-input" style={{ width: 'auto' }} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function ProposeTreatyModal({ onClose, onSubmit }) {
  const [houseBId, setHouseBId] = useState(1)
  const [title, setTitle] = useState('')
  const [treatyType, setTreatyType] = useState('peace')
  const [terms, setTerms] = useState('')
  return (
    <Modal title="Propose Treaty" onClose={onClose}>
      <div className="form-group"><label className="form-label">Target House ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseBId} onChange={e => setHouseBId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Treaty Type</label>
        <select className="form-input" style={{ width: '100%' }} value={treatyType} onChange={e => setTreatyType(e.target.value)}>
          {TREATY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Terms</label><textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={terms} onChange={e => setTerms(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ house_b_id: houseBId, title, treaty_type: treatyType, terms })}>Propose</button>
    </Modal>
  )
}

function ProposeMarriageModal({ onClose, onSubmit }) {
  const [houseAId, setHouseAId] = useState(1)
  const [houseBId, setHouseBId] = useState(2)
  const [dowryGold, setDowryGold] = useState(100)
  return (
    <Modal title="Propose Marriage" onClose={onClose}>
      <div className="form-group"><label className="form-label">House A ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseAId} onChange={e => setHouseAId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">House B ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseBId} onChange={e => setHouseBId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Dowry (gold)</label><input className="form-input" type="number" style={{ width: '100%' }} value={dowryGold} onChange={e => setDowryGold(Number(e.target.value))} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ house_a_id: houseAId, house_b_id: houseBId, dowry_gold: dowryGold })}>Propose</button>
    </Modal>
  )
}

function TakeHostageModal({ onClose, onSubmit }) {
  const [hostageName, setHostageName] = useState('')
  const [hostageHouseId, setHostageHouseId] = useState(1)
  const [holderHouseId, setHolderHouseId] = useState(2)
  const [reason, setReason] = useState('')
  const [returnConditions, setReturnConditions] = useState('')
  return (
    <Modal title="Take Hostage" onClose={onClose}>
      <div className="form-group"><label className="form-label">Hostage Name</label><input className="form-input" style={{ width: '100%' }} value={hostageName} onChange={e => setHostageName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Hostage House ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={hostageHouseId} onChange={e => setHostageHouseId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Holder House ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={holderHouseId} onChange={e => setHolderHouseId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Reason</label><input className="form-input" style={{ width: '100%' }} value={reason} onChange={e => setReason(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Return Conditions</label><textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={returnConditions} onChange={e => setReturnConditions(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSubmit({ hostage_name: hostageName, hostage_house_id: hostageHouseId, holder_house_id: holderHouseId, reason, return_conditions: returnConditions })}>Take Hostage</button>
    </Modal>
  )
}

function BreakTreatyModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Break Treaty" onClose={onClose}>
      <div className="form-group"><label className="form-label">Reason for breaking treaty</label><textarea className="form-input" style={{ width: '100%', minHeight: '80px' }} value={reason} onChange={e => setReason(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => { if (reason.trim()) { onSubmit(reason) } }}>Break Treaty</button>
    </Modal>
  )
}

function RelationsForm({ onSubmit }) {
  const [houseAId, setHouseAId] = useState(1)
  const [houseBId, setHouseBId] = useState(2)
  const [level, setLevel] = useState(0)
  const [type, setType] = useState('neutral')
  return (
    <div>
      <div className="form-group"><label className="form-label">House A ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseAId} onChange={e => setHouseAId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">House B ID</label><input className="form-input" type="number" style={{ width: '100%' }} value={houseBId} onChange={e => setHouseBId(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Relation Level (-100 to 100)</label><input className="form-input" type="number" min="-100" max="100" style={{ width: '100%' }} value={level} onChange={e => setLevel(Number(e.target.value))} /></div>
      <div className="form-group"><label className="form-label">Relation Type</label>
        <select className="form-input" style={{ width: '100%' }} value={type} onChange={e => setType(e.target.value)}>
          {RELATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button className="btn btn-primary" onClick={() => onSubmit({ house_a_id: houseAId, house_b_id: houseBId, relation_level: level, relation_type: type })}>Update Relations</button>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflow: 'auto' }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{title}</h3><button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  )
}
