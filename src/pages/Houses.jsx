import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Houses() {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')

  useEffect(() => { loadHouses() }, [])

  const loadHouses = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHouses(search || null, region || null)
      setHouses(data.houses || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const regions = ['', 'North', 'Westerlands', 'Reach', 'Stormlands', 'Vale', 'Riverlands', 'Iron Islands', 'Dorne', 'Crownlands']

  return (
    <div>
      <div className="page-header">
        <h1>Houses of Westeros</h1>
        <p>Browse the great and minor houses of the Seven Kingdoms</p>
      </div>

      <div className="page-content">
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="Search houses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadHouses()}
          />
          <select className="filter-select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map(r => (
              <option key={r} value={r}>{r || 'All Regions'}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={loadHouses}>Search</button>
        </div>

        {loading && <Loading />}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-3">
            {houses.map(h => (
              <Link to={`/houses/${h.id}`} key={h.id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                  <div className="card-header">{h.name}</div>
                  <div className="card-body">
                    {h.words && <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>"{h.words}"</p>}
                    <p style={{ fontSize: '.85rem' }} className="text-muted">Seat: {h.seat || 'Unknown'}</p>
                    <p style={{ fontSize: '.85rem' }} className="text-muted">Region: {h.region}</p>
                    <p style={{ fontSize: '.85rem' }} className="text-muted">Type: {h.type}</p>
                    <p style={{ fontSize: '.85rem' }} className="text-muted">Members: {h.member_count || 0}</p>
                  </div>
                </div>
              </Link>
            ))}
            {!houses.length && <p className="text-muted">No houses found</p>}
          </div>
        )}
      </div>
    </div>
  )
}
