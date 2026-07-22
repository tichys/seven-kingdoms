import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Tools() {
  const [tool, setTool] = useState('combat')

  const tools = [
    { id: 'combat', label: 'Combat Simulator' },
    { id: 'stats', label: 'Stat Calculator' },
    { id: 'currency', label: 'Currency Converter' },
    { id: 'crafting', label: 'Crafting Finder' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Tools & Calculators</h1>
        <p>Interactive utilities for players and GMs</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className="btn btn-sm"
              style={{
                background: tool === t.id ? 'var(--gold)' : 'transparent',
                color: tool === t.id ? 'var(--bg-dark)' : 'var(--text)',
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

        {tool === 'combat' && <CombatSimulator />}
        {tool === 'stats' && <StatCalculator />}
        {tool === 'currency' && <CurrencyConverter />}
        {tool === 'crafting' && <CraftingFinder />}
      </div>
    </div>
  )
}

// =====================================================
function CombatSimulator() {
  const [atkStat, setAtkStat] = useState(5)
  const [atkSkill, setAtkSkill] = useState(3)
  const [atkWeapon, setAtkWeapon] = useState(2)
  const [atkWound, setAtkWound] = useState(0)
  const [defStat, setDefStat] = useState(4)
  const [defSkill, setDefSkill] = useState(2)
  const [defArmor, setDefArmor] = useState(3)
  const [defShield, setDefShield] = useState(2)
  const [defWound, setDefWound] = useState(0)
  const [iterations, setIterations] = useState(10000)
  const [results, setResults] = useState(null)

  const statBonus = (v) => v <= 1 ? -2 : v === 2 ? -1 : v === 3 ? 0 : v === 4 ? 1 : v === 5 ? 2 : v === 6 ? 3 : 4

  const runSim = () => {
    const tiers = { miss: 0, glancing: 0, solid: 0, heavy: 0, critical: 0, devastating: 0 }
    let totalDamage = 0

    for (let i = 0; i < iterations; i++) {
      const atkRoll = Math.floor(Math.random() * 20) + 1
      const defRoll = Math.floor(Math.random() * 20) + 1
      const atkTotal = atkRoll + statBonus(atkStat) + atkSkill + atkWeapon - atkWound
      const defTotal = defRoll + statBonus(defStat) + defSkill + defArmor + Math.min(defShield, 3) - defWound
      const net = atkTotal - defTotal

      let tier, damage
      if (net <= 0) { tier = 'miss'; damage = 0 }
      else if (net <= 3) { tier = 'glancing'; damage = 2 }
      else if (net <= 6) { tier = 'solid'; damage = 5 }
      else if (net <= 9) { tier = 'heavy'; damage = 10 }
      else { tier = 'critical'; damage = 20 }
      if (atkRoll === 20 && net >= 10) { tier = 'devastating'; damage = 30 }

      damage = Math.max(1, damage - defArmor)
      if (damage > 0) { tiers[tier]++; totalDamage += damage }
    }

    const hp = 10 + defStat * 3 + atkStat
    const avgDmg = (totalDamage / iterations).toFixed(1)
    const hitsToKill = avgDmg > 0 ? Math.ceil(hp / avgDmg) : 'N/A'

    setResults({
      tiers,
      avgDmg,
      hp,
      hitsToKill,
      iterations,
      hitRate: (((tiers.glancing + tiers.solid + tiers.heavy + tiers.critical + tiers.devastating) / iterations) * 100).toFixed(1)
    })
  }

  const Slider = ({ label, value, set, min = 1, max = 7 }) => (
    <div style={{ marginBottom: '.5rem' }}>
      <label style={{ fontSize: '.85rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{value} (bonus {statBonus(value) >= 0 ? '+' : ''}{statBonus(value)})</span>
      </label>
      <input type="range" min={min} max={max} value={value} onChange={e => set(parseInt(e.target.value))} style={{ width: '100%' }} />
    </div>
  )

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header" style={{ color: 'var(--danger)' }}>Attacker</div>
        <div className="card-body">
          <Slider label="Stat (Might/Agility)" value={atkStat} set={setAtkStat} />
          <Slider label="Skill Level" value={atkSkill} set={setAtkSkill} min={0} max={10} />
          <Slider label="Weapon Mod" value={atkWeapon} set={setAtkWeapon} min={0} max={5} />
          <Slider label="Wound Penalty" value={atkWound} set={setAtkWound} min={0} max={10} />
        </div>
      </div>
      <div className="card">
        <div className="card-header" style={{ color: 'var(--green)' }}>Defender</div>
        <div className="card-body">
          <Slider label="Stat (Agility)" value={defStat} set={setDefStat} />
          <Slider label="Skill Level" value={defSkill} set={setDefSkill} min={0} max={10} />
          <Slider label="Armor DR" value={defArmor} set={setDefArmor} min={0} max={8} />
          <Slider label="Shield Parry" value={defShield} set={setDefShield} min={0} max={4} />
          <Slider label="Wound Penalty" value={defWound} set={setDefWound} min={0} max={10} />
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ fontSize: '.85rem' }}>Iterations:
            <input type="number" value={iterations} onChange={e => setIterations(Math.max(100, Math.min(100000, parseInt(e.target.value) || 10000)))} style={{ width: '80px', marginLeft: '.5rem' }} className="filter-input" />
          </label>
          <button className="btn btn-primary" onClick={runSim}>Run Simulation</button>
        </div>

        {results && (
          <div className="card">
            <div className="card-header">Results ({results.iterations.toLocaleString()} iterations)</div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold)' }}>Avg Damage: {results.avgDmg}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Hit Rate: {results.hitRate}%</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Hits to Kill: {results.hitsToKill}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Defender HP: {results.hp}</div>
              </div>
              <table style={{ width: '100%', fontSize: '.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gold)' }}>
                    <th style={{ textAlign: 'left', padding: '.5rem' }}>Outcome</th>
                    <th style={{ textAlign: 'right', padding: '.5rem' }}>Count</th>
                    <th style={{ textAlign: 'right', padding: '.5rem' }}>Chance</th>
                    <th style={{ textAlign: 'left', padding: '.5rem' }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Miss/Parry', key: 'miss', dmg: 0, color: '#888' },
                    { name: 'Glancing (2 dmg)', key: 'glancing', dmg: 2, color: '#8a8' },
                    { name: 'Solid (5 dmg)', key: 'solid', dmg: 5, color: '#4a9' },
                    { name: 'Heavy (10 dmg)', key: 'heavy', dmg: 10, color: '#fc8' },
                    { name: 'Critical (20 dmg)', key: 'critical', dmg: 20, color: '#f84' },
                    { name: 'Devastating (30 dmg)', key: 'devastating', dmg: 30, color: '#c4f' }
                  ].map(t => {
                    const count = results.tiers[t.key] || 0
                    const pct = (count / results.iterations * 100)
                    return (
                      <tr key={t.key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '.5rem', color: t.color }}>{t.name}</td>
                        <td style={{ padding: '.5rem', textAlign: 'right' }}>{count.toLocaleString()}</td>
                        <td style={{ padding: '.5rem', textAlign: 'right' }}>{pct.toFixed(1)}%</td>
                        <td style={{ padding: '.5rem' }}>
                          <div style={{ background: t.color, height: '12px', width: `${Math.max(1, pct)}%`, borderRadius: '2px' }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
function StatCalculator() {
  const [stats, setStats] = useState({ might: 3, agility: 3, endurance: 3, wits: 3, will: 3, presence: 3 })
  const [points, setPoints] = useState(12)

  const statBonus = (v) => v <= 1 ? -2 : v === 2 ? -1 : v === 3 ? 0 : v === 4 ? 1 : v === 5 ? 2 : v === 6 ? 3 : 4
  const hp = 10 + stats.endurance * 3 + stats.might

  const adjust = (stat, delta) => {
    const newStats = { ...stats }
    const newVal = newStats[stat] + delta
    if (newVal < 1 || newVal > 7) return
    if (delta > 0 && points <= 0) return
    newStats[stat] = newVal
    setStats(newStats)
    setPoints(points - delta)
  }

  const statInfo = [
    { key: 'might', label: 'Might', desc: 'Physical strength, melee damage' },
    { key: 'agility', label: 'Agility', desc: 'Speed, dodging, ranged accuracy' },
    { key: 'endurance', label: 'Endurance', desc: 'Stamina, wound recovery, HP' },
    { key: 'wits', label: 'Wits', desc: 'Quick thinking, initiative, crafting' },
    { key: 'will', label: 'Will', desc: 'Mental resilience, magic power' },
    { key: 'presence', label: 'Presence', desc: 'Social influence, leadership' }
  ]

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Character Stat Calculator</span>
          <span style={{ color: points > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>Unspent Points: {points}</span>
        </div>
        <div className="card-body">
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
            Stats start at 3, max 7. HP = 10 + (Endurance x 3) + Might = <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>{hp}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {statInfo.map(s => (
          <div key={s.key} className="card">
            <div className="card-header">
              {s.label}
              <span style={{ float: 'right', color: statBonus(stats[s.key]) >= 0 ? 'var(--green)' : 'var(--danger)' }}>
                {stats[s.key]} (bonus {statBonus(stats[s.key]) >= 0 ? '+' : ''}{statBonus(stats[s.key])})
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>{s.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => adjust(s.key, -1)} disabled={stats[s.key] <= 1}>-</button>
                <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                  <div style={{ height: '100%', width: `${(stats[s.key] / 7) * 100}%`, background: 'var(--gold)', borderRadius: '4px' }} />
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => adjust(s.key, 1)} disabled={stats[s.key] >= 7 || points <= 0}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => { setStats({ might: 3, agility: 3, endurance: 3, wits: 3, will: 3, presence: 3 }); setPoints(12) }}>Reset</button>
        <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          Total allocated: {Object.values(stats).reduce((a, v) => a + (v - 3), 0)} / 12 points
        </div>
      </div>
    </div>
  )
}

// =====================================================
function CurrencyConverter() {
  const [amount, setAmount] = useState(10)
  const [from, setFrom] = useState('stags')
  const [to, setTo] = useState('stars')
  const fee = 0.05

  const rates = {
    dragons: 1,
    stags: 210,
    stars: 11760
  }

  const convert = () => {
    const inStars = amount * rates[from]
    const outStars = inStars / rates[to]
    const afterFee = outStars * (1 - fee)
    return afterFee
  }

  const result = convert()

  return (
    <div>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card-header">Currency Converter (5% conversion fee)</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))} className="filter-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="filter-select">
                <option value="dragons">Gold Dragons</option>
                <option value="stags">Silver Stags</option>
                <option value="stars">Copper Stars</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="filter-select">
                <option value="dragons">Gold Dragons</option>
                <option value="stags">Silver Stags</option>
                <option value="stars">Copper Stars</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(218,165,32,0.1)', borderRadius: '4px', border: '1px solid rgba(218,165,32,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>You receive (after 5% fee)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gold)' }}>
              {result.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
              {to === 'dragons' ? 'Gold Dragons' : to === 'stags' ? 'Silver Stags' : 'Copper Stars'}
            </div>
          </div>

          <table style={{ width: '100%', fontSize: '.8rem', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '.5rem' }}>Exchange Rates</th>
                <th style={{ textAlign: 'right', padding: '.5rem' }}>1 Dragon</th>
                <th style={{ textAlign: 'right', padding: '.5rem' }}>1 Stag</th>
                <th style={{ textAlign: 'right', padding: '.5rem' }}>1 Star</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Gold Dragons</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>1</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>1/210</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>1/11760</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Silver Stags</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>210</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>1</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>1/56</td>
              </tr>
              <tr>
                <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Copper Stars</td>
                <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--gold)' }}>11,760</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>56</td>
                <td style={{ padding: '.5rem', textAlign: 'right' }}>1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// =====================================================
function CraftingFinder() {
  const [skill, setSkill] = useState('')
  const [station, setStation] = useState('')
  const [maxDiff, setMaxDiff] = useState(10)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [allRecipes, setAllRecipes] = useState(null)

  useEffect(() => {
    if (!allRecipes) loadRecipes()
  }, [])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const data = await api.getRecipes()
      setAllRecipes(data.recipes || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => {
    if (!allRecipes) return
    let filtered = allRecipes
    if (skill) filtered = filtered.filter(r => r.skill === skill)
    if (station) filtered = filtered.filter(r => r.station === station)
    filtered = filtered.filter(r => r.difficulty <= maxDiff)
    setRecipes(filtered)
  }, [allRecipes, skill, station, maxDiff])

  const skills = ['', 'Blacksmithing', 'Armorsmithing', 'Leatherworking', 'Fletching', 'Healing', 'Weaponsmithing']
  const stations = ['', 'forge', 'anvil', 'tannery', 'workbench', 'kitchen', 'lab', 'loom', 'fletching']

  const successChance = (skillLevel, difficulty) => {
    const chance = 90 + skillLevel * 3 - difficulty * 5
    return Math.max(5, Math.min(95, chance))
  }

  return (
    <div>
      <div className="filter-bar" style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="filter-select" value={skill} onChange={e => setSkill(e.target.value)}>
          {skills.map(s => <option key={s} value={s}>{s || 'All Skills'}</option>)}
        </select>
        <select className="filter-select" value={station} onChange={e => setStation(e.target.value)}>
          {stations.map(s => <option key={s} value={s}>{s || 'All Stations'}</option>)}
        </select>
        <label style={{ fontSize: '.85rem', alignSelf: 'center' }}>Max Difficulty:
          <input type="range" min="1" max="10" value={maxDiff} onChange={e => setMaxDiff(parseInt(e.target.value))} style={{ marginLeft: '.5rem' }} />
          <span style={{ color: 'var(--gold)', marginLeft: '.5rem' }}>{maxDiff}</span>
        </label>
      </div>

      {loading && <Loading />}

      {!loading && recipes.length === 0 && <p className="text-muted">No recipes match your filters.</p>}

      {!loading && recipes.length > 0 && (
        <div>
          {recipes.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: '.5rem' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{r.name}</span>
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  {r.skill} L{r.skill_level} | {r.station} | Diff {r.difficulty}/10
                </span>
              </div>
              <div className="card-body" style={{ fontSize: '.85rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                  <span>Result: <span style={{ color: 'var(--gold)' }}>{r.result_item}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>Time: {r.time_minutes}m</span>
                  <span style={{ color: 'var(--green)' }}>XP: +{r.xp_reward}</span>
                </div>
                {r.materials?.length > 0 && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Materials: {r.materials.map(m => `${m.quantity}x ${m.name}`).join(', ')}
                  </div>
                )}
                <div style={{ marginTop: '.5rem', fontSize: '.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Success chance at skill {r.skill_level}: </span>
                  <span style={{ color: successChance(r.skill_level, r.difficulty) >= 80 ? 'var(--green)' : successChance(r.skill_level, r.difficulty) >= 50 ? 'var(--gold)' : 'var(--danger)' }}>
                    {successChance(r.skill_level, r.difficulty)}%
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '.5rem' }}>
                    (Crit 1-5: 2x XP | Crit fail 96-100: lose 50% mats)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
