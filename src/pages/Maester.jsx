import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from '../components/Loading.jsx'

const DIFFICULTY_LABELS = { novice: 'Novice', apprentice: 'Apprentice', journeyman: 'Journeyman', master: 'Master' }
const DIFFICULTY_COLORS = { novice: '#6b8f3e', apprentice: '#b08d57', journeyman: '#8c6420', master: '#702618' }
const GRADE_COLORS = { A: '#2A3D1F', B: '#6b8f3e', C: '#b08d57', D: '#8c6420', F: '#702618' }
const SEMESTERS = ['spring', 'summer', 'fall', 'winter']
const CERT_ICONS = { healing: '\u2695', craft: '\u2691', academic: '\u269A' }

export default function Maester() {
  const { adminLevel } = useAuth()
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState(null)
  const [enrollments, setEnrollments] = useState(null)
  const [gpa, setGpa] = useState(0)
  const [certs, setCerts] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterSemester, setFilterSemester] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [gradingEnrollment, setGradingEnrollment] = useState(null)
  const [allEnrollments, setAllEnrollments] = useState(null)

  const loadCourses = useCallback(async () => {
    try {
      const res = await api.maesterCourses(filterSemester || null, filterSkill || null)
      if (res.status === 'ok') setCourses(res.courses)
    } catch (e) { setError(e.message) }
  }, [filterSemester, filterSkill])

  const loadEnrollments = useCallback(async () => {
    try {
      const res = await api.maesterMyEnrollments()
      if (res.status === 'ok') {
        setEnrollments(res.enrollments)
        setGpa(res.gpa)
      }
    } catch (e) { setError(e.message) }
  }, [])

  const loadCerts = useCallback(async () => {
    try {
      const res = await api.maesterCertifications()
      if (res.status === 'ok') setCerts(res.certifications)
    } catch (e) { setError(e.message) }
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([loadCourses(), loadEnrollments(), loadCerts()])
    setLoading(false)
  }, [loadCourses, loadEnrollments, loadCerts])

  useEffect(() => { loadAll() }, [loadAll])

  const handleEnroll = async (courseId) => {
    setError(null)
    try {
      const res = await api.maesterEnroll(courseId)
      if (res.status === 'ok') {
        loadCourses()
        loadEnrollments()
      }
    } catch (e) { setError(e.message) }
  }

  const handleDrop = async (enrollmentId) => {
    if (!confirm('Withdraw from this course?')) return
    setError(null)
    try {
      const res = await api.maesterDrop(enrollmentId)
      if (res.status === 'ok') {
        loadCourses()
        loadEnrollments()
      }
    } catch (e) { setError(e.message) }
  }

  const handleGrade = async (enrollmentId, grade, notes) => {
    setError(null)
    try {
      const res = await api.maesterGrade(enrollmentId, grade, notes)
      if (res.status === 'ok') {
        setGradingEnrollment(null)
        loadEnrollments()
        loadCerts()
        if (allEnrollments) loadAllEnrollments()
      }
    } catch (e) { setError(e.message) }
  }

  const handleClaimCert = async (certId) => {
    setError(null)
    try {
      const res = await api.maesterAwardCert(certId)
      if (res.status === 'ok') loadCerts()
    } catch (e) { setError(e.message) }
  }

  const loadAllEnrollments = async () => {
    try {
      const res = await api.maesterAllEnrollments()
      if (res.status === 'ok') setAllEnrollments(res.enrollments)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    if (tab === 'admin' && adminLevel >= 2 && !allEnrollments) {
      loadAllEnrollments()
    }
  }, [tab, adminLevel])

  if (loading) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '16px' }}>The Citadel</h1>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'courses', label: 'Courses' },
          { key: 'transcript', label: 'My Transcript' },
          { key: 'certs', label: 'Certifications' },
          ...(adminLevel >= 2 ? [{ key: 'admin', label: 'Administration' }] : []),
        ].map(t => (
          <button
            key={t.key}
            className="btn btn-sm"
            style={{
              background: tab === t.key ? 'var(--gold)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              borderBottom: tab === t.key ? '1px solid var(--gold)' : '1px solid var(--border)',
              borderRadius: '4px 4px 0 0',
              padding: '8px 16px',
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'courses' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}>
              <option value="">All Skills</option>
              <option value="healing">Healing</option>
              <option value="herbalism">Herbalism</option>
              <option value="history">History</option>
              <option value="reading">Reading</option>
            </select>
            {adminLevel >= 2 && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(true)}>+ New Course</button>
            )}
          </div>

          <div className="grid grid-2">
            {courses?.map(c => (
              <div key={c.id} style={{
                border: '1px solid var(--border)', borderRadius: '4px', padding: '16px',
                background: 'var(--bg-card)', marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>{c.name}</h3>
                  <span style={{
                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                    background: DIFFICULTY_COLORS[c.difficulty], color: '#fff',
                  }}>
                    {DIFFICULTY_LABELS[c.difficulty]}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '8px' }}>{c.description}</p>
                <div style={{ fontSize: '0.75rem', opacity: '0.6', marginBottom: '8px' }}>
                  <span>Skill: <strong>{c.skill_name}</strong></span>
                  {' | '}
                  <span>Semester: <strong>{c.semester}</strong></span>
                  {' | '}
                  <span>{c.enrolled_count}/{c.max_students} enrolled</span>
                  {c.instructor_name && <> {' | '} <span>Instructor: {c.instructor_name}</span></>}
                </div>
                {c.prerequisite_name && (
                  <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                    Prerequisite: <span style={{ color: c.prerequisite_met ? 'var(--gold)' : '#702618' }}>
                      {c.prerequisite_name} {c.prerequisite_met ? '\u2713' : '\u2717'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {c.my_status === 'enrolled' ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 'bold' }}>Enrolled</span>
                  ) : c.my_status === 'completed' ? (
                    <span style={{ fontSize: '0.8rem', color: GRADE_COLORS[c.my_grade] || '#888', fontWeight: 'bold' }}>
                      Completed: {c.my_grade}
                    </span>
                  ) : c.prerequisite_met && c.enrolled_count < c.max_students ? (
                    <button className="btn btn-primary btn-sm" onClick={() => handleEnroll(c.id)}>Enroll</button>
                  ) : !c.prerequisite_met ? (
                    <span style={{ fontSize: '0.8rem', opacity: '0.5' }}>Prerequisite required</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', opacity: '0.5' }}>Course full</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'transcript' && (
        <div>
          <div style={{
            border: '1px solid var(--gold)', borderRadius: '4px', padding: '16px',
            background: 'var(--bg-card)', marginBottom: '16px', textAlign: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>GPA: </span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 'bold' }}>
              {gpa.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.8rem', opacity: '0.5', marginLeft: '8px' }}>
              ({enrollments?.filter(e => e.status === 'completed').length || 0} courses completed)
            </span>
          </div>

          {enrollments?.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: '0.5', fontFamily: 'var(--font-serif)', marginTop: '40px' }}>
              No enrollments yet. Visit the Courses tab to begin your studies.
            </div>
          ) : (
            <div>
              {enrollments?.map(e => (
                <div key={e.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '4px',
                  background: 'var(--bg-card)', marginBottom: '8px',
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{e.course_name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: '0.6' }}>
                      {e.skill_name} | {DIFFICULTY_LABELS[e.difficulty]} | {e.semester}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '0.8rem', padding: '2px 10px', borderRadius: '10px',
                      background: e.status === 'completed' ? (GRADE_COLORS[e.grade] || '#555') : 'transparent',
                      color: e.status === 'completed' ? '#fff' : 'var(--text)',
                      border: e.status !== 'completed' ? '1px solid var(--border)' : 'none',
                    }}>
                      {e.status === 'enrolled' ? 'Enrolled' :
                       e.status === 'completed' ? `Grade: ${e.grade}` :
                       e.status === 'dropped' ? 'Withdrawn' :
                       e.status === 'failed' ? 'Failed' : e.status}
                    </span>
                    {e.status === 'enrolled' && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleDrop(e.id)}>Withdraw</button>
                    )}
                    {e.grade_notes && (
                      <span style={{ fontSize: '0.7rem', opacity: '0.5' }} title={e.grade_notes}>Notes</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'certs' && (
        <div className="grid grid-2">
          {certs?.map(c => (
            <div key={c.id} style={{
              border: c.earned ? '2px solid var(--gold)' : '1px solid var(--border)',
              borderRadius: '4px', padding: '16px', background: 'var(--bg-card)', marginBottom: '12px',
              opacity: c.earned ? 1 : 0.8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: 0 }}>
                  {CERT_ICONS[c.cert_type] || '\u269A'} {c.name}
                </h3>
                {c.earned && <span style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>\u2713</span>}
              </div>
              <p style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '8px' }}>{c.description}</p>
              <div style={{ fontSize: '0.75rem', opacity: '0.6', marginBottom: '8px' }}>
                Requires: <strong>{c.required_skill_name}</strong> level {c.required_skill_level}
                {c.required_course_ids && <> | Courses: {c.required_course_ids}</>}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                Skill: {c.skill_level}/{c.required_skill_level} {c.skill_met ? '\u2713' : '\u2717'}
                {' | '}
                Courses: {c.courses_met ? '\u2713' : `\u2717 (${c.courses_missing.length} missing)`}
              </div>
              {c.earned ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 'bold' }}>Certified</span>
              ) : c.can_earn ? (
                <button className="btn btn-primary btn-sm" onClick={() => handleClaimCert(c.id)}>Claim Certification</button>
              ) : (
                <span style={{ fontSize: '0.8rem', opacity: '0.5' }}>Requirements not yet met</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'admin' && adminLevel >= 2 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '12px' }}>All Enrollments</h3>
          {allEnrollments?.length === 0 ? (
            <div style={{ opacity: '0.5' }}>No enrollments.</div>
          ) : (
            <div>
              {allEnrollments?.map(e => (
                <div key={e.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '4px',
                  background: 'var(--bg-card)', marginBottom: '6px',
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{e.student_name || 'Unknown'}</span>
                    {' — '}
                    <span style={{ fontSize: '0.85rem' }}>{e.course_name}</span>
                    <div style={{ fontSize: '0.7rem', opacity: '0.5' }}>
                      {e.skill_name} | Enrolled: {e.enrolled_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
                      background: e.status === 'completed' ? (GRADE_COLORS[e.grade] || '#555') : 'transparent',
                      color: e.status === 'completed' ? '#fff' : 'var(--text)',
                      border: e.status !== 'completed' ? '1px solid var(--border)' : 'none',
                    }}>
                      {e.status === 'enrolled' ? 'Active' : e.status === 'completed' ? e.grade : e.status}
                    </span>
                    {e.status === 'enrolled' && (
                      <button className="btn btn-outline btn-sm" onClick={() => setGradingEnrollment(e)}>
                        Grade
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {gradingEnrollment && (
        <GradeModal
          enrollment={gradingEnrollment}
          onGrade={handleGrade}
          onCancel={() => setGradingEnrollment(null)}
        />
      )}

      {showCreate && (
        <CreateCourseModal onCreate={async (data) => {
          try {
            const res = await api.maesterCreateCourse(data)
            if (res.status === 'ok') { setShowCreate(false); loadCourses() }
          } catch (e) { setError(e.message) }
        }} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  )
}

function GradeModal({ enrollment, onGrade, onCancel }) {
  const [grade, setGrade] = useState('A')
  const [notes, setNotes] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '12px' }}>Assign Grade</h3>
        <p style={{ fontSize: '0.85rem', opacity: '0.7', marginBottom: '12px' }}>
          {enrollment.student_name} — {enrollment.course_name}
        </p>
        <div className="form-group">
          <label className="form-label">Grade</label>
          <select className="form-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="A">A (90+)</option>
            <option value="B">B (80+)</option>
            <option value="C">C (70+)</option>
            <option value="D">D (60+)</option>
            <option value="F">F (Below 60)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={256} />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onGrade(enrollment.id, grade, notes)}>Submit Grade</button>
        </div>
      </div>
    </div>
  )
}

function CreateCourseModal({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [skillName, setSkillName] = useState('healing')
  const [difficulty, setDifficulty] = useState('novice')
  const [semester, setSemester] = useState('spring')
  const [maxStudents, setMaxStudents] = useState(20)

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      description: description.trim(),
      skill_name: skillName,
      difficulty,
      semester,
      max_students: maxStudents,
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,18,12,0.45)', zIndex: 1400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '24px', maxWidth: '460px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Create New Course</h3>
        <div className="form-group">
          <label className="form-label">Course Name</label>
          <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={128} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Skill</label>
            <select className="form-input" value={skillName} onChange={(e) => setSkillName(e.target.value)}>
              <option value="healing">Healing</option>
              <option value="herbalism">Herbalism</option>
              <option value="history">History</option>
              <option value="reading">Reading</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="novice">Novice</option>
              <option value="apprentice">Apprentice</option>
              <option value="journeyman">Journeyman</option>
              <option value="master">Master</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Semester</label>
            <select className="form-input" value={semester} onChange={(e) => setSemester(e.target.value)}>
              {SEMESTERS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Max Students</label>
            <input type="number" className="form-input" value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 20)} min={1} max={100} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!name.trim()}>Create Course</button>
        </div>
      </div>
    </div>
  )
}
