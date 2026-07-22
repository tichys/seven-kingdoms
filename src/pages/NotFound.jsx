import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="not-found">
      <div>
        <div className="not-found-404">404</div>
        <h1>Page Not Found</h1>
        <p>You seem to have wandered beyond the Wall. Turn back before the cold takes you.</p>
        <Link to="/" className="btn btn-primary">Return Home</Link>
      </div>
    </div>
  )
}
