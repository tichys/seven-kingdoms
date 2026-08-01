import { useState } from 'react'

const CONDITION_TYPES = [
  { value: 'house', label: 'House Membership', desc: 'Check if player belongs to a house' },
  { value: 'faction', label: 'Faction Reputation', desc: 'Check faction reputation level' },
  { value: 'skill', label: 'Skill Level', desc: 'Check player skill level' },
  { value: 'item', label: 'Item Possession', desc: 'Check if player has an item' },
  { value: 'quest', label: 'Quest Completion', desc: 'Check if another quest is complete' },
  { value: 'rep', label: 'Reputation Score', desc: 'Check overall reputation' },
  { value: 'level', label: 'Character Level', desc: 'Check character level' },
  { value: 'dialog_choice', label: 'Dialog Choice', desc: 'Check a previous dialog selection' },
]

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'in', label: 'in' },
]

export default function QuestGateBuilder({ gate, conditions, onChange }) {
  const [combinator, setCombinator] = useState(gate?.combinator || 'AND')
  const [clauses, setClauses] = useState(conditions || [])
  const [showAdd, setShowAdd] = useState(false)

  const update = (newComb, newClauses) => {
    setCombinator(newComb)
    setClauses(newClauses)
    if (onChange) onChange({ combinator: newComb, conditions: newClauses })
  }

  const addCondition = (type) => {
    setShowAdd(false)
    const newClauses = [...clauses, { condition_type: type, subject: '', operator: 'eq', value: '' }]
    update(combinator, newClauses)
  }

  const removeCondition = (idx) => {
    update(combinator, clauses.filter((_, i) => i !== idx))
  }

  const updateCondition = (idx, field, val) => {
    const newClauses = clauses.map((c, i) => i === idx ? { ...c, [field]: val } : c)
    update(combinator, newClauses)
  }

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d' }}>
          Gate — Prerequisites
        </span>
      </div>

      {/* Combinator */}
      <div style={{ display: 'inline-flex', border: '1px solid #3a3a2a', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
        <button
          onClick={() => update('AND', clauses)}
          style={{
            padding: '6px 20px', cursor: 'pointer', border: 'none', background: combinator === 'AND' ? '#2A3D1F' : 'transparent',
            color: combinator === 'AND' ? '#ECEBE3' : '#8f887d', fontFamily: 'monospace', fontSize: '10px',
            fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase',
          }}
        >AND</button>
        <button
          onClick={() => update('OR', clauses)}
          style={{
            padding: '6px 20px', cursor: 'pointer', border: 'none', borderLeft: '1px solid #3a3a2a', background: combinator === 'OR' ? '#702618' : 'transparent',
            color: combinator === 'OR' ? '#ECEBE3' : '#8f887d', fontFamily: 'monospace', fontSize: '10px',
            fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase',
          }}
        >OR</button>
      </div>

      {/* Clauses */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {clauses.length === 0 && (
          <div style={{ border: '1px dashed #3a3a2a', padding: '18px', textAlign: 'center', borderRadius: '2px' }}>
            <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '13px', color: '#8f887d' }}>
              No prerequisites. The task is always available.
            </span>
          </div>
        )}

        {clauses.map((c, idx) => {
          const typeInfo = CONDITION_TYPES.find(t => t.value === c.condition_type)
          return (
            <div key={idx} style={{
              border: '1px solid #3a3a2a',
              borderLeft: `3px solid ${combinator === 'AND' ? '#2A3D1F' : '#702618'}`,
              borderRadius: '2px',
              padding: '11px 13px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '11px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', color: '#8f887d', border: '1px solid #3a3a2a', borderRadius: '2px', padding: '3px 6px' }}>
                  {typeInfo?.label || c.condition_type}
                </span>
                <button
                  onClick={() => removeCondition(idx)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #702618', color: '#702618', borderRadius: '2px', fontSize: '11px', padding: '4px 7px', cursor: 'pointer', fontFamily: 'monospace' }}
                >DEL</button>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                  <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '5px' }}>Subject</label>
                  <input
                    type="text"
                    value={c.subject}
                    onChange={(e) => updateCondition(idx, 'subject', e.target.value)}
                    placeholder="house_id, faction_id, skill_name..."
                    style={{ width: '100%', background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'sans-serif', fontSize: '12px', padding: '6px 8px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: '0 1 80px' }}>
                  <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '5px' }}>Op</label>
                  <select
                    value={c.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    style={{ width: '100%', background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'sans-serif', fontSize: '12px', padding: '6px 8px', boxSizing: 'border-box' }}
                  >
                    {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                  <label style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', display: 'block', marginBottom: '5px' }}>Value</label>
                  <input
                    type="text"
                    value={c.value}
                    onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                    placeholder="value..."
                    style={{ width: '100%', background: '#2a2a20', border: '1px solid #3a3a2a', borderRadius: '2px', color: '#e8e3d0', fontFamily: 'sans-serif', fontSize: '12px', padding: '6px 8px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* AND/OR dividers between clauses */}
        {clauses.length > 1 && clauses.map((_, i) => {
          if (i === 0) return null
          return (
            <div key={`div-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '-3px 0' }}>
              <div style={{ flex: 1, borderBottom: '1px dashed #3a3a2a' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1.5px', color: combinator === 'AND' ? '#2A3D1F' : '#702618' }}>
                {combinator}
              </span>
              <div style={{ flex: 1, borderBottom: '1px dashed #3a3a2a' }} />
            </div>
          )
        })}
      </div>

      {/* Add condition */}
      <div style={{ marginTop: '8px' }}>
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              cursor: 'pointer', background: 'transparent', border: '1px solid #2A3D1F',
              borderRadius: '2px', color: '#b08d57', fontFamily: 'monospace', fontSize: '9px',
              fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 9px',
            }}
          >+ Add Condition</button>
        ) : (
          <div style={{ border: '1px solid #3a3a2a', borderRadius: '2px', background: '#2a2a20', maxWidth: '330px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', padding: '8px 12px 5px', borderBottom: '1px solid #3a3a2a' }}>
              Condition Type
            </div>
            {CONDITION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => addCondition(t.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', textAlign: 'left',
                  padding: '9px 12px', cursor: 'pointer', background: 'transparent', border: 'none',
                  borderBottom: '1px dashed #2a2a20',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold', border: '1px solid #3a3a2a', borderRadius: '2px', padding: '3px 5px', color: '#8f887d', flexShrink: 0 }}>
                  {t.value.slice(0, 4).toUpperCase()}
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 600, color: '#e8e3d0' }}>{t.label}</span>
                  <span style={{ display: 'block', fontFamily: 'serif', fontStyle: 'italic', fontSize: '11px', color: '#8f887d' }}>{t.desc}</span>
                </span>
              </button>
            ))}
            <button onClick={() => setShowAdd(false)} style={{ width: '100%', padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none', borderTop: '1px solid #3a3a2a', color: '#8f887d', fontFamily: 'monospace', fontSize: '10px' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Reads-as preview */}
      {clauses.length > 0 && (
        <div style={{ marginTop: '12px', border: '1px solid #3a3a2a', borderLeft: '3px solid #b08d57', padding: '10px 13px', borderRadius: '2px', background: '#22221a' }}>
          <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8f887d', marginBottom: '6px' }}>
            Reads As
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e8e3d0' }}>
            {clauses.map((c, i) => (
              <span key={i}>
                {i > 0 && <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', color: combinator === 'AND' ? '#2A3D1F' : '#702618', margin: '0 4px' }}>{combinator}</span>}
                <strong style={{ fontWeight: 600 }}>{c.subject || '...'}</strong>
                <span style={{ color: '#8f887d' }}> {OPERATORS.find(o => o.value === c.operator)?.label || '='} </span>
                <strong style={{ fontWeight: 600 }}>{c.value || '...'}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
