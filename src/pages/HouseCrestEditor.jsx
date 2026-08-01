import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import HouseCrest from '../components/house/HouseCrest.jsx'

const EMBLEM_SHAPES = ['shield', 'banner', 'seal', 'roundel', 'bare']
const EMBLEM_SYMBOLS = ['wolf', 'lion', 'dragon', 'raven', 'rose', 'sun', 'trout', 'kraken', 'stag', 'bear', 'falcon', 'flayed', 'viper', 'onion']

export default function HouseCrestEditor() {
  const [houses, setHouses] = useState(null)
  const [selectedHouseId, setSelectedHouseId] = useState(null)
  const [crest, setCrest] = useState(null)
  const [uniform, setUniform] = useState(null)
  const [groupLink, setGroupLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveMsg, setSaveMsg] = useState(null)

  const loadHouses = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.housesList()
      setHouses(data.houses || data || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  const loadHouseData = useCallback(async (houseId) => {
    setLoading(true); setError(null)
    try {
      const [crestData, uniformData, linkData] = await Promise.all([
        api.crestGet(houseId).catch(e => ({ error: e.message })),
        api.uniformGet(houseId).catch(e => ({ error: e.message })),
        api.groupLinkGet(houseId).catch(e => ({ error: e.message })),
      ])
      setCrest(crestData.crest || { emblem_shape: 'shield', emblem_symbol: 'wolf', primary_color: '#2A3D1F', secondary_color: '#8C6420', accent_color: '#ECEBE3', motto: '' })
      setUniform(uniformData.uniform || { description: '', colors: [], items: [] })
      setGroupLink(linkData.link || null)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadHouses() }, [loadHouses])
  useEffect(() => { if (selectedHouseId) loadHouseData(selectedHouseId) }, [selectedHouseId, loadHouseData])

  const handleSaveCrest = async () => {
    if (!crest || !selectedHouseId) return
    try {
      await api.crestSave(selectedHouseId, crest)
      setSaveMsg('Crest saved')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (err) { setError(err.message) }
  }

  const handleSaveUniform = async () => {
    if (!uniform || !selectedHouseId) return
    try {
      await api.uniformSave(selectedHouseId, uniform.description, uniform.colors, uniform.items)
      setSaveMsg('Uniform saved')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (err) { setError(err.message) }
  }

  const handleSaveLink = async () => {
    if (!groupLink || !selectedHouseId) return
    try {
      await api.groupLinkSave(selectedHouseId, groupLink.group_uuid, groupLink.group_name)
      setSaveMsg('Group link saved')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (err) { setError(err.message) }
  }

  if (loading && !houses) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}
      {saveMsg && <div className="alert alert-success">{saveMsg}</div>}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem' }}>House Crest & Uniform Editor</h2>

      {/* House selector */}
      <div className="card mb-4">
        <div className="card-header">Select House</div>
        <div className="card-body">
          <select
            value={selectedHouseId || ''}
            onChange={(e) => setSelectedHouseId(parseInt(e.target.value))}
            className="form-input"
            style={{ maxWidth: '400px' }}
          >
            <option value="">Select a house...</option>
            {(houses || []).map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedHouseId && crest && (
        <div className="grid grid-2">
          {/* Left: Crest preview + editor */}
          <div>
            <div className="card mb-4">
              <div className="card-header">Crest Preview</div>
              <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
                <HouseCrest crest={crest} size={120} showMotto />
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">Crest Settings</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Emblem Shape</label>
                  <select className="form-input" value={crest.emblem_shape} onChange={(e) => setCrest({ ...crest, emblem_shape: e.target.value })}>
                    {EMBLEM_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Emblem Symbol</label>
                  <select className="form-input" value={crest.emblem_symbol} onChange={(e) => setCrest({ ...crest, emblem_symbol: e.target.value })}>
                    {EMBLEM_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">Primary</label>
                    <input type="color" className="form-input" value={crest.primary_color} onChange={(e) => setCrest({ ...crest, primary_color: e.target.value })} style={{ height: '40px', padding: '2px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secondary</label>
                    <input type="color" className="form-input" value={crest.secondary_color} onChange={(e) => setCrest({ ...crest, secondary_color: e.target.value })} style={{ height: '40px', padding: '2px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Accent</label>
                    <input type="color" className="form-input" value={crest.accent_color} onChange={(e) => setCrest({ ...crest, accent_color: e.target.value })} style={{ height: '40px', padding: '2px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Motto</label>
                  <input type="text" className="form-input" value={crest.motto || ''} onChange={(e) => setCrest({ ...crest, motto: e.target.value })} placeholder="House words..." maxLength={128} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSaveCrest}>Save Crest</button>
              </div>
            </div>
          </div>

          {/* Right: Uniform + Group Link */}
          <div>
            <div className="card mb-4">
              <div className="card-header">Uniform Guidelines</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={uniform?.description || ''} onChange={(e) => setUniform({ ...uniform, description: e.target.value })} rows={4} placeholder="Describe the house attire..." maxLength={2000} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color Swatches</label>
                  {(uniform?.colors || []).map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <input type="color" value={c.color || '#000000'} onChange={(e) => setUniform({ ...uniform, colors: uniform.colors.map((cc, idx) => idx === i ? { ...cc, color: e.target.value } : cc) })} style={{ width: '40px', height: '32px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                      <input type="text" className="form-input" value={c.label || ''} onChange={(e) => setUniform({ ...uniform, colors: uniform.colors.map((cc, idx) => idx === i ? { ...cc, label: e.target.value } : cc) })} placeholder="Color name (e.g. Stark Grey)" style={{ flex: 1 }} />
                      <button className="btn btn-outline btn-sm" onClick={() => setUniform({ ...uniform, colors: uniform.colors.filter((_, idx) => idx !== i) })} style={{ fontSize: '10px', padding: '4px 8px' }}>DEL</button>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={() => setUniform({ ...uniform, colors: [...(uniform?.colors || []), { color: '#888888', label: '' }] })}>+ Add Color</button>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSaveUniform}>Save Uniform</button>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">SL Group Link</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">SL Group UUID</label>
                  <input type="text" className="form-input" value={groupLink?.group_uuid || ''} onChange={(e) => setGroupLink({ ...groupLink, group_uuid: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Group Name</label>
                  <input type="text" className="form-input" value={groupLink?.group_name || ''} onChange={(e) => setGroupLink({ ...groupLink, group_name: e.target.value })} placeholder="Second Life group name" />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSaveLink}>Save Group Link</button>
                <p className="text-muted" style={{ fontSize: '.8rem', marginTop: '8px' }}>
                  Linking a SL group enables roster sync and in-world group operations via GoTBot.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
