import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import PropCanvas from '../components/prop/PropCanvas.jsx'

export default function PropGallery() {
  const [templates, setTemplates] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [instances, setInstances] = useState(null)
  const [variableData, setVariableData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.propListTemplates()
      setTemplates(data.templates || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  const loadInstances = useCallback(async (templateId) => {
    try {
      const data = await api.propListInstances(templateId)
      setInstances(data.instances || [])
    } catch (err) { setError(err.message) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (selectedTemplate) {
      api.propGetTemplate(selectedTemplate).then(data => {
        setSelectedTemplate(data.template)
        setVariableData({})
        loadInstances(data.template.id)
      }).catch(err => setError(err.message))
    }
  }, [selectedTemplate])

  const handleCreate = async () => {
    if (!selectedTemplate) return
    try {
      await api.propCreateInstance(selectedTemplate.id, 'New Document', variableData)
      loadInstances(selectedTemplate.id)
    } catch (err) { setError(err.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem' }}>Document Gallery</h2>

      <div className="grid grid-2">
        {/* Left: Template list */}
        <div>
          <div className="card mb-4">
            <div className="card-header">Templates</div>
            <div className="card-body">
              {(templates || []).map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    padding: '12px 16px',
                    margin: '4px 0',
                    border: `1px solid ${selectedTemplate?.id === t.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedTemplate?.id === t.id ? 'rgba(176,141,87,0.08)' : 'transparent',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--gold)' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.template_type} / {t.width}x{t.height}</div>
                </div>
              ))}
              {(!templates || templates.length === 0) && <p className="text-muted">No templates available.</p>}
            </div>
          </div>

          {/* Instances */}
          {selectedTemplate && (
            <div className="card">
              <div className="card-header">Rendered Documents</div>
              <div className="card-body">
                {(instances || []).map(inst => (
                  <div key={inst.id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px' }}>{inst.name}</span>
                    {inst.sl_asset_uuid && (
                      <span style={{ fontSize: '11px', color: 'var(--gold)', marginLeft: '8px' }}>Uploaded to SL</span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', float: 'right' }}>
                      {inst.created_at?.split(' ')[0]}
                    </span>
                  </div>
                ))}
                {(!instances || instances.length === 0) && <p className="text-muted" style={{ fontSize: '.85rem' }}>No documents yet.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview + variable inputs */}
        {selectedTemplate && (
          <div>
            <div className="card mb-4">
              <div className="card-header">{selectedTemplate.name}</div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <PropCanvas
                  template={selectedTemplate}
                  variableData={variableData}
                />
              </div>
            </div>

            {(selectedTemplate.variables || []).length > 0 && (
              <div className="card">
                <div className="card-header">Fill Variables</div>
                <div className="card-body">
                  {(selectedTemplate.variables || []).map(v => (
                    <div key={v} className="form-group">
                      <label className="form-label">{v}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={variableData[v] || ''}
                        onChange={(e) => setVariableData({ ...variableData, [v]: e.target.value })}
                        placeholder={`Enter ${v}...`}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create Document</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
