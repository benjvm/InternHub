import { getProfileImageUrl } from '../services/cloudinaryService'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function getStudentDisplayName(user) {
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim()

  if (fullName) {
    return fullName
  }

  return user?.correo || user?.email || 'Estudiante'
}

export default function StudentPanelSidebar({ currentUser, activeSection = 'applications' }) {
  const studentName = getStudentDisplayName(currentUser)
  const profileImageUrl = getProfileImageUrl(currentUser)

  return (
    <aside className="student-applications-sidebar">
      <Link to={ROUTES.studentProfile} className="student-applications-profile-card">
        <div className="student-applications-profile-avatar">
          <img src={profileImageUrl} alt={studentName} />
        </div>
        <div>
          <h2>{studentName}</h2>
          <p>Estudiante</p>
        </div>
      </Link>

      <div className="student-applications-sidebar-menu">
        <Link
          to={ROUTES.studentApplications}
          className={`student-applications-sidebar-link ${
            activeSection === 'applications' ? 'active' : ''
          }`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            work
          </span>
          Mis candidaturas
        </Link>

        <Link
          to={ROUTES.studentInternships}
          className={`student-applications-sidebar-link ${
            activeSection === 'internships' ? 'active' : ''
          }`}
        >
          <Icon name="school" />
          Prácticas
        </Link>

        <Link
          to={ROUTES.studentProfile}
          className={`student-applications-sidebar-link ${
            activeSection === 'profile' ? 'active' : ''
          }`}
        >
          <Icon name="person" />
          Mi perfil
        </Link>
      </div>

      <Link to={ROUTES.internships} className="student-applications-discover-link">
        Buscar nuevas ofertas
      </Link>
    </aside>
  )
}
