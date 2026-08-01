import { useRef, useEffect, useCallback, useState } from 'react'

const NODE_WIDTH = 236
const NODE_HEIGHT = 64
const PORT_RADIUS = 8

export default function QuestCanvas({ nodes, edges, selectedKey, onSelectNode, onEditNode, onDragNode, onDrawEdge, onZoom }) {
  const viewportRef = useRef(null)
  const worldRef = useRef(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [dragState, setDragState] = useState(null)
  const [edgeDraw, setEdgeDraw] = useState(null)
  const [ghostPath, setGhostPath] = useState(null)

  const applyTransform = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
    }
  }, [pan, zoom])

  useEffect(() => { applyTransform() }, [applyTransform])

  // Pan + zoom via wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = viewportRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const factor = Math.exp(-e.deltaY * 0.0015)
    const newZoom = Math.min(3, Math.max(0.25, zoom * factor))
    const k = newZoom / zoom
    setPan(prev => ({
      x: px - (px - prev.x) * k,
      y: py - (py - prev.y) * k,
    }))
    setZoom(newZoom)
    if (onZoom) onZoom(newZoom)
  }, [zoom, onZoom])

  // Pointer down on background = pan
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target === viewportRef.current || e.target === worldRef.current || e.target.tagName === 'svg') {
      setDragState({
        type: 'pan',
        startX: e.clientX - pan.x,
        startY: e.clientY - pan.y,
      })
    }
  }, [pan])

  // Node drag
  const handleNodePointerDown = useCallback((e, node) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const rect = viewportRef.current.getBoundingClientRect()
    setDragState({
      type: 'node',
      node,
      offsetX: e.clientX - rect.left - pan.x - node.pos_x * zoom,
      offsetY: e.clientY - rect.top - pan.y - node.pos_y * zoom,
      startX: e.clientX,
      startY: e.clientY,
    })
  }, [pan, zoom])

  // Port drag (edge drawing)
  const handlePortPointerDown = useCallback((e, node) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const rect = viewportRef.current.getBoundingClientRect()
    const startX = (node.pos_x + NODE_WIDTH) * zoom + pan.x + rect.left
    const startY = (node.pos_y + NODE_HEIGHT / 2) * zoom + pan.y + rect.top
    setEdgeDraw({ fromNode: node, startX, startY })
  }, [pan, zoom])

  // Pointer move
  useEffect(() => {
    function handleMove(e) {
      if (!dragState && !edgeDraw) return

      if (edgeDraw) {
        const rect = viewportRef.current.getBoundingClientRect()
        const ex = e.clientX - rect.left - pan.x
        const ey = e.clientY - rect.top - pan.y
        const fx = edgeDraw.fromNode.pos_x + NODE_WIDTH
        const fy = edgeDraw.fromNode.pos_y + NODE_HEIGHT / 2
        const dx = Math.max(46, Math.abs(ex - fx) * 0.5)
        setGhostPath(`M${fx},${fy} C${fx + dx},${fy} ${ex - dx},${ey} ${ex},${ey}`)
        return
      }

      if (dragState?.type === 'pan') {
        setPan({ x: e.clientX - dragState.startX, y: e.clientY - dragState.startY })
      } else if (dragState?.type === 'node') {
        const rect = viewportRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - pan.x - dragState.offsetX) / zoom
        const y = (e.clientY - rect.top - pan.y - dragState.offsetY) / zoom
        if (onDragNode) onDragNode(dragState.node.node_key, x, y)
      }
    }

    function handleUp(e) {
      if (edgeDraw) {
        // Hit test: did we drop on a node's in-port?
        const rect = viewportRef.current.getBoundingClientRect()
        const ex = (e.clientX - rect.left - pan.x) / zoom
        const ey = (e.clientY - rect.top - pan.y) / zoom
        const target = nodes.find(n =>
          ex >= n.pos_x && ex <= n.pos_x + NODE_WIDTH &&
          ey >= n.pos_y && ey <= n.pos_y + NODE_HEIGHT &&
          n.node_key !== edgeDraw.fromNode.node_key
        )
        if (target && onDrawEdge) {
          onDrawEdge(edgeDraw.fromNode.node_key, target.node_key)
        }
        setEdgeDraw(null)
        setGhostPath(null)
      }

      if (dragState?.type === 'node') {
        const dx = Math.abs(e.clientX - dragState.startX)
        const dy = Math.abs(e.clientY - dragState.startY)
        if (dx <= 4 && dy <= 4 && onSelectNode) {
          onSelectNode(dragState.node.node_key)
        }
      }

      setDragState(null)
    }

    if (dragState || edgeDraw) {
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }
  }, [dragState, edgeDraw, nodes, pan, zoom, onSelectNode, onDragNode, onDrawEdge])

  // Double-click to edit
  const lastClickRef = useRef({ key: null, time: 0 })
  const handleNodeClick = useCallback((node) => {
    const now = Date.now()
    if (lastClickRef.current.key === node.node_key && now - lastClickRef.current.time < 400) {
      if (onEditNode) onEditNode(node.node_key)
      lastClickRef.current = { key: null, time: 0 }
    } else {
      if (onSelectNode) onSelectNode(node.node_key)
      lastClickRef.current = { key: node.node_key, time: now }
    }
  }, [onSelectNode, onEditNode])

  // Compute bezier path for an edge
  const edgePath = (from, to) => {
    const fx = from.pos_x + NODE_WIDTH
    const fy = from.pos_y + NODE_HEIGHT / 2
    const tx = to.pos_x
    const ty = to.pos_y + NODE_HEIGHT / 2
    const dx = Math.max(46, Math.abs(tx - fx) * 0.5)
    return `M${fx},${fy} C${fx + dx},${fy} ${tx - dx},${ty} ${tx},${ty}`
  }

  const nodeColors = {
    start: '#2A3D1F',
    dialog: '#3a5a2a',
    combat: '#8B4513',
    fetch: '#4a6a8a',
    interact: '#6a4a8a',
    choice: '#8a6a2a',
    end: '#555',
    failure: '#702618',
  }

  return (
    <div
      ref={viewportRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: dragState?.type === 'pan' ? 'grabbing' : 'default',
        background: '#1a1a14',
      }}
    >
      <div ref={worldRef} style={{ position: 'absolute', inset: 0, transformOrigin: '0 0' }}>
        {/* SVG edges layer */}
        <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width="100%" height="100%">
          {edges.map((edge, i) => {
            const from = nodes.find(n => n.node_key === edge.from_node_key)
            const to = nodes.find(n => n.node_key === edge.to_node_key)
            if (!from || !to) return null
            const d = edgePath(from, to)
            return (
              <g key={i}>
                <path d={d} stroke="transparent" strokeWidth="16" fill="none" style={{ pointerEvents: 'stroke', cursor: 'pointer' }} />
                <path d={d} stroke="#5a6070" strokeWidth="2" fill="none" />
                <polygon
                  points={`${to.pos_x},${to.pos_y + NODE_HEIGHT / 2} ${to.pos_x - 9},${to.pos_y + NODE_HEIGHT / 2 - 5} ${to.pos_x - 9},${to.pos_y + NODE_HEIGHT / 2 + 5}`}
                  fill="#5a6070"
                />
              </g>
            )
          })}
          {ghostPath && (
            <path d={ghostPath} stroke="#5a6070" strokeWidth="2" strokeDasharray="6 4" fill="none" />
          )}
        </svg>

        {/* Node layer */}
        {nodes.map(node => {
          const color = nodeColors[node.node_type] || '#3a5a2a'
          const isSelected = node.node_key === selectedKey
          return (
            <div
              key={node.node_key}
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onClick={() => handleNodeClick(node)}
              style={{
                position: 'absolute',
                left: node.pos_x,
                top: node.pos_y,
                width: NODE_WIDTH,
                minHeight: NODE_HEIGHT,
                background: '#2a2a20',
                border: `2px solid ${isSelected ? '#b08d57' : color}`,
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'grab',
                userSelect: 'none',
                boxShadow: isSelected ? '0 0 0 1px #b08d57' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: color,
              }}>
                {node.node_type}
              </div>
              <div style={{
                fontSize: '13px',
                fontFamily: 'serif',
                color: '#e8e3d0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {node.title}
              </div>
              {/* Out port (right side) */}
              <div
                onPointerDown={(e) => handlePortPointerDown(e, node)}
                style={{
                  position: 'absolute',
                  right: -PORT_RADIUS,
                  top: NODE_HEIGHT / 2 - PORT_RADIUS,
                  width: PORT_RADIUS * 2,
                  height: PORT_RADIUS * 2,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'crosshair',
                  border: '2px solid #1a1a14',
                }}
              />
              {/* In port (left side) */}
              <div
                style={{
                  position: 'absolute',
                  left: -PORT_RADIUS,
                  top: NODE_HEIGHT / 2 - PORT_RADIUS,
                  width: PORT_RADIUS * 2,
                  height: PORT_RADIUS * 2,
                  borderRadius: '50%',
                  background: '#444',
                  border: '2px solid #1a1a14',
                }}
              />
              {/* Fired indicator */}
              {node.is_fired == 1 && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#2A3D1F',
                  border: '1px solid #1a1a14',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
