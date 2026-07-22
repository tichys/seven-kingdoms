export default function WoundList({ wounds = [] }) {
  if (!wounds.length) {
    return <p className="text-muted">No active wounds</p>
  }

  const severityClass = {
    minor: 'wound-minor',
    moderate: 'wound-moderate',
    severe: 'wound-severe',
    critical: 'wound-critical'
  }

  return (
    <div>
      {wounds.map(w => (
        <div key={w.id} className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <span className={`wound-badge ${severityClass[w.severity] || 'wound-minor'}`}>
              {w.severity}
            </span>
            <span className="ms-2 text-muted" style={{ fontSize: '0.85rem' }}>
              {w.body_part ? w.body_part.replace('_', ' ') : 'Unknown'} - inflicted
            </span>
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            {w.inflicted_date ? new Date(w.inflicted_date).toLocaleDateString() : (w.created_at ? new Date(w.created_at).toLocaleDateString() : '-')}
          </div>
        </div>
      ))}
    </div>
  )
}
