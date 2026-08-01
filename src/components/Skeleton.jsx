export function SkeletonLine({ width }) {
  return <div className="skeleton skeleton-line" style={width ? { width } : undefined} />
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-line" style={{ width: '40%', height: '1.2rem', marginBottom: '1rem' }} />
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line short" />
    </div>
  )
}

export function SkeletonGrid({ cols = 3, count = 6 }) {
  const arr = Array.from({ length: count })
  return (
    <div className={`skeleton-grid grid-${cols}`}>
      {arr.map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-line" style={{ width: '50%', height: '1.2rem', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  const arr = Array.from({ length: rows })
  return (
    <div>
      <div className="skeleton skeleton-line" style={{ height: '2rem', marginBottom: '.5rem' }} />
      {arr.map((_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ height: '2.5rem', marginBottom: '.5rem' }} />
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">&#9888;</div>
      <h3>{title || 'Failed to Load'}</h3>
      <p>{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Retry</button>}
    </div>
  )
}

export default function Skeleton({ type = 'card', ...props }) {
  switch (type) {
    case 'line':
      return <SkeletonLine {...props} />
    case 'grid':
      return <SkeletonGrid {...props} />
    case 'table':
      return <SkeletonTable {...props} />
    default:
      return <SkeletonCard {...props} />
  }
}
