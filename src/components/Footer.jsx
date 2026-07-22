import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">ASOIAF RP HUD &middot; {new Date().getFullYear()}</span>
        <div className="footer-links">
          <Link to="/wiki">Rules</Link>
          <Link to="/houses">Houses</Link>
          <Link to="/wiki">Wiki</Link>
        </div>
      </div>
    </footer>
  )
}
