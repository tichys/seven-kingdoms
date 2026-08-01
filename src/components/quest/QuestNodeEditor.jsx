import { useState, useEffect } from 'react'
import QuestGateBuilder from './QuestGateBuilder.jsx'

const NODE_TYPES = ['start', 'dialog', 'combat', 'fetch', 'interact', 'choice', 'end', 'failure']
const TRIGGER_TYPES = ['dialog_choice', 'status_changed', 'item_acquired', 'location_entered', 'npc_interact']
const REWARD_TYPES = ['gold', 'item', 'xp', 'faction_rep', 'title', 'status']

export default function QuestNodeEditor({ node, gate, gateConditions, rewards, edges, allNodes, onClose, onSave }) {
  const [title, setTitle] = useState(node?.title || 'New Task')
  const [nodeType, setNodeType] = useState(node?.node_type || 'dialog')
  const [triggerType, setTriggerType] = useState(node?.trigger_type || 'dialog_choice')
  const [triggerValue, setTriggerValue] = useState(node?.trigger_value || '')
  const [storyText, setStoryText] = useState(node?.story_text || '')
  const [gateData, setGateData] = useState({ combinator: gate?.combinator || 'AND', conditions: gateConditions || [] })
  const [rewardList, setRewardList] = useState(rewards || [])
  const [activeSection, setActiveSection] = useState('trigger')

  if (!node) return null

  const handleSave = () => {
    if (onSave) {
      onSave({
        title, node_type: nodeType, trigger_type: triggerType, trigger_value: triggerValue,
        story_text: storyText, gate: gateData, rewards: rewardList,
      })
    }
    onClose()
  }

  const sections = [
    { id: 'trigger', label: 'A · Trigger' },
    { id: 'story', label: 'B · Story' },
    { id: 'paths', label: 'C · Paths' },
    { id: 'gate', label: 'D · Prerequisites' },
    { id: 'rewards', label: 'E · Rewards' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', overflow: 'auto',
    }}>
      <div style={{
        background: '#1a1a14', border: '1px solid #b08d57', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.6)',
        maxWidth: '700px', width: '100%', maxHeight: 'calc(100vh - 88px)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', borderBottom: '1px solid #b08d57' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', color: '#8f887d' }}>
              Task Editor
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%', marginTop: '2px', background: 'transparent', border: 'none', borderBottom: '1px solid transparent',
                fontFamily: 'serif', fontSize: '22px', fontWeight: 600, color: '#e8e3d0', outline: 'none', padding: '0 0 2px',
              }}
              placeholder="Task title..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', color: '#8f887d', border: '1px solid #3a3a2a', borderRadius: '2px', padding: '4px 8px' }}>
              {node.node_key?.slice(0, 12)}...
            </span>
            <button onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#8f887d', fontFamily: 'monospace', fontSize: '12px', padding: '5px 9px' }}>
              Close
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #3a3a2a', padding: '0 20px' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '10px 14px', cursor: 'pointer', background: 'transparent', border: 'none',
                borderBottom: activeSection === s.id ? '2px solid #b08d57' : '2px solid transparent',
                fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.4px', textTransform: 'uppercase',
                color: activeSection === s.id ? '#e8e3d0' : '#8f887d',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px', overflow: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {/* Section A: Trigger */}
          {activeSection === 'trigger' && (
            <div>
              <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '7px' }}>
                Trigger Type
              </label>
              <div style={{ display: 'inline-flex', border: '1px solid #3a3a2a', borderRadius: '2px', overflow: 'hidden', flexWrap: 'wrap' }}>
                {TRIGGER_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTriggerType(t)}
                    style={{
                      padding: '6px 11px', cursor: 'pointer', border: 'none', borderLeft: '1px solid #3a3a2a',
                      background: triggerType === t ? '#b08d57' : 'transparent',
                      color: triggerType === t ? '#1a1a14' : '#8f887d',
                      fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.8px', textTransform: 'uppercase',
                    }}
                  >
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '8px', marginBottom: '14px' }}>
                <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '7px' }}>
                  Trigger Value
                </label>
                <input
                  type="text"
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="Trigger parameter (e.g. dialog option name, status flag, item ID)..."
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.5px solid #b08d57', borderRadius: 0, fontFamily: 'serif', fontSize: '15px', color: '#e8e3d0', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '12px', color: '#8f887d', marginTop: '8px' }}>
                  The event that fires this task when the player meets prerequisites.
                </div>
              </div>
              <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '7px' }}>
                Node Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                style={{ background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'sans-serif', fontSize: '13px', padding: '7px 9px', width: '100%', boxSizing: 'border-box' }}
              >
                {NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Section B: Story */}
          {activeSection === 'story' && (
            <div>
              <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '7px' }}>
                Story Description
              </label>
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="The narrative text shown to the player when this task is active..."
                maxLength={5000}
                style={{
                  width: '100%', minHeight: '120px', resize: 'vertical', background: '#2a2a20',
                  border: '1px solid #3a3a2a', borderRadius: '2px', fontFamily: 'serif', fontSize: '14px',
                  lineHeight: 1.5, color: '#e8e3d0', padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#8f887d', marginTop: '4px' }}>
                {storyText.length} / 5000 chars
              </div>
            </div>
          )}

          {/* Section C: Paths */}
          {activeSection === 'paths' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#e8e3d0' }}>
                  Paths (Edges)
                </span>
              </div>
              {edges && edges.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {edges.map((edge, i) => {
                    const target = allNodes?.find(n => n.node_key === edge.to_node_key)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8f887d' }}>&rarr;</span>
                        <span style={{ fontFamily: 'serif', fontSize: '13px', color: '#e8e3d0' }}>
                          {target?.title || edge.to_node_key}
                        </span>
                        {edge.condition_subject && (
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#b08d57' }}>
                            IF {edge.condition_subject} {edge.condition_operator} {edge.condition_value}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '13px', color: '#8f887d' }}>
                  No paths from this node. Draw edges on the canvas by dragging from the right-side port to another node's left-side port.
                </div>
              )}
            </div>
          )}

          {/* Section D: Prerequisites (Gate) */}
          {activeSection === 'gate' && (
            <QuestGateBuilder
              gate={gate}
              conditions={gateConditions}
              onChange={(data) => setGateData(data)}
            />
          )}

          {/* Section E: Rewards */}
          {activeSection === 'rewards' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#e8e3d0' }}>
                  Rewards
                </span>
                <button
                  onClick={() => setRewardList([...rewardList, { reward_type: 'gold', amount: 0, kind: '', chance: 100 }])}
                  style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #2A3D1F', borderRadius: '2px', color: '#b08d57', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 9px' }}
                >+ Add Reward</button>
              </div>
              {rewardList.length === 0 ? (
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '13px', color: '#8f887d' }}>
                  No rewards. Players receive nothing when completing this task.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rewardList.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) => setRewardList(rewardList.map((rr, i) => i === idx ? { ...rr, amount: parseInt(e.target.value) || 0 } : rr))}
                        style={{ width: '90px', flexShrink: 0, background: 'transparent', border: 'none', borderBottom: '1.5px solid #b08d57', borderRadius: 0, fontFamily: 'monospace', fontSize: '14px', color: '#e8e3d0', padding: '4px 0', outline: 'none', textAlign: 'right' }}
                      />
                      <select
                        value={r.reward_type}
                        onChange={(e) => setRewardList(rewardList.map((rr, i) => i === idx ? { ...rr, reward_type: e.target.value } : rr))}
                        style={{ flexShrink: 0, background: 'transparent', border: 'none', borderBottom: '1.5px solid #b08d57', borderRadius: 0, fontFamily: 'serif', fontSize: '15px', color: '#e8e3d0', padding: '4px 0', outline: 'none' }}
                      >
                        {REWARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        value={r.kind}
                        onChange={(e) => setRewardList(rewardList.map((rr, i) => i === idx ? { ...rr, kind: e.target.value } : rr))}
                        placeholder="kind (item name, faction, title...)"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', borderBottom: '1.5px solid #b08d57', borderRadius: 0, fontFamily: 'serif', fontSize: '15px', color: '#e8e3d0', padding: '4px 0', outline: 'none' }}
                      />
                      <input
                        type="number"
                        value={r.chance}
                        onChange={(e) => setRewardList(rewardList.map((rr, i) => i === idx ? { ...rr, chance: Math.max(0, Math.min(100, parseInt(e.target.value) || 100)) } : rr))}
                        style={{ width: '56px', flexShrink: 0, background: 'transparent', border: 'none', borderBottom: '1.5px solid #b08d57', borderRadius: 0, fontFamily: 'monospace', fontSize: '14px', color: '#e8e3d0', padding: '4px 0', outline: 'none', textAlign: 'right' }}
                      />
                      <span style={{ fontFamily: 'serif', fontSize: '14px', color: '#8f887d' }}>%</span>
                      <button
                        onClick={() => setRewardList(rewardList.filter((_, i) => i !== idx))}
                        style={{ flexShrink: 0, cursor: 'pointer', background: 'transparent', border: '1px solid #702618', borderRadius: '2px', color: '#702618', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', padding: '5px 8px' }}
                      >DEL</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #b08d57', padding: '12px 20px', background: '#22221a' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#8f887d' }}>
            {node.is_fired == 1 ? 'FIRED' : 'NOT FIRED'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#8f887d', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '9px 16px' }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ cursor: 'pointer', background: '#2A3D1F', border: '1px solid #2A3D1F', borderRadius: '2px', color: '#ECEBE3', fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '9px 16px' }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
