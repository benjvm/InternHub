import { useEffect } from 'react'
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

function getCompanyName(user) {
  return user?.nombreEmpresa || user?.companyName || 'Empresa'
}

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="company-candidates-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="company-candidates-primary-link compact">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

function CandidateRow({
  application,
  isUpdating,
  onOpen,
  onAccept,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(application.id)
    }
  }

  return (
    <article
      className="company-candidates-row"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(application.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="company-candidates-row-student">
        <div className="company-candidates-avatar">
          <img
            src={getProfileImageUrl(application.student)}
            alt={application.studentName}
          />
        </div>

        <div className="company-candidates-row-copy">
          <h3>{application.studentName}</h3>
          <p>{application.studentEmail || 'Correo no disponible'}</p>
        </div>
      </div>

      <div className="company-candidates-row-university">
        <strong>{application.studentUniversity}</strong>
        <span>{application.studentDegree || 'Carrera no indicada'}</span>
      </div>

      <div className="company-candidates-row-actions" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="company-candidates-ghost-button" disabled>
          Ver perfil
        </button>
        <button
          type="button"
          className="company-candidates-accept-button"
          onClick={() => onAccept(application.id)}
          disabled={isUpdating || application.status === 'aceptado'}
        >
          {application.status === 'aceptado'
            ? 'Aceptada'
            : isUpdating
              ? 'Guardando...'
              : 'Aceptar'}
        </button>
      </div>
    </article>
  )
}

function ApplicationModal({ application, onClose, onAccept, onReject, isUpdating }) {
  useEffect(() => {
    if (!application) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [application, onClose])

  if (!application) {
    return null
  }

  return (
    <div className="company-candidates-modal-backdrop" onClick={onClose}>
      <div
        className="company-candidates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-candidates-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="company-candidates-modal-header">
          <div>
            <p className="company-candidates-modal-eyebrow">Candidatura</p>
            <h3 id="company-candidates-modal-title">{application.studentName}</h3>
            <p>
              {application.offerTitle} · {application.statusLabel}
            </p>
          </div>

          <button
            type="button"
            className="company-candidates-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="company-candidates-modal-grid">
          <div className="company-candidates-modal-card">
            <span>Universidad</span>
            <strong>{application.studentUniversity}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Carrera</span>
            <strong>{application.studentDegree || 'No indicada'}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Correo</span>
            <strong>{application.studentEmail || 'No disponible'}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Fecha</span>
            <strong>{formatCreatedAt(application.createdAt)}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Disponibilidad</span>
            <strong>{application.availability || 'No indicada'}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Jornada</span>
            <strong>{application.scheduleType || 'No indicada'}</strong>
          </div>
        </div>

        <section className="company-candidates-modal-section">
          <h4>Mensaje de la candidatura</h4>
          <p>{application.coverLetter || 'La persona candidata no añadió un mensaje.'}</p>
        </section>

        <section className="company-candidates-modal-section">
          <h4>Oferta relacionada</h4>
          <p>{application.offerTitle}</p>
          <small>{application.location}</small>
        </section>

        {application.student?.cvUrl ? (
          <section className="company-candidates-modal-section">
            <h4>Currículum</h4>
            <a href={application.student.cvUrl} target="_blank" rel="noreferrer">
              {application.student.cvFileName || 'Ver CV adjunto'}
            </a>
          </section>
        ) : null}

        <div className="company-candidates-modal-actions">
          <button type="button" className="company-candidates-secondary-button" onClick={onClose}>
            Volver
          </button>
          {application.status !== 'aceptado' ? (
            <button
              type="button"
              className="company-candidates-reject-button"
              onClick={() => onReject(application.id)}
              disabled={isUpdating || application.status === 'rechazado'}
            >
              {application.status === 'rechazado'
                ? 'Candidatura rechazada'
                : isUpdating
                  ? 'Guardando...'
                  : 'Rechazar candidatura'}
            </button>
          ) : null}
          <button
            type="button"
            className="company-candidates-primary-button"
            onClick={() => onAccept(application.id)}
            disabled={isUpdating || application.status === 'aceptado'}
          >
            {application.status === 'aceptado'
              ? 'Candidatura aceptada'
              : isUpdating
                ? 'Guardando...'
                : 'Aceptar candidatura'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CompanyCandidatesView({
  currentUser,
  applicationFilters,
  activeFilter,
  onFilterChange,
  applications,
  filteredApplications,
  selectedApplication,
  onSelectApplication,
  onCloseModal,
  onAcceptApplication,
  onRejectApplication,
  isLoading,
  errorMessage,
  updatingApplicationId,
}) {
  const companyName = getCompanyName(currentUser)
  const profileImageUrl = getProfileImageUrl(currentUser)

  return (
    <main className="company-candidates-page">
      <div className="container company-candidates-shell">
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
            <Link to={ROUTES.companyCandidates} className="company-candidates-sidebar-link active">
              <Icon name="groups" />
              Candidatos
            </Link>

            <Link to={ROUTES.postOffer} className="company-candidates-sidebar-link">
              <Icon name="work" />
              Publicar oferta
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

        <section className="company-candidates-content">
          <header className="company-candidates-heading">
            <p className="company-candidates-heading-kicker">Panel de empresa</p>
            <h1>Revisión de candidatos</h1>
            <p>
              Gestiona todas las candidaturas recibidas para tus ofertas activas desde un solo lugar.
            </p>
          </header>

          <div className="company-candidates-toolbar">
            <div className="company-candidates-filter-row">
              {applicationFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`company-candidates-filter-pill ${
                    activeFilter === filter.id ? 'active' : ''
                  }`}
                  onClick={() => onFilterChange(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="company-candidates-count-pill">
              {filteredApplications.length} candidato{filteredApplications.length === 1 ? '' : 's'}
            </div>
          </div>

          {errorMessage ? <p className="company-candidates-feedback error">{errorMessage}</p> : null}
          {isLoading ? <p className="company-candidates-feedback">Cargando candidatos...</p> : null}

          {!isLoading ? (
            applications.length ? (
              filteredApplications.length ? (
                <div className="company-candidates-table">
                  <div className="company-candidates-table-head">
                    <span>Nombre del alumno</span>
                    <span>Universidad</span>
                    <span>Acciones</span>
                  </div>

                  <div className="company-candidates-table-body">
                    {filteredApplications.map((application) => (
                      <CandidateRow
                        key={application.id}
                        application={application}
                        isUpdating={updatingApplicationId === application.id}
                        onOpen={onSelectApplication}
                        onAccept={onAcceptApplication}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No hay candidaturas en este estado"
                  description="Cambia el filtro para revisar otras candidaturas de tus ofertas."
                />
              )
            ) : (
              <EmptyState
                title="Aún no has recibido candidaturas"
                description="Publica una oferta para empezar a recibir perfiles de estudiantes."
                actionLabel="Crear oferta"
                actionTo={ROUTES.postOffer}
              />
            )
          ) : null}
        </section>
      </div>

      <ApplicationModal
        application={selectedApplication}
        onClose={onCloseModal}
        onAccept={onAcceptApplication}
        onReject={onRejectApplication}
        isUpdating={updatingApplicationId === selectedApplication?.id}
      />
    </main>
  )
}
