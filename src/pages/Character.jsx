import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Loading from '../components/Loading.jsx'
import StatBar from '../components/StatBar.jsx'
import ItemCard from '../components/ItemCard.jsx'
import WoundList from '../components/WoundList.jsx'

export default function Character() {
  const [character, setCharacter] = useState(null)
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [skills, setSkills] = useState(null)
  const [wounds, setWounds] = useState(null)
  const [survival, setSurvival] = useState(null)
  const [diseases, setDiseases] = useState(null)
  const [factions, setFactions] = useState(null)
  const [religion, setReligion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.getCharacter().catch(e => ({ error: e.message })),
      api.getStats().catch(e => ({ error: e.message })),
      api.getInventory().catch(e => ({ error: e.message })),
      api.getSkills().catch(e => ({ error: e.message })),
      api.getWounds().catch(e => ({ error: e.message })),
      api.getSurvival().catch(e => ({ error: e.message })),
      api.getDiseases().catch(e => ({ error: e.message })),
      api.factionMyRep().catch(e => ({ error: e.message })),
      api.religionGet().catch(e => ({ error: e.message }))
    ]).then(([char, st, inv, sk, wd, sv, dis, fac, rel]) => {
      if (char.error) { setError(char.error); setLoading(false); return }
      setCharacter(char)
      if (!st.error) setStats(st)
      if (!inv.error) setInventory(inv)
      if (!sk.error) setSkills(sk)
      if (!wd.error) setWounds(wd)
      if (!sv.error) setSurvival(sv)
      if (!dis.error) setDiseases(dis)
      if (!fac.error) setFactions(fac)
      if (!rel.error) setReligion(rel)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="page-content"><Loading /></div>
  if (error) return <div className="page-content"><div className="alert alert-danger">{error}</div></div>
  if (!character) return <div className="page-content"><div className="alert alert-warning">No character data found</div></div>

  const statNames = ['might', 'agility', 'endurance', 'wits', 'will', 'presence']
  const statLabels = { might: 'Might', agility: 'Agility', endurance: 'Endurance', wits: 'Wits', will: 'Will', presence: 'Presence' }

  const skillCategories = {
    combat: 'Combat', physical: 'Physical', social: 'Social',
    knowledge: 'Knowledge', crafting: 'Crafting', magic: 'Magic', special: 'Special'
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          {character.title ? `${character.title} ` : ''}{character.avatar_name || 'Unknown'}
        </div>
        <div className="card-body">
          <div className="grid grid-2">
            <div>
              <p>House: <span className="text-gold">{character.house_name || 'None'}</span></p>
              <p>Archetype: <span className="text-gold">{character.archetype_name || 'None'}</span></p>
              <p>Religion: <span className="text-gold">{character.religion_name || 'None'}</span></p>
              <p>Status: <span className="text-gold">{character.ic_status || 'IC'}</span></p>
              {character.magic && (
                <p>Magic: <span className="text-gold">{character.magic.type} (Lvl {character.magic.level})</span></p>
              )}
            </div>
            <div>
              <StatBar label="HP" value={character.hp_current} max={character.hp_max} isHP />
              <div style={{ marginTop: '1rem' }}>
                <p>Gold: <span className="text-gold">{character.gold_dragons || 0}</span></p>
                <p>Stags: <span className="text-gold">{character.silver_stags || 0}</span></p>
                <p>Stars: <span className="text-gold">{character.copper_stars || 0}</span></p>
              </div>
              <p>RP Score: <span className="text-gold">{character.rp_score || 0}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Survival & Diseases */}
      {(survival || (diseases && diseases.count > 0)) && (
        <div className="card mb-4">
          <div className="card-header">Survival</div>
          <div className="card-body">
            {survival && (
              <div className="grid grid-2 mb-2">
                <StatBar label="Hunger" value={survival.hunger} max={100} />
                <StatBar label="Thirst" value={survival.thirst} max={100} />
              </div>
            )}
            {survival && survival.hunger < 25 && (
              <div className="alert alert-warning" style={{ fontSize: '.85rem' }}>
                {survival.hunger === 0 ? 'You are starving! Taking HP damage.' : 'You are getting hungry.'}
              </div>
            )}
            {survival && survival.thirst < 25 && (
              <div className="alert alert-warning" style={{ fontSize: '.85rem' }}>
                {survival.thirst === 0 ? 'You are dehydrated! Taking HP damage.' : 'You are getting thirsty.'}
              </div>
            )}
            {diseases && diseases.count > 0 && (
              <div className="mt-2">
                <h4 style={{ fontSize: '.9rem', color: 'var(--danger)', marginBottom: '.5rem' }}>Active Diseases</h4>
                {diseases.diseases.map(d => (
                  <div key={d.id} className="item-card" style={{ borderColor: 'var(--red)' }}>
                    <div className="item-name">{d.name} <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>({d.stage})</span></div>
                    <div className="item-type">{d.description}</div>
                    <div style={{ fontSize: '.8rem', marginTop: '.25rem' }}>
                      <span className="text-muted">Severity: {d.severity}/5</span>
                      {d.hp_drain > 0 && <span className="text-muted"> | HP drain: {d.hp_drain}/hr</span>}
                      {d.is_contagious === 1 && <span style={{ color: 'var(--danger)' }}> | Contagious!</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wounds */}
      <div className="card mb-4">
        <div className="card-header">Wounds</div>
        <div className="card-body">
          <WoundList wounds={wounds?.wounds || []} />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="card mb-4">
          <div className="card-header">Attributes</div>
          <div className="card-body">
            {statNames.map(s => (
              <StatBar key={s} label={statLabels[s]} value={stats[s] ?? 3} max={7} />
            ))}
            {stats.unspent_points > 0 && (
              <p className="text-warning mt-2">Unspent points: {stats.unspent_points}</p>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="card mb-4">
          <div className="card-header">Skills</div>
          <div className="card-body">
            {Object.entries(skillCategories).map(([cat, label]) => {
              const catSkills = (skills.skills || []).filter(s => (s.skill_category || s.category) === cat)
              if (!catSkills.length) return null
              return (
                <div key={cat} className="mb-3">
                  <h4 style={{ fontSize: '.95rem', color: 'var(--gold)', letterSpacing: '.1em', marginBottom: '.75rem' }}>{label}</h4>
                  <div className="grid grid-3">
                    {catSkills.map(s => (
                      <div key={s.id} style={{ fontSize: '.85rem' }}>
                        <span className="text-muted">{s.skill_name}:</span>{' '}
                        <span className="text-gold">{s.level}</span>
                        {s.xp > 0 && <span className="text-muted" style={{ fontSize: '.75rem' }}> ({s.xp}xp)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inventory */}
      {inventory && (
        <div className="card mb-4">
          <div className="card-header">Inventory ({inventory.count || 0}/{inventory.max_count || 30})</div>
          <div className="card-body">
            <p className="text-muted" style={{ fontSize: '.85rem', marginBottom: '1rem' }}>
              Weight: {inventory.weight || 0}/{inventory.max_weight || 50}
            </p>
            <div className="grid grid-3">
              {(inventory.items || []).map((item, i) => (
                <ItemCard key={i} item={item} equipped={item.equipped} />
              ))}
              {(!inventory.items || !inventory.items.length) && (
                <p className="text-muted">Inventory is empty</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Factions & Religion */}
      <div className="grid grid-2">
        {factions && (factions.reputations || factions.factions) && (
          <div className="card mb-4">
            <div className="card-header">Factions</div>
            <div className="card-body">
              {(factions.reputations || []).length === 0 && (!factions.factions || factions.factions.length === 0) ? (
                <p className="text-muted">No faction memberships.</p>
              ) : (
                <table className="stats-table">
                  <tbody>
                    {(factions.reputations || []).map((f, i) => (
                      <tr key={i}>
                        <td><strong>{f.faction_name || f.name}</strong></td>
                        <td style={{ textTransform: 'capitalize' }}>{f.faction_type || ''}</td>
                        <td>Rep: <span className="text-gold">{f.reputation}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {religion && religion.religion_name && (
          <div className="card mb-4">
            <div className="card-header">Religion</div>
            <div className="card-body">
              <p>Deity: <span className="text-gold">{religion.religion_name}</span></p>
              <p>Piety: <span className="text-gold">{religion.piety || 0}</span></p>
              <p>Devotion: <span className="text-gold">{religion.devotion || 0}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
