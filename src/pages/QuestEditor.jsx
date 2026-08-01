import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import QuestCanvas from '../components/quest/QuestCanvas.jsx'
import QuestNodeEditor from '../components/quest/QuestNodeEditor.jsx'

export default function QuestEditor() {
  const [quests, setQuests] = useState(null)
  const [selectedQuestId, setSelectedQuestId] = useState(null)
  const [graph, setGraph] = useState({ nodes: [], edges: [], gates: [], rewards: [] })
  const [selectedNodeKey, setSelectedNodeKey] = useState(null)
  const [editingNode, setEditingNode] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lslPreview, setLslPreview] = useState(null)

  const loadQuests = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.questGraphList()
      setQuests(data.quests || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  const loadGraph = useCallback(async (questId) => {
    setLoading(true); setError(null)
    try {
      const data = await api.questGraphGet(questId)
      setGraph({
        nodes: data.nodes || [],
        edges: data.edges || [],
        gates: data.gates || [],
        rewards: data.rewards || [],
      })
      setSelectedNodeKey(null)
      setEditingNode(null)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { loadQuests() }, [loadQuests])
  useEffect(() => { if (selectedQuestId) loadGraph(selectedQuestId) }, [selectedQuestId, loadGraph])

  const handleDragNode = useCallback(async (nodeKey, x, y) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.node_key === nodeKey ? { ...n, pos_x: x, pos_y: y } : n),
    }))
  }, [])

  const handleDrawEdge = useCallback(async (fromKey, toKey) => {
    try {
      await api.questGraphAddEdge(selectedQuestId, fromKey, toKey)
      loadGraph(selectedQuestId)
    } catch (err) { setError(err.message) }
  }, [selectedQuestId, loadGraph])

  const handleAddNode = useCallback(async () => {
    try {
      const data = await api.questGraphAddNode(selectedQuestId, 100 + Math.random() * 200, 100 + Math.random() * 200)
      loadGraph(selectedQuestId)
    } catch (err) { setError(err.message) }
  }, [selectedQuestId, loadGraph])

  const handleSaveNode = useCallback(async (updates) => {
    if (!editingNode) return
    try {
      await api.questGraphUpdateNode(selectedQuestId, editingNode.node_key, {
        title: updates.title,
        node_type: updates.node_type,
        trigger_type: updates.trigger_type,
        trigger_value: updates.trigger_value,
        story_text: updates.story_text,
      })
      if (updates.gate) {
        await api.questGraphSaveGate(selectedQuestId, editingNode.node_key, updates.gate.combinator, updates.gate.conditions)
      }
      if (updates.rewards) {
        await api.questGraphSaveRewards(selectedQuestId, editingNode.node_key, updates.rewards)
      }
      loadGraph(selectedQuestId)
    } catch (err) { setError(err.message) }
  }, [editingNode, selectedQuestId, loadGraph])

  const handleGenerateLsl = useCallback(async () => {
    try {
      const data = await api.questGraphGenerateLsl(selectedQuestId)
      setLslPreview(data.lsl)
    } catch (err) { setError(err.message) }
  }, [selectedQuestId])

  const selectedNode = graph.nodes.find(n => n.node_key === selectedNodeKey)
  const editingNodeData = graph.nodes.find(n => n.node_key === editingNode?.node_key)
  const editingGate = graph.gates.find(g => g.node_key === editingNode?.node_key)
  const editingGateConditions = editingGate?.conditions || []
  const editingRewards = graph.rewards.filter(r => r.node_key === editingNode?.node_key)
  const editingEdges = graph.edges.filter(e => e.from_node_key === editingNode?.node_key)

  if (loading && !quests) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content" style={{ maxWidth: '100%', padding: 0 }}>
      {error && <div className="alert alert-danger" style={{ margin: '16px' }}>{error}</div>}

      {/* Quest selector breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 26px', background: '#1a1a14', borderBottom: '1px solid #3a3a2a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8f887d' }}>
            Quest Editor
          </span>
          {selectedQuestId && (
            <>
              <span style={{ color: '#5a6070' }}>/</span>
              <select
                value={selectedQuestId || ''}
                onChange={(e) => setSelectedQuestId(parseInt(e.target.value))}
                style={{ background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'serif', fontSize: '14px', padding: '4px 8px' }}
              >
                <option value="">Select a quest...</option>
                {(quests || []).map(q => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
            </>
          )}
        </div>
        {selectedQuestId && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAddNode} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #2A3D1F', borderRadius: '2px', color: '#b08d57', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 9px' }}>
              + New Task
            </button>
            <button onClick={handleGenerateLsl} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#8f887d', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 9px' }}>
              Generate LSL
            </button>
          </div>
        )}
      </div>

      {/* Main editor area */}
      {!selectedQuestId ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '16px', color: '#8f887d' }}>
            Select a quest from the dropdown above to start editing.
          </p>
          <div style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'serif', fontSize: '18px', color: '#b08d57', marginBottom: '12px' }}>Available Quests</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {(quests || []).map(q => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestId(q.id)}
                  style={{ padding: '12px 16px', background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontFamily: 'serif', fontSize: '14px', color: '#e8e3d0' }}>{q.title}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8f887d' }}>
                    {q.node_count || 0} nodes
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 26px', background: '#22221a', borderBottom: '1px solid #3a3a2a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} style={{ width: '30px', height: '28px', cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'monospace', fontSize: '14px' }}>+</button>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8f887d', width: '44px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.max(0.25, z / 1.2))} style={{ width: '30px', height: '28px', cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'monospace', fontSize: '14px' }}>-</button>
              <button onClick={() => { setZoom(1); }} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#8f887d', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 14px', height: '28px' }}>Fit</button>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '14px' }}>
              {[
                { label: 'START', color: '#2A3D1F' },
                { label: 'DIALOG', color: '#3a5a2a' },
                { label: 'COMBAT', color: '#8B4513' },
                { label: 'CHOICE', color: '#8a6a2a' },
                { label: 'END', color: '#555' },
                { label: 'FAILURE', color: '#702618' },
              ].map(l => (
                <div key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8f887d' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div style={{ position: 'relative', height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <QuestCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              selectedKey={selectedNodeKey}
              onSelectNode={(key) => setSelectedNodeKey(key)}
              onEditNode={(key) => {
                const node = graph.nodes.find(n => n.node_key === key)
                setEditingNode(node ? { node_key: key } : null)
              }}
              onDragNode={handleDragNode}
              onDrawEdge={handleDrawEdge}
              onZoom={setZoom}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 26px', background: '#1a1a14', borderTop: '1px solid #3a3a2a', fontFamily: 'monospace', fontSize: '9px', color: '#8f887d', letterSpacing: '1px' }}>
            <span>{graph.nodes.length} nodes · {graph.edges.length} edges</span>
            <span>Double-click a node to edit · Drag from right port to connect</span>
          </div>
        </>
      )}

      {/* Node editor modal */}
      {editingNode && (
        <QuestNodeEditor
          node={editingNodeData}
          gate={editingGate}
          gateConditions={editingGateConditions}
          rewards={editingRewards}
          edges={editingEdges}
          allNodes={graph.nodes}
          onClose={() => setEditingNode(null)}
          onSave={handleSaveNode}
        />
      )}

      {/* LSL preview modal */}
      {lslPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', overflow: 'auto' }}>
          <div style={{ background: '#1a1a14', border: '1px solid #b08d57', maxWidth: '700px', width: '100%', maxHeight: 'calc(100vh - 88px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #b08d57' }}>
              <span style={{ fontFamily: 'serif', fontSize: '22px', fontWeight: 600, color: '#e8e3d0' }}>LSL Preview</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(lslPreview) }}
                  style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#b08d57', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 9px' }}
                >Copy</button>
                <button onClick={() => setLslPreview(null)} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#8f887d', fontFamily: 'monospace', fontSize: '12px', padding: '5px 9px' }}>Close</button>
              </div>
            </div>
            <pre style={{ margin: 0, background: '#0f0f0a', color: '#e8e3d0', fontFamily: 'monospace', fontSize: '10.5px', lineHeight: 1.5, padding: '12px 14px', overflow: 'auto', flex: 1, whiteSpace: 'pre' }}>
              {lslPreview}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
