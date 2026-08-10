import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { sounds } from '../utils/sounds.js'
import NotificationBell from './NotificationBell.jsx'
import Icon from './Icon.jsx'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('asoiaf_theme') || 'dark')
  const [soundOn, setSoundOn] = useState(sounds.isEnabled())
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('asoiaf_theme', theme)
  }, [theme])

  useEffect(() => {
    setOpen(false)
    setOpenDropdown(null)
  }, [location.pathname])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const toggleSound = () => { const on = sounds.toggle(); setSoundOn(on); if (on) sounds.click() }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''
  const closeMenu = () => setOpen(false)

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/houses', label: 'Houses' },
    { path: '/compendium', label: 'Compendium' },
    { path: '/lore', label: 'Lore' },
    { path: '/tools', label: 'Tools' },
    { path: '/wiki', label: 'Wiki' },
  ]

  const authLinks = isAuthenticated ? [{ path: '/logs', label: 'Logs' }] : []

  const dropdowns = []
  if (isAuthenticated) {
    dropdowns.push({
      id: 'character', label: 'Character', icon: 'shield', items: [
        { path: '/profile', label: 'Character Sheet' },
        { path: '/character-creator', label: 'Character Creation' },
        { path: '/house', label: 'House Management' },
        { path: '/lineage', label: 'Lineage & Bloodlines' },
        { path: '/politics', label: 'Politics & Decrees' },
        { path: '/diplomacy', label: 'Diplomacy & Treaties' },
        { path: '/factions', label: 'Factions' },
        { path: '/religion', label: 'Religion' },
        { path: '/health', label: 'Health Record' },
      ]
    })
    dropdowns.push({
      id: 'adventure', label: 'Adventure', icon: 'sword', items: [
        { path: '/war', label: 'War Council' },
        { path: '/settlement', label: 'Settlements' },
        { path: '/realm', label: 'Realm Management' },
        { path: '/pve', label: 'Dungeons & Bounties' },
        { path: '/quests', label: 'Quests' },
        { path: '/crafting', label: 'Crafting' },
        { path: '/activities', label: 'Activities' },
        { path: '/world', label: 'World Events' },
        { path: '/chronicles', label: 'Chronicles & Encounters' },
        { path: '/magic', label: 'Ancient Powers' },
        { path: '/travel', label: 'Travel & Roads' },
      ]
    })
    dropdowns.push({
      id: 'community', label: 'Community', icon: 'scroll', items: [
        { path: '/community', label: 'Leaderboards & Marketplace' },
        { path: '/directory', label: 'Citizen Directory' },
        { path: '/forms', label: 'Forms & Petitions' },
        { path: '/trade', label: 'Trade & Goods' },
        { path: '/marketplace', label: 'Marketplace' },
        { path: '/economy', label: 'Economy & Banking' },
        { path: '/calendar', label: 'Event Calendar' },
        { path: '/raven', label: 'Raven Network' },
        { path: '/maester', label: 'The Citadel' },
        { path: '/events', label: 'Events' },
        { path: '/housing', label: 'Housing' },
        { path: '/ledger', label: 'Castle Ledger' },
        { path: '/blotter', label: 'Blotter' },
      ]
    })
  }
  if (isAdmin) {
    dropdowns.push({
      id: 'admin', label: 'Admin', icon: 'crown', items: [
        { path: '/admin', label: 'Dashboard' },
      ]
    })
  }

  const handleDropdownClick = (id) => {
    setOpenDropdown(openDropdown === id ? null : id)
  }

  const isDropdownActive = (items) => items.some(i => location.pathname === i.path)

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={closeMenu}><Icon name="castle" size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />The Seven Kingdoms</Link>
        <div className="nav-actions">
          {isAuthenticated && (
            <span className="nav-user">
              <span className="text-gold">{user?.avatar_name || 'Player'}</span>
              {user?.house_name && <span className="nav-user-house"> | {user.house_name}</span>}
            </span>
          )}
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu}>Login</Link>
          )}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '\u2600' : '\u263E'}
          </button>
          {isAuthenticated && (
            <button className="theme-toggle" onClick={toggleSound} title="Toggle sound">
              {soundOn ? '\u{1F50A}' : '\u{1F507}'}
            </button>
          )}
          <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
        <ul className={`nav-menu${open ? ' open' : ''}`}>
          {publicLinks.map(l => (
            <li key={l.path} className="nav-item">
              <Link to={l.path} className={isActive(l.path)} onClick={closeMenu}>{l.label}</Link>
            </li>
          ))}
          {dropdowns.map(d => (
            <li key={d.id} className={`nav-dropdown${openDropdown === d.id ? ' open' : ''}`}>
              <button
                className={`nav-dropdown-trigger${isDropdownActive(d.items) ? ' active' : ''}`}
                onClick={() => handleDropdownClick(d.id)}
                aria-expanded={openDropdown === d.id}
              >
                <Icon name={d.icon} size={16} />
                {d.label}
                <span className="nav-dropdown-arrow">{openDropdown === d.id ? '\u25B2' : '\u25BC'}</span>
              </button>
              <ul className="nav-dropdown-menu">
                {d.items.map(item => (
                  <li key={item.path}>
                    <Link to={item.path} className={isActive(item.path)} onClick={closeMenu}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {authLinks.map(l => (
            <li key={l.path} className="nav-item">
              <Link to={l.path} className={isActive(l.path)} onClick={closeMenu}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
