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

function formatCreatedAt(createdAt) {
  if (createdAt?.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (typeof createdAt === 'string') {
    const parsedDate = new Date(createdAt)

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  }

  return 'Sin fecha'
}

function getStudentDisplayName(user) {
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim()

  if (fullName) {
    return fullName
  }

  return user?.correo || user?.email || 'Estudiante'
}

function normalizeModality(modality) {
  const value = modality?.trim().toLowerCase()

  switch (value) {
    case 'remote':
    case 'remoto':
      return 'remote'
    case 'on-site':
    case 'onsite':
    case 'presencial':
      return 'onsite'
    case 'hybrid':
    case 'híbrido':
    case 'hibrido':
      return 'hybrid'
    default:
      return value || ''
  }
}

function normalizeCategory(category) {
  const value = category?.trim().toLowerCase()

  switch (value) {
    case 'engineering':
    case 'ingeniería':
    case 'ingenieria':
      return 'engineering'
    case 'design':
    case 'diseño':
    case 'diseno':
      return 'design'
    case 'marketing':
      return 'marketing'
    case 'product':
    case 'producto':
      return 'product'
    default:
      return value || ''
  }
}

function translateModality(modality) {
  switch (normalizeModality(modality)) {
    case 'remote':
      return 'Remoto'
    case 'onsite':
      return 'Presencial'
    case 'hybrid':
      return 'Híbrido'
    default:
      return modality || ''
  }
}

function translateCategory(category) {
  switch (normalizeCategory(category)) {
    case 'engineering':
      return 'Ingeniería'
    case 'design':
      return 'Diseño'
    case 'marketing':
      return 'Marketing'
    case 'product':
      return 'Producto'
    default:
      return category || ''
  }
}

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="student-applications-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="student-applications-discover-link compact">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

function ApplicationCard({ application }) {
  return (
    <article className="student-applications-card">
      <div className="student-applications-card-top">
        <div className="student-applications-card-brand">
          <div className="student-applications-card-icon">
            <Icon name={application.offer?.icon || 'work'} />
          </div>

          <div className="student-applications-card-copy">
            <p className="student-applications-card-company">{application.companyName}</p>
            <div className="student-applications-card-title-row">
              <h3>{application.offerTitle}</h3>
              <span
                className={`student-applications-status-badge ${
                  application.status === 'aceptado' ? 'accepted' : 'pending'
                }`}
              >
                {application.statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="student-applications-card-description">
        {application.offer?.summary || application.offer?.description || 'Sin descripción disponible.'}
      </p>

      <div className="student-applications-card-meta">
        <span>
          <Icon name="calendar_today" className="student-applications-inline-icon" />
          {formatCreatedAt(application.createdAt)}
        </span>
        <span>
          <Icon name="location_on" className="student-applications-inline-icon" />
          {application.location}
        </span>
      </div>

      <div className="student-applications-card-footer">
        <span className="student-applications-chip">{translateCategory(application.category)}</span>
        <Link
          to={ROUTES.internshipDetail(application.offerId)}
          className="student-applications-card-link"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  )
}

function SavedOfferCard({ offer }) {
  return (
    <article className="student-applications-card">
      <div className="student-applications-card-top">
        <div className="student-applications-card-brand">
          <div className="student-applications-card-icon">
            <Icon name={offer.icon || 'bookmark'} />
          </div>

          <div className="student-applications-card-copy">
            <p className="student-applications-card-company">
              {offer.companyName || offer.company || 'InternHub'}
            </p>
            <div className="student-applications-card-title-row">
              <h3>{offer.title}</h3>
              <span className="student-applications-status-badge saved">Guardada</span>
            </div>
          </div>
        </div>
      </div>

      <p className="student-applications-card-description">
        {offer.summary || offer.description || 'Sin descripción disponible.'}
      </p>

      <div className="student-applications-card-meta">
        <span>
          <Icon name="location_on" className="student-applications-inline-icon" />
          {offer.location || 'Ubicación por definir'}
        </span>
        <span>
          <Icon name="payments" className="student-applications-inline-icon" />
          {offer.salary || 'Por definir'}
        </span>
      </div>

      <div className="student-applications-card-footer">
        <span className="student-applications-chip">{translateModality(offer.modality) || 'Flexible'}</span>
        <Link to={ROUTES.internshipDetail(offer.id)} className="student-applications-card-link">
          Ver detalles
        </Link>
      </div>
    </article>
  )
}

export default function StudentApplicationsView({
  currentUser,
  activeSection,
  onSectionChange,
  applicationFilters,
  activeFilter,
  onFilterChange,
  applications,
  filteredApplications,
  savedOffers,
  isLoading,
  errorMessage,
}) {
  const totalApplications = applications.length
  const studentName = getStudentDisplayName(currentUser)
  const profileImageUrl = getProfileImageUrl(currentUser)

  const headingTitle =
    activeSection === 'saved' ? 'Ofertas guardadas' : 'Mis candidaturas'
  const headingDescription =
    activeSection === 'saved'
      ? `Tienes ${savedOffers.length} oferta${savedOffers.length === 1 ? '' : 's'} guardada${
          savedOffers.length === 1 ? '' : 's'
        } para revisar más tarde.`
      : `Tienes ${totalApplications} candidatura${totalApplications === 1 ? '' : 's'} activa${
          totalApplications === 1 ? '' : 's'
        }.`

  return (
    <main className="student-applications-page">
      <div className="container student-applications-shell">
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
            <button
              type="button"
              className={`student-applications-sidebar-link ${
                activeSection === 'applications' ? 'active' : ''
              }`}
              onClick={() => onSectionChange('applications')}
            >
              <Icon name="work" />
              Mis candidaturas
            </button>

            <button
              type="button"
              className={`student-applications-sidebar-link ${
                activeSection === 'saved' ? 'active' : ''
              }`}
              onClick={() => onSectionChange('saved')}
            >
              <Icon name="bookmark" />
              Ofertas guardadas
            </button>

            <button
              type="button"
              className="student-applications-sidebar-link disabled"
              disabled
            >
              <Icon name="settings" />
              Configuración
            </button>
          </div>

          <Link to={ROUTES.internships} className="student-applications-discover-link">
            Buscar nuevas ofertas
          </Link>
        </aside>

        <section className="student-applications-content">
          <header className="student-applications-heading">
            <p className="student-applications-heading-kicker">Panel del estudiante</p>
            <h1>{headingTitle}</h1>
            <p>{headingDescription}</p>
          </header>

          {activeSection === 'applications' ? (
            <div className="student-applications-filter-row">
              {applicationFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`student-applications-filter-pill ${
                    activeFilter === filter.id ? 'active' : ''
                  }`}
                  onClick={() => onFilterChange(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : null}

          {errorMessage ? <p className="student-applications-feedback error">{errorMessage}</p> : null}
          {isLoading ? <p className="student-applications-feedback">Cargando información...</p> : null}

          {!isLoading && activeSection === 'applications' ? (
            filteredApplications.length ? (
              <div className="student-applications-grid">
                {filteredApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay candidaturas para este filtro"
                description="Prueba otro estado o explora nuevas ofertas para enviar tu primera postulación."
                actionLabel="Explorar ofertas"
                actionTo={ROUTES.internships}
              />
            )
          ) : null}

          {!isLoading && activeSection === 'saved' ? (
            savedOffers.length ? (
              <div className="student-applications-grid">
                {savedOffers.map((offer) => (
                  <SavedOfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aún no tienes ofertas guardadas"
                description="Guarda una oferta desde su detalle para poder volver a ella rápidamente."
                actionLabel="Ver pasantías"
                actionTo={ROUTES.internships}
              />
            )
          ) : null}
        </section>
      </div>
    </main>
  )
}
