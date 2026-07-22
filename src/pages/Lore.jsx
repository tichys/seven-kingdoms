import { useState } from 'react'

export default function Lore() {
  const [section, setSection] = useState('newplayer')

  const sections = [
    { id: 'newplayer', label: 'New Player Guide' },
    { id: 'regions', label: 'Regions of Westeros' },
    { id: 'combat', label: 'Combat Guide' },
    { id: 'stats', label: 'SPECIAL Stats' },
    { id: 'magic', label: 'Magic System' },
    { id: 'economy', label: 'Economy Guide' },
    { id: 'survival', label: 'Survival Guide' },
    { id: 'religion', label: 'Religion & Devotion' },
    { id: 'crafting', label: 'Crafting Guide' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Lore & Guides</h1>
        <p>Everything you need to know about the world and its rules</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="btn btn-sm"
              style={{
                background: section === s.id ? 'var(--gold)' : 'transparent',
                color: section === s.id ? 'var(--bg-dark)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px 4px 0 0',
                borderBottom: 'none',
                padding: '.5rem 1rem',
                cursor: 'pointer',
                fontSize: '.85rem'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="parchment" style={{ padding: '2rem', maxWidth: '800px', lineHeight: '1.7' }}>
          {section === 'newplayer' && <NewPlayerGuide />}
          {section === 'regions' && <RegionLore />}
          {section === 'combat' && <CombatGuide />}
          {section === 'stats' && <StatsGuide />}
          {section === 'magic' && <MagicGuide />}
          {section === 'economy' && <EconomyGuide />}
          {section === 'survival' && <SurvivalGuide />}
          {section === 'religion' && <ReligionGuide />}
          {section === 'crafting' && <CraftingGuide />}
        </div>
      </div>
    </div>
  )
}

function H2({ children }) { return <h2 style={{ color: 'var(--gold)', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem', marginBottom: '1rem' }}>{children}</h2> }
function H3({ children }) { return <h3 style={{ color: 'var(--text)', marginTop: '1.5rem', marginBottom: '.5rem' }}>{children}</h3> }
function P({ children }) { return <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>{children}</p> }
function UL({ children }) { return <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>{children}</ul> }
function LI({ children }) { return <li style={{ marginBottom: '.25rem' }}>{children}</li> }
function Note({ children }) { return <div style={{ padding: '.75rem 1rem', background: 'rgba(218,165,32,0.08)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: '4px', margin: '1rem 0', fontSize: '.9rem' }}>{children}</div> }

// =====================================================
function NewPlayerGuide() {
  return (
    <div>
      <H2>Welcome to Westeros</H2>
      <P>This guide will help you get started in the ASOIAF Roleplaying HUD. Whether you're a veteran roleplayer or new to Second Life, these steps will get you playing quickly.</P>

      <H3>1. Wear the HUD</H3>
      <P>Attach the ASOIAF RP HUD to any HUD attachment point. The HUD will initialize all 12 scripts. Wait until you see the message "All systems ready" before proceeding.</P>

      <H3>2. Login</H3>
      <P>Type <code>/hud login</code> in local chat. The HUD connects to the server and creates your character. On first login, your character is auto-registered with starting stats and currency.</P>
      <P>If you see "Config not loaded yet", wait a few seconds for the notecard to finish reading, then try again.</P>

      <H3>3. Check Your Stats</H3>
      <P>Type <code>/hud stats</code> to see your six SPECIAL attributes. You start with 3 in each stat and 12 points to distribute. Visit the website to allocate your stats.</P>

      <H3>4. Join a House</H3>
      <P>Visit the Houses page on the website to browse available houses. Contact an admin or house lord in-world to join a house. House membership unlocks titles, territory income, and political gameplay.</P>

      <H3>5. Choose an Archetype</H3>
      <P>Your archetype defines your character's role. There are 22 archetypes from Knight to Maester to Warg. Some are admin-locked or require specific house/faction membership. Visit the Compendium to see all options.</P>
      <Note>Archetype choice is permanent. Choose carefully — it cannot be changed later without admin assistance.</Note>

      <H3>6. Start Roleplaying</H3>
      <P>Set your status to IC (In-Character) with <code>/hud ic</code>. Use <code>/hud emote [text]</code> to send emotes (minimum 20 characters for RP score). Type <code>/hud menu</code> for the full menu.</P>

      <H3>Chat Commands</H3>
      <UL>
        <LI><code>/hud menu</code> — Open the main HUD dialog menu</LI>
        <LI><code>/hud login</code> — Log in to the server</LI>
        <LI><code>/hud stats</code> — View your SPECIAL stats</LI>
        <LI><code>/hud inventory</code> — View your inventory</LI>
        <LI><code>/hud roll d20</code> — Roll a 20-sided die</LI>
        <LI><code>/hud emote [text]</code> — Send an RP emote</LI>
        <LI><code>/hud ic</code> — Set status to In-Character</LI>
        <LI><code>/hud ooc</code> — Set status to Out-Of-Character</LI>
        <LI><code>/hud help</code> — Show help text</LI>
      </UL>

      <Note>Combat requires mutual consent. Both players must agree to fight via the menu. Death is permanent — resurrection is only possible through a R'hllor priest ritual.</Note>
    </div>
  )
}

// =====================================================
function RegionLore() {
  const regions = [
    { name: 'The North', color: '#cfc', lord: 'House Stark', seat: 'Winterfell', desc: 'The largest region of Westeros, stretching from the Neck to the Wall. Cold, vast, and sparsely populated. The Northmen value honor and the Old Gods. Winterfell is the ancestral seat of House Stark, built around a godswood with a heart tree.' },
    { name: 'The Vale', color: '#cef', lord: 'House Arryn', seat: 'The Eyrie', desc: 'A mountainous region filled with fertile valleys, surrounded by the Mountains of the Moon. The Eyrie sits atop the Giant\'s Lance, impregnable to assault. The Vale knights are known for their discipline and chivalry.' },
    { name: 'The Riverlands', color: '#cfc', lord: 'House Tully', seat: 'Riverrun', desc: 'A fertile region at the heart of Westeros, crossed by many rivers. Centrally located, the Riverlands are often caught in wars between larger kingdoms. Riverrun sits at the confluence of the Tumblestone and Red Fork.' },
    { name: 'The Westerlands', color: '#fc8', lord: 'House Lannister', seat: 'Casterly Rock', desc: 'Rich in gold mines and industry, the Westerlands are the wealthiest region in the realm. Casterly Rock is carved into a massive cliff overlooking the Sunset Sea. The Lannisters are known for their cunning and gold.' },
    { name: 'The Reach', color: '#cfa', lord: 'House Tyrell', seat: 'Highgarden', desc: 'The most fertile and populous region, known for its fields of golden wheat and flowers. Highgarden is a beautiful castle surrounded by gardens. The Reach fields the largest army in Westeros.' },
    { name: 'The Stormlands', color: '#aaf', lord: 'House Baratheon', seat: 'Storm\'s End', desc: 'A rocky, windswept land battered by storms from the Narrow Sea. Storm\'s End is one of the strongest castles in Westeros, said to be built by the first Storm King. The Stormlanders are hardy warriors.' },
    { name: 'Dorne', color: '#fc8', lord: 'House Martell', seat: 'Sunspear', desc: 'A desert region of sand and sun, the hottest in Westeros. Dorne maintains many unique traditions, including equal inheritance for men and women. Sunspear guards the eastern coast of Dorne.' },
    { name: 'The Iron Islands', color: '#888', lord: 'House Greyjoy', seat: 'Pyke', desc: 'A harsh archipelago off the western coast. The Ironborn are seafaring raiders who follow the Old Way, paying the iron price. They do not sow, they reap through strength and raiding.' },
    { name: 'The Crownlands', color: '#f88', lord: 'The Iron Throne', seat: 'King\'s Landing', desc: 'The lands surrounding King\'s Landing, directly ruled by the Iron Throne. The city is the largest in Westeros, home to the Red Keep, the Great Sept of Baelor, and the Dragonpit ruins.' },
    { name: 'Beyond the Wall', color: '#eef', lord: 'Free Folk', seat: 'None', desc: 'The frozen lands north of the Wall, home to the Free Folk (wildlings), giants, and threats from the Long Night. The lands are vast, cold, and dangerous. White Walkers are said to lurk in the Lands of Always Winter.' }
  ]

  return (
    <div>
      <H2>Regions of Westeros</H2>
      <P>The Seven Kingdoms of Westeros are divided into distinct regions, each with their own culture, lords, and geography. Understanding the regions is key to roleplaying your character's background and allegiances.</P>

      {regions.map(r => (
        <div key={r.name} style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${r.color}`, paddingLeft: '1rem' }}>
          <H3>{r.name}</H3>
          <P><strong style={{ color: 'var(--text)' }}>Ruling House:</strong> {r.lord} | <strong style={{ color: 'var(--text)' }}>Seat:</strong> {r.seat}</P>
          <P>{r.desc}</P>
        </div>
      ))}
    </div>
  )
}

// =====================================================
function CombatGuide() {
  return (
    <div>
      <H2>Combat Guide</H2>
      <P>Combat in the ASOIAF HUD uses opposed dice rolls. It is consent-based — both players must agree to fight. The system is designed for fair, narrative combat rather than twitch-based gameplay.</P>

      <H3>The Basic Roll</H3>
      <P>Each combat round consists of two opposed rolls:</P>
      <UL>
        <LI><strong>Attack Roll:</strong> d20 + stat_bonus + skill_level + weapon_mod - wound_penalty</LI>
        <LI><strong>Defense Roll:</strong> d20 + stat_bonus + skill_level + armor_dr + shield_parry - wound_penalty</LI>
      </UL>
      <P>The <strong>net result</strong> (attack - defense) determines the outcome:</P>

      <table style={{ width: '100%', marginBottom: '1rem' }}>
        <thead><tr style={{ borderBottom: '2px solid var(--gold)' }}>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Net Result</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Tier</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Damage</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Wound</th>
        </tr></thead>
        <tbody>
          {[
            ['0 or less', 'Miss/Parry', '0', 'None'],
            ['1-3', 'Glancing', '2', 'Minor'],
            ['4-6', 'Solid', '5', 'Moderate'],
            ['7-9', 'Heavy', '10', 'Severe'],
            ['10+', 'Critical', '20', 'Critical'],
            ['Nat 20 + net 10+', 'Devastating', '30', 'Critical + location']
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '.5rem', fontWeight: 'bold' }}>{r[0]}</td>
              <td style={{ padding: '.5rem' }}>{r[1]}</td>
              <td style={{ padding: '.5rem', textAlign: 'right', color: 'var(--danger)' }}>{r[2]}</td>
              <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H3>Stat Bonuses</H3>
      <P>The stat used depends on the weapon: Might for melee, Agility for ranged. The bonus scale is:</P>
      <UL>
        <LI>Stat 1: -2 | Stat 2: -1 | Stat 3: +0 (default)</LI>
        <LI>Stat 4: +1 | Stat 5: +2 | Stat 6: +3 | Stat 7: +4</LI>
      </UL>

      <H3>HP Formula</H3>
      <P>HP = 10 + (Endurance x 3) + Might. A starting character (Endurance 3, Might 3) has 22 HP.</P>

      <H3>Wounds</H3>
      <P>Each wound applies a penalty to all rolls: minor (-1), moderate (-2), severe (-3), critical (-4). Wounds heal naturally over 3 days per severity level, or can be healed by a Maester or Red Priest.</P>

      <H3>Equipment Effects</H3>
      <UL>
        <LI><strong>Weapon Mod:</strong> Adds to attack roll (+1 to +3 typical)</LI>
        <LI><strong>Armor DR:</strong> Reduces incoming damage (subtracted after tier damage is determined, minimum 1 damage)</LI>
        <LI><strong>Shield Parry:</strong> Adds to defense roll (capped at +3 for balance)</LI>
      </UL>

      <Note>Natural 20 on the die roll (before modifiers) with a net result of 10+ triggers a Devastating hit for 30 damage. This is the most powerful combat outcome.</Note>

      <H3>Death and Resurrection</H3>
      <P>When HP reaches 0, a character must make a death save (Might/Endurance check, DC 15). Failure means permanent death. Resurrection is only possible through a R'hllor priest (level 6+) performing a ritual, and it must be done within a reasonable time frame.</P>
    </div>
  )
}

// =====================================================
function StatsGuide() {
  const stats = [
    { name: 'Might', desc: 'Physical strength and power. Used for melee weapon attacks, heavy lifting, and intimidation. Also contributes to HP.', weapon: 'Melee weapons (swords, axes, maces, hammers)' },
    { name: 'Agility', desc: 'Speed, reflexes, and coordination. Used for ranged weapon attacks, dodging, stealth, and acrobatic feats.', weapon: 'Ranged weapons (bows, crossbows, thrown weapons)' },
    { name: 'Endurance', desc: 'Stamina, toughness, and resilience. Determines HP (x3 multiplier) and resistance to disease, poison, and environmental hazards.', weapon: 'Endurance-based defense and survival checks' },
    { name: 'Wits', desc: 'Intelligence, quick thinking, and problem-solving. Used for crafting, initiative in combat, and knowledge checks.', weapon: 'Initiative, crafting skills, puzzle-solving' },
    { name: 'Will', desc: 'Mental fortitude and magical aptitude. Used for magic power pool, resisting mental attacks, and maintaining concentration.', weapon: 'Magic abilities, resisting fear and compulsion' },
    { name: 'Presence', desc: 'Social influence, charisma, and leadership. Used for persuasion, diplomacy, command, and social RP score.', weapon: 'Social interactions, leadership, intimidation' }
  ]

  return (
    <div>
      <H2>The SPECIAL System</H2>
      <P>Characters in ASOIAF are defined by six core attributes, collectively called SPECIAL. Each stat ranges from 1 to 7. All characters start at 3 in each stat and receive 12 points to distribute during character creation.</P>
      <P>No stat can be raised above 7 or lowered below 1 at creation. The maximum bonus at stat 7 is +4, while stat 1 imposes a -2 penalty.</P>

      {stats.map(s => (
        <div key={s.name} style={{ marginBottom: '1.5rem' }}>
          <H3>{s.name}</H3>
          <P>{s.desc}</P>
          <P><strong style={{ color: 'var(--text)' }}>Used with:</strong> {s.weapon}</P>
        </div>
      ))}

      <H3>HP Calculation</H3>
      <P>HP = 10 + (Endurance x 3) + Might</P>
      <UL>
        <LI>Starting character (all stats 3): 10 + 9 + 3 = 22 HP</LI>
        <LI>Might-focused (Might 7, End 3): 10 + 9 + 7 = 26 HP</LI>
        <LI>Tank (End 7, Might 5): 10 + 21 + 5 = 36 HP</LI>
      </UL>
    </div>
  )
}

// =====================================================
function MagicGuide() {
  const types = [
    { name: 'Warging', desc: 'The ability to enter the mind of animals. Wargs can sense, see through, control, and eventually bond permanently with creatures. Only those with the blood of the First Men are known to possess this gift.', power: 'Power pool: 20 max, 5/hr regen. Bonding costs 3 power per creature, max 3 bonds.', archetype: 'Warg archetype (level 3+ to bond)' },
    { name: "R'hllor", desc: 'Fire magic of the Red God. Practitioners can see visions in flames, resist fire, heal wounds, enchant weapons with flame, bind shadows into assassins, and even resurrect the dead. The most powerful battle magic in the setting.', power: 'Power pool: 20 max, 5/hr regen. Resurrection costs 15 power and requires level 6+.', archetype: 'Red Priest archetype' },
    { name: 'Greensight', desc: 'Prophetic vision through weirwood trees. Greenseers can see past events, glimpse possible futures, and deliver prophecies. The most powerful greenseers can access the entire weirwood network and walk through time.', power: 'Power pool: 20 max, 5/hr regen. Vision abilities cost 3-10 power.', archetype: 'Greenseer (admin-assigned, very rare)' },
    { name: 'Elemental', desc: 'Control over fire, water, earth, and wind. Battle mages who can hurl fireballs, call lightning, create earthquakes, and raise elemental shields. The most versatile combat magic.', power: 'Power pool: 20 max, 5/hr regen. Spells cost 2-10 power by tier.', archetype: 'Elementalist (admin-assigned)' }
  ]

  return (
    <div>
      <H2>Magic System</H2>
      <P>Magic is rare and powerful in the ASOIAF setting. It is not available to all characters — it requires a specific archetype or admin assignment. All magic uses a power pool that regenerates over time.</P>
      <Note>Magic is rare. Most characters have no magical abilities. Do not expect magic to be common — it is a special gift that shapes the character's entire story.</Note>

      {types.map(t => (
        <div key={t.name} style={{ marginBottom: '1.5rem', borderLeft: '4px solid #a4a', paddingLeft: '1rem' }}>
          <H3>{t.name}</H3>
          <P>{t.desc}</P>
          <P><strong style={{ color: 'var(--text)' }}>Requirements:</strong> {t.archetype}</P>
          <P><strong style={{ color: 'var(--text)' }}>Power:</strong> {t.power}</P>
        </div>
      ))}

      <H3>Power Pool</H3>
      <P>All magic users share the same power pool mechanics:</P>
      <UL>
        <LI>Maximum power: 20</LI>
        <LI>Regeneration: 5 per hour</LI>
        <LI>Abilities have cooldowns (varies per ability)</LI>
        <LI>Power is consumed on use; if insufficient, the ability fails</LI>
      </UL>
    </div>
  )
}

// =====================================================
function EconomyGuide() {
  return (
    <div>
      <H2>Economy Guide</H2>
      <P>The economy uses three tiers of currency, from the rare gold dragons to the common copper stars.</P>

      <H3>Currency</H3>
      <table style={{ width: '100%', marginBottom: '1rem' }}>
        <thead><tr style={{ borderBottom: '2px solid var(--gold)' }}>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Currency</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Equivalent</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Use</th>
        </tr></thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', color: 'var(--gold)' }}>Gold Dragons</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>1 = 210 stags = 11,760 stars</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Large transactions, founding houses</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem' }}>Silver Stags</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>1 = 56 stars</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Weapons, armor, services</td>
          </tr>
          <tr>
            <td style={{ padding: '.5rem' }}>Copper Stars</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>1 star</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>Food, drink, daily goods</td>
          </tr>
        </tbody>
      </table>

      <H3>Starting Currency</H3>
      <P>New characters start with 0 gold dragons, 50 silver stags, and 100 copper stars — enough for basic equipment and a few days of survival.</P>

      <H3>Earning Money</H3>
      <UL>
        <LI><strong>Quests:</strong> Complete quests for rewards (XP, gold, items)</LI>
        <LI><strong>Territory Income:</strong> House lords collect income from territories</LI>
        <LI><strong>Selling Items:</strong> Sell items at shops (50% of base value)</LI>
        <LI><strong>Crafting:</strong> Craft items and sell them for profit</LI>
        <LI><strong>Admin Grants:</strong> GMs can grant currency for events</LI>
      </UL>

      <H3>Shop Prices</H3>
      <P>Shops sell items at 5x their base value. You can sell items back at 1x base value, meaning a 90% loss at shop prices. This makes crafting the profitable path — materials cost less than the finished item's value.</P>

      <H3>Currency Conversion</H3>
      <P>You can convert between currencies at a 5% fee. Use the Tools page for the currency converter.</P>

      <Note>House founding costs 1,000 gold dragons and 50 RP score influence. This is a significant investment that requires either great wealth or the support of a great house.</Note>
    </div>
  )
}

// =====================================================
function SurvivalGuide() {
  return (
    <div>
      <H2>Survival Guide</H2>
      <P>The survival system tracks hunger and thirst, both ranging from 0 to 100. If neglected, they cause HP damage.</P>

      <H3>Hunger & Thirst</H3>
      <table style={{ width: '100%', marginBottom: '1rem' }}>
        <thead><tr style={{ borderBottom: '2px solid var(--gold)' }}>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Level</th>
          <th style={{ textAlign: 'right', padding: '.5rem' }}>Value</th>
          <th style={{ textAlign: 'left', padding: '.5rem' }}>Effect</th>
        </tr></thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', color: 'var(--green)' }}>Satiated</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>80-100</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>No penalty</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem' }}>Peckish</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>50-79</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>No penalty yet</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', color: 'var(--gold)' }}>Hungry</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>25-49</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>HP damage: 1/hr</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', color: 'var(--danger)' }}>Starving</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>10-24</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>HP damage: 2/hr</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '.5rem', color: 'var(--danger)' }}>Critical</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>1-9</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>HP damage: 3/hr</td>
          </tr>
          <tr>
            <td style={{ padding: '.5rem', color: 'var(--danger)' }}>Empty</td>
            <td style={{ padding: '.5rem', textAlign: 'right' }}>0</td>
            <td style={{ padding: '.5rem', color: 'var(--text-muted)' }}>HP damage: 3/hr</td>
          </tr>
        </tbody>
      </table>

      <H3>Decay Rate</H3>
      <P>Both hunger and thirst decay at 2 points per hour (base rate). Activity can increase this — combat and travel cause faster decay.</P>

      <H3>Environmental Hazards</H3>
      <P>Different regions have different environmental threats:</P>
      <UL>
        <LI><strong>Beyond the Wall:</strong> Extreme cold, HP drain without protection</LI>
        <LI><strong>Dorne:</strong> Heat and heatwave, increased water consumption</LI>
        <LI><strong>Stormlands:</strong> Severe storms, travel penalties</LI>
        <LI><strong>Iron Islands:</strong> Wind exposure, sailing hazards</LI>
        <LI><strong>Crownlands:</strong> Wildfire exposure risk</LI>
      </UL>
      <P>Use the <code>/hud</code> survival commands to eat, drink, and check your status. Protection from gear or shelter reduces environmental damage.</P>
    </div>
  )
}

// =====================================================
function ReligionGuide() {
  return (
    <div>
      <H2>Religion & Devotion</H2>
      <P>Seven major religions are practiced in Westeros and beyond. Characters can follow a religion and build devotion through prayer and sacrifice.</P>

      <H3>The Seven Religions</H3>
      <UL>
        <LI><strong>Faith of the Seven:</strong> The dominant religion of southern Westeros. Worships the Seven-Faced God (Father, Mother, Warrior, Smith, Maiden, Crone, Stranger).</LI>
        <LI><strong>Old Gods:</strong> The religion of the North and Beyond the Wall. Worship at heart trees (weirwoods). No priests or holy text — a personal, nature-based faith.</LI>
        <LI><strong>R'hllor (The Red God):</strong> The Lord of Light. Fire magic, resurrection, and shadow binding. Priests can perform miracles through fire visions.</LI>
        <LI><strong>The Drowned God:</strong> Worshiped by the Ironborn. "What is dead may never die, but rises again harder and stronger." Ritual drowning and resuscitation.</LI>
        <LI><strong>The Many-Faced God:</strong> The God of Death. Worshiped by the Faceless Men of Braavos. "All men must die, and all men must serve."</LI>
        <LI><strong>The Great Stallion:</strong> The horse god of the Dothraki. The stallion that mounts the world is their prophesied conqueror.</LI>
        <LI><strong>The Great Shepherd:</strong> The god of the Lhazareen, a peaceful people of the far east.</LI>
      </UL>

      <H3>Devotion System</H3>
      <P>Devotion ranges from 0 to 100. You gain devotion through:</P>
      <UL>
        <LI><strong>Prayer:</strong> Use <code>/hud pray</code> to pray (small devotion gain, cooldown)</LI>
        <LI><strong>Sacrifice:</strong> Offer items or animals to your god (larger devotion gain)</LI>
        <LI><strong>RP Actions:</strong> Roleplay that aligns with your religion's values</LI>
      </UL>

      <H3>Devotion Rewards</H3>
      <P>At 100 devotion, you unlock a special ability unique to your religion. Visit the Compendium to see the devotion ability for each faith.</P>
      <Note>Religion choice is primarily a roleplaying element. The mechanical benefits are intentionally limited to keep religion focused on narrative rather than optimization.</Note>
    </div>
  )
}

// =====================================================
function CraftingGuide() {
  return (
    <div>
      <H2>Crafting Guide</H2>
      <P>Crafting allows you to create weapons, armor, and consumables from raw materials. It is the most profitable way to acquire equipment — crafted items cost less than shop prices.</P>

      <H3>How Crafting Works</H3>
      <UL>
        <LI><strong>1. Learn a Recipe:</strong> Recipes are available based on your crafting skill and archetype</LI>
        <LI><strong>2. Gather Materials:</strong> Purchase from shops or acquire through quests/admin</LI>
        <LI><strong>3. Find a Station:</strong> Each recipe requires a specific station type</LI>
        <LI><strong>4. Start Crafting:</strong> Use the HUD menu to begin. Crafting takes time (minutes)</LI>
        <LI><strong>5. Collect Result:</strong> The item is added to your inventory on completion</LI>
      </UL>

      <H3>Success Chance</H3>
      <P>The crafting success roll is: <strong>d100 {'<='} (90 + skill_level x 3 - difficulty x 5)</strong></P>
      <UL>
        <LI><strong>Crit Success (roll 1-5):</strong> 2x XP reward</LI>
        <LI><strong>Normal Success:</strong> Item created, normal XP</LI>
        <LI><strong>Normal Failure:</strong> No item, but materials are returned</LI>
        <LI><strong>Crit Failure (roll 96-100):</strong> Lose 50% of materials</LI>
      </UL>

      <H3>Crafting Skills</H3>
      <UL>
        <LI><strong>Blacksmithing:</strong> Weapons, metal goods (forge, anvil)</LI>
        <LI><strong>Armorsmithing:</strong> Metal armor (anvil)</LI>
        <LI><strong>Leatherworking:</strong> Leather armor, boiled leather (tannery)</LI>
        <LI><strong>Fletching:</strong> Bows, arrows (fletching bench)</LI>
        <LI><strong>Healing:</strong> Poultices, herbs, medicines (lab)</LI>
        <LI><strong>Weaponsmithing:</strong> Fine weapons (forge)</LI>
      </UL>

      <H3>Stations</H3>
      <P>Each crafting station type is found in specific locations. Visit the Compendium to find station locations. You must be near the correct station type to craft a recipe.</P>

      <Note>Crafting is the most economical path to equipment. A Blacksmith with skill level 3 can reliably craft weapons that would cost 5x more at a shop.</Note>
    </div>
  )
}
