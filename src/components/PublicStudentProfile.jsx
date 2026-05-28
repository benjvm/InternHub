import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/publicStudentProfile.css'
import { fetchUserProfile, useUser } from '../services/userService'
import { getCvDocumentUrl, getProfileImageUrl } from '../services/cloudinaryService'
import { ROUTES } from '../routes/paths'
import { useRouteParams, useRouter } from '../routes/router'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function toText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function toList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function getFullName(profile = {}) {
  const fullName = toText(profile?.cvData?.parsedProfile?.fullName)

  if (fullName) {
    return fullName
  }

  return [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim() || 'Estudiante'
}

function getHeadline(profile = {}, parsedProfile = {}) {
  return (
    toText(parsedProfile.headline) ||
    toText(profile.carrera) ||
    toText(profile.degree) ||
    'Perfil de estudiante'
  )
}

function getLocation(profile = {}, parsedProfile = {}) {
  return toText(parsedProfile.location) || toText(profile.ubicacion) || toText(profile.location)
}

function getSemester(profile = {}, parsedProfile = {}) {
  return toText(parsedProfile.semester) || toText(profile.semester) || toText(profile.semestre)
}

function getBio(profile = {}, parsedProfile = {}) {
  return (
    toText(parsedProfile.bio) ||
    toText(profile.bio) ||
    'Este estudiante todavia no ha compartido una biografia profesional.'
  )
}

function buildProfileData(profile = {}) {
  const parsedProfile = profile?.cvData?.parsedProfile || {}
  const socialLinks = parsedProfile.socialLinks || {}

  return {
    fullName: getFullName(profile),
    headline: getHeadline(profile, parsedProfile),
    location: getLocation(profile, parsedProfile),
    semester: getSemester(profile, parsedProfile),
    bio: getBio(profile, parsedProfile),
    university:
      toText(parsedProfile.university) ||
      toText(profile.universidad) ||
      toText(profile.university) ||
      'Universidad no indicada',
    degree:
      toText(parsedProfile.degree) ||
      toText(profile.carrera) ||
      toText(profile.degree) ||
      'Carrera no indicada',
    technicalSkills: toList(parsedProfile.skills?.technical),
    designSkills: toList(parsedProfile.skills?.design),
    softSkills: toList(parsedProfile.skills?.soft),
    experience: toList(parsedProfile.experience),
    education: toList(parsedProfile.education),
    languages: toList(parsedProfile.languages),
    projects: toList(parsedProfile.projects),
    linkedin: toText(socialLinks.linkedin) || toText(profile.linkedin),
    github: toText(socialLinks.github) || toText(profile.github),
    portfolio: toText(socialLinks.portfolio) || toText(profile.portfolio),
    cvUrl: getCvDocumentUrl(profile),
  }
}

function SectionCard({ title, icon, children, className = '' }) {
  return (
    <section className={`public-student-profile-card ${className}`.trim()}>
      <div className="public-student-profile-section-title">
        <Icon name={icon} />
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SkillGroup({ title, items }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="public-student-profile-skill-group">
      <p>{title}</p>
      <div className="public-student-profile-tags">
        {items.map((item) => (
          <span key={`${title}-${item}`} className="public-student-profile-tag">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function LinkItem({ href, label, icon }) {
  if (!href) {
    return null
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="public-student-profile-link-item">
      <Icon name={icon} />
      <span>{label}</span>
    </a>
  )
}

export default function PublicStudentProfile() {
  const { studentId } = useRouteParams()
  const { navigate } = useRouter()
  const { currentUser } = useUser()
  const [studentProfile, setStudentProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!studentId) {
        setErrorMessage('No se encontro el estudiante solicitado.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')
        const profile = await fetchUserProfile(studentId)

        if (!isMounted) {
          return
        }

        if (!profile) {
          setStudentProfile(null)
          setErrorMessage('El perfil publico de este estudiante no esta disponible.')
          return
        }

        setStudentProfile(profile)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'No se pudo cargar el perfil del estudiante.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [studentId])

  const profileData = useMemo(() => buildProfileData(studentProfile || {}), [studentProfile])
  const profileImageUrl = getProfileImageUrl(studentProfile)
  const studentEmail = toText(studentProfile?.correo) || toText(studentProfile?.email)

  function handleGoBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    navigate(Number(currentUser?.rol) === 3 ? ROUTES.teacherTracking : ROUTES.companyCandidates, {
      replace: true,
    })
  }

  if (isLoading) {
    return (
      <main className="public-student-profile-page">
        <div className="container public-student-profile-shell">
          <p className="public-student-profile-feedback">Cargando perfil del estudiante...</p>
        </div>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="public-student-profile-page">
        <div className="container public-student-profile-shell">
          <button
            type="button"
            className="public-student-profile-back-button"
            onClick={handleGoBack}
          >
            <Icon name="arrow_back" />
            Volver
          </button>
          <div className="public-student-profile-empty">
            <h1>Perfil no disponible</h1>
            <p>{errorMessage}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="public-student-profile-page">
      <div className="container public-student-profile-shell">
        <button
          type="button"
          className="public-student-profile-back-button"
          onClick={handleGoBack}
        >
          <Icon name="arrow_back" />
          Volver
        </button>

        <section className="public-student-profile-hero">
          <div className="public-student-profile-hero-card">
            <div className="public-student-profile-hero-media">
              <img src={profileImageUrl} alt={profileData.fullName} />
            </div>

            <div className="public-student-profile-hero-copy">
              <div className="public-student-profile-hero-top">
                <div>
                  <h1>{profileData.fullName}</h1>
                  <p>{profileData.headline}</p>
                </div>
              </div>

              <div className="public-student-profile-hero-meta">
                {profileData.semester ? (
                  <span>
                    <Icon name="school" />
                    {profileData.semester}
                  </span>
                ) : null}
                <span>
                  <Icon name="account_balance" />
                  {profileData.university}
                </span>
                {profileData.location ? (
                  <span>
                    <Icon name="location_on" />
                    {profileData.location}
                  </span>
                ) : null}
              </div>

              <div className="public-student-profile-hero-actions">
                {studentEmail ? (
                  <a
                    href={`mailto:${studentEmail}`}
                    className="public-student-profile-primary-action"
                  >
                    <Icon name="mail" />
                    Contactar
                  </a>
                ) : null}
                {profileData.cvUrl ? (
                  <a
                    href={profileData.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="public-student-profile-secondary-action"
                    aria-label="Descargar curriculo"
                  >
                    <Icon name="download" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="public-student-profile-grid">
          <div className="public-student-profile-main-column">
            <SectionCard title="Biografia profesional" icon="person">
              <p className="public-student-profile-bio">{profileData.bio}</p>
            </SectionCard>

            <SectionCard title="Experiencia previa" icon="work_history">
              {profileData.experience.length ? (
                <div className="public-student-profile-timeline">
                  {profileData.experience.map((item, index) => (
                    <article
                      key={`${item.title}-${item.company}-${index}`}
                      className="public-student-profile-timeline-item"
                    >
                      <div className="public-student-profile-timeline-dot" />
                      <div className="public-student-profile-timeline-content">
                        <div className="public-student-profile-timeline-header">
                          <div>
                            <h3>{item.title || 'Experiencia profesional'}</h3>
                            <p>{item.company || item.location || 'Organizacion no indicada'}</p>
                          </div>
                          {(item.startDate || item.endDate) ? (
                            <span className="public-student-profile-date-pill">
                              {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                            </span>
                          ) : null}
                        </div>
                        <p>{item.summary || 'Sin descripcion adicional.'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="public-student-profile-empty-copy">
                  Este estudiante aun no ha compartido experiencia previa en su CV.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Proyectos destacados" icon="star">
              {profileData.projects.length ? (
                <div className="public-student-profile-projects">
                  {profileData.projects.map((project, index) => (
                    <article
                      key={`${project.name}-${index}`}
                      className="public-student-profile-project-card"
                    >
                      <h3>{project.name || 'Proyecto destacado'}</h3>
                      <p>{project.description || 'Sin descripcion adicional.'}</p>
                      {project.technologies?.length ? (
                        <div className="public-student-profile-tags">
                          {project.technologies.map((technology) => (
                            <span
                              key={`${project.name}-${technology}`}
                              className="public-student-profile-tag"
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noreferrer">
                          Ver proyecto
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="public-student-profile-empty-copy">
                  No hay proyectos destacados disponibles todavia.
                </p>
              )}
            </SectionCard>
          </div>

          <aside className="public-student-profile-side-column">
            <SectionCard title="Habilidades" icon="workspace_premium">
              <SkillGroup title="Tecnicas" items={profileData.technicalSkills} />
              <SkillGroup title="Diseno y producto" items={profileData.designSkills} />
              <SkillGroup title="Soft skills" items={profileData.softSkills} />
              {!profileData.technicalSkills.length &&
              !profileData.designSkills.length &&
              !profileData.softSkills.length ? (
                <p className="public-student-profile-empty-copy">
                  Todavia no hay habilidades extraidas del CV.
                </p>
              ) : null}
            </SectionCard>

            <SectionCard title="Formacion" icon="school">
              <div className="public-student-profile-education-summary">
                <p className="public-student-profile-highlight-label">Grado universitario</p>
                <h3>{profileData.degree}</h3>
                <p>{profileData.university}</p>
              </div>

              {profileData.education.length ? (
                <div className="public-student-profile-education-list">
                  {profileData.education.map((item, index) => (
                    <article key={`${item.institution}-${index}`}>
                      <strong>{item.degree || 'Formacion academica'}</strong>
                      <p>{item.institution || 'Institucion no indicada'}</p>
                      {(item.startDate || item.endDate) ? (
                        <span>{[item.startDate, item.endDate].filter(Boolean).join(' - ')}</span>
                      ) : null}
                      {item.details ? <small>{item.details}</small> : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {profileData.languages.length ? (
                <div className="public-student-profile-language-list">
                  <p className="public-student-profile-highlight-label">Idiomas</p>
                  {profileData.languages.map((language, index) => (
                    <div
                      key={`${language.name}-${index}`}
                      className="public-student-profile-language-row"
                    >
                      <span>{language.name}</span>
                      <strong>{language.level || 'Nivel no indicado'}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Enlaces" icon="link">
              <LinkItem href={profileData.linkedin} label="LinkedIn" icon="public" />
              <LinkItem href={profileData.github} label="GitHub" icon="code" />
              <LinkItem href={profileData.portfolio} label="Portfolio" icon="globe" />
              {!profileData.linkedin && !profileData.github && !profileData.portfolio ? (
                <p className="public-student-profile-empty-copy">
                  Este estudiante no ha compartido enlaces externos.
                </p>
              ) : null}
            </SectionCard>
          </aside>
        </section>
      </div>
    </main>
  )
}
