import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Compendium() {
  const [tab, setTab] = useState('factions')
  const [data, setData] = useState({})
  const [loading, setLoading] = useState({})
  const [error, setError] = useState({})

  const tabs = [
    { id: 'factions', label: 'Factions', icon: '⚔' },
    { id: 'archetypes', label: 'Archetypes', icon: '👤' },
    { id: 'religions', label: 'Religions', icon: '🛐' },
    { id: 'magic', label: 'Magic', icon: '✦' },
    { id: 'quests', label: 'Quests', icon: '❗' },
    { id: 'crafting', label: 'Crafting', icon: '🔨' },
    { id: 'territories', label: 'Territories', icon: '🗺' },
    { id: 'diseases', label: 'Diseases', icon: '☠' },
    { id: 'environment', label: 'Hazards', icon: '🌪' },
    { id: 'shops', label: 'Shops', icon: '🪙' },
    { id: 'items', label: 'Items', icon: '🗡' }
  ]

  useEffect(() => { loadTab('factions') }, [])

  const loadTab = async (tabId) => {
    setTab(tabId)
    if (data[tabId]) return

    setLoading(l => ({ ...l, [tabId]: true }))
    setError(e => ({ ...e, [tabId]: null }))
    try {
      let result
      switch (tabId) {
        case 'factions': result = await api.getFactions(); break
        case 'archetypes': result = await api.getArchetypes(); break
        case 'religions': result = await api.getReligions(); break
        case 'magic': result = await api.getMagicTypes(); break
        case 'quests': result = await api.getQuests(); break
        case 'crafting': result = await api.getRecipes(); break
        case 'territories': result = await api.getTerritories(); break
        case 'diseases': result = await api.getDiseases(); break
        case 'environment': result = await api.getEnvironment(); break
        case 'shops': result = await api.getShops(); break
        case 'items': result = await api.getItems(); break
      }
      setData(d => ({ ...d, [tabId]: result }))
    } catch (err) {
      setError(e => ({ ...e, [tabId]: err.message }))
    }
    setLoading(l => ({ ...l, [tabId]: false }))
  }

  const isLoading = loading[tab]
  const tabData = data[tab]
  const tabError = error[tab]

  return (
    <div>
      <div className="page-header">
        <h1>Compendium</h1>
        <p>The complete guide to the world of Westeros and beyond</p>
      </div>

      <div className="page-content">
        <div className="compendium-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => loadTab(t.id)}
              className="btn btn-sm"
              style={{
                background: tab === t.id ? 'var(--gold)' : 'transparent',
                color: tab === t.id ? 'var(--bg-dark)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px 4px 0 0',
                borderBottom: 'none',
                padding: '.5rem 1rem',
                cursor: 'pointer',
                fontSize: '.85rem'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading && <Loading />}
        {tabError && <div className="alert alert-danger">{tabError}</div>}
        {!isLoading && !tabError && tabData && (
          <div className="compendium-content">
            {tab === 'factions' && <FactionsTab data={tabData.factions} />}
            {tab === 'archetypes' && <ArchetypesTab data={tabData.archetypes} />}
            {tab === 'religions' && <ReligionsTab data={tabData.religions} />}
            {tab === 'magic' && <MagicTab data={tabData.magic_types} />}
            {tab === 'quests' && <QuestsTab data={tabData.quests} />}
            {tab === 'crafting' && <CraftingTab data={tabData.recipes} />}
            {tab === 'territories' && <TerritoriesTab data={tabData.territories} />}
            {tab === 'diseases' && <DiseasesTab data={tabData.diseases} />}
            {tab === 'environment' && <EnvironmentTab data={tabData.effects} />}
            {tab === 'shops' && <ShopsTab data={tabData.shops} />}
            {tab === 'items' && <ItemsTab data={tabData.items} />}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
function FactionsTab({ data }) {
  const typeColors = { order: '#4a9', military: '#c44', religious: '#dc8', mercantile: '#8ac', mercenary: '#c84', cult: '#a4a' }
  return (
    <div className="grid grid-2">
      {data.map(f => (
        <div key={f.id} className="card">
          <div className="card-header" style={{ borderLeft: `4px solid ${typeColors[f.type] || '#888'}` }}>
            {f.name}
            <span style={{ fontSize: '.7rem', float: 'right', color: typeColors[f.type], textTransform: 'capitalize' }}>{f.type}</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '.9rem', color: 'var(--text-muted)' }}>{f.description || 'No description available.'}</p>
            {f.joinable ? (
              <span style={{ fontSize: '.75rem', color: 'var(--green)' }}>Open for recruitment</span>
            ) : (
              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Closed faction</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function ArchetypesTab({ data }) {
  const statColors = { might: '#c44', agility: '#4a9', endurance: '#fc8', wits: '#8ac', will: '#a4a', presence: '#dc8' }
  return (
    <div className="grid grid-2">
      {data.map(a => (
        <div key={a.id} className="card">
          <div className="card-header">{a.name}</div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '.5rem', fontSize: '.85rem' }}>
              <span>Primary: <span style={{ color: statColors[a.primary_stat] || '#888', fontWeight: 'bold', textTransform: 'capitalize' }}>{a.primary_stat}</span></span>
              <span>Secondary: <span style={{ color: statColors[a.secondary_stat] || '#888', fontWeight: 'bold', textTransform: 'capitalize' }}>{a.secondary_stat}</span></span>
              {a.hp_bonus > 0 && <span style={{ color: 'var(--green)' }}>+{a.hp_bonus} HP</span>}
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{a.description || 'No description available.'}</p>
            {a.starting_skills?.length > 0 && (
              <div style={{ fontSize: '.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Starting skills: </span>
                {a.starting_skills.map(s => `${s.name} L${s.level}`).join(', ')}
              </div>
            )}
            <div style={{ marginTop: '.5rem', fontSize: '.75rem' }}>
              {a.admin_locked === 1 && <span style={{ color: 'var(--danger)', marginRight: '.5rem' }}>Admin Locked</span>}
              {a.house_required === 1 && <span style={{ color: 'var(--gold)', marginRight: '.5rem' }}>House Required</span>}
              {a.faction && <span style={{ color: 'var(--text-muted)' }}>Faction: {a.faction}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function ReligionsTab({ data }) {
  return (
    <div className="grid grid-2">
      {data.map(r => (
        <div key={r.id} className="card">
          <div className="card-header">{r.name}</div>
          <div className="card-body">
            <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>{r.description || 'No description available.'}</p>
            {r.devotion_ability && (
              <div style={{ fontSize: '.8rem', padding: '.5rem', background: 'rgba(218,165,32,0.1)', borderRadius: '4px', border: '1px solid rgba(218,165,32,0.2)' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Devotion Reward (100): </span>
                <span style={{ color: 'var(--text-muted)' }}>{r.devotion_ability}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function MagicTab({ data }) {
  return (
    <div className="grid grid-2">
      {data.map(m => (
        <div key={m.type} className="card">
          <div className="card-header" style={{ borderLeft: '4px solid #a4a' }}>
            {m.name}
            {m.element && <span style={{ fontSize: '.75rem', float: 'right', color: 'var(--text-muted)' }}>Element: {m.element}</span>}
          </div>
          <div className="card-body">
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>{m.description}</p>
            <table style={{ width: '100%', fontSize: '.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Lvl</th>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Ability</th>
                  <th style={{ textAlign: 'left', padding: '.25rem' }}>Effect</th>
                </tr>
              </thead>
              <tbody>
                {m.abilities.map(a => (
                  <tr key={a.level} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '.25rem', color: 'var(--gold)', fontWeight: 'bold' }}>{a.level}</td>
                    <td style={{ padding: '.25rem' }}>{a.name}</td>
                    <td style={{ padding: '.25rem', color: 'var(--text-muted)' }}>{a.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function QuestsTab({ data }) {
  const diffColors = { trivial: '#8a8', easy: '#4a9', moderate: '#fc8', hard: '#f84', legendary: '#c4f' }
  return (
    <div>
      {data.map(q => (
        <div key={q.id} className="card" style={{ marginBottom: '.75rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{q.name}</span>
            <span style={{ fontSize: '.75rem' }}>
              <span style={{ color: diffColors[q.difficulty], fontWeight: 'bold', textTransform: 'capitalize' }}>{q.difficulty}</span>
              {' | '}
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{q.type}</span>
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{q.description || 'No description available.'}</p>
            {q.objectives?.length > 0 && (
              <div style={{ fontSize: '.8rem', marginBottom: '.5rem' }}>
                <span style={{ color: 'var(--gold)' }}>Objectives:</span>
                <ul style={{ margin: '.25rem 0 .25rem 1rem', color: 'var(--text-muted)' }}>
                  {q.objectives.map((o, i) => (
                    <li key={i}>{o.description || `${o.type}: ${o.target || ''} x${o.amount}`}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '.8rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--gold)' }}>Rewards: {q.rewards.join(', ') || 'None'}</span>
              {q.faction && <span style={{ color: 'var(--text-muted)' }}>Faction: {q.faction}</span>}
              {q.repeatable ? <span style={{ color: 'var(--green)' }}>Repeatable</span> : <span style={{ color: 'var(--text-muted)' }}>One-time</span>}
              {q.min_level > 0 && <span style={{ color: 'var(--text-muted)' }}>Min Level: {q.min_level}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function CraftingTab({ data }) {
  return (
    <div>
      {data.map(r => (
        <div key={r.id} className="card" style={{ marginBottom: '.75rem' }}>
          <div className="card-header">{r.name}</div>
          <div className="card-body" style={{ fontSize: '.85rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
              <span>Result: <span style={{ color: 'var(--gold)' }}>{r.result_item}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Skill: {r.skill} L{r.skill_level}</span>
              <span style={{ color: 'var(--text-muted)' }}>Station: {r.station}</span>
              <span style={{ color: 'var(--text-muted)' }}>Difficulty: {r.difficulty}/10</span>
              <span style={{ color: 'var(--text-muted)' }}>Time: {r.time_minutes}m</span>
              <span style={{ color: 'var(--green)' }}>XP: +{r.xp_reward}</span>
            </div>
            {r.materials?.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Materials: </span>
                {r.materials.map(m => `${m.quantity}x ${m.name}`).join(', ')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function TerritoriesTab({ data }) {
  const typeColors = { capital: '#fc8', castle: '#c44', town: '#4a9', village: '#8a8', farm: '#6c3', mine: '#888', trade_post: '#8ac', ruin: '#666' }
  return (
    <table style={{ width: '100%', fontSize: '.85rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--gold)' }}>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Type</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Region</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>House</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Defense</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Income</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Pop.</th>
        </tr>
      </thead>
      <tbody>
        {data.map(t => (
          <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', fontWeight: 'bold' }}>{t.name}</td>
            <td style={{ padding: '.5rem' }}><span style={{ color: typeColors[t.type] || '#888', textTransform: 'capitalize' }}>{t.type}</span></td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{t.region}</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{t.house || 'Unclaimed'}</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>{t.defense}</td>
            <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>{t.income}</td>
            <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{t.population}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// =====================================================
function DiseasesTab({ data }) {
  const sevColors = [null, '#8a8', '#4a9', '#fc8', '#f84', '#c44']
  return (
    <div className="grid grid-2">
      {data.map(d => (
        <div key={d.id} className="card">
          <div className="card-header" style={{ borderLeft: `4px solid ${sevColors[d.severity] || '#888'}` }}>
            {d.name}
            <span style={{ fontSize: '.75rem', float: 'right' }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= d.severity ? sevColors[d.severity] : 'var(--border)' }}>●</span>)}
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{d.description || 'No description available.'}</p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '.8rem', flexWrap: 'wrap' }}>
              <span>Incubation: {d.incubation_days}d</span>
              <span style={{ color: 'var(--danger)' }}>HP Drain: {d.hp_drain}/hr</span>
              <span>Cure DC: {d.cure_dc}</span>
              {d.contagious === 1 && <span style={{ color: 'var(--danger)' }}>Contagious</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function EnvironmentTab({ data }) {
  const typeIcons = { cold: '❄', heat: '🔥', fire: '🔥', lightning: '⚡', exposure: '🌪' }
  return (
    <table style={{ width: '100%', fontSize: '.85rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--gold)' }}>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Hazard</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Region</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Type</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>DC</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>HP Drain</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Interval</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Season</th>
        </tr>
      </thead>
      <tbody>
        {data.map(e => (
          <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', fontWeight: 'bold' }}>{typeIcons[e.type]} {e.name}</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{e.region}</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{e.type}</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>{e.dc}</td>
            <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--danger)' }}>{e.hp_drain}</td>
            <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{e.interval_mins}m</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{e.season}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// =====================================================
function ShopsTab({ data }) {
  const [expanded, setExpanded] = useState(null)
  return (
    <div>
      {data.map(s => (
        <div key={s.id} className="card" style={{ marginBottom: '.75rem' }}>
          <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
            {s.name}
            <span style={{ fontSize: '.8rem', float: 'right', color: 'var(--text-muted)' }}>
              {s.region} | {s.item_count} items {expanded === s.id ? '▲' : '▼'}
            </span>
          </div>
          {expanded === s.id && s.inventory?.length > 0 && (
            <div className="card-body">
              <table style={{ width: '100%', fontSize: '.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '.25rem' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '.25rem' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '.25rem' }}>Price (stars)</th>
                    <th style={{ textAlign: 'right', padding: '.25rem' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {s.inventory.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '.25rem' }}>{item.name}</td>
                      <td style={{ padding: '.25rem', color: 'var(--text-muted)' }}>{item.type}</td>
                      <td style={{ padding: '.25rem', textAlign: 'right', color: 'var(--gold)' }}>{item.price}</td>
                      <td style={{ padding: '.25rem', textAlign: 'right', color: 'var(--text-muted)' }}>{item.quantity < 0 ? '∞' : item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// =====================================================
function ItemsTab({ data }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [items, setItems] = useState(data || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => { setItems(data || []) }, [data])

  const doSearch = async () => {
    setLoading(true)
    try {
      const result = await api.getItems(search || null, filterType || null)
      setItems(result.items || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const types = ['', 'weapon', 'armor', 'shield', 'consumable', 'material', 'misc']
  const typeColors = { weapon: '#c44', armor: '#4a9', shield: '#8ac', consumable: '#fc8', material: '#888', misc: '#aaa' }

  return (
    <div>
      <div className="filter-bar" style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        <input type="text" className="filter-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={doSearch}>Search</button>
      </div>
      {loading && <Loading />}
      {!loading && (
        <table style={{ width: '100%', fontSize: '.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gold)' }}>
              <th style={{ textAlign: 'left', padding: '.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '.5rem' }}>Type</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>Dmg</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>DR</th>
              <th style={{ textAlign: 'left', padding: '.5rem' }}>Stat</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>Wt</th>
              <th style={{ textAlign: 'right', padding: '.5rem' }}>Value</th>
              <th style={{ textAlign: 'left', padding: '.5rem' }}>Rarity</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.5rem', fontWeight: 'bold' }}>{item.name}</td>
                <td style={{ padding: '.5rem' }}><span style={{ color: typeColors[item.item_type] || '#888' }}>{item.item_type}</span></td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: item.damage > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{item.damage || '-'}</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: item.armor_dr > 0 ? 'var(--green)' : 'var(--text-muted)' }}>{item.armor_dr || '-'}</td>
                <td style={{ padding: '.5rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.governing_stat || '-'}</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{item.weight}</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>{item.value_stars}</td>
                <td style={{ padding: '.5rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.rarity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
