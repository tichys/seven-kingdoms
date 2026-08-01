import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

export default function CitizenDirectory() {
  const { user } = useAuth()
  const [citizens, setCitizens] = useState(null)
  const [featured, setFeatured] = useState(null)
  const [houses, setHouses] = useState([])
  const [archetypes, setArchetypes] = useState([])
  const [search, setSearch] = useState('')
  const [houseFilter, setHouseFilter] = useState(0)
  const [archetypeFilter, setArchetypeFilter] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [myProfile, setMyProfile] = useState(null)

  const loadDirectory = useCallback(async () => {
    try {
      const res = await api.directorySearch(search, houseFilter, archetypeFilter, page)
      if (res.status === 'ok') {
        setCitizens(res.citizens)
        setTotalPages(res.total_pages)
        setTotal(res.total)
      }
    } catch (e) { setError(e.message) }
  }, [search, houseFilter, archetypeFilter, page])

  const loadFilters = useCallback(async () => {
    try {
      const [h, a, f] = await Promise.all([
        api.directoryHouses(),
        api.directoryArchetypes(),
        api.directoryFeatured(),
      ])
      if (h.status === 'ok') setHouses(h.houses)
      if (a.status === 'ok') setArchetypes(a.archetypes)
      if (f.status === 'ok') setFeatured(f.featured)
    } catch (e) { setError(e.message) }
  }, [])

  useEffect(() => {
    Promise.all([loadDirectory(), loadFilters()]).then(() => setLoading(false))
  }, [loadDirectory, loadFilters])

  useEffect(() => { setPage(1) }, [search, houseFilter, archetypeFilter])

  const handleOpenDossier = async (avatarKey) => {
    setError(null)
    try {
      const res = await api.directoryDossier(avatarKey)
      if (res.status === 'ok') setDossier(res.citizen)
    } catch (e) { setError(e.message) }
  }

  const loadMyProfile = async () => {
    try {
      const res = await api.directoryMyProfile()
      if (res.status === 'ok') setMyProfile(res.profile)
    } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>Citizen Directory</h1>
        <button className="btn btn-outline btn-sm" onClick={() => { setShowProfileEditor(true); loadMyProfile() }}>
          My Directory Card
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      {featured && featured.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '8px' }}>Notable Citizens</h2>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {featured.map(f => (
              <div
                key={f.avatar_key}
                onClick={() => handleOpenDossier(f.avatar_key)}
                style={{
                  minWidth: '160px', cursor: 'pointer',
                  border: '1px solid var(--gold)', borderRadius: '4px', padding: '12px',
                  background: 'var(--bg-card)', textAlign: 'center',
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 8px',
                  background: 'var(--bg-faint)', overflow: 'hidden',
                  border: '2px solid var(--gold)',
                }}>
                  {f.portrait_url ? (
                    <img src={f.portrait_url} alt={f.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem', opacity: '0.5' }}>
                      {f.house_sigil || '\u2691'}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{f.character_name || f.avatar_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>{f.house_name}</div>
                <div style={{ fontSize: '0.65rem', opacity: '0.6', textTransform: 'capitalize' }}>{f.house_rank}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search citizens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={64}
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select className="form-input" style={{ width: 'auto' }} value={houseFilter} onChange={(e) => setHouseFilter(parseInt(e.target.value))}>
          <option value={0}>All Houses</option>
          {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={archetypeFilter} onChange={(e) => setArchetypeFilter(parseInt(e.target.value))}>
          <option value={0}>All Archetypes</option>
          {archetypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div style={{ fontSize: '0.8rem', opacity: '0.5', marginBottom: '12px' }}>
        {total} citizen{total !== 1 ? 's' : ''} found {totalPages > 1 && `\u2014 Page ${page} of ${totalPages}`}
      </div>

      {citizens && citizens.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)', marginTop: '40px' }}>
          No citizens matching your search.
        </div>
      ) : (
        <div className="grid grid-3">
          {citizens?.map(c => (
            <div
              key={c.avatar_key}
              onClick={() => handleOpenDossier(c.avatar_key)}
              style={{
                border: '1px solid var(--border)', borderRadius: '4px', padding: '16px',
                background: 'var(--bg-card)', cursor: 'pointer', marginBottom: '12px',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '4px', flexShrink: 0,
                  background: 'var(--bg-faint)', overflow: 'hidden',
                }}>
                  {c.portrait_url ? (
                    <img src={c.portrait_url} alt={c.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.3rem', opacity: '0.4' }}>
                      {c.house_sigil || '\u2691'}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.character_name || c.avatar_name}
                  </div>
                  {c.house_name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{c.house_name}</div>
                  )}
                  {c.archetype_name && (
                    <div style={{ fontSize: '0.7rem', opacity: '0.6' }}>{c.archetype_name}</div>
                  )}
                  {c.status === 'online' && (
                    <span style={{ fontSize: '0.65rem', color: '#6b8f3e' }}>\u25CF Online</span>
                  )}
                </div>
              </div>
              {c.blurb && (
                <p style={{ fontSize: '0.75rem', opacity: '0.6', marginTop: '8px', margin: '8px 0 0 0' }}>
                  {c.blurb}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {dossier && (
        <DossierModal citizen={dossier} onClose={() => setDossier(null)} />
      )}

      {showProfileEditor && myProfile && (
        <ProfileEditorModal
          profile={myProfile}
          onSave={async (data) => {
            try {
              const res = await api.directoryUpdateProfile(data)
              if (res.status === 'ok') { setShowProfileEditor(false); loadDirectory() }
            } catch (e) { setError(e.message) }
          }}
          onClose={() => setShowProfileEditor(false)}
        />
      )}
    </div>
  )
}

function DossierModal({ citizen, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '4px', flexShrink: 0,
            background: 'var(--bg-faint)', overflow: 'hidden', border: '2px solid var(--gold)',
          }}>
            {citizen.portrait_url ? (
              <img src={citizen.portrait_url} alt={citizen.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', opacity: '0.4' }}>
                {citizen.house_sigil || '\u2691'}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: '0 0 4px 0' }}>
              {citizen.character_name || citizen.avatar_name}
            </h2>
            {citizen.house_name && (
              <div style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '4px' }}>
                House {citizen.house_name}
                {citizen.house_words && <span style={{ opacity: '0.6', marginLeft: '6px', fontStyle: 'italic' }}>{citizen.house_words}</span>}
              </div>
            )}
            {citizen.archetype_name && (
              <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>{citizen.archetype_name}</div>
            )}
            {citizen.gender && <div style={{ fontSize: '0.75rem', opacity: '0.5' }}>{citizen.gender}{citizen.age ? ', Age ' + citizen.age : ''}</div>}
          </div>
        </div>

        {citizen.blurb && (
          <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', opacity: '0.8', margin: 0 }}>{citizen.blurb}</p>
          </div>
        )}

        {citizen.bio && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '6px' }}>Biography</h3>
            <p style={{ fontSize: '0.85rem', opacity: '0.7', whiteSpace: 'pre-wrap' }}>{citizen.bio}</p>
          </div>
        )}

        {citizen.titles && citizen.titles.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '6px' }}>Titles</h3>
            {citizen.titles.map((t, i) => (
              <span key={i} style={{
                display: 'inline-block', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '10px',
                border: '1px solid var(--gold)', margin: '2px 4px 2px 0',
              }}>{t.name}</span>
            ))}
          </div>
        )}

        {citizen.skills && citizen.skills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '6px' }}>Known Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {citizen.skills.map((s, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px',
                  background: 'var(--bg-faint)',
                }}>
                  {s.skill_name} <strong style={{ color: 'var(--gold)' }}>{s.level}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {citizen.certifications && citizen.certifications.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '6px' }}>Certifications</h3>
            {citizen.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--gold)' }}>{c.name}</strong>
                <span style={{ opacity: '0.5', marginLeft: '6px' }}>{c.awarded_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}

        {citizen.stats && citizen.stats.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '6px' }}>SPECIAL Stats</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {citizen.stats.map((s, i) => (
                <span key={i} style={{ fontSize: '0.75rem' }}>
                  <strong>{s.stat_name}</strong>: {s.modified_value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function ProfileEditorModal({ profile, onSave, onClose }) {
  const [portraitUrl, setPortraitUrl] = useState(profile.portrait_url || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [blurb, setBlurb] = useState(profile.blurb || '')
  const [directoryVisible, setDirectoryVisible] = useState(profile.directory_visible != 0)

  const handleSave = () => {
    onSave({
      portrait_url: portraitUrl.trim(),
      bio: bio.trim(),
      blurb: blurb.trim(),
      directory_visible: directoryVisible ? 1 : 0,
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.55)', zIndex: 1400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>My Directory Card</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '4px', flexShrink: 0,
            background: 'var(--bg-faint)', overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            {portraitUrl ? (
              <img src={portraitUrl} alt="Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: '0.3', fontSize: '1.5rem' }}>?</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{profile.character_name || profile.avatar_name}</div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Portrait URL (HTTPS only)</label>
          <input type="text" className="form-input" value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)} placeholder="https://..." maxLength={512} />
        </div>
        <div className="form-group">
          <label className="form-label">Short Blurb ({blurb.length}/200)</label>
          <input type="text" className="form-input" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={200} placeholder="A brief tagline for your character" />
        </div>
        <div className="form-group">
          <label className="form-label">Biography ({bio.length}/500)</label>
          <textarea className="form-input" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="A longer description of your character" />
        </div>
        <div className="form-group">
          <label className="form-label">
            <input type="checkbox" checked={directoryVisible} onChange={(e) => setDirectoryVisible(e.target.checked)} style={{ marginRight: '6px' }} />
            Visible in public directory
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
