import { useRef, useEffect, useCallback } from 'react'

// =====================================================
// PropCanvas — HTML5 Canvas layered text/image renderer
// Adapted from Munibase prop-render.js for ASOIAF docs
// =====================================================
// Layer types: Text (font, color, align, wrap) + Image (url, filter, aspect)
// Variables: [VariableName] replaced at render time
// =====================================================

export default function PropCanvas({ template, variableData, width, height }) {
  const canvasRef = useRef(null)

  const replaceVariables = useCallback((text, vars) => {
    if (!text || !vars) return text || ''
    return text.replace(/\[([^\]]+)\]/g, (match, name) => vars[name] ?? match)
  }, [])

  const wrapText = useCallback((ctx, text, maxWidth) => {
    const paragraphs = text.split(/\r?\n/)
    const lines = []
    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(''); continue }
      const words = para.trim().split(/\s+/)
      let current = ''
      for (const word of words) {
        if (!current) {
          lines.push(word)
          current = word
          continue
        }
        const candidate = current + ' ' + word
        if (ctx.measureText(candidate).width <= maxWidth) {
          lines[lines.length - 1] = candidate
          current = candidate
        } else {
          lines.push(word)
          current = word
        }
      }
    }
    return lines.length > 0 ? lines : ['']
  }, [])

  const renderLayer = useCallback(async (ctx, layer, vars) => {
    ctx.save()
    try {
      ctx.globalAlpha = layer.opacity ?? 1.0

      if (layer.rotation) {
        const cx = (layer.x || 0) + (layer.width || 100) / 2
        const cy = (layer.y || 0) + (layer.height || 100) / 2
        ctx.translate(cx, cy)
        ctx.rotate(layer.rotation * Math.PI / 180)
        ctx.translate(-cx, -cy)
      }

      if (layer.layerType === 'Text' || layer.layerType === 0) {
        let text = replaceVariables(layer.text || '', vars)
        const fontSize = layer.fontSize || 16
        const fontFamily = layer.fontFamily || 'serif'
        const fontWeight = layer.fontWeight || 400
        const fontStyle = layer.fontStyle || 'normal'
        const lineHeightFactor = parseFloat(layer.lineHeight || 1.2)
        const hAlign = (layer.align || 'left').toLowerCase()
        const vAlign = (layer.vAlign || 'top').toLowerCase()

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", serif`
        ctx.fillStyle = layer.color || '#000000'
        ctx.textAlign = ['center', 'right'].includes(hAlign) ? hAlign : 'left'
        ctx.textBaseline = 'middle'

        const x = layer.x || 0
        const y = layer.y || 0
        const lw = layer.width || 100
        const lh = layer.height || 20

        if (layer.bgColor) {
          ctx.fillStyle = layer.bgColor
          ctx.fillRect(x, y, lw, lh)
        }

        if (!text) { ctx.restore(); return }

        ctx.fillStyle = layer.color || '#000000'
        const allowWrap = layer.allowWrap ?? false
        const maxTextWidth = Math.max(1, lw - 20)
        const lines = allowWrap ? wrapText(ctx, text, maxTextWidth) : text.split(/\r?\n/)
        const lineHeight = Math.max(1, fontSize * lineHeightFactor)
        const totalHeight = lineHeight * lines.length

        let anchorX = x + 10
        if (hAlign === 'center') anchorX = x + lw / 2
        else if (hAlign === 'right') anchorX = x + lw - 10

        let firstY
        if (vAlign === 'middle' || vAlign === 'center') {
          firstY = y + (lh - totalHeight) / 2 + lineHeight / 2
        } else if (vAlign === 'bottom') {
          firstY = y + lh - totalHeight + lineHeight / 2
        } else {
          firstY = y + lineHeight / 2 + 5
        }

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], anchorX, firstY + i * lineHeight)
        }
      } else if (layer.layerType === 'Image' || layer.layerType === 1) {
        let imageUrl = replaceVariables(layer.imageUrl || '', vars)
        if (!imageUrl) {
          ctx.fillStyle = layer.bgColor || '#f0f0f0'
          ctx.fillRect(layer.x || 0, layer.y || 0, layer.width || 100, layer.height || 100)
          ctx.restore()
          return
        }

        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = imageUrl
          })

          const filter = layer.imageFilter || 'none'
          if (filter !== 'none') {
            const filterMap = {
              grayscale: 'grayscale(100%)',
              sepia: 'sepia(100%)',
              brightness: 'brightness(115%)',
              contrast: 'contrast(125%)',
              saturate: 'saturate(130%)',
              invert: 'invert(100%)',
            }
            ctx.filter = filterMap[filter] || 'none'
          }

          ctx.drawImage(img, layer.x || 0, layer.y || 0, layer.width || 100, layer.height || 100)
          ctx.filter = 'none'
        } catch {
          ctx.fillStyle = '#ffcccc'
          ctx.fillRect(layer.x || 0, layer.y || 0, layer.width || 100, layer.height || 100)
        }
      }
    } finally {
      ctx.restore()
    }
  }, [replaceVariables, wrapText])

  const render = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !template) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = template.width || 512
    canvas.height = template.height || 640

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (template.background_color) {
      ctx.fillStyle = template.background_color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const layers = template.layers || []
    const vars = variableData || {}

    if (document.fonts) {
      const families = new Set()
      for (const layer of layers) {
        const fam = (layer.fontFamily || '').trim()
        if (fam) families.add(fam)
      }
      try {
        await Promise.all(Array.from(families).map(f => document.fonts.load(`16px "${f}"`).catch(() => {})))
        await document.fonts.ready
      } catch {}
    }

    for (const layer of layers) {
      if (layer.show !== false) {
        await renderLayer(ctx, layer, vars)
      }
    }
  }, [template, variableData, renderLayer])

  useEffect(() => { render() }, [render])

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        maxHeight: '70vh',
        border: '1px solid #3a3a2a',
        borderRadius: '4px',
        objectFit: 'contain',
      }}
    />
  )
}
