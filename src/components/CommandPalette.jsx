import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const ALL_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/profile', label: 'Character Sheet' },
  { path: '/character-creator', label: 'Character Creation' },
  { path: '/houses', label: 'Houses' },
  { path: '/house', label: 'House Management' },
  { path: '/war', label: 'War Council' },
  { path: '/settlement', label: 'Settlements' },
  { path: '/realm', label: 'Realm Management' },
  { path: '/blotter', label: 'Blotter & Moderation' },
  { path: '/pve', label: 'Dungeons & Bounties' },
  { path: '/quests', label: 'Quests' },
  { path: '/crafting', label: 'Crafting' },
  { path: '/activities', label: 'Activities' },
  { path: '/world', label: 'World Events' },
  { path: '/community', label: 'Leaderboards & Marketplace' },
  { path: '/directory', label: 'Citizen Directory' },
  { path: '/forms', label: 'Forms & Petitions' },
  { path: '/trade', label: 'Trade & Goods' },
  { path: '/raven', label: 'Raven Network' },
  { path: '/maester', label: 'The Citadel' },
  { path: '/events', label: 'Events' },
  { path: '/housing', label: 'Housing' },
  { path: '/ledger', label: 'Castle Ledger' },
  { path: '/factions', label: 'Factions' },
  { path: '/religion', label: 'Religion' },
  { path: '/health', label: 'Health Record' },
  { path: '/logs', label: 'History & Logs' },
  { path: '/compendium', label: 'Compendium' },
  { path: '/lore', label: 'Lore' },
  { path: '/tools', label: 'Tools' },
  { path: '/wiki', label: 'Wiki' },
  { path: '/admin', label: 'Admin Dashboard' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const openPalette = useCallback(() => {
    setOpen(true)
    setQuery('')
    setSelectedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, openPalette])

  const filtered = query
    ? ALL_PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_PAGES

  const handleSelect = (path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex].path)
    }
  }

  if (!open) return null

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-wrap">
          <span className="cmdk-icon">{'\u{1F50D}'}</span>
          <input
            ref={inputRef}
            type="text"
            className="cmdk-input"
            placeholder="Search pages... (Ctrl+K)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>
        <div className="cmdk-results">
          {filtered.length === 0 ? (
            <div className="cmdk-empty">No pages found</div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.path}
                className={`cmdk-item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => handleSelect(p.path)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="cmdk-item-icon">{'\u{1F4C2}'}</span>
                <span className="cmdk-item-label">{p.label}</span>
                <span className="cmdk-item-path">{p.path}</span>
              </div>
            ))
          )}
        </div>
        <div className="cmdk-footer">
          <kbd>{'\u2191'}{'\u2193'}</kbd> navigate
          <kbd>Enter</kbd> select
          <kbd>Esc</kbd> close
        </div>
      </div>
    </div>
  )
}
