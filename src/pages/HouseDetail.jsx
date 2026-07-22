import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import HouseBanner from '../components/HouseBanner.jsx'

export default function HouseDetail() {
  const { id } = useParams()
  const [house, setHouse] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.getHouse(id).catch(e => ({ error: e.message })),
      api.getHouseMembers(id).catch(e => ({ error: e.message }))
    ]).then(([h, m]) => {
      if (h.error) { setError(h.error); setLoading(false); return }
      setHouse(h)
      if (!m.error) setMembers(m.members || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="page-content"><Loading /></div>
  if (error) return <div className="page-content"><div className="alert alert-danger">{error}</div></div>
  if (!house) return <div className="page-content"><div className="alert alert-warning">House not found</div></div>

  const rankOrder = { 'Lord': 1, 'Lady': 2, 'Castellan': 3, 'Knight': 4, 'Man-at-Arms': 5, 'Smallfolk': 6, 'Guest': 7 }
  const sortedMembers = [...members].sort((a, b) => (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99))

  return (
    <div>
      <div className="page-content">
        <Link to="/houses" className="link-arrow" style={{ fontSize: '.8rem' }}>&larr; Back to Houses</Link>

        <div className="mt-2">
          <HouseBanner
            name={house.name}
            words={house.words}
            primaryColor={house.banner_primary}
            secondaryColor={house.banner_secondary}
          />
        </div>

        <div className="grid grid-2 mt-2">
          <div className="card">
            <div className="card-header">House Details</div>
            <div className="card-body">
              <p style={{ fontSize: '.9rem' }}><strong>Seat:</strong> <span className="text-muted">{house.seat || 'Unknown'}</span></p>
              <p style={{ fontSize: '.9rem' }}><strong>Region:</strong> <span className="text-muted">{house.region}</span></p>
              <p style={{ fontSize: '.9rem' }}><strong>Type:</strong> <span className="text-muted">{house.type}</span></p>
              {house.overlord_house_name && <p style={{ fontSize: '.9rem' }}><strong>Sworn to:</strong> <span className="text-muted">{house.overlord_house_name}</span></p>}
              {house.lord_name && <p style={{ fontSize: '.9rem' }}><strong>Lord:</strong> <span className="text-muted">{house.lord_name}</span></p>}
              <p style={{ fontSize: '.9rem' }}><strong>Founded:</strong> <span className="text-muted">{new Date(house.founded_date).toLocaleDateString()}</span></p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Members ({members.length})</div>
            <div className="card-body">
              {sortedMembers.length ? (
                <table className="stats-table">
                  <thead><tr><th>Name</th><th>Rank</th><th>Joined</th></tr></thead>
                  <tbody>
                    {sortedMembers.map(m => (
                      <tr key={m.id}>
                        <td>{m.avatar_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{m.rank}</td>
                        <td>{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">No members</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
