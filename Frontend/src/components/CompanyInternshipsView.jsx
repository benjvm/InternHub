import CompanyPanelSidebar from './CompanyPanelSidebar'
import InternshipFormModal from './InternshipFormModal'

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Sin definir'
  }

  if (dateValue?.seconds) {
    return new Date(dateValue.seconds * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const parsedDate = new Date(dateValue)

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return 'Sin definir'
}

function EmptyState({ title, description }) {
  return (
    <div className="company-candidates-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function InternshipRow({ internship, onOpen, isUpdating }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(internship.id)
    }
  }

  return (
    <article
      className="company-candidates-row company-internships-row"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(internship.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="company-internships-primary">
        <h3>{internship.studentName}</h3>
        <p>{internship.studentEmail || 'Correo no disponible'}</p>
      </div>

      <div className="company-internships-secondary">
        <strong>{internship.offerTitle}</strong>
        <span>Práctica vinculada a candidatura aceptada</span>
      </div>

      <div className="company-internships-status">
        <span className={`company-internships-status-badge ${internship.status}`}>
          {internship.statusLabel}
        </span>
      </div>

      <div className="company-internships-date">{formatDate(internship.startDate)}</div>
      <div className="company-internships-date">{formatDate(internship.endDate)}</div>

      <div className="company-internships-action">
        <button type="button" className="company-candidates-ghost-button" disabled={isUpdating}>
          {isUpdating ? 'Actualizando...' : 'Ver detalle'}
        </button>
      </div>
    </article>
  )
}

export default function CompanyInternshipsView({
  currentUser,
  internshipFilters,
  activeFilter,
  onFilterChange,
  internships,
  filteredInternships,
  selectedInternship,
  onSelectInternship,
  onCloseModal,
  onSaveDetails,
  onMarkCompleted,
  onCancelInternship,
  isLoading,
  errorMessage,
  updatingInternshipId,
}) {
  return (
    <main className="company-candidates-page">
      <div className="container company-candidates-shell">
        <CompanyPanelSidebar currentUser={currentUser} activeSection="internships" />

        <section className="company-candidates-content">
          <header className="company-candidates-heading">
            <p className="company-candidates-heading-kicker">Panel de empresa</p>
            <h1>Gestión de prácticas</h1>
            <p>
              Revisa las prácticas generadas tras aceptar candidaturas y activa cada una cuando
              tengas la información obligatoria completa.
            </p>
          </header>

          <div className="company-candidates-toolbar">
            <div className="company-candidates-filter-row">
              {internshipFilters.map((filter) => (
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
              {filteredInternships.length} práctica{filteredInternships.length === 1 ? '' : 's'}
            </div>
          </div>

          {errorMessage ? <p className="company-candidates-feedback error">{errorMessage}</p> : null}
          {isLoading ? <p className="company-candidates-feedback">Cargando prácticas...</p> : null}

          {!isLoading ? (
            internships.length ? (
              filteredInternships.length ? (
                <div className="company-candidates-table">
                  <div className="company-candidates-table-head company-internships-table-head">
                    <span>Alumno</span>
                    <span>Oferta</span>
                    <span>Estado</span>
                    <span>Fecha inicio</span>
                    <span>Fecha fin</span>
                    <span>Acciones</span>
                  </div>

                  <div className="company-candidates-table-body">
                    {filteredInternships.map((internship) => (
                      <InternshipRow
                        key={internship.id}
                        internship={internship}
                        onOpen={onSelectInternship}
                        isUpdating={updatingInternshipId === internship.id}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No hay prácticas en este estado"
                  description="Cambia el filtro para revisar el resto del seguimiento de prácticas."
                />
              )
            ) : (
              <EmptyState
                title="Aún no tienes prácticas creadas"
                description="Las prácticas aparecerán aquí automáticamente cuando aceptes una candidatura."
              />
            )
          ) : null}
        </section>
      </div>

      <InternshipFormModal
        internship={selectedInternship}
        onClose={onCloseModal}
        onSave={onSaveDetails}
        onMarkCompleted={onMarkCompleted}
        onCancelInternship={onCancelInternship}
        isUpdating={updatingInternshipId === selectedInternship?.id}
      />
    </main>
  )
}
