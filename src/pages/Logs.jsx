import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Logs() {
  const [activeTab, setActiveTab] = useState('combat')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const tabs = [
    { id: 'combat', label: 'Combat', api: 'getCombatLog' },
    { id: 'economy', label: 'Economy', api: 'getEconomyLog' },
    { id: 'ravens', label: 'Ravens', api: 'getRavenInbox' },
    { id: 'quests', label: 'Quests', api: 'getQuestLog' }
  ]

  useEffect(() => { loadData(activeTab) }, [activeTab, page])

  const loadData = async (tab) => {
    setLoading(true)
    setError(null)
    try {
      const tabConfig = tabs.find(t => t.id === tab)
      const result = await api[tabConfig.api](limit, page * limit)
      setData(result.logs || result.messages || result.quests || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const renderTable = () => {
    if (!data.length) return <p className="text-muted">No records found</p>

    switch (activeTab) {
      case 'combat':
        return (
          <table className="stats-table">
            <thead><tr><th>Date</th><th>Attacker</th><th>Defender</th><th>Result</th><th>Damage</th></tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.attacker || r.attacker_key}</td>
                  <td>{r.defender || r.defender_key}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.result}</td>
                  <td>{r.damage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'economy':
        return (
          <table className="stats-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Currency</th><th>Reason</th></tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.transaction_type.replace(/_/g, ' ')}</td>
                  <td style={{ color: r.amount > 0 ? 'var(--green)' : 'var(--red)' }}>{r.amount > 0 ? '+' : ''}{r.amount}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.currency_type}</td>
                  <td>{r.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'ravens':
        return (
          <table className="stats-table">
            <thead><tr><th>Arrived</th><th>From</th><th>Subject</th><th>Read</th></tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.arrives_date).toLocaleString()}</td>
                  <td>{r.sender_name || r.sender_key}</td>
                  <td>{r.subject || '(no subject)'}</td>
                  <td>{r.is_read ? 'Yes' : <span className="text-warning">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'quests':
        return (
          <table className="stats-table">
            <thead><tr><th>Quest</th><th>Status</th><th>Progress</th><th>Accepted</th></tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{r.title || r.quest_id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                  <td>{r.current_objective || r.progress || 0}</td>
                  <td>{new Date(r.accepted_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      default: return null
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My History</h1>
        <p>Combat logs, economy transactions, raven messages, and quest progress</p>
      </div>

      <div className="page-content">
        <div className="tabs">
          <div className="tab-nav">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => { setActiveTab(t.id); setPage(0) }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-panel active">
            {loading && <Loading />}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && renderTable()}

            {!loading && data.length > 0 && (
              <div className="d-flex justify-between align-center mt-3">
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  &larr; Previous
                </button>
                <span className="text-muted" style={{ fontSize: '.85rem' }}>Page {page + 1}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={data.length < limit}>
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
