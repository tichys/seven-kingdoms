import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('asoiaf_theme') || 'dark')
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

  const dropdowns = []
  if (isAuthenticated) {
    dropdowns.push({
      id: 'character', label: 'Character', items: [
        { path: '/character', label: 'Character Sheet' },
        { path: '/setup', label: 'Setup & Stats' },
      ]
    })
    dropdowns.push({
      id: 'adventure', label: 'Adventure', items: [
        { path: '/war', label: 'War Council' },
        { path: '/pve', label: 'Dungeons & Bounties' },
        { path: '/quests', label: 'Quests' },
        { path: '/crafting', label: 'Crafting' },
      ]
    })
    dropdowns.push({
      id: 'community', label: 'Community', items: [
        { path: '/community', label: 'Leaderboards & Marketplace' },
      ]
    })
    dropdowns.push({
      id: 'account', label: 'Account', items: [
        { path: '/profile', label: 'Profile' },
        { path: '/logs', label: 'History & Logs' },
      ]
    })
  }
  if (isAdmin) {
    dropdowns.push({
      id: 'admin', label: 'Admin', items: [
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
        <Link to="/" className="nav-brand" onClick={closeMenu}>The Seven Kingdoms</Link>
        <div className="nav-actions">
          {isAuthenticated && (
            <span className="nav-user">
              <span className="text-gold">{user?.avatar_name || 'Player'}</span>
              {user?.house_name && <span className="nav-user-house"> | {user.house_name}</span>}
            </span>
          )}
          {isAuthenticated ? (
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu}>Login</Link>
          )}
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '\u2600' : '\u263E'}
          </button>
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
        </ul>
      </div>
    </nav>
  )
}
