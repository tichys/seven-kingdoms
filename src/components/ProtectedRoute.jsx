import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from './Loading.jsx'

export default function ProtectedRoute({ children, adminOnly = false, allowUnapproved = false }) {
  const { isAuthenticated, isAdmin, loading, characterApproved, hasArchetype } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="text-center mt-5">
        <h2>Access Denied</h2>
        <p className="text-muted">You need admin privileges to view this page.</p>
      </div>
    )
  }

  if (!allowUnapproved && !isAdmin && (!characterApproved || !hasArchetype) && location.pathname !== '/character-creator') {
    return <Navigate to="/character-creator" replace />
  }

  return children
}
