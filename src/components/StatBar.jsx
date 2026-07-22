export default function StatBar({ label, value, max = 7, isHP = false }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="stat-bar-wrap">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span>{value}{isHP ? `/${max}` : ''}</span>
      </div>
      <div className="stat-bar">
        <div className={`stat-bar-fill${isHP ? ' hp' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
