import { useEffect, useState } from 'react'
import '../assets/styles/offer.css'
import { getMockOfferById } from '../data/mockOffers'
import { ROUTES } from '../routes/paths'
import { Link, useRouteParams } from '../routes/router'
import { getOfferById } from '../services/offerService'
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

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function JobDetails() {
  const { offerId } = useRouteParams()
  const [offer, setOffer] = useState(() => getMockOfferById(offerId))
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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

      <div className="card cta">
        <div>
          <p className="cta-title">Ready to take the next step?</p>
          <p className="cta-sub">Review the details and continue your journey in the app.</p>
        </div>
        <div className="cta-actions">
          <Link to={ROUTES.login} className="btn primary">
            Apply Now
          </Link>
          <Link to={ROUTES.internships} className="icon-btn" aria-label="Save offer">
            <Icon name="bookmark" />
          </Link>
          <button type="button" className="icon-btn" aria-label="Share offer">
            <Icon name="share" />
          </button>
        </div>
      </div>

      {errorMessage ? <p>{errorMessage}</p> : null}

      <section>
        <h2>About the role</h2>
        <p>{offer.summary || offer.description}</p>
      </section>

      <section>
        <h2>Responsibilities</h2>
        <ul>
          <li>Work closely with the hiring team on day-to-day internship projects.</li>
          <li>Collaborate with mentors and receive feedback as you build experience.</li>
          <li>Contribute ideas, execution, and documentation inside the platform flow.</li>
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
            <span>Coordinates not available for this offer.</span>
          )}
        </div>
      </section>
    </div>
  )
}
