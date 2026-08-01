import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import PropCanvas from '../components/prop/PropCanvas.jsx'

const TEMPLATE_TYPES = ['decree', 'bounty', 'certificate', 'letter', 'poster', 'sigil', 'treaty', 'custom']
const FONT_FAMILIES = ['Libre Caslon Text', 'Oswald', 'Public Sans', 'JetBrains Mono']
const IMAGE_FILTERS = ['none', 'grayscale', 'sepia', 'brightness', 'contrast', 'saturate', 'invert']
const ALIGN_OPTIONS = ['left', 'center', 'right']
const VALIGN_OPTIONS = ['top', 'middle', 'bottom']

export default function PropEditor() {
  const [templates, setTemplates] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [template, setTemplate] = useState(null)
  const [variableData, setVariableData] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLayerIdx, setSelectedLayerIdx] = useState(-1)
  const [renderBase64, setRenderBase64] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.propListTemplates()
      setTemplates(data.templates || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  const loadTemplate = useCallback(async (id) => {
    setLoading(true); setError(null)
    try {
      const data = await api.propGetTemplate(id)
      setTemplate(data.template)
      setVariableData({})
      setSelectedLayerIdx(-1)
      setRenderBase64(null)
      setUploadResult(null)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])
  useEffect(() => { if (selectedId) loadTemplate(selectedId) }, [selectedId, loadTemplate])

  const updateLayer = (idx, field, value) => {
    if (!template || idx < 0) return
    const layers = [...(template.layers || [])]
    layers[idx] = { ...layers[idx], [field]: value }
    setTemplate({ ...template, layers })
  }

  const addTextLayer = () => {
    if (!template) return
    const layers = [...template.layers, {
      layerType: 'Text',
      text: 'New Text',
      fontFamily: 'Libre Caslon Text',
      fontSize: 16,
      fontWeight: 400,
      color: '#1a1a14',
      x: 50, y: 50, width: 400, height: 40,
      align: 'left', allowWrap: false,
    }]
    setTemplate({ ...template, layers })
    setSelectedLayerIdx(layers.length - 1)
  }

  const addImageLayer = () => {
    if (!template) return
    const layers = [...template.layers, {
      layerType: 'Image',
      imageUrl: '',
      x: 50, y: 50, width: 200, height: 200,
      imageFilter: 'none',
    }]
    setTemplate({ ...template, layers })
    setSelectedLayerIdx(layers.length - 1)
  }

  const deleteLayer = (idx) => {
    if (!template) return
    setTemplate({ ...template, layers: template.layers.filter((_, i) => i !== idx) })
    setSelectedLayerIdx(-1)
  }

  const moveLayer = (idx, dir) => {
    if (!template) return
    const layers = [...template.layers]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= layers.length) return
    ;[layers[idx], layers[newIdx]] = [layers[newIdx], layers[idx]]
    setTemplate({ ...template, layers })
    setSelectedLayerIdx(newIdx)
  }

  const handleSave = async () => {
    if (!template) return
    try {
      const data = await api.propSaveTemplate(
        template.id || 0,
        template.name, template.description, template.template_type,
        template.width, template.height, template.background_color,
        template.layers, template.variables
      )
      if (data.template_id) {
        setSelectedId(data.template_id)
        loadTemplates()
      }
    } catch (err) { setError(err.message) }
  }

  const handleRender = async () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const base64 = canvas.toDataURL('image/png').split(',')[1]
    setRenderBase64(base64)
  }

  const handleUpload = async () => {
    if (!renderBase64 || !template) return
    try {
      const data = await api.propCreateInstance(template.id, 'Render ' + new Date().toLocaleString(), variableData)
      if (data.instance_id) {
        await api.propSaveRender(data.instance_id, renderBase64)
        const uploadData = await api.propUploadToSl(data.instance_id)
        setUploadResult(uploadData)
      }
    } catch (err) { setError(err.message) }
  }

  if (loading && !templates) return <div className="page-content"><Loading /></div>

  const selectedLayer = template && selectedLayerIdx >= 0 ? template.layers[selectedLayerIdx] : null

  return (
    <div className="page-content">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem' }}>Document Template Editor</h2>

      {/* Template selector */}
      <div className="card mb-4">
        <div className="card-header">Templates</div>
        <div className="card-body">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(parseInt(e.target.value))}
            className="form-input"
            style={{ maxWidth: '400px' }}
          >
            <option value="">Select a template...</option>
            {(templates || []).map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.template_type})</option>
            ))}
          </select>
        </div>
      </div>

      {template && (
        <div className="grid grid-2">
          {/* Left: Canvas preview + render controls */}
          <div>
            <div className="card mb-4">
              <div className="card-header">Preview</div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <PropCanvas
                  template={template}
                  variableData={variableData}
                  width={template.width}
                  height={template.height}
                />
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleRender}>Render to PNG</button>
                  {renderBase64 && (
                    <button className="btn btn-outline btn-sm" onClick={handleUpload}>
                      Upload to SL
                    </button>
                  )}
                </div>
                {uploadResult && (
                  <div className="alert alert-success mt-2" style={{ fontSize: '.85rem' }}>
                    Uploaded! Asset UUID: {uploadResult.asset_uuid || 'N/A'}
                  </div>
                )}
              </div>
            </div>

            {/* Variable inputs */}
            {(template.variables || []).length > 0 && (
              <div className="card mb-4">
                <div className="card-header">Variables</div>
                <div className="card-body">
                  {(template.variables || []).map(v => (
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
                </div>
              </div>
            )}
          </div>

          {/* Right: Template settings + Layer editor */}
          <div>
            <div className="card mb-4">
              <div className="card-header">Template Settings</div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" value={template.name || ''} onChange={(e) => setTemplate({ ...template, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-input" value={template.description || ''} onChange={(e) => setTemplate({ ...template, description: e.target.value })} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Width</label>
                    <input type="number" className="form-input" value={template.width || 512} onChange={(e) => setTemplate({ ...template, width: parseInt(e.target.value) || 512 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height</label>
                    <input type="number" className="form-input" value={template.height || 640} onChange={(e) => setTemplate({ ...template, height: parseInt(e.target.value) || 640 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Background Color</label>
                  <input type="text" className="form-input" value={template.background_color || '#f5e6c8'} onChange={(e) => setTemplate({ ...template, background_color: e.target.value })} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Template</button>
              </div>
            </div>

            {/* Layer list */}
            <div className="card mb-4">
              <div className="card-header">
                Layers ({(template.layers || []).length})
                <span style={{ float: 'right' }}>
                  <button className="btn btn-outline btn-sm" onClick={addTextLayer} style={{ marginRight: '4px' }}>+ Text</button>
                  <button className="btn btn-outline btn-sm" onClick={addImageLayer}>+ Image</button>
                </span>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(template.layers || []).map((layer, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedLayerIdx(idx)}
                    style={{
                      padding: '8px 10px',
                      margin: '4px 0',
                      border: `1px solid ${idx === selectedLayerIdx ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: idx === selectedLayerIdx ? 'rgba(176,141,87,0.08)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.85rem', color: 'var(--gold)' }}>
                        {layer.layerType === 'Text' ? 'TEXT' : 'IMAGE'}: {(layer.text || layer.imageUrl || '').slice(0, 30)}
                      </span>
                      <span style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, -1) }} style={{ fontSize: '10px', padding: '2px 6px', cursor: 'pointer' }}>&uarr;</button>
                        <button onClick={(e) => { e.stopPropagation(); moveLayer(idx, 1) }} style={{ fontSize: '10px', padding: '2px 6px', cursor: 'pointer' }}>&darr;</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteLayer(idx) }} style={{ fontSize: '10px', padding: '2px 6px', cursor: 'pointer', color: 'var(--danger)' }}>DEL</button>
                      </span>
                    </div>
                  </div>
                ))}
                {(!template.layers || template.layers.length === 0) && (
                  <p className="text-muted" style={{ fontSize: '.85rem' }}>No layers. Add text or image layers above.</p>
                )}
              </div>
            </div>

            {/* Selected layer properties */}
            {selectedLayer && (
              <div className="card mb-4">
                <div className="card-header">Layer Properties</div>
                <div className="card-body">
                  {selectedLayer.layerType === 'Text' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Text</label>
                        <textarea className="form-input" value={selectedLayer.text || ''} onChange={(e) => updateLayer(selectedLayerIdx, 'text', e.target.value)} rows={3} style={{ fontFamily: 'serif' }} />
                      </div>
                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label">Font Family</label>
                          <select className="form-input" value={selectedLayer.fontFamily || 'Libre Caslon Text'} onChange={(e) => updateLayer(selectedLayerIdx, 'fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Font Size</label>
                          <input type="number" className="form-input" value={selectedLayer.fontSize || 16} onChange={(e) => updateLayer(selectedLayerIdx, 'fontSize', parseInt(e.target.value) || 16)} />
                        </div>
                      </div>
                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label">Font Weight</label>
                          <select className="form-input" value={selectedLayer.fontWeight || 400} onChange={(e) => updateLayer(selectedLayerIdx, 'fontWeight', parseInt(e.target.value))}>
                            <option value={400}>Regular (400)</option>
                            <option value={600}>Semibold (600)</option>
                            <option value={700}>Bold (700)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Color</label>
                          <input type="text" className="form-input" value={selectedLayer.color || '#000000'} onChange={(e) => updateLayer(selectedLayerIdx, 'color', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-3">
                        <div className="form-group">
                          <label className="form-label">Align</label>
                          <select className="form-input" value={selectedLayer.align || 'left'} onChange={(e) => updateLayer(selectedLayerIdx, 'align', e.target.value)}>
                            {ALIGN_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">V-Align</label>
                          <select className="form-input" value={selectedLayer.vAlign || 'top'} onChange={(e) => updateLayer(selectedLayerIdx, 'vAlign', e.target.value)}>
                            {VALIGN_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Wrap</label>
                          <select className="form-input" value={selectedLayer.allowWrap ? '1' : '0'} onChange={(e) => updateLayer(selectedLayerIdx, 'allowWrap', e.target.value === '1')}>
                            <option value="0">No</option>
                            <option value="1">Yes</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedLayer.layerType === 'Image' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Image URL</label>
                        <input type="text" className="form-input" value={selectedLayer.imageUrl || ''} onChange={(e) => updateLayer(selectedLayerIdx, 'imageUrl', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Filter</label>
                        <select className="form-input" value={selectedLayer.imageFilter || 'none'} onChange={(e) => updateLayer(selectedLayerIdx, 'imageFilter', e.target.value)}>
                          {IMAGE_FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="grid grid-4">
                    <div className="form-group">
                      <label className="form-label">X</label>
                      <input type="number" className="form-input" value={selectedLayer.x || 0} onChange={(e) => updateLayer(selectedLayerIdx, 'x', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Y</label>
                      <input type="number" className="form-input" value={selectedLayer.y || 0} onChange={(e) => updateLayer(selectedLayerIdx, 'y', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Width</label>
                      <input type="number" className="form-input" value={selectedLayer.width || 100} onChange={(e) => updateLayer(selectedLayerIdx, 'width', parseInt(e.target.value) || 100)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Height</label>
                      <input type="number" className="form-input" value={selectedLayer.height || 40} onChange={(e) => updateLayer(selectedLayerIdx, 'height', parseInt(e.target.value) || 40)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
