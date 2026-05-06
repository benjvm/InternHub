import { useEffect, useState } from 'react'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

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

function createInitialFormState(internship) {
  return {
    startDate: internship?.startDate || '',
    endDate: internship?.endDate || '',
    totalHours: internship?.totalHours ?? internship?.weeklyHours ?? '',
    tutorCompanyName: internship?.tutorCompanyName || '',
    notes: internship?.notes || '',
  }
}

export default function InternshipFormModal({
  internship,
  onClose,
  onSave,
  onMarkCompleted,
  onCancelInternship,
  isUpdating,
}) {
  const [formData, setFormData] = useState(createInitialFormState(internship))

  useEffect(() => {
    setFormData(createInitialFormState(internship))
  }, [internship])

  useEffect(() => {
    if (!internship) {
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
  }, [internship, onClose])

  if (!internship) {
    return null
  }

  const isPending = internship.status === 'pendiente'
  const isActive = internship.status === 'activo'
  const canCloseInternship = isPending || isActive

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSave(internship.id, formData)
  }

  return (
    <div className="company-candidates-modal-backdrop" onClick={onClose}>
      <div
        className="company-candidates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-internships-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="company-candidates-modal-header">
          <div>
            <p className="company-candidates-modal-eyebrow">Práctica profesional</p>
            <h3 id="company-internships-modal-title">{internship.studentName}</h3>
            <p>
              {internship.offerTitle} · {internship.statusLabel}
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
            <span>Alumno</span>
            <strong>{internship.studentName}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Oferta</span>
            <strong>{internship.offerTitle}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Fecha inicio</span>
            <strong>{formatDate(internship.startDate)}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Fecha fin</span>
            <strong>{formatDate(internship.endDate)}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Horas totales</span>
            <strong>{internship.totalHours ?? internship.weeklyHours ?? 'Sin definir'}</strong>
          </div>
          <div className="company-candidates-modal-card">
            <span>Tutor de empresa</span>
            <strong>{internship.tutorCompanyName || 'Sin definir'}</strong>
          </div>
        </div>

        {isPending ? (
          <form className="company-internships-form" onSubmit={handleSubmit}>
            <section className="company-candidates-modal-section">
              <h4>Activar práctica</h4>
              <p>
                Completa los datos obligatorios para pasar la práctica de pendiente a activa.
              </p>
            </section>

            <div className="company-internships-form-grid">
              <label className="company-internships-field">
                <span>Fecha de inicio</span>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="company-internships-field">
                <span>Fecha de fin</span>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="company-internships-field">
                <span>Horas totales</span>
                <input
                  type="number"
                  min="1"
                  name="totalHours"
                  value={formData.totalHours}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="company-internships-field">
                <span>Tutor de empresa</span>
                <input
                  type="text"
                  name="tutorCompanyName"
                  value={formData.tutorCompanyName}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="company-internships-field">
              <span>Notas</span>
              <textarea
                name="notes"
                rows="4"
                value={formData.notes}
                onChange={handleChange}
                required
              />
            </label>

            <div className="company-candidates-modal-actions">
              <button
                type="button"
                className="company-candidates-secondary-button"
                onClick={onClose}
              >
                Volver
              </button>
              <button
                type="submit"
                className="company-candidates-primary-button"
                disabled={isUpdating}
              >
                {isUpdating ? 'Guardando...' : 'Guardar y activar práctica'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <section className="company-candidates-modal-section">
              <h4>Detalle de seguimiento</h4>
              <p>{internship.notes || 'Todavía no se han añadido notas para esta práctica.'}</p>
            </section>

            <div className="company-candidates-modal-actions">
              <button type="button" className="company-candidates-secondary-button" onClick={onClose}>
                Cerrar
              </button>
              {isActive ? (
                <button
                  type="button"
                  className="company-candidates-primary-button"
                  onClick={() => onMarkCompleted(internship.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Guardando...' : 'Marcar como completada'}
                </button>
              ) : null}
              {canCloseInternship ? (
                <button
                  type="button"
                  className="company-candidates-reject-button"
                  onClick={() => onCancelInternship(internship.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Guardando...' : 'Cancelar práctica'}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
