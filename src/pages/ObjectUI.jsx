import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// This page is designed to render on SL prim faces via shared media
// URL format: /#/object?type=training&key=AVATAR_KEY&token=TOKEN
// The LSL script generates the token and sets the prim media URL

export default function ObjectUI() {
  const [authed, setAuthed] = useState(false)
  const [objectType, setObjectType] = useState('')
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const type = params.get('type') || ''
    const key = params.get('key') || ''
    const token = params.get('token') || ''

    if (!type || !key || !token) {
      setError('Missing URL parameters. Touch the in-world object to access this page.')
      setLoading(false)
      return
    }

    // Set token and validate
    api.setToken(token)
    setObjectType(type)

    // Store the avatar key and token for API calls
    localStorage.setItem('asoiaf_object_key', key)
    localStorage.setItem('asoiaf_object_token', token)
    localStorage.setItem('asoiaf_object_type', type)

    setAuthed(true)
    setPlayerData({ avatar_key: key, token, type })
    setLoading(false)
  }, [])

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
  if (error) return <div style={{ padding: '1rem', color: '#c44', textAlign: 'center' }}>{error}</div>
  if (!authed) return <div style={{ padding: '1rem', textAlign: 'center' }}>Authentication failed.</div>

  const pages = {
    training: <TrainingUI />,
    cyvasse: <CyvasseUI />,
    tavern: <TavernUI />,
    stable: <StableUI />,
    contracts: <ContractsUI />,
    landmark: <LandmarkUI />,
    trade: <TradeUI />,
    shop: <ShopUI />,
    banking: <BankingUI />,
    bounty: <BountyUI />,
    notice: <NoticeUI />,
    healing: <HealingUI />,
    arena: <ArenaUI />,
    census: <CensusUI />,
    crafting: <CraftingUI />,
    resurrection: <ResurrectionUI />,
    messages: <MessagesObjUI />,
    production: <ProductionObjUI />,
    roads: <RoadsObjUI />,
    scriptorium: <ScriptoriumObjUI />,
    shipyard: <ShipyardObjUI />,
    siege: <SiegeObjUI />,
    tax: <TaxObjUI />,
    throne: <ThroneObjUI />,
    weather: <WeatherObjUI />,
    stall: <StallObjUI />,
    religious: <ReligiousObjUI />,
    dragon: <DragonObjUI />,
    ears: <EarsObjUI />,
    links: <LinksObjUI />,
    calendar: <CalendarObjUI />,
    diplomacy: <DiplomacyObjUI />,
    dragonglass: <DragonglassObjUI />,
    valyrian: <ValyrianObjUI />,
    rhllor: <RhllorObjUI />,
    weirwood: <WeirwoodObjUI />,
    ironbank: <IronBankObjUI />,
    travel: <TravelObjUI />,
    tournament: <TournamentObjUI />,
    justice: <JusticeObjUI />,
    council: <CouncilObjUI />,
    gallows: <GallowsObjUI />,
    guard: <GuardObjUI />,
    harbor: <HarborObjUI />,
    heraldry: <HeraldryObjUI />,
    marriage: <MarriageObjUI />,
    dungeon: <DungeonObjUI />
  }

  return (
    <div style={{ background: '#1a1a2e', color: '#e0d6c2', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      <div style={{ padding: '.5rem', borderBottom: '2px solid #b08d57', textAlign: 'center' }}>
        <span style={{ color: '#b08d57', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {objectType.charAt(0).toUpperCase() + objectType.slice(1)}
        </span>
      </div>
      <div style={{ padding: '.75rem' }}>
        {pages[objectType] || <div>Unknown object type: {objectType}</div>}
      </div>
    </div>
  )
}

// =====================================================
function TrainingUI() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [miniGame, setMiniGame] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.myTrainers()
      setTrainers(data.trainers || [])
    } catch (e) { setResult({ error: e.message }) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const startTrain = async (trainer) => {
    setSelectedTrainer(trainer)
    setResult(null)
    // Start mini-game
    const forms = ['Slash', 'Thrust', 'Parry', 'Feint', 'Riposte']
    const counters = { Slash: 'Parry', Thrust: 'Riposte', Parry: 'Slash', Feint: 'Thrust', Riposte: 'Feint' }
    setMiniGame({ round: 0, score: 0, forms, counters, attackForm: null, finished: false })
  }

  const nextRound = () => {
    if (miniGame.round >= 3) {
      // Game finished - check score
      if (miniGame.score >= 2) {
        completeTrain()
      } else {
        setMiniGame({ ...miniGame, finished: true, failed: true })
      }
      return
    }
    const attackForm = miniGame.forms[Math.floor(Math.random() * 5)]
    setMiniGame({ ...miniGame, round: miniGame.round + 1, attackForm, answered: false })
  }

  const answer = (form) => {
    if (miniGame.answered) return
    const correct = miniGame.counters[miniGame.attackForm] === form
    const newScore = miniGame.score + (correct ? 1 : 0)
    setMiniGame({ ...miniGame, score: newScore, answered: true, lastCorrect: correct })
  }

  const completeTrain = async () => {
    try {
      const r = await api.trainSkill(selectedTrainer.id)
      setResult({ success: true, message: r.message })
      setMiniGame(null)
      await load()
    } catch (e) { setResult({ error: e.message }) }
  }

  useEffect(() => { if (miniGame && !miniGame.attackForm && !miniGame.finished && miniGame.round < 3) nextRound() }, [miniGame?.round])

  if (loading) return <div>Loading trainers...</div>

  if (miniGame && !miniGame.finished) {
    return (
      <div>
        <h3 style={{ color: '#b08d57', marginBottom: '.5rem' }}>Training: {selectedTrainer.skill}</h3>
        <p style={{ fontSize: '.85rem', marginBottom: '.5rem' }}>Round {miniGame.round}/3 | Score: {miniGame.score}</p>
        {miniGame.attackForm && (
          <div style={{ background: '#2a2a4e', padding: '.75rem', borderRadius: '4px', marginBottom: '.5rem' }}>
            <p style={{ fontSize: '.9rem', marginBottom: '.5rem' }}>
              <strong style={{ color: '#c44' }}>{selectedTrainer.name}</strong> attacks with: <strong style={{ color: '#b08d57' }}>{miniGame.attackForm}</strong>!
            </p>
            <p style={{ fontSize: '.8rem', color: '#888', marginBottom: '.5rem' }}>Choose your counter-form:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem' }}>
              {miniGame.forms.map(f => (
                <button key={f} onClick={() => answer(f)} disabled={miniGame.answered}
                  style={{
                    padding: '.5rem', background: miniGame.answered
                      ? (miniGame.counters[miniGame.attackForm] === f ? '#2ecc71' : '#555')
                      : '#b08d57',
                    color: miniGame.answered && miniGame.counters[miniGame.attackForm] !== f ? '#888' : '#1a1a2e',
                    border: 'none', borderRadius: '3px', cursor: miniGame.answered ? 'default' : 'pointer',
                    fontSize: '.85rem', fontWeight: 'bold'
                  }}>
                  {f}
                </button>
              ))}
            </div>
            {miniGame.answered && (
              <div style={{ marginTop: '.5rem' }}>
                <p style={{ fontSize: '.85rem', color: miniGame.lastCorrect ? '#2ecc71' : '#c44' }}>
                  {miniGame.lastCorrect ? 'Correct counter!' : 'Wrong! Correct was: ' + miniGame.counters[miniGame.attackForm]}
                </p>
                <button onClick={nextRound} style={{ padding: '.4rem .8rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '.85rem' }}>
                  {miniGame.round >= 3 ? 'Finish' : 'Next Round'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (miniGame && miniGame.finished) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ fontSize: '1rem', color: miniGame.failed ? '#c44' : '#2ecc71', marginBottom: '.5rem' }}>
          {miniGame.failed ? 'Training failed! Score too low.' : 'Training complete!'}
        </p>
        <p style={{ fontSize: '.85rem', marginBottom: '.5rem' }}>Score: {miniGame.score}/3 (need 2+ to pass)</p>
        <button onClick={() => setMiniGame(null)} style={{ padding: '.4rem .8rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Try Again</button>
      </div>
    )
  }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.5rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.5rem' }}>{result.message}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {trainers.filter(t => t.can_train).map(t => (
          <div key={t.id} style={{ background: '#2a2a4e', padding: '.6rem', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => startTrain(t)}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.9rem' }}>{t.name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>{t.skill} L{t.current_level}/{t.max_level} - {t.cost} stags</div>
            <div style={{ fontSize: '.75rem', color: '#666', marginTop: '.2rem' }}>{t.description}</div>
          </div>
        ))}
        {trainers.filter(t => t.can_train).length === 0 && <div style={{ color: '#888', fontSize: '.85rem' }}>All skills maxed with available trainers!</div>}
      </div>
    </div>
  )
}

// =====================================================
function CyvasseUI() {
  const [stats, setStats] = useState(null)
  const [result, setResult] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [wager, setWager] = useState(0)
  const [opponent, setOpponent] = useState('Tyrion Lannister')

  const opponents = ['Tyrion Lannister', 'Morro the Braavosi', 'Daenerys Targaryen', 'Petyr Baelish', 'Samwell Tarly', 'Oberyn Martell']

  const loadStats = async () => { try { setStats(await api.cyvasseStats()) } catch (e) {} }
  useEffect(() => { loadStats() }, [])

  const play = async () => {
    setPlaying(true); setResult(null)
    try { const r = await api.cyvassePlay(wager, opponent); setResult(r); await loadStats() }
    catch (e) { setResult({ error: e.message }) }
    setPlaying(false)
  }

  return (
    <div>
      {stats && (
        <div style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.5rem' }}>
          <div style={{ fontSize: '.85rem' }}>Rating: <strong style={{ color: '#b08d57' }}>{stats.rating || 1000}</strong> ({stats.rank || 'Novice'})</div>
          <div style={{ fontSize: '.75rem', color: '#888' }}>W:{stats.games_won || 0} L:{stats.games_lost || 0} D:{stats.games_draw || 0}</div>
        </div>
      )}
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.5rem' }}>{result.error}</div>}
      {result?.message && (
        <div style={{ background: result.result === 'won' ? '#1a3a1a' : result.result === 'lost' ? '#3a1a1a' : '#2a2a4e', padding: '.6rem', borderRadius: '4px', marginBottom: '.5rem' }}>
          <div style={{ fontSize: '.9rem', color: result.result === 'won' ? '#2ecc71' : result.result === 'lost' ? '#c44' : '#b08d57' }}>
            {result.result === 'won' ? 'VICTORY!' : result.result === 'lost' ? 'DEFEAT' : 'DRAW'}
          </div>
          <div style={{ fontSize: '.8rem', color: '#888' }}>{result.message}</div>
        </div>
      )}
      <div style={{ marginBottom: '.5rem' }}>
        <label style={{ fontSize: '.8rem', color: '#888' }}>Opponent:</label>
        <select value={opponent} onChange={e => setOpponent(e.target.value)}
          style={{ width: '100%', padding: '.3rem', background: '#2a2a4e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px' }}>
          {opponents.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '.5rem' }}>
        <label style={{ fontSize: '.8rem', color: '#888' }}>Wager (stags): {wager}</label>
        <input type="range" min="0" max="100" value={wager} onChange={e => setWager(parseInt(e.target.value))} style={{ width: '100%' }} />
      </div>
      <button onClick={play} disabled={playing}
        style={{ width: '100%', padding: '.5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>
        {playing ? 'Playing...' : 'Play Cyvasse'}
      </button>
    </div>
  )
}

// =====================================================
function TavernUI() {
  const [taverns, setTaverns] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const data = await api.tavernList(); setTaverns(data.taverns || []) } catch (e) { setResult({ error: e.message }) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const act = async (fn) => { setResult(null); try { const r = await fn(); setResult({ success: r.message }) } catch (e) { setResult({ error: e.message }) } }

  if (loading) return <div>Loading taverns...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      {taverns.map(t => (
        <div key={t.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
          <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.9rem' }}>{t.name}</div>
          <div style={{ fontSize: '.7rem', color: '#888', marginBottom: '.2rem' }}>{t.region} - {t.innkeeper}</div>
          <div style={{ fontSize: '.75rem', color: '#666', marginBottom: '.3rem' }}>{t.description}</div>
          <div style={{ display: 'flex', gap: '.3rem' }}>
            <button onClick={() => act(() => api.tavernRest(t.id))} style={{ flex: 1, padding: '.3rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Rest {t.rest_cost}s</button>
            <button onClick={() => act(() => api.tavernMeal(t.id))} style={{ flex: 1, padding: '.3rem', background: '#4a6a4a', color: '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Meal {t.meal_cost}s</button>
            <button onClick={() => act(() => api.tavernDrink(t.id))} style={{ flex: 1, padding: '.3rem', background: '#4a5a7a', color: '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Drink {t.drink_cost}s</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function StableUI() {
  const [myMounts, setMyMounts] = useState([])
  const [result, setResult] = useState(null)

  const mountTypes = [
    { type: 'palfrey', name: 'Palfrey', cost: 25, spd: 8, cmb: 0, end: 12 },
    { type: 'courser', name: 'Courser', cost: 50, spd: 12, cmb: 2, end: 10 },
    { type: 'destrier', name: 'Destrier', cost: 100, spd: 10, cmb: 5, end: 15 },
    { type: 'sand_steed', name: 'Sand Steed', cost: 80, spd: 15, cmb: 1, end: 8 },
    { type: 'draft', name: 'Draft Horse', cost: 15, spd: 5, cmb: 0, end: 20 },
    { type: 'pony', name: 'Pony', cost: 20, spd: 7, cmb: 1, end: 18 },
  ]

  const load = async () => { try { const d = await api.mountMy(); setMyMounts(d.mounts || []) } catch (e) {} }
  useEffect(() => { load() }, [])

  const act = async (fn) => { setResult(null); try { const r = await fn(); setResult({ success: r.message }); load() } catch (e) { setResult({ error: e.message }) } }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}

      {myMounts.length > 0 && (
        <div style={{ marginBottom: '.5rem' }}>
          <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Your Mounts</h4>
          {myMounts.map(m => (
            <div key={m.id} style={{ background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
              <div style={{ fontSize: '.85rem' }}>{m.name} {m.is_active === 1 && <span style={{ color: '#b08d57' }}>★</span>}</div>
              <div style={{ fontSize: '.7rem', color: '#888' }}>Spd:{m.speed} Cmb:+{m.combat_bonus} End:{m.endurance} {m.is_trained === 1 && '✓'}</div>
              <div style={{ display: 'flex', gap: '.3rem', marginTop: '.2rem' }}>
                {m.is_trained !== 1 && <button onClick={() => act(() => api.mountTrain(m.id))} style={{ padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Train 30s</button>}
                {m.is_active !== 1 && <button onClick={() => act(() => api.mountEquip(m.id))} style={{ padding: '.2rem .4rem', background: '#4a6a4a', color: '#e0d6c2', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Equip</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Buy a Mount</h4>
      {mountTypes.map(m => (
        <div key={m.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
          <div>
            <div style={{ fontSize: '.85rem' }}>{m.name}</div>
            <div style={{ fontSize: '.7rem', color: '#888' }}>Spd:{m.spd} Cmb:+{m.cmb} End:{m.end} - {m.cost}s</div>
          </div>
          <button onClick={() => act(() => api.mountBuy({ mount_type: m.type }))} style={{ padding: '.3rem .5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Buy</button>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function ContractsUI() {
  const [contracts, setContracts] = useState([])
  const [result, setResult] = useState(null)

  const load = async () => { try { const d = await api.contractList(); setContracts(d.contracts || []) } catch (e) {} }
  useEffect(() => { load() }, [])

  const accept = async (id) => {
    setResult(null)
    try { const r = await api.contractAccept(id); setResult({ success: r.message }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Open Contracts</h4>
      {contracts.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No open contracts. Post one on the website.</div> : (
        contracts.map(c => (
          <div key={c.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem', textTransform: 'capitalize' }}>{c.type.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '.7rem', color: '#888' }}>by {c.contractor}</span>
            </div>
            <p style={{ fontSize: '.8rem', margin: '.2rem 0' }}>{c.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#b08d57' }}>
                {c.reward_gold > 0 && `${c.reward_gold}g `}{c.reward_stags > 0 && `${c.reward_stags}s `}{c.reward_stars > 0 && `${c.reward_stars}c`}
              </span>
              <button onClick={() => accept(c.id)} style={{ padding: '.3rem .5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Accept</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function LandmarkUI() {
  const [landmarks, setLandmarks] = useState([])
  const [discoveries, setDiscoveries] = useState([])
  const [result, setResult] = useState(null)

  const load = async () => {
    try {
      const [lm, ds] = await Promise.all([api.landmarks(), api.myDiscoveries()])
      setLandmarks(lm.landmarks || [])
      setDiscoveries(ds.discoveries || [])
    } catch (e) { setResult({ error: e.message }) }
  }
  useEffect(() => { load() }, [])

  const discoveredNames = new Set(discoveries.map(d => d.name))

  const discover = async (id, name) => {
    setResult(null)
    try { const r = await api.discover(id); setResult({ success: r }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && (
        <div style={{ background: '#1a3a1a', padding: '.5rem', borderRadius: '4px', marginBottom: '.5rem' }}>
          <div style={{ color: '#2ecc71', fontSize: '.9rem' }}>{result.success.message}</div>
          {result.success.description && <div style={{ color: '#888', fontSize: '.8rem', marginTop: '.2rem' }}>{result.success.description}</div>}
        </div>
      )}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {landmarks.map(l => {
          const found = discoveredNames.has(l.name)
          return (
            <div key={l.id} style={{ background: found ? '#1a2a1a' : '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem', opacity: found ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.85rem' }}>{found ? `${l.name} ✓` : l.name}</span>
                <span style={{ fontSize: '.65rem', color: '#888' }}>{l.region}</span>
              </div>
              {found && <div style={{ fontSize: '.75rem', color: '#888' }}>{l.description}</div>}
              {!found && <button onClick={() => discover(l.id, l.name)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Discover (+{l.discover_xp} RP)</button>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
function TradeUI() {
  const [goods, setGoods] = useState({})
  const [result, setResult] = useState(null)

  const load = async () => {
    try { const d = await api.tradeMyGoods(); setGoods(d.summary || {}) } catch (e) {}
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Your House Goods</h4>
      {Object.keys(goods).length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No goods. Join a house with territories.</div> : (
        Object.entries(goods).sort((a, b) => b[1] - a[1]).map(([good, qty]) => (
          <div key={good} style={{ display: 'flex', justifyContent: 'space-between', background: '#2a2a4e', padding: '.3rem .5rem', borderRadius: '3px', marginBottom: '.2rem' }}>
            <span style={{ fontSize: '.85rem' }}>{good}</span>
            <span style={{ color: '#b08d57', fontSize: '.85rem' }}>{qty}</span>
          </div>
        ))
      )}
      <p style={{ fontSize: '.75rem', color: '#888', marginTop: '.5rem' }}>Visit the website for full trade negotiations.</p>
    </div>
  )
}

// =====================================================
function ShopUI() {
  const [category, setCategory] = useState('weapon')
  const [items, setItems] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const categories = [
    { key: 'weapon', label: 'Weapons' },
    { key: 'armor', label: 'Armor' },
    { key: 'shield', label: 'Shields' },
    { key: 'consumable', label: 'Consumables' },
    { key: 'material', label: 'Materials' },
    { key: 'misc', label: 'Misc' }
  ]

  const load = async (cat) => {
    setLoading(true); setResult(null)
    try {
      const data = await api.npcVendor(cat)
      setItems(data.items || [])
    } catch (e) { setResult({ error: e.message }) }
    setLoading(false)
  }
  useEffect(() => { load(category) }, [category])

  const buy = async (itemId, itemName) => {
    setResult(null)
    try { const r = await api.npcBuy(itemId); setResult({ success: r.message }) }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.2rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
        {categories.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            style={{ padding: '.2rem .4rem', background: category === c.key ? '#b08d57' : '#2a2a4e', color: category === c.key ? '#1a1a2e' : '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px', fontSize: '.7rem', cursor: 'pointer' }}>
            {c.label}
          </button>
        ))}
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      {loading ? <div>Loading...</div> : (
        <div>
          {items.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No items in this category.</div> : (
            items.map(it => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
                <div>
                  <div style={{ fontSize: '.85rem' }}>{it.name}</div>
                  <div style={{ fontSize: '.7rem', color: '#888' }}>{it.item_type} - {it.base_price} stags</div>
                </div>
                <button onClick={() => buy(it.id, it.name)} style={{ padding: '.3rem .5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Buy</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// =====================================================
function BankingUI() {
  const [char, setChar] = useState(null)
  const [result, setResult] = useState(null)
  const [amount, setAmount] = useState(10)
  const [direction, setDirection] = useState('stags_stars')

  const load = async () => { try { setChar(await api.getCharacter()) } catch (e) {} }
  useEffect(() => { load() }, [])

  const convert = async () => {
    setResult(null)
    try { const r = await api.convertCurrency(direction, amount); setResult({ success: r.message }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  if (!char) return <div>Loading balance...</div>
  return (
    <div>
      <div style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem' }}>Gold Dragons</span><span style={{ color: '#ffd700', fontSize: '.85rem' }}>{char.gold_dragons}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem' }}>Silver Stags</span><span style={{ color: '#c0c0c0', fontSize: '.85rem' }}>{char.silver_stags}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '.85rem' }}>Copper Stars</span><span style={{ color: '#b87333', fontSize: '.85rem' }}>{char.copper_stars}</span>
        </div>
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <div style={{ marginBottom: '.3rem' }}>
        <label style={{ fontSize: '.8rem', color: '#888' }}>Direction:</label>
        <select value={direction} onChange={e => setDirection(e.target.value)}
          style={{ width: '100%', padding: '.3rem', background: '#2a2a4e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px' }}>
          <option value="stags_stars">Stags to Stars</option>
          <option value="stars_stags">Stars to Stags</option>
        </select>
      </div>
      <div style={{ marginBottom: '.3rem' }}>
        <label style={{ fontSize: '.8rem', color: '#888' }}>Amount: {amount}</label>
        <input type="range" min="1" max="500" value={amount} onChange={e => setAmount(parseInt(e.target.value))} style={{ width: '100%' }} />
      </div>
      <button onClick={convert} style={{ width: '100%', padding: '.5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>Convert</button>
      <p style={{ fontSize: '.7rem', color: '#666', marginTop: '.3rem', textAlign: 'center' }}>5% conversion fee applies. 56 stars = 1 stag.</p>
    </div>
  )
}

// =====================================================
function BountyUI() {
  const [bounties, setBounties] = useState([])
  const [myBounties, setMyBounties] = useState([])
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('open')

  const load = async () => {
    try {
      const [b, mb] = await Promise.all([api.bountyList(), api.bountyMy()])
      setBounties(b.bounties || [])
      setMyBounties(mb.bounties || [])
    } catch (e) {}
  }
  useEffect(() => { load() }, [])

  const accept = async (id) => {
    setResult(null)
    try { const r = await api.bountyAccept(id); setResult({ success: r.message }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  const list = tab === 'open' ? bounties : myBounties

  return (
    <div>
      <div style={{ display: 'flex', gap: '.2rem', marginBottom: '.5rem' }}>
        <button onClick={() => setTab('open')} style={{ flex: 1, padding: '.3rem', background: tab === 'open' ? '#b08d57' : '#2a2a4e', color: tab === 'open' ? '#1a1a2e' : '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Open ({bounties.length})</button>
        <button onClick={() => setTab('mine')} style={{ flex: 1, padding: '.3rem', background: tab === 'mine' ? '#b08d57' : '#2a2a4e', color: tab === 'mine' ? '#1a1a2e' : '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Mine ({myBounties.length})</button>
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      {list.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No bounties.</div> : (
        list.map(b => (
          <div key={b.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{b.title || b.creature_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888', marginBottom: '.2rem' }}>{b.description || b.region}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#b08d57' }}>{b.reward_gold > 0 && `${b.reward_gold}g `}{b.reward_xp > 0 && `${b.reward_xp}xp`}</span>
              {tab === 'open' && <button onClick={() => accept(b.id)} style={{ padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Accept</button>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function NoticeUI() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.recentEvents().then(d => setEvents(d.events || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading notices...</div>
  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Recent Events</h4>
      {events.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No recent events.</div> : (
        events.map((e, i) => (
          <div key={i} style={{ background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.65rem', color: '#b08d57', textTransform: 'uppercase' }}>[{e.type}]</span>
            <span style={{ fontSize: '.8rem', marginLeft: '.3rem' }}>{e.text}</span>
            <div style={{ fontSize: '.6rem', color: '#666' }}>{e.date}</div>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function HealingUI() {
  const [char, setChar] = useState(null)
  const [result, setResult] = useState(null)
  const [healing, setHealing] = useState(false)

  const load = async () => { try { setChar(await api.getCharacter()) } catch (e) {} }
  useEffect(() => { load() }, [])

  const heal = async () => {
    setHealing(true); setResult(null)
    try { const r = await api.healShrine(20); setResult({ success: r.message, hp: r.hp_current, max: r.hp_max }); load() }
    catch (e) { setResult({ error: e.message }) }
    setHealing(false)
  }

  if (!char) return <div>Loading...</div>
  const hpPct = char.hp_max > 0 ? Math.round(char.hp_current / char.hp_max * 100) : 0
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: '#2a2a4e', padding: '.6rem', borderRadius: '4px', marginBottom: '.5rem' }}>
        <div style={{ fontSize: '.85rem', marginBottom: '.3rem' }}>HP: {char.hp_current} / {char.hp_max}</div>
        <div style={{ background: '#1a1a2e', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#2ecc71' : hpPct > 25 ? '#f39c12' : '#c44', height: '100%', transition: 'width .3s' }} />
        </div>
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <button onClick={heal} disabled={healing || hpPct >= 100}
        style={{ width: '100%', padding: '.5rem', background: hpPct >= 100 ? '#555' : '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: hpPct >= 100 ? 'default' : 'pointer' }}>
        {healing ? 'Praying...' : 'Pray for Healing (+20 HP)'}
      </button>
      <p style={{ fontSize: '.7rem', color: '#666', marginTop: '.3rem' }}>The shrine restores 20 HP per prayer.</p>
    </div>
  )
}

// =====================================================
function ArenaUI() {
  const [result, setResult] = useState(null)
  const [targetKey, setTargetKey] = useState('')
  const [dueling, setDueling] = useState(false)

  const duel = async () => {
    if (!targetKey) return
    setDueling(true); setResult(null)
    try { const r = await api.arenaDuel(targetKey); setResult(r) }
    catch (e) { setResult({ error: e.message }) }
    setDueling(false)
  }

  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Combat Arena</h4>
      <p style={{ fontSize: '.75rem', color: '#888', marginBottom: '.5rem' }}>Enter the avatar key of your opponent to challenge them to a duel.</p>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.result && (
        <div style={{ background: result.result === 'won' ? '#1a3a1a' : result.result === 'lost' ? '#3a1a1a' : '#2a2a4e', padding: '.6rem', borderRadius: '4px', marginBottom: '.5rem' }}>
          <div style={{ fontSize: '.9rem', color: result.result === 'won' ? '#2ecc71' : result.result === 'lost' ? '#c44' : '#b08d57' }}>
            {result.result === 'won' ? 'VICTORY!' : result.result === 'lost' ? 'DEFEAT' : 'DRAW'}
          </div>
          <div style={{ fontSize: '.8rem', color: '#888' }}>You: {result.my_roll} | Opp: {result.target_roll}</div>
          <div style={{ fontSize: '.8rem', color: '#888' }}>{result.message}</div>
        </div>
      )}
      <div style={{ marginBottom: '.3rem' }}>
        <input type="text" placeholder="Avatar UUID..." value={targetKey} onChange={e => setTargetKey(e.target.value)}
          style={{ width: '100%', padding: '.3rem', background: '#2a2a4e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px', fontSize: '.75rem' }} />
      </div>
      <button onClick={duel} disabled={dueling || !targetKey}
        style={{ width: '100%', padding: '.5rem', background: '#c44', color: '#fff', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>
        {dueling ? 'Fighting...' : 'Challenge to Duel'}
      </button>
    </div>
  )
}

// =====================================================
function CensusUI() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServerStatus().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Querying the maesters...</div>
  if (!stats) return <div>Failed to load census data.</div>

  return (
    <div>
      <div style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem' }}>Online Now</span><span style={{ color: '#2ecc71', fontSize: '.85rem' }}>{stats.online ?? 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem' }}>Total Characters</span><span style={{ color: '#b08d57', fontSize: '.85rem' }}>{stats.total_players ?? 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem' }}>Active Houses</span><span style={{ color: '#b08d57', fontSize: '.85rem' }}>{stats.total_houses ?? 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '.85rem' }}>Total Combats</span><span style={{ color: '#c44', fontSize: '.85rem' }}>{stats.total_combats ?? 0}</span>
        </div>
      </div>
      {stats.houses && stats.houses.length > 0 && (
        <div>
          <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Great Houses</h4>
          {stats.houses.slice(0, 10).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#2a2a4e', padding: '.3rem .5rem', borderRadius: '3px', marginBottom: '.2rem' }}>
              <span style={{ fontSize: '.8rem' }}>{h.name}</span>
              <span style={{ fontSize: '.8rem', color: '#b08d57' }}>{h.members} members</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================
function CraftingUI() {
  const [recipes, setRecipes] = useState([])
  const [activeCrafts, setActiveCrafts] = useState([])
  const [result, setResult] = useState(null)
  const [tab, setTab] = useState('recipes')
  const stationType = 'forge'

  const load = async () => {
    try {
      const [r, c] = await Promise.all([api.craftRecipes(stationType), api.craftCheck()])
      setRecipes(r.recipes || [])
      setActiveCrafts(c.active_crafts || [])
    } catch (e) {}
  }
  useEffect(() => { load() }, [])

  const start = async (recipeId) => {
    setResult(null)
    try { const r = await api.craftStart(recipeId, 1); setResult({ success: `Crafting started! Completes at ${r.completes_at}` }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  const complete = async (craftId) => {
    setResult(null)
    try { const r = await api.craftComplete(craftId); setResult({ success: `Crafted ${r.item}! +${r.xp} XP` }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '.2rem', marginBottom: '.5rem' }}>
        <button onClick={() => setTab('recipes')} style={{ flex: 1, padding: '.3rem', background: tab === 'recipes' ? '#b08d57' : '#2a2a4e', color: tab === 'recipes' ? '#1a1a2e' : '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Recipes</button>
        <button onClick={() => setTab('active')} style={{ flex: 1, padding: '.3rem', background: tab === 'active' ? '#b08d57' : '#2a2a4e', color: tab === 'active' ? '#1a1a2e' : '#e0d6c2', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Active ({activeCrafts.length})</button>
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      {tab === 'recipes' ? (
        recipes.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No recipes available.</div> : (
          recipes.map(r => (
            <div key={r.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
              <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{r.name}</div>
              <div style={{ fontSize: '.7rem', color: '#888' }}>{r.skill} L{r.skill_level} - {r.time_mins}m - +{r.xp} XP</div>
              <div style={{ fontSize: '.7rem', color: '#666', marginTop: '.2rem' }}>Materials: {r.materials?.map(m => `${m.name} x${m.qty}`).join(', ')}</div>
              <button onClick={() => start(r.id)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Start</button>
            </div>
          ))
        )
      ) : (
        activeCrafts.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No active crafts.</div> : (
          activeCrafts.map(c => (
            <div key={c.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
              <div style={{ fontSize: '.85rem' }}>{c.recipe}</div>
              <div style={{ fontSize: '.7rem', color: c.ready ? '#2ecc71' : '#888' }}>{c.ready ? 'Ready!' : `${c.seconds_left}s remaining`}</div>
              {c.ready && <button onClick={() => complete(c.id)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#2ecc71', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Complete</button>}
            </div>
          ))
        )
      )}
    </div>
  )
}

// =====================================================
function ResurrectionUI() {
  const [deadName, setDeadName] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!deadName) return
    setSubmitting(true); setResult(null)
    try { const r = await api.resurrectRequest(deadName); setResult({ success: r.message }) }
    catch (e) { setResult({ error: e.message }) }
    setSubmitting(false)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: '#2a2a1a', border: '1px solid #ff6600', padding: '.5rem', borderRadius: '4px', marginBottom: '.5rem' }}>
        <p style={{ fontSize: '.8rem', color: '#ff6600', marginBottom: '.3rem' }}>R'hllor Resurrection Altar</p>
        <p style={{ fontSize: '.7rem', color: '#888' }}>WARNING: Requires admin approval. Only permanently dead characters can be resurrected.</p>
      </div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <div style={{ marginBottom: '.3rem' }}>
        <input type="text" placeholder="Dead character name..." value={deadName} onChange={e => setDeadName(e.target.value)}
          style={{ width: '100%', padding: '.3rem', background: '#2a2a4e', color: '#e0d6c2', border: '1px solid #ff6600', borderRadius: '3px', fontSize: '.8rem' }} />
      </div>
      <button onClick={submit} disabled={submitting || !deadName}
        style={{ width: '100%', padding: '.5rem', background: '#ff6600', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>
        {submitting ? 'Petitioning...' : 'Petition Resurrection'}
      </button>
    </div>
  )
}

// =====================================================
function MessagesObjUI() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.recentEvents().then(d => setEvents(d.events || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading messages...</div>
  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Recent Messages</h4>
      {events.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No recent messages.</div> : (
        events.map((e, i) => (
          <div key={i} style={{ background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.65rem', color: '#b08d57', textTransform: 'uppercase' }}>[{e.type}]</span>
            <span style={{ fontSize: '.8rem', marginLeft: '.3rem' }}>{e.text}</span>
            <div style={{ fontSize: '.6rem', color: '#666' }}>{e.date}</div>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function RoadsObjUI() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.travelConnectionsAll().then(d => setConnections(d.connections || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading roads...</div>
  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Territory Connections</h4>
      {connections.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No connections found.</div> : (
        connections.map((c, i) => (
          <div key={i} style={{ background: '#2a2a4e', padding: '.4rem', borderRadius: '3px', marginBottom: '.3rem' }}>
            <div style={{ fontSize: '.85rem' }}>{c.origin_name} → {c.destination_name}</div>
            <div style={{ fontSize: '.7rem', color: '#888' }}>{c.road_name} · {c.travel_type} · {c.travel_hours}h · Danger: {c.danger_level}</div>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function ProductionObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Production Workbench</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Visit the website for production chains and crafting schedules.</p>
    </div>
  )
}

// =====================================================
function ScriptoriumObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Scriptorium</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>The maesters craft scrolls and records here.</p>
    </div>
  )
}

// =====================================================
function ShipyardObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Shipyard</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Ships are constructed and repaired here. Visit the website for maritime trade.</p>
    </div>
  )
}

// =====================================================
function SiegeObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Siege Engine</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>War machines are prepared for battle.</p>
    </div>
  )
}

// =====================================================
function TaxObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Tax Office</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Taxes are collected for the lord of the region.</p>
    </div>
  )
}

// =====================================================
function ThroneObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Throne Room</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>The Iron Throne sits upon a dais of twisted blades. Visit the website for political proceedings.</p>
    </div>
  )
}

// =====================================================
function WeatherObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Weather Stone</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>The stone hums with the current weather. Visit the website for weather effects.</p>
    </div>
  )
}

// =====================================================
function StallObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Market Stall</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Goods are traded here. Visit the marketplace on the website.</p>
    </div>
  )
}

// =====================================================
function ReligiousObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Sept</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Light a candle to the Seven. Visit the website for religious sites and prayer bonuses.</p>
    </div>
  )
}

// =====================================================
function DragonObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Dragonpit</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>The ruins of the Dragonpit loom large. Dragons have not been seen in Westeros for centuries.</p>
    </div>
  )
}

// =====================================================
function EarsObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Ear Collector</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Bring proof of your kills. Bounties are paid for the ears of bandits and outlaws.</p>
    </div>
  )
}

// =====================================================
function LinksObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Landmark Giver</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Touch to receive landmarks to important locations across the Seven Kingdoms.</p>
    </div>
  )
}

// =====================================================
function CalendarObjUI() {
  const [events, setEvents] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.calendarEventList(false); setEvents(d.events || []) } catch (e) { setResult({ error: e.message }) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const register = async (eventId) => {
    setResult(null)
    try { const r = await api.calendarEventRegister(eventId); setResult({ success: r.message || 'Registered!' }) }
    catch (e) { setResult({ error: e.message }) }
  }

  if (loading) return <div>Loading events...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Upcoming Events</h4>
      {events.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No upcoming events.</div> : (
        events.map(e => (
          <div key={e.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.9rem' }}>{e.title}</div>
            <div style={{ fontSize: '.75rem', color: '#888', marginBottom: '.2rem' }}>{e.event_type} - {e.region}</div>
            <div style={{ fontSize: '.75rem', color: '#666', marginBottom: '.3rem' }}>{e.scheduled_at?.slice(0, 16)}</div>
            <button onClick={() => register(e.id)} style={{ padding: '.3rem .5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Register</button>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function DiplomacyObjUI() {
  const [treaties, setTreaties] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.diplomacyTreatyList(); setTreaties(d.treaties || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <div>Loading treaties...</div>
  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Treaties</h4>
      {treaties.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No treaties.</div> : (
        treaties.map(t => (
          <div key={t.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.85rem', marginBottom: '.2rem' }}><strong style={{ color: '#b08d57' }}>{t.house_a_name}</strong> vs <strong style={{ color: '#b08d57' }}>{t.house_b_name}</strong></div>
            <div style={{ fontSize: '.75rem', color: '#888', marginBottom: '.3rem' }}>{t.treaty_type}</div>
            <span style={{ fontSize: '.7rem', padding: '.1rem .3rem', borderRadius: '3px', background: t.status === 'active' ? '#1a3a1a' : '#3a3a1a', color: t.status === 'active' ? '#2ecc71' : '#f39c12' }}>{t.status}</span>
          </div>
        ))
      )}
      <p style={{ fontSize: '.75rem', color: '#888', marginTop: '.5rem' }}><a href="#/diplomacy" style={{ color: '#b08d57' }}>View full diplomacy page</a></p>
    </div>
  )
}

// =====================================================
function DragonglassObjUI() {
  const [recipes, setRecipes] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.magicDragonglassRecipes(); setRecipes(d.recipes || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const craft = async (recipeId) => {
    setResult(null)
    try { const r = await api.magicDragonglassCraft(recipeId); setResult({ success: r.message || 'Crafted!' }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  if (loading) return <div>Loading recipes...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Dragonglass Recipes</h4>
      {recipes.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No recipes available.</div> : (
        recipes.map(r => (
          <div key={r.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{r.recipe_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Result: {r.result_item_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Dragonglass: {r.dragonglass_needed} | Min Lvl: {r.min_level}</div>
            <button onClick={() => craft(r.id)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Craft</button>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function ValyrianObjUI() {
  const [recipes, setRecipes] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.magicValyrianRecipes(); setRecipes(d.recipes || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const reforge = async (recipeId, goldCost, chance) => {
    if (!confirm(`Reforge for ${goldCost} gold? Success chance: ${chance}%`)) return
    setResult(null)
    try { const r = await api.magicValyrianReforge(recipeId); setResult({ success: r.message || 'Reforged!' }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  if (loading) return <div>Loading recipes...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Valyrian Reforging</h4>
      {recipes.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No recipes available.</div> : (
        recipes.map(r => (
          <div key={r.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{r.recipe_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>{r.source_item_name} → {r.result_item_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Cost: {r.gold_cost}g | Success: {r.success_chance}% | Min Lvl: {r.min_level}</div>
            <button onClick={() => reforge(r.id, r.gold_cost, r.success_chance)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Reforge</button>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function RhllorObjUI() {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.magicRitualList(); setRituals(d.rituals || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <div>Loading rituals...</div>
  return (
    <div>
      <div style={{ background: '#2a2a1a', border: '1px solid #ff6600', padding: '.4rem', borderRadius: '4px', marginBottom: '.5rem' }}>
        <p style={{ fontSize: '.8rem', color: '#ff6600', marginBottom: '.2rem' }}>R'hllor Rituals</p>
        <p style={{ fontSize: '.7rem', color: '#888' }}>Resurrection rituals require admin approval and a worthy sacrifice.</p>
      </div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Rituals</h4>
      {rituals.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No rituals performed.</div> : (
        rituals.map(r => (
          <div key={r.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.85rem' }}><strong style={{ color: '#b08d57' }}>{r.priest_name}</strong> → {r.target_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>{r.ritual_type} - {r.status}</div>
            {r.performed_at && <div style={{ fontSize: '.7rem', color: '#666' }}>{r.performed_at.slice(0, 16)}</div>}
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function WeirwoodObjUI() {
  const [visions, setVisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [interp, setInterp] = useState({})

  const load = async () => {
    setLoading(true)
    try { const d = await api.magicVisionList(); setVisions(d.visions || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const interpret = async (visionId) => {
    setResult(null)
    try { const r = await api.magicVisionInterpret(visionId, interp[visionId] || ''); setResult({ success: r.message || 'Interpreted!' }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  if (loading) return <div>Loading visions...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Greenseeing Visions</h4>
      {visions.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No visions received.</div> : (
        visions.map(v => (
          <div key={v.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{v.vision_type}</div>
            {v.region && <div style={{ fontSize: '.7rem', color: '#888' }}>{v.region}</div>}
            <div style={{ fontSize: '.8rem', color: '#e0d6c2', margin: '.2rem 0' }}>{v.vision_content}</div>
            <div style={{ fontSize: '.7rem', color: '#666' }}>Seen: {v.seen_at?.slice(0, 16)}</div>
            {!v.is_interpreted && (
              <div style={{ marginTop: '.3rem' }}>
                <textarea placeholder="Interpretation..." value={interp[v.id] || ''} onChange={e => setInterp({ ...interp, [v.id]: e.target.value })}
                  style={{ width: '100%', padding: '.3rem', background: '#1a1a2e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px', fontSize: '.75rem', minHeight: '40px' }} />
                <button onClick={() => interpret(v.id)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Interpret</button>
              </div>
            )}
            {v.is_interpreted && <div style={{ fontSize: '.75rem', color: '#2ecc71', marginTop: '.2rem' }}>✓ Interpreted</div>}
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function IronBankObjUI() {
  const [banks, setBanks] = useState([])
  const [loans, setLoans] = useState([])
  const [result, setResult] = useState(null)
  const [repay, setRepay] = useState({})

  const load = async () => {
    try {
      const [b, l] = await Promise.all([api.economyBanksList(), api.economyMyLoans()])
      setBanks(b.banks || [])
      setLoans(l.loans || [])
    } catch (e) {}
  }
  useEffect(() => { load() }, [])

  const doRepay = async (loanId) => {
    const amt = parseInt(repay[loanId]) || 0
    if (amt <= 0) return
    setResult(null)
    try { const r = await api.economyLoanRepay(loanId, amt); setResult({ success: r.message || 'Repaid!' }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Banks</h4>
      {banks.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No banks established.</div> : (
        banks.map(b => (
          <div key={b.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{b.name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Interest: {b.interest_rate}% | Reserve: {b.gold_reserve?.toLocaleString()}g</div>
          </div>
        ))
      )}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', margin: '.5rem 0 .3rem' }}>Your Loans</h4>
      {loans.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No outstanding loans.</div> : (
        loans.map(l => (
          <div key={l.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.85rem' }}>{l.bank_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Due: {l.total_due}g | Repaid: {l.amount_repaid}g</div>
            <div style={{ fontSize: '.75rem', color: l.status === 'active' ? '#b08d57' : '#888' }}>{l.status}</div>
            {l.status === 'active' && (
              <div style={{ display: 'flex', gap: '.3rem', marginTop: '.2rem' }}>
                <input type="number" placeholder="Amount" value={repay[l.id] || ''} onChange={e => setRepay({ ...repay, [l.id]: e.target.value })}
                  style={{ width: '80px', padding: '.2rem', background: '#1a1a2e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '2px', fontSize: '.7rem' }} />
                <button onClick={() => doRepay(l.id)} style={{ padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Repay</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function TravelObjUI() {
  const [territoryId, setTerritoryId] = useState('')
  const [connections, setConnections] = useState([])
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(null)

  const find = async () => {
    if (!territoryId) return
    setResult(null)
    try { const d = await api.travelConnectionsFrom(territoryId); setConnections(d.connections || []); setSearched(territoryId) }
    catch (e) { setResult({ error: e.message }) }
  }

  const start = async (toId) => {
    setResult(null)
    try { const r = await api.travelJourneyStart(searched, toId, 0); setResult({ success: r.message || 'Journey started!' }) }
    catch (e) { setResult({ error: e.message }) }
  }

  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Travel Routes</h4>
      <div style={{ display: 'flex', gap: '.3rem', marginBottom: '.5rem' }}>
        <input type="text" placeholder="Territory ID..." value={territoryId} onChange={e => setTerritoryId(e.target.value)}
          style={{ flex: 1, padding: '.3rem', background: '#2a2a4e', color: '#e0d6c2', border: '1px solid #b08d57', borderRadius: '3px', fontSize: '.75rem' }} />
        <button onClick={find} style={{ padding: '.3rem .5rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '3px', fontSize: '.75rem', cursor: 'pointer' }}>Find</button>
      </div>
      {searched && connections.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No routes found.</div> : (
        connections.map(c => (
          <div key={c.to_territory_id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{c.destination_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>{c.road_name || 'Unnamed'} - {c.travel_type}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>{c.travel_hours}h | Danger: {c.danger_level}</div>
            {c.is_passable == 1 ? (
              <button onClick={() => start(c.to_territory_id)} style={{ marginTop: '.2rem', padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Start Journey</button>
            ) : <div style={{ fontSize: '.7rem', color: '#c44', marginTop: '.2rem' }}>Impassable</div>}
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function TournamentObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Tournament Board</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Visit the website for tournament registration and brackets.</p>
    </div>
  )
}

// =====================================================
function JusticeObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Court of Justice</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Visit the website for criminal records and trials.</p>
    </div>
  )
}

// =====================================================
function CouncilObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Council Chamber</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Visit the website for Small Council proceedings.</p>
    </div>
  )
}

// =====================================================
function GallowsObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>The Gallows</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Justice comes for all men eventually.</p>
    </div>
  )
}

// =====================================================
function GuardObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Guard Post</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Stand watch. Report disturbances to the captain.</p>
    </div>
  )
}

// =====================================================
function HarborObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Harbor</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>Ships dock at the harbor. Visit the website for maritime trade.</p>
    </div>
  )
}

// =====================================================
function HeraldryObjUI() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h4 style={{ color: '#b08d57', fontSize: '.9rem', marginBottom: '.5rem' }}>Heraldry Display</h4>
      <p style={{ fontSize: '.85rem', color: '#888' }}>The sigils of the great houses are displayed here.</p>
    </div>
  )
}

// =====================================================
function MarriageObjUI() {
  const [marriages, setMarriages] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.diplomacyMarriageList(); setMarriages(d.marriages || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <div>Loading pacts...</div>
  return (
    <div>
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Marriage Pacts</h4>
      {marriages.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No marriage pacts.</div> : (
        marriages.map(m => (
          <div key={m.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.85rem' }}><strong style={{ color: '#b08d57' }}>{m.house_a_name}</strong> & <strong style={{ color: '#b08d57' }}>{m.house_b_name}</strong></div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Groom: {m.groom_name || 'TBD'} | Bride: {m.bride_name || 'TBD'}</div>
            <div style={{ fontSize: '.75rem', color: '#888' }}>Dowry: {m.dowry_gold}g</div>
            <span style={{ fontSize: '.7rem', padding: '.1rem .3rem', borderRadius: '3px', background: m.status === 'married' ? '#1a3a1a' : '#3a3a1a', color: m.status === 'married' ? '#2ecc71' : '#f39c12' }}>{m.status}</span>
          </div>
        ))
      )}
    </div>
  )
}

// =====================================================
function DungeonObjUI() {
  const [bounties, setBounties] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await api.bountyList(); setBounties(d.bounties || []) } catch (e) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const accept = async (id) => {
    setResult(null)
    try { const r = await api.bountyAccept(id); setResult({ success: r.message || 'Accepted!' }); load() }
    catch (e) { setResult({ error: e.message }) }
  }

  if (loading) return <div>Loading bounties...</div>
  return (
    <div>
      {result?.error && <div style={{ color: '#c44', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.error}</div>}
      {result?.success && <div style={{ color: '#2ecc71', fontSize: '.85rem', marginBottom: '.3rem' }}>{result.success}</div>}
      <h4 style={{ color: '#b08d57', fontSize: '.85rem', marginBottom: '.3rem' }}>Bounties</h4>
      {bounties.length === 0 ? <div style={{ color: '#888', fontSize: '.85rem' }}>No bounties.</div> : (
        bounties.map(b => (
          <div key={b.id} style={{ background: '#2a2a4e', padding: '.5rem', borderRadius: '4px', marginBottom: '.4rem' }}>
            <div style={{ fontWeight: 'bold', color: '#b08d57', fontSize: '.85rem' }}>{b.title || b.creature_name}</div>
            <div style={{ fontSize: '.75rem', color: '#888', marginBottom: '.2rem' }}>{b.description || b.region}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#b08d57' }}>{b.reward_gold > 0 && `${b.reward_gold}g `}{b.reward_xp > 0 && `${b.reward_xp}xp`}</span>
              <button onClick={() => accept(b.id)} style={{ padding: '.2rem .4rem', background: '#b08d57', color: '#1a1a2e', border: 'none', borderRadius: '2px', fontSize: '.7rem', cursor: 'pointer' }}>Accept</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
