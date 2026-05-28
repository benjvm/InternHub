import { getProfileImageUrl } from '../services/cloudinaryService'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'

function Icon({ name }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {name}
    </span>
  )
}

function getTeacherDisplayName(user) {
  return user?.nombreCompleto || user?.full_name || user?.fullName || user?.correo || 'Profesor'
}

export default function TeacherPanelSidebar({ currentUser, activeSection = 'tracking' }) {
  const teacherName = getTeacherDisplayName(currentUser)
  const profileImageUrl = getProfileImageUrl(currentUser)

  return (
    <aside className="teacher-dashboard-sidebar">
      <Link to={ROUTES.teacherSettings} className="teacher-dashboard-profile-card">
        <div className="teacher-dashboard-profile-avatar">
          <img src={profileImageUrl} alt={teacherName} />
        </div>
        <div>
          <h2>{teacherName}</h2>
          <p>Profesor</p>
        </div>
      </Link>

      <div className="teacher-dashboard-sidebar-menu">
        <Link
          to={ROUTES.teacherTracking}
          className={`teacher-dashboard-sidebar-link ${
            activeSection === 'tracking' ? 'active' : ''
          }`}
        >
          <Icon name="monitoring" />
          Seguimiento
        </Link>

        <Link
          to={ROUTES.teacherSettings}
          className={`teacher-dashboard-sidebar-link ${
            activeSection === 'settings' ? 'active' : ''
          }`}
        >
          <Icon name="settings" />
          Configuracion
        </Link>
      </div>

      <Link to={ROUTES.teacherTracking} className="teacher-dashboard-primary-link">
        Abrir panel
      </Link>
    </aside>
  )
}
