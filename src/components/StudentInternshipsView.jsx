import { useEffect, useMemo, useState } from 'react'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import StudentPanelSidebar from './StudentPanelSidebar'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const LOG_TYPE_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
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

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLongDate(dateValue) {
  const parsedDate = toDate(dateValue)

  if (!parsedDate) {
    return 'Sin definir'
  }

  return parsedDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMonthYear(dateValue) {
  return dateValue.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })
}

function formatWeekdayLabel(dateValue) {
  return dateValue.toLocaleDateString('es-ES', { weekday: 'long' })
}

function formatSelectedDateLabel(dateValue) {
  const parsedDate = toDate(dateValue)

  if (!parsedDate) {
    return 'Fecha no disponible'
  }

  return parsedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getProgressPercentage(completedHours, totalHours) {
  if (!totalHours) {
    return 0
  }

  return Math.min(100, Math.round((Number(completedHours || 0) / Number(totalHours)) * 100))
}

function createDateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMonthStart(dateValue) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), 1)
}

function addMonths(dateValue, amount) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth() + amount, 1)
}

function startOfCalendarGrid(dateValue) {
  const monthStart = getMonthStart(dateValue)
  const dayOfWeek = monthStart.getDay()
  const mondayBasedOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(monthStart.getDate() - mondayBasedOffset)
  return calendarStart
}

function buildCalendarDays(dateValue) {
  const calendarStart = startOfCalendarGrid(dateValue)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart)
    day.setDate(calendarStart.getDate() + index)
    return day
  })
}

function getInternshipTypeLabel(type) {
  return type === 'remoto' ? 'Remoto' : 'Presencial'
}

function getInitialFormState() {
  return {
    description: '',
    hoursWorked: '',
    type: 'presencial',
  }
}

function getFormStateFromLog(selectedLog) {
  if (!selectedLog) {
    return getInitialFormState()
  }

  return {
    description: selectedLog.description || '',
    hoursWorked: String(selectedLog.hoursWorked || ''),
    type: selectedLog.type || 'presencial',
  }
}

function isDateWithinRange(dateKey, internship) {
  if (!internship?.startDate || !internship?.endDate) {
    return false
  }

  return dateKey >= internship.startDate && dateKey <= internship.endDate
}

function getPreviousDayKey(dateKey) {
  const dateValue = createDateFromIso(dateKey)
  dateValue.setDate(dateValue.getDate() - 1)
  return toDateKey(dateValue)
}

function buildWeeklySummaries(dailyLogs, internshipStartDate) {
  if (!dailyLogs.length || !internshipStartDate) {
    return []
  }

  const internshipStart = createDateFromIso(internshipStartDate)
  const summaries = new Map()

  dailyLogs.forEach((log) => {
    const currentDate = createDateFromIso(log.date)
    const dayOffset = Math.max(
      0,
      Math.floor((currentDate.getTime() - internshipStart.getTime()) / 86400000),
    )
    const weekNumber = Math.floor(dayOffset / 7) + 1

    if (!summaries.has(weekNumber)) {
      summaries.set(weekNumber, {
        weekNumber,
        days: [],
        totalHours: 0,
      })
    }

    const currentWeek = summaries.get(weekNumber)
    currentWeek.days.push({
      date: log.date,
      label: formatWeekdayLabel(currentDate),
      hoursWorked: log.hoursWorked,
    })
    currentWeek.totalHours += Number(log.hoursWorked || 0)
  })

  return Array.from(summaries.values()).map((week) => ({
    ...week,
    days: week.days.sort((left, right) => left.date.localeCompare(right.date)),
  }))
}

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="student-internships-empty-state">
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

function InternshipSummaryCard({ internship, dailyLogs }) {
  const completedHours = Number(internship?.completedHours || 0)
  const totalHours = Number(internship?.totalHours || 0)
  const progressPercentage = getProgressPercentage(completedHours, totalHours)

  return (
    <article className="student-internships-summary-card">
      <div className="student-internships-summary-head">
        <div>
          <p className="student-internships-summary-kicker">Práctica activa</p>
          <h2>{internship.offerTitle}</h2>
          <p>{internship.companyName || 'Empresa colaboradora'}</p>
        </div>

        <span className={`student-internships-status-badge ${internship.status}`}>
          {internship.statusLabel}
        </span>
      </div>

      <div className="student-internships-summary-grid">
        <div>
          <span>Periodo</span>
          <strong>
            {formatLongDate(internship.startDate)} - {formatLongDate(internship.endDate)}
          </strong>
        </div>
        <div>
          <span>Tutor de empresa</span>
          <strong>{internship.tutorCompanyName || 'Pendiente'}</strong>
        </div>
        <div>
          <span>Días registrados</span>
          <strong>{dailyLogs.length}</strong>
        </div>
        <div>
          <span>Horas completadas</span>
          <strong>
            {completedHours} / {totalHours || 'Sin definir'} h
          </strong>
        </div>
      </div>

      <div className="student-internships-progress-block">
        <div className="student-internships-progress-copy">
          <span>Progreso del seguimiento</span>
          <strong>{progressPercentage}% completado</strong>
        </div>
        <div className="student-internships-progress-bar" aria-hidden="true">
          <span style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>
    </article>
  )
}

function InternshipCalendar({
  internship,
  dailyLogsByDate,
  selectedDate,
  onSelectDate,
}) {
  const initialMonth = useMemo(() => {
    if (selectedDate) {
      return getMonthStart(createDateFromIso(selectedDate))
    }

    if (internship?.startDate) {
      return getMonthStart(createDateFromIso(internship.startDate))
    }

    return getMonthStart(new Date())
  }, [internship?.startDate, selectedDate])

  const [visibleMonth, setVisibleMonth] = useState(initialMonth)

  useEffect(() => {
    setVisibleMonth(initialMonth)
  }, [initialMonth])

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])

  return (
    <article className="student-internships-calendar-card">
      <div className="student-internships-calendar-head">
        <div>
          <h2>Calendario de prácticas</h2>
          <p>{formatMonthYear(visibleMonth)}</p>
        </div>

        <div className="student-internships-calendar-actions">
          <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>
            <Icon name="chevron_left" />
          </button>
          <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>

      <div className="student-internships-calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="student-internships-calendar-weekday">
            {label}
          </span>
        ))}

        {calendarDays.map((day) => {
          const dayKey = toDateKey(day)
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
          const isInRange = isDateWithinRange(dayKey, internship)
          const isCompleted = Boolean(dailyLogsByDate[dayKey])
          const isSelected = selectedDate === dayKey

          return (
            <button
              key={dayKey}
              type="button"
              className={`student-internships-calendar-day ${
                isCurrentMonth ? '' : 'muted'
              } ${isInRange ? 'active-range' : ''} ${isCompleted ? 'completed' : ''} ${
                isSelected ? 'selected' : ''
              }`.trim()}
              onClick={() => onSelectDate(dayKey)}
            >
              <span>{day.getDate()}</span>
              {isCompleted ? <Icon name="check_circle" className="student-internships-calendar-check" /> : null}
            </button>
          )
        })}
      </div>

      <div className="student-internships-calendar-legend">
        <div>
          <span className="student-internships-legend-dot active-range" />
          Periodo activo
        </div>
        <div>
          <span className="student-internships-legend-dot completed" />
          Día registrado
        </div>
      </div>
    </article>
  )
}

function DailyLogForm({
  internship,
  selectedDate,
  selectedLog,
  previousDayLog,
  onSaveDailyLog,
  isSaving,
}) {
  const [formState, setFormState] = useState(() => getFormStateFromLog(selectedLog))

  const isInRange = isDateWithinRange(selectedDate, internship)

  function handleChange(event) {
    const { name, value } = event.target
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }))
  }

  function handleCopyPreviousDay() {
    if (!previousDayLog) {
      return
    }

    setFormState({
      description: previousDayLog.description || '',
      hoursWorked: String(previousDayLog.hoursWorked || ''),
      type: previousDayLog.type || 'presencial',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSaveDailyLog(formState)
  }

  return (
    <article className="student-internships-form-card">
      <div className="student-internships-form-head">
        <div>
          <p className="student-internships-summary-kicker">Registro diario</p>
          <h2>Registro diario de actividades</h2>
          <p>{formatSelectedDateLabel(selectedDate)}</p>
        </div>

        {previousDayLog && !selectedLog && isInRange ? (
          <button
            type="button"
            className="student-internships-copy-button"
            onClick={handleCopyPreviousDay}
          >
            <Icon name="content_copy" />
            Copiar horario de ayer
          </button>
        ) : null}
      </div>

      {!isInRange ? (
        <div className="student-internships-date-warning">
          Esta fecha está fuera del rango activo de la práctica. Selecciona un día válido del calendario.
        </div>
      ) : null}

      {isInRange && selectedLog ? (
        <div className="student-internships-existing-log">
          <p>
            Ya registraste esta jornada. Así evitamos que el alumno pueda guardar dos veces el mismo
            día por accidente.
          </p>
          <dl>
            <div>
              <dt>Descripción</dt>
              <dd>{selectedLog.description}</dd>
            </div>
            <div>
              <dt>Horas</dt>
              <dd>{selectedLog.hoursWorked} h</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{getInternshipTypeLabel(selectedLog.type)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {isInRange && !selectedLog ? (
        <form className="student-internships-form" onSubmit={handleSubmit}>
          <label>
            <span>Descripción de tareas</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              placeholder="¿Qué actividades completaste hoy?"
              rows={6}
              required
            />
          </label>

          <div className="student-internships-form-row">
            <label>
              <span>Horas hechas</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                name="hoursWorked"
                value={formState.hoursWorked}
                onChange={handleChange}
                placeholder="8"
                required
              />
            </label>

            <label>
              <span>Tipo</span>
              <select name="type" value={formState.type} onChange={handleChange}>
                {LOG_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="student-internships-save-button" disabled={isSaving}>
            <Icon name="save" />
            {isSaving ? 'Guardando...' : 'Guardar registro'}
          </button>
        </form>
      ) : null}
    </article>
  )
}

function WeeklySummary({ weeklySummaries }) {
  if (!weeklySummaries.length) {
    return (
      <article className="student-internships-weekly-card">
        <h2>Resumen semanal</h2>
        <p>Aún no hay jornadas registradas para generar la vista semanal automática.</p>
      </article>
    )
  }

  return (
    <article className="student-internships-weekly-card">
      <div className="student-internships-calendar-head">
        <div>
          <h2>Resumen semanal</h2>
          <p>La app agrupa automáticamente las horas registradas por semanas de práctica.</p>
        </div>
      </div>

      <div className="student-internships-weekly-grid">
        {weeklySummaries.map((week) => (
          <section key={week.weekNumber} className="student-internships-week-card">
            <h3>Semana {week.weekNumber}</h3>
            <ul>
              {week.days.map((day) => (
                <li key={day.date}>
                  <span>{day.label}</span>
                  <strong>{day.hoursWorked} h</strong>
                </li>
              ))}
            </ul>
            <div className="student-internships-week-total">
              <span>Total</span>
              <strong>{week.totalHours} h</strong>
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}

export default function StudentInternshipsView({
  currentUser,
  internships,
  selectedInternshipId,
  onSelectInternship,
  selectedInternship,
  dailyLogs,
  selectedDate,
  onSelectDate,
  onSaveDailyLog,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
}) {
  const dailyLogsByDate = useMemo(
    () =>
      dailyLogs.reduce((accumulator, log) => {
        accumulator[log.date] = log
        return accumulator
      }, {}),
    [dailyLogs],
  )

  const selectedLog = dailyLogsByDate[selectedDate] || null
  const previousDayLog = dailyLogsByDate[getPreviousDayKey(selectedDate)] || null
  const weeklySummaries = useMemo(
    () => buildWeeklySummaries(dailyLogs, selectedInternship?.startDate),
    [dailyLogs, selectedInternship?.startDate],
  )

  return (
    <main className="student-applications-page student-internships-page">
      <div className="container student-applications-shell">
        <StudentPanelSidebar currentUser={currentUser} activeSection="internships" />

        <section className="student-applications-content student-internships-content">
          <header className="student-applications-heading">
            <p className="student-applications-heading-kicker">Panel del estudiante</p>
            <h1>Registro de prácticas</h1>
            <p>
              Lleva un registro diario de tus tareas, controla las horas completadas y revisa el
              avance semanal de tu práctica.
            </p>
          </header>

          {errorMessage ? <p className="student-applications-feedback error">{errorMessage}</p> : null}
          {successMessage ? <p className="student-internships-feedback success">{successMessage}</p> : null}
          {isLoading ? <p className="student-applications-feedback">Cargando prácticas...</p> : null}

          {!isLoading && !internships.length ? (
            <EmptyState
              title="Todavía no tienes prácticas asignadas"
              description="Cuando una candidatura aceptada se convierta en práctica, podrás registrar tus jornadas aquí."
              actionLabel="Ver candidaturas"
              actionTo={ROUTES.studentApplications}
            />
          ) : null}

          {!isLoading && internships.length ? (
            <div className="student-internships-layout">
              <div className="student-internships-topbar">
                <label className="student-internships-selector">
                  <span>Práctica seleccionada</span>
                  <select
                    value={selectedInternshipId}
                    onChange={(event) => onSelectInternship(event.target.value)}
                  >
                    {internships.map((internship) => (
                      <option key={internship.id} value={internship.id}>
                        {internship.offerTitle} · {internship.companyName || 'Empresa'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedInternship ? (
                <>
                  <InternshipSummaryCard internship={selectedInternship} dailyLogs={dailyLogs} />

                  <div className="student-internships-main-grid">
                    <DailyLogForm
                      key={`${selectedDate}-${selectedLog?.id || 'new'}`}
                      internship={selectedInternship}
                      selectedDate={selectedDate}
                      selectedLog={selectedLog}
                      previousDayLog={previousDayLog}
                      onSaveDailyLog={onSaveDailyLog}
                      isSaving={isSaving}
                    />

                    <InternshipCalendar
                      internship={selectedInternship}
                      dailyLogsByDate={dailyLogsByDate}
                      selectedDate={selectedDate}
                      onSelectDate={onSelectDate}
                    />
                  </div>

                  <WeeklySummary weeklySummaries={weeklySummaries} />
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
