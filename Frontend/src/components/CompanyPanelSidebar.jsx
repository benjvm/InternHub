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

function getCompanyName(user) {
  return user?.nombreEmpresa || user?.companyName || 'Empresa'
}

export default function CompanyPanelSidebar({ currentUser, activeSection = 'candidates' }) {
  const companyName = getCompanyName(currentUser)
  const profileImageUrl = getProfileImageUrl(currentUser)

  return (
    <aside className="company-candidates-sidebar">
      <Link to={ROUTES.companyProfile} className="company-candidates-profile-card">
        <div className="company-candidates-profile-avatar">
          <img src={profileImageUrl} alt={companyName} />
        </div>
        <div>
          <h2>{companyName}</h2>
          <p>Empresa</p>
        </div>
      </Link>

      <div className="company-candidates-sidebar-menu">
        <Link
          to={ROUTES.companyCandidates}
          className={`company-candidates-sidebar-link ${
            activeSection === 'candidates' ? 'active' : ''
          }`}
        >
          <Icon name="groups" />
          Candidatos
        </Link>

        <Link
          to={ROUTES.postOffer}
          className={`company-candidates-sidebar-link ${
            activeSection === 'offers' ? 'active' : ''
          }`}
        >
          <Icon name="work" />
          Publicar oferta
        </Link>

        <Link
          to={ROUTES.companyInternships}
          className={`company-candidates-sidebar-link ${
            activeSection === 'internships' ? 'active' : ''
          }`}
        >
          <Icon name="school" />
          Prácticas
        </Link>

        <button type="button" className="company-candidates-sidebar-link disabled" disabled>
          <Icon name="settings" />
          Configuracion
        </button>
      </div>

      <Link to={ROUTES.postOffer} className="company-candidates-primary-link">
        Crear nueva oferta
      </Link>
    </aside>
  )
}
