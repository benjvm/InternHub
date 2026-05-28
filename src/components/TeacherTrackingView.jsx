import { getProfileImageUrl } from '../services/cloudinaryService'
import {
  getInternshipProgressPercentage,
  getInternshipRequiredHours,
} from '../services/professorTrackingService'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import TeacherPanelSidebar from './TeacherPanelSidebar'

function Icon({ name }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {name}
    </span>
  )
}

function toDate(value) {
  if (!value) {
    return null
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000)
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function formatLongDate(value) {
  const parsedDate = toDate(value)

  if (!parsedDate) {
    return 'Sin definir'
  }

  return parsedDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(value) {
  const parsedDate = toDate(value)

  if (!parsedDate) {
    return 'Sin fecha'
  }

  return parsedDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

function getRemainingDays(endDate) {
  const parsedEndDate = toDate(endDate)

  if (!parsedEndDate) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsedEndDate.setHours(0, 0, 0, 0)

  return Math.max(0, Math.ceil((parsedEndDate.getTime() - today.getTime()) / 86400000))
}

function getCurrentWeekTotal(dailyLogs) {
  if (!dailyLogs.length) {
    return 0
  }

  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + mondayOffset)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return dailyLogs.reduce((total, log) => {
    const logDate = toDate(log.date)

    if (!logDate || logDate < startOfWeek || logDate >= endOfWeek) {
      return total
    }

    return total + Number(log.hoursWorked || 0)
  }, 0)
}

function getRecentDailyLogs(dailyLogs, limit = 5) {
  return [...dailyLogs]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit)
}

function getInternshipTypeLabel(type) {
  return type === 'remoto' ? 'Remoto' : 'Presencial'
}

function EmptyState({ title, description }) {
  return (
    <div className="teacher-dashboard-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function TrackingSkeleton() {
  return (
    <div className="teacher-dashboard-skeleton-grid">
      <div className="teacher-dashboard-skeleton-card large" />
      <div className="teacher-dashboard-skeleton-card" />
      <div className="teacher-dashboard-skeleton-card" />
      <div className="teacher-dashboard-skeleton-card wide" />
    </div>
  )
}

function SearchBar({
  searchTerm,
  onSearchChange,
  assignedCount,
  availableCount,
  hasAssignedInternships,
}) {
  const totalResults = assignedCount + availableCount

  return (
    <div className="teacher-dashboard-search-card">
      <div className="teacher-dashboard-search-copy">
        <p className="teacher-dashboard-heading-kicker">Panel del profesor</p>
        <h2>{hasAssignedInternships ? 'Tus alumnos asignados' : 'Busca alumnos disponibles'}</h2>
        <p>
          {hasAssignedInternships
            ? 'Busca por nombre para cambiar rapido entre estudiantes y continuar su seguimiento.'
            : 'Selecciona una practica sin profesor responsable para asumir su seguimiento.'}
        </p>
      </div>

      <div className="teacher-dashboard-search-controls">
        <label className="teacher-dashboard-search-input">
          <Icon name="search" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar alumno por nombre"
          />
        </label>
        <div className="teacher-dashboard-count-pill">
          {totalResults} resultado{totalResults === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  )
}

function SearchResultsRail({
  title,
  internships,
  selectedInternshipId,
  onSelectInternship,
  variant = 'assigned',
}) {
  if (!internships.length) {
    return null
  }

  return (
    <section className="teacher-dashboard-results-section">
      <div className="teacher-dashboard-section-head teacher-dashboard-results-head">
        <div>
          <h2>{title}</h2>
          <p>
            {variant === 'available'
              ? 'Practicas sin profesor responsable que puedes asumir.'
              : 'Alumnos bajo tu seguimiento actual.'}
          </p>
        </div>
      </div>

      <div className="teacher-dashboard-results-grid">
        {internships.map((internship) => (
          <button
            key={internship.id}
            type="button"
            className={`teacher-dashboard-result-card ${
              selectedInternshipId === internship.id ? 'active' : ''
            } ${variant === 'available' ? 'available' : ''}`}
            onClick={() => onSelectInternship(internship.id)}
          >
            <div className="teacher-dashboard-result-avatar">
              <img
                src={getProfileImageUrl(internship.student)}
                alt={internship.studentName}
              />
            </div>

            <div className="teacher-dashboard-result-copy">
              <strong>{internship.studentName}</strong>
              <span>{internship.companyName || 'Empresa'}</span>
              <small>{internship.offerTitle}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function PendingResponsibilityCard({
  internship,
  isAssigning,
  onAcceptResponsibility,
}) {
  const requiredHours = getInternshipRequiredHours(internship)

  return (
    <section className="teacher-dashboard-pending-card">
      <div className="teacher-dashboard-pending-head">
        <div>
          <p className="teacher-dashboard-heading-kicker">Alumno seleccionado</p>
          <h2>{internship.studentName}</h2>
          <p>
            {internship.companyName || 'Empresa'} · {internship.offerTitle}
          </p>
        </div>

        <button
          type="button"
          className="teacher-dashboard-primary-button"
          onClick={onAcceptResponsibility}
          disabled={isAssigning}
        >
          <Icon name="verified" />
          {isAssigning ? 'Asignando...' : 'Aceptar responsabilidad'}
        </button>
      </div>

      <div className="teacher-dashboard-stat-grid compact">
        <article>
          <span>Horas requeridas</span>
          <strong>{requiredHours || 'Sin definir'} h</strong>
        </article>
        <article>
          <span>Horas completadas</span>
          <strong>{Number(internship.completedHours || 0)} h</strong>
        </article>
        <article>
          <span>Estado</span>
          <strong>{internship.statusLabel}</strong>
        </article>
      </div>
    </section>
  )
}

function StudentOverviewCard({ internship }) {
  return (
    <article className="teacher-dashboard-card teacher-dashboard-student-card">
      <div className="teacher-dashboard-student-hero">
        <div className="teacher-dashboard-student-avatar">
          <img src={getProfileImageUrl(internship.student)} alt={internship.studentName} />
        </div>

        <div className="teacher-dashboard-student-copy">
          <h2>{internship.studentName}</h2>
          <p>{internship.student?.carrera || 'Perfil academico no disponible'}</p>
          <span>{internship.student?.universidad || 'Universidad no disponible'}</span>
        </div>
      </div>

      <div className="teacher-dashboard-student-meta">
        <div>
          <span>Empresa: </span>
          <strong>{internship.companyName || 'Empresa no disponible'}</strong>
        </div>
        <div>
          <span>Oferta: </span>
          <strong>{internship.offerTitle}</strong>
        </div>
        <div>
          <span>Periodo: </span>
          <strong>
            {formatLongDate(internship.startDate)} - {formatLongDate(internship.endDate)}
          </strong>
        </div>
        <div>
          <span>Tutor de empresa: </span>
          <strong>{internship.tutorCompanyName || 'Pendiente'}</strong>
        </div>
      </div>

      {internship.studentId ? (
        <Link
          to={ROUTES.publicStudentProfile(internship.studentId)}
          className="teacher-dashboard-secondary-link"
        >
          Ver perfil publico
        </Link>
      ) : null}
    </article>
  )
}

function ProgressCard({ internship, dailyLogs }) {
  const requiredHours = getInternshipRequiredHours(internship)
  const completedHours = Number(internship.completedHours || 0)
  const progressPercentage = getInternshipProgressPercentage(internship)
  const remainingDays = getRemainingDays(internship.endDate)
  const weeklyTotal = getCurrentWeekTotal(dailyLogs)

  return (
    <article className="teacher-dashboard-card teacher-dashboard-progress-card">
      <div className="teacher-dashboard-progress-top">
        <div className="teacher-dashboard-progress-ring-wrap">
          <div
            className="teacher-dashboard-progress-ring"
            style={{
              background: `conic-gradient(#ff8c00 ${progressPercentage}%, #e2e8f0 ${progressPercentage}% 100%)`,
            }}
          >
            <div>
              <strong>{progressPercentage}%</strong>
              <span>Completado</span>
            </div>
          </div>
        </div>

        <div className="teacher-dashboard-progress-copy">
          <div className="teacher-dashboard-progress-head">
            <div>
              <p className="teacher-dashboard-heading-kicker">Progreso de practicas</p>
              <h2>Seguimiento academico</h2>
              <p>Resumen de horas, estado y ritmo semanal del alumno.</p>
            </div>

            <span className={`teacher-dashboard-status-badge ${internship.status}`}>
              {internship.statusLabel}
            </span>
          </div>

          <div className="teacher-dashboard-stat-grid">
            <article className="teacher-dashboard-metric-card">
              <div className="teacher-dashboard-metric-label">
                <span>Horas totales</span>
              </div>
              <strong>{completedHours} h</strong>
              <small>de {requiredHours || 'Sin definir'} horas requeridas</small>
            </article>
            <article className="teacher-dashboard-metric-card">
              <div className="teacher-dashboard-metric-label">
                <span>Ritmo semanal</span>
              </div>
              <strong>{weeklyTotal} h</strong>
              <small>{weeklyTotal ? 'acumuladas esta semana' : 'sin horas registradas'}</small>
            </article>
            <article className="teacher-dashboard-metric-card">
              <div className="teacher-dashboard-metric-label">
                <span>Dias restantes</span>
              </div>
              <strong>{remainingDays === null ? 'Sin fecha' : remainingDays}</strong>
              <small>
                {remainingDays === null ? 'fin de practica pendiente' : 'hasta la fecha de cierre'}
              </small>
            </article>
          </div>
        </div>
      </div>
    </article>
  )
}

function ActivitiesCard({ dailyLogs, isLoadingLogs }) {
  const recentDailyLogs = getRecentDailyLogs(dailyLogs)

  return (
    <article className="teacher-dashboard-card teacher-dashboard-activity-card">
      <div className="teacher-dashboard-section-head">
        <div>
          <h2>Ultimas actividades</h2>
          <p>Registro diario reportado por el alumno.</p>
        </div>
      </div>

      {isLoadingLogs ? <p className="teacher-dashboard-muted-copy">Cargando actividad...</p> : null}

      {!isLoadingLogs && !recentDailyLogs.length ? (
        <p className="teacher-dashboard-muted-copy">
          Aun no hay jornadas registradas para esta practica.
        </p>
      ) : null}

      {!isLoadingLogs && recentDailyLogs.length ? (
        <div className="teacher-dashboard-timeline">
          {recentDailyLogs.map((log) => (
            <article key={log.id} className="teacher-dashboard-timeline-item">
              <div className="teacher-dashboard-timeline-dot" />
              <div className="teacher-dashboard-timeline-copy">
                <div className="teacher-dashboard-timeline-head">
                  <strong>{formatShortDate(log.date)}</strong>
                  <span>{log.hoursWorked} h</span>
                </div>
                <p>{log.description}</p>
                <small>{getInternshipTypeLabel(log.type)}</small>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function WeeklySummaryCard({ dailyLogs }) {
  const weeklyTotal = getCurrentWeekTotal(dailyLogs)

  return (
    <article className="teacher-dashboard-card teacher-dashboard-weekly-card">
      <div className="teacher-dashboard-section-head">
        <div>
          <h2>Total semanal</h2>
          <p>Horas acumuladas entre lunes y domingo.</p>
        </div>
      </div>

      <div className="teacher-dashboard-weekly-total">
        <strong>{weeklyTotal} h</strong>
        <span>{weeklyTotal ? 'Semana en curso' : 'Sin actividad esta semana'}</span>
      </div>
    </article>
  )
}

function NotesCard({ internship }) {
  return (
    <article className="teacher-dashboard-card teacher-dashboard-notes-card">
      <div className="teacher-dashboard-section-head">
        <div>
          <h2>Observaciones</h2>
          <p>Notas compartidas por la empresa sobre la practica.</p>
        </div>
      </div>

      <p className="teacher-dashboard-notes-copy">
        {internship.notes || 'Todavia no hay observaciones registradas para esta practica.'}
      </p>
    </article>
  )
}

export default function TeacherTrackingView({
  currentUser,
  searchTerm,
  setSearchTerm,
  selectedInternshipId,
  setSelectedInternshipId,
  selectedInternship,
  filteredAssignedInternships,
  filteredAvailableInternships,
  combinedSearchInternships,
  hasAssignedInternships,
  dailyLogs,
  isLoading,
  isLoadingLogs,
  isAssigning,
  errorMessage,
  successMessage,
  onAcceptResponsibility,
}) {
  const visibleAssignedInternships = searchTerm
    ? filteredAssignedInternships
    : hasAssignedInternships
      ? filteredAssignedInternships
      : []
  const visibleAvailableInternships = searchTerm ? filteredAvailableInternships : []
  const totalVisibleResults = searchTerm
    ? combinedSearchInternships.length
    : visibleAssignedInternships.length

  return (
    <main className="teacher-dashboard-page">
      <div className="container teacher-dashboard-shell">
        <TeacherPanelSidebar currentUser={currentUser} activeSection="tracking" />

        <section className="teacher-dashboard-content">
          <header className="teacher-dashboard-page-heading">
            <p className="teacher-dashboard-heading-kicker">Panel del profesor</p>
            <h1>Seguimiento de practicas</h1>
            <p>
              Centraliza el acompanamiento academico de cada estudiante, revisa sus horas y
              consulta la actividad mas reciente desde un unico panel.
            </p>
          </header>

          {errorMessage ? <p className="teacher-dashboard-feedback error">{errorMessage}</p> : null}
          {successMessage ? (
            <p className="teacher-dashboard-feedback success">{successMessage}</p>
          ) : null}

          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            assignedCount={searchTerm ? visibleAssignedInternships.length : totalVisibleResults}
            availableCount={searchTerm ? visibleAvailableInternships.length : 0}
            hasAssignedInternships={hasAssignedInternships}
          />

          {isLoading ? <TrackingSkeleton /> : null}

          {!isLoading && hasAssignedInternships && searchTerm && !totalVisibleResults ? (
            <EmptyState
              title="No hay alumnos para esta busqueda"
              description="Prueba con otro nombre o limpia el buscador para ver tus alumnos y las practicas disponibles."
            />
          ) : null}

          {!isLoading && !hasAssignedInternships && !searchTerm ? (
            <EmptyState
              title="No tienes alumnos asignados"
              description="Busca un alumno para comenzar y acepta la responsabilidad de su seguimiento."
            />
          ) : null}

          {!isLoading && !hasAssignedInternships && searchTerm && !totalVisibleResults ? (
            <EmptyState
              title="No encontramos practicas disponibles"
              description="No hay coincidencias sin profesor responsable para el texto que has escrito."
            />
          ) : null}

          {!isLoading && (visibleAssignedInternships.length || visibleAvailableInternships.length) ? (
            <>
              <SearchResultsRail
                title="Alumnos asignados"
                internships={visibleAssignedInternships}
                selectedInternshipId={selectedInternshipId}
                onSelectInternship={setSelectedInternshipId}
                variant="assigned"
              />

              <SearchResultsRail
                title="Practicas disponibles"
                internships={visibleAvailableInternships}
                selectedInternshipId={selectedInternshipId}
                onSelectInternship={setSelectedInternshipId}
                variant="available"
              />

              {selectedInternship &&
              !visibleAssignedInternships.some((internship) => internship.id === selectedInternship.id) ? (
                <PendingResponsibilityCard
                  internship={selectedInternship}
                  isAssigning={isAssigning}
                  onAcceptResponsibility={onAcceptResponsibility}
                />
              ) : null}

              {hasAssignedInternships &&
              selectedInternship &&
              visibleAssignedInternships.some((internship) => internship.id === selectedInternship.id) ? (
                <div className="teacher-dashboard-main-grid">
                  <StudentOverviewCard internship={selectedInternship} />
                  <ProgressCard internship={selectedInternship} dailyLogs={dailyLogs} />
                  <ActivitiesCard dailyLogs={dailyLogs} isLoadingLogs={isLoadingLogs} />
                  <div className="teacher-dashboard-side-stack">
                    <WeeklySummaryCard dailyLogs={dailyLogs} />
                    <NotesCard internship={selectedInternship} />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </main>
  )
}
