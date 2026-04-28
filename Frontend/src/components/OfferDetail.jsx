import { useEffect, useState } from 'react'
import '../assets/styles/offer.css'
import { getMockOfferById } from '../data/mockOffers'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouteParams, useRouter } from '../routes/router'
import {
  createApplication,
  getApplicationByOfferAndStudent,
} from '../services/applicationsService'
import { getCvDocumentUrl } from '../services/cloudinaryService'
import { getOfferById } from '../services/offerService'
import { useUser } from '../services/userService'
import OfferMap from './OfferMap'

function formatPublishedAt(createdAt, fallbackLabel) {
  if (fallbackLabel) {
    return fallbackLabel
  }

  if (!createdAt?.seconds) {
    return 'Recently published'
  }

  const createdDate = new Date(createdAt.seconds * 1000)
  return `Published on ${createdDate.toLocaleDateString()}`
}

function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalizedValue = typeof value === 'string' ? value.trim().replace(',', '.') : value
  const coordinate = Number(normalizedValue)

  return Number.isFinite(coordinate) ? coordinate : null
}

function hasValidCoordinates(latitude, longitude) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function getOfferLocation(offer) {
  if (offer?.ubicacion && typeof offer.ubicacion === 'object' && !Array.isArray(offer.ubicacion)) {
    return offer.ubicacion
  }

  if (Array.isArray(offer?.ubicaciones) && offer.ubicaciones.length > 0) {
    return offer.ubicaciones[0]
  }

  return null
}

function getOfferResponsibilities(offer) {
  if (!Array.isArray(offer?.responsibilities)) {
    return []
  }

  return offer.responsibilities
    .map((responsibility) =>
      typeof responsibility === 'string' ? responsibility.trim() : '',
    )
    .filter(Boolean)
}

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function JobDetails() {
  const { offerId } = useRouteParams()
  const { navigate } = useRouter()
  const { currentUser } = useUser()
  const [offer, setOffer] = useState(() => getMockOfferById(offerId))
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')
  const [existingApplication, setExistingApplication] = useState(null)
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [applicationFormData, setApplicationFormData] = useState({
    coverLetter: '',
    availability: 'Inmediata',
    availableFromDate: '',
    scheduleType: 'Full time',
  })
  const currentUserRole = Number(currentUser?.rol)
  const isStudent = currentUserRole === 1
  const shouldShowCta = !currentUser || isStudent
  const currentCvUrl = getCvDocumentUrl(currentUser)
  const applyActionTo = currentUser
    ? getDefaultRouteForRole(currentUser.rol)
    : ROUTES.register

  useEffect(() => {
    let isMounted = true

    async function loadOffer() {
      try {
        setIsLoading(true)
        setErrorMessage('')
        const firestoreOffer = await getOfferById(offerId)

        if (isMounted) {
          setOffer(firestoreOffer ?? getMockOfferById(offerId))
        }
      } catch {
        if (isMounted) {
          setErrorMessage('No se pudo cargar la oferta desde Firebase.')
          setOffer(getMockOfferById(offerId))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOffer()

    return () => {
      isMounted = false
    }
  }, [offerId])

  useEffect(() => {
    let isMounted = true

    async function loadExistingApplication() {
      if (!isStudent || !currentUser?.uid || !offer?.id) {
        if (isMounted) {
          setExistingApplication(null)
          setApplicationMessage('')
          setApplicationError('')
        }
        return
      }

      try {
        const application = await getApplicationByOfferAndStudent(offer.id, currentUser.uid)

        if (!isMounted) {
          return
        }

        setExistingApplication(application)

        if (application) {
          setApplicationMessage('Ya te has postulado a esta oferta.')
        } else {
          setApplicationMessage('')
        }
      } catch {
        if (isMounted) {
          setApplicationError('No se pudo comprobar tu postulacion actual.')
        }
      }
    }

    loadExistingApplication()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid, isStudent, offer?.id])

  useEffect(() => {
    if (!isApplicationModalOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isApplying) {
        setIsApplicationModalOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isApplicationModalOpen, isApplying])

  function handleApplicationFormChange(event) {
    const { name, value } = event.target

    setApplicationFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function openApplicationModal() {
    setApplicationError('')
    setApplicationMessage('')
    setApplicationFormData({
      coverLetter: '',
      availability: 'Inmediata',
      availableFromDate: '',
      scheduleType: 'Full time',
    })
    setIsApplicationModalOpen(true)
  }

  function closeApplicationModal() {
    if (isApplying) {
      return
    }

    setIsApplicationModalOpen(false)
  }

  function handleApplyNow() {
    if (!currentUser) {
      navigate(ROUTES.register)
      return
    }

    if (!isStudent) {
      return
    }

    openApplicationModal()
  }

  async function handleApplicationSubmit(event) {
    event.preventDefault()

    if (!currentCvUrl) {
      setApplicationError('Debes tener un CV subido en tu perfil antes de postularte.')
      return
    }

    if (
      applicationFormData.availability === 'Seleccionar fecha' &&
      !applicationFormData.availableFromDate
    ) {
      setApplicationError('Selecciona una fecha de disponibilidad.')
      return
    }

    try {
      setIsApplying(true)
      setApplicationError('')
      const application = await createApplication({
        offerId: offer.id,
        studentId: currentUser.uid,
        status: 'submitted',
        coverLetter: applicationFormData.coverLetter,
        availability: applicationFormData.availability,
        availableFromDate:
          applicationFormData.availability === 'Seleccionar fecha'
            ? applicationFormData.availableFromDate
            : '',
        scheduleType: applicationFormData.scheduleType,
        cvUrl: currentCvUrl,
        cvFileName: currentUser?.cvFileName || '',
      })

      setExistingApplication(application)
      setApplicationMessage('Postulacion enviada correctamente.')
      setIsApplicationModalOpen(false)
    } catch (error) {
      setApplicationError(error.message || 'No se pudo enviar la postulacion.')
    } finally {
      setIsApplying(false)
    }
  }

  if (isLoading && !offer) {
    return <div className="job-container">Loading offer...</div>
  }

  if (!offer) {
    return (
      <div className="job-container">
        <nav className="breadcrumbs">
          <Link to={ROUTES.home}>Home</Link>
          <span>{'>'}</span>
          <Link to={ROUTES.internships}>Practicas</Link>
        </nav>

        <section>
          <h1>Offer not found</h1>
          <p>This internship does not exist or is no longer available.</p>
          <Link to={ROUTES.internships}>Back to all offers</Link>
        </section>
      </div>
    )
  }

  const offerLocation = getOfferLocation(offer)
  const offerResponsibilities = getOfferResponsibilities(offer)
  const locationLatitude = parseCoordinate(offerLocation?.latitud)
  const locationLongitude = parseCoordinate(offerLocation?.longitud)
  const hasLocationCoordinates = hasValidCoordinates(locationLatitude, locationLongitude)
  return (
    <div className="job-container">
      <nav className="breadcrumbs">
        <Link to={ROUTES.home}>Home</Link>
        <span>{' > '}</span>
        <Link to={ROUTES.internships}>Practicas</Link>
        <span>{' > '}</span>
        <span className="current">{offer.title}</span>
      </nav>

      <div className="card header">
        <div className="header-content">
          <div className="logo">
            <span className="material-symbols-outlined" aria-hidden="true">
              {offer.icon || 'work'}
            </span>
          </div>

          <div className="info">
            <h1>{offer.title}</h1>
            <p className="meta">
              <span>{offer.companyName || offer.company || 'InternHub company'}</span>
              <span aria-hidden="true">{'\u2022'}</span>
              <span>{formatPublishedAt(offer.createdAt, offer.publishedAtLabel)}</span>
            </p>

            <div className="tags">
              <span className="tag primary">{offer.modality || 'Hybrid'}</span>
              <span className="tag success">{offer.category || 'Internship'}</span>
              <span className="tag">{offer.location || 'Spain'}</span>
            </div>
          </div>
        </div>
      </div>

      {shouldShowCta ? (
        <div className="card cta">
          <div>
            <p className="cta-title">Ready to take the next step?</p>
            <p className="cta-sub">
              {isStudent
                ? 'Revisa la oferta y envia tu postulacion en un solo clic.'
                : 'Crea tu cuenta para poder postularte a esta oferta.'}
            </p>
            {applicationMessage ? <p className="cta-feedback success">{applicationMessage}</p> : null}
            {applicationError ? <p className="cta-feedback error">{applicationError}</p> : null}
          </div>
          <div className="cta-actions">
            {isStudent ? (
              <button
                type="button"
                className="btn primary"
                onClick={handleApplyNow}
                disabled={isApplying || Boolean(existingApplication)}
              >
                {existingApplication ? 'Already Applied' : isApplying ? 'Applying...' : 'Apply Now'}
              </button>
            ) : (
              <Link to={applyActionTo} className="btn primary">
                Apply Now
              </Link>
            )}
            <Link to={ROUTES.internships} className="icon-btn" aria-label="Save offer">
              <Icon name="bookmark" />
            </Link>
            <button type="button" className="icon-btn" aria-label="Share offer">
              <Icon name="share" />
            </button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p>{errorMessage}</p> : null}

      <section>
        <h2>About the role</h2>
        <p>{offer.summary || offer.description}</p>
      </section>

      <section>
        <h2>Responsibilities</h2>
        <ul>
          {offerResponsibilities.map((responsibility) => (
            <li key={responsibility}>{responsibility}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Offer details</h2>
        <ul>
          <li>Category: {offer.category || 'General internship'}</li>
          <li>Salary: {offer.salary || 'To be defined'}</li>
          <li>Modality: {offer.modality || 'Flexible'}</li>
        </ul>
      </section>

      <section>
        <h2>Location</h2>
        <div className="location-box">
          {hasLocationCoordinates ? (
            <OfferMap latitude={locationLatitude} longitude={locationLongitude} />
          ) : (
            <span>Coordenadas no disponibles para esta oferta.</span>
          )}
        </div>
      </section>

      {isApplicationModalOpen ? (
        <div className="offer-application-modal-backdrop" onClick={closeApplicationModal}>
          <div
            className="offer-application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-application-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="offer-application-modal-header">
              <div>
                <p className="offer-application-modal-eyebrow">Postulacion</p>
                <h3 id="offer-application-modal-title">Apply to {offer.title}</h3>
                <p>Completa esta informacion para enviar tu candidatura a la empresa.</p>
              </div>

              <button
                type="button"
                className="offer-application-modal-close"
                onClick={closeApplicationModal}
                disabled={isApplying}
                aria-label="Cerrar modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <form className="offer-application-modal-form" onSubmit={handleApplicationSubmit}>
              <div className="offer-application-modal-section">
                <span className="offer-application-modal-label">CV</span>
                {currentCvUrl ? (
                  <div className="offer-application-cv-card">
                    <p>
                      CV listo para adjuntar:
                      <strong> {currentUser?.cvFileName || 'CV actual guardado en tu perfil'}</strong>
                    </p>
                    <a href={currentCvUrl} target="_blank" rel="noreferrer">
                      Ver CV actual
                    </a>
                  </div>
                ) : (
                  <div className="offer-application-cv-card missing">
                    <p>Aun no tienes tu CV?</p>
                    <Link to={ROUTES.studentProfile} onClick={closeApplicationModal}>
                      Ir a perfil
                    </Link>
                  </div>
                )}
              </div>

              <label className="offer-application-field">
                <span>Carta breve</span>
                <textarea
                  name="coverLetter"
                  rows="5"
                  placeholder="Explica brevemente por que te interesa esta oferta y que puedes aportar."
                  value={applicationFormData.coverLetter}
                  onChange={handleApplicationFormChange}
                  required
                />
              </label>

              <div className="offer-application-modal-grid">
                <label className="offer-application-field">
                  <span>Disponibilidad</span>
                  <div className="offer-application-select-wrap">
                    <select
                      name="availability"
                      value={applicationFormData.availability}
                      onChange={handleApplicationFormChange}
                    >
                      <option value="Inmediata">Inmediata</option>
                      <option value="En 2 semanas">En 2 semanas</option>
                      <option value="Seleccionar fecha">Seleccionar fecha</option>
                    </select>
                    <Icon name="expand_more" className="offer-application-select-icon" />
                  </div>
                </label>

                <label className="offer-application-field">
                  <span>Tipo de jornada disponible</span>
                  <div className="offer-application-select-wrap">
                    <select
                      name="scheduleType"
                      value={applicationFormData.scheduleType}
                      onChange={handleApplicationFormChange}
                    >
                      <option value="Full time">Full time</option>
                      <option value="Part time">Part time</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                    <Icon name="expand_more" className="offer-application-select-icon" />
                  </div>
                </label>
              </div>

              {applicationFormData.availability === 'Seleccionar fecha' ? (
                <label className="offer-application-field">
                  <span>Fecha disponible</span>
                  <input
                    type="date"
                    name="availableFromDate"
                    value={applicationFormData.availableFromDate}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </label>
              ) : null}

              {applicationError ? (
                <p className="offer-application-modal-error" role="alert">
                  {applicationError}
                </p>
              ) : null}

              <div className="offer-application-modal-actions">
                <button
                  type="button"
                  className="offer-application-secondary-button"
                  onClick={closeApplicationModal}
                  disabled={isApplying}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="offer-application-primary-button"
                  disabled={isApplying || !currentCvUrl}
                >
                  {isApplying ? 'Enviando...' : 'Enviar postulacion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
