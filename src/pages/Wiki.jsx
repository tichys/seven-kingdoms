import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'

export default function Wiki() {
  const [page, setPage] = useState('rules')
  const [items, setItems] = useState([])
  const [itemSearch, setItemSearch] = useState('')
  const [itemType, setItemType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pages = {
    rules: 'Game Rules',
    combat: 'Combat System',
    stats: 'Stats & Skills',
    magic: 'Magic System',
    newplayer: 'New Player Guide',
    lore: 'ASOIAF Lore Primer'
  }

  const itemTypes = ['', 'weapon', 'armor', 'shield', 'consumable', 'misc', 'material']

  useEffect(() => { if (page === 'items') loadItems() }, [page, itemSearch, itemType])

  const loadItems = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getItems(itemSearch || null, itemType || null)
      setItems(data.items || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Wiki &amp; Rules</h1>
        <p>Game rules, combat guide, stats reference, item database, and lore</p>
      </div>

      <div className="page-content">
        <div className="wiki-layout">
          {/* Sidebar */}
          <div className="wiki-nav">
            {Object.entries(pages).map(([key, label]) => (
              <button key={key} className={`wiki-nav-item${page === key ? ' active' : ''}`} onClick={() => setPage(key)}>
                {label}
              </button>
            ))}
            <button className={`wiki-nav-item${page === 'items' ? ' active' : ''}`} onClick={() => setPage('items')}>
              Item Database
            </button>
          </div>

          {/* Content */}
          <div>
            {page === 'items' ? (
              <div>
                <div className="filter-bar">
                  <input className="filter-input" placeholder="Search items..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadItems()} />
                  <select className="filter-select" value={itemType} onChange={e => setItemType(e.target.value)}>
                    {itemTypes.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={loadItems}>Search</button>
                </div>
                {loading && <Loading />}
                {error && <div className="alert alert-danger">{error}</div>}
                {!loading && !error && (
                  <div className="card">
                    <div className="card-body">
                      <table className="stats-table">
                        <thead><tr><th>Name</th><th>Type</th><th>Damage/DR</th><th>Weight</th><th>Value</th></tr></thead>
                        <tbody>
                          {items.map(it => (
                            <tr key={it.id}>
                              <td style={{ color: 'var(--heading)' }}>{it.name}</td>
                              <td style={{ textTransform: 'capitalize' }}>{it.item_type}{it.subtype ? ` (${it.subtype})` : ''}</td>
                              <td>{(it.damage > 0) ? `+${it.damage} dmg` : ''}{(it.armor_dr > 0) ? `${it.armor_dr} DR` : ''}{!it.damage && !it.armor_dr ? '-' : ''}</td>
                              <td>{it.weight}</td>
                              <td>{it.value_stars} stars</td>
                            </tr>
                          ))}
                          {!items.length && <tr><td colSpan="5" className="text-muted">No items found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="parchment">
                {page === 'rules' && <RulesContent />}
                {page === 'combat' && <CombatContent />}
                {page === 'stats' && <StatsContent />}
                {page === 'magic' && <MagicContent />}
                {page === 'newplayer' && <NewPlayerContent />}
                {page === 'lore' && <LoreContent />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RulesContent() {
  return (
    <div>
      <h2>Core Rules</h2>
      <h3>Character Creation</h3>
      <ul>
        <li>Choose one of 22 archetypes (some require admin approval or house membership)</li>
        <li>Distribute 12 stat points across 6 attributes (starting at 3, max 7)</li>
        <li>Your archetype grants fixed starting skills</li>
        <li>Archetype choice is permanent</li>
      </ul>
      <h3>Death</h3>
      <p>Death is permanent. When your HP reaches -20 or you fail 3 death saves, your character is dead.</p>
      <p>The only way to return is through a R'hllor resurrection ritual (extremely rare, requires Fire Magic 7+).</p>
      <h3>Combat</h3>
      <p>All combat requires mutual consent from both participants. Use the HUD menu to initiate combat.</p>
      <h3>Roleplay</h3>
      <p>This is a roleplaying sim. Stay in character (IC) when possible. Use the IC/OOC toggle on your HUD when breaking character.</p>
    </div>
  )
}

function CombatContent() {
  return (
    <div>
      <h2>Combat System</h2>
      <h3>Opposed Rolls</h3>
      <p>Combat uses opposed dice rolls: attacker vs defender.</p>
      <p><strong>Attacker:</strong> d20 + stat bonus + skill level + weapon mod + wound penalty</p>
      <p><strong>Defender:</strong> d20 + stat bonus + skill level + armor mod + shield parry + wound penalty</p>
      <p><strong>Net = Attacker - Defender</strong></p>
      <h3>Results</h3>
      <table>
        <thead><tr><th>Net</th><th>Outcome</th><th>Damage</th><th>Wound</th></tr></thead>
        <tbody>
          <tr><td>0 or less</td><td>Miss/Parry</td><td>0</td><td>None</td></tr>
          <tr><td>1-3</td><td>Glancing Hit</td><td>2</td><td>Minor</td></tr>
          <tr><td>4-6</td><td>Solid Hit</td><td>5</td><td>Moderate</td></tr>
          <tr><td>7-9</td><td>Heavy Hit</td><td>10</td><td>Severe</td></tr>
          <tr><td>10+</td><td>Critical Hit</td><td>20</td><td>Critical</td></tr>
        </tbody>
      </table>
      <h3>Stat Bonus</h3>
      <table>
        <thead><tr><th>Stat</th><th>Bonus</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>-2</td></tr><tr><td>2</td><td>-1</td></tr><tr><td>3</td><td>+0</td></tr>
          <tr><td>4</td><td>+1</td></tr><tr><td>5</td><td>+2</td></tr><tr><td>6</td><td>+3</td></tr><tr><td>7</td><td>+4</td></tr>
        </tbody>
      </table>
      <h3>Formal Combat</h3>
      <p><strong>Duel:</strong> 1v1, first blood or yield, max 10 rounds</p>
      <p><strong>Joust:</strong> Mounted, opposed Agility+Riding, 3 passes</p>
      <p><strong>Melee:</strong> Multi-participant, initiative by Wits, last standing</p>
    </div>
  )
}

function StatsContent() {
  return (
    <div>
      <h2>Attributes</h2>
      <p>Six attributes on a 1-7 scale (3 = average adult):</p>
      <ul>
        <li><strong>Might</strong> - Raw physical strength, melee damage</li>
        <li><strong>Agility</strong> - Speed, dodging, ranged attacks</li>
        <li><strong>Endurance</strong> - Stamina, wound tolerance, HP</li>
        <li><strong>Wits</strong> - Reaction, tactics, initiative</li>
        <li><strong>Will</strong> - Magic resistance, mental fortitude</li>
        <li><strong>Presence</strong> - Social influence, intimidation</li>
      </ul>
      <p><strong>HP = 10 + (Endurance x 3) + Might</strong></p>
      <h2>Skills</h2>
      <p>60+ skills across 7 categories: Combat, Physical, Social, Knowledge, Crafting, Magic, Special.</p>
      <p>Skills level up through XP (0-7), earned via combat, quests, crafting, and RP.</p>
    </div>
  )
}

function MagicContent() {
  return (
    <div>
      <h2>Magic System</h2>
      <p>Magic is rare and admin-assigned only. There are four types:</p>
      <h3>Warging / Skinchanging</h3>
      <p>Enter animal minds, see through their eyes, control their movement. Risk: consciousness can be trapped on death.</p>
      <h3>R'hllor (Red God)</h3>
      <p>Fire visions, fire resistance, shadow assassins, and rare resurrection rituals. Requires permanent HP sacrifice for major abilities.</p>
      <h3>Greensight</h3>
      <p>Prophetic visions and seeing past events at weirwoods. All visions are admin-provided and cryptic.</p>
      <h3>Elemental Magic</h3>
      <p>Fire, Water, Earth, and Wind manipulation. Each element has 5 levels of abilities.</p>
      <h3>Magic Resistance</h3>
      <p>d20 + Will + Magic Resistance skill vs DC (10 + caster level + caster Will)</p>
    </div>
  )
}

function NewPlayerContent() {
  return (
    <div>
      <h2>Getting Started</h2>
      <ol>
        <li><strong>Get the HUD</strong> - Pick up the free HUD from the sim entrance</li>
        <li><strong>Wear it</strong> - Attach to a HUD slot; it will register you automatically</li>
        <li><strong>Choose Archetype</strong> - Select from 22 archetypes (some require admin approval)</li>
        <li><strong>Distribute Stats</strong> - Assign 12 points across 6 attributes</li>
        <li><strong>Join a House</strong> - Ask an admin or house lord to invite you</li>
        <li><strong>Start RPing</strong> - Use the HUD for dice rolls, emotes, and character management</li>
      </ol>
      <h3>Tips</h3>
      <ul>
        <li>Combat requires consent from both players</li>
        <li>Death is permanent - be careful!</li>
        <li>Read the combat rules before fighting</li>
        <li>Earn XP through quests, combat, and RP</li>
        <li>Ravens are the in-world mail system</li>
      </ul>
    </div>
  )
}

function LoreContent() {
  return (
    <div>
      <h2>ASOIAF Lore Primer</h2>
      <p>This sim is set in the world of George R.R. Martin's <em>A Song of Ice and Fire</em> book series, during the events of the books.</p>
      <h3>The Seven Kingdoms</h3>
      <p>Westeros is divided into seven historical kingdoms, now united under the Iron Throne:</p>
      <ul>
        <li><strong>The North</strong> - Ruled by House Stark, "Winter is Coming"</li>
        <li><strong>The Westerlands</strong> - Ruled by House Lannister, "Hear Me Roar!"</li>
        <li><strong>The Reach</strong> - Ruled by House Tyrell, "Growing Strong"</li>
        <li><strong>The Stormlands</strong> - Ruled by House Baratheon, "Ours is the Fury"</li>
        <li><strong>The Vale</strong> - Ruled by House Arryn, "As High as Honor"</li>
        <li><strong>The Riverlands</strong> - Ruled by House Tully, "Family, Duty, Honor"</li>
        <li><strong>Dorne</strong> - Ruled by House Martell, "Unbowed, Unbent, Unbroken"</li>
      </ul>
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>Iron Throne</strong> - The seat of the King of the Seven Kingdoms</li>
        <li><strong>Night's Watch</strong> - Sworn brothers guarding the Wall against the North</li>
        <li><strong>Maesters</strong> - Scholars, healers, and advisors</li>
        <li><strong>Valyrian Steel</strong> - Rare, magical steel from fallen Valyria</li>
        <li><strong>Wildfire</strong> - Dangerous green flame made by the Alchemists' Guild</li>
      </ul>
    </div>
  )
}
