import { useEffect, useState } from 'react'
import '../assets/styles/internshipBoard.css'
import { mockOffers } from '../data/mockOffers'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import { getOffers } from '../services/offerService'

const filters = {
  modalities: ['All Types', 'Remote', 'On-site', 'Hybrid'],
  categories: ['All Categories', 'Engineering', 'Design', 'Marketing', 'Product'],
}

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function InternshipCard({ internship }) {
  return (
    <article className="internship-board-card">
      <div className="internship-board-card-top">
        <div className="internship-board-icon-wrap">
          <Icon name={internship.icon || 'work'} className="internship-board-icon" />
        </div>
        <span className="internship-board-tag">{internship.category}</span>
      </div>

      <h3>{internship.title}</h3>
      <p>{internship.description}</p>

      <div className="internship-board-card-footer">
        <div className="internship-board-meta">
          <div>
            <Icon name={internship.location === 'Remote' ? 'public' : 'location_on'} />
            <span>{internship.location}</span>
          </div>
          <div>
            <Icon name="payments" />
            <span>{internship.salary}</span>
          </div>
        </div>

        <div className="internship-board-action-row">
          <span className="internship-board-modality">{internship.modality}</span>
          <Link
            to={ROUTES.internshipDetail(internship.id)}
            className="internship-board-link-button"
          >
            View Details
            <Icon name="arrow_forward" className="internship-board-link-icon" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function InternshipBoard() {
  const [modalityFilter, setModalityFilter] = useState(filters.modalities[0])
  const [categoryFilter, setCategoryFilter] = useState(filters.categories[0])
  const [remoteOffers, setRemoteOffers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOffers() {
      try {
        setIsLoading(true)
        setErrorMessage('')
        const offers = await getOffers()

        if (isMounted) {
          setRemoteOffers(offers.filter((offer) => offer.status !== 'draft'))
        }
      } catch {
        if (isMounted) {
          setErrorMessage('No se pudieron cargar las ofertas de Firebase. Mostrando ejemplos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOffers()

    return () => {
      isMounted = false
    }
  }, [])

  const mergedOffers = [...remoteOffers]

  mockOffers.forEach((offer) => {
    if (!mergedOffers.some((remoteOffer) => remoteOffer.id === offer.id)) {
      mergedOffers.push(offer)
    }
  })

  const filteredOffers = mergedOffers.filter((offer) => {
    const matchesModality =
      modalityFilter === 'All Types' ||
      offer.modality?.toLowerCase() === modalityFilter.toLowerCase()
    const matchesCategory =
      categoryFilter === 'All Categories' || offer.category === categoryFilter

    return matchesModality && matchesCategory
  })

  return (
    <main className="internship-board-page">
      <section className="container internship-board-hero">
        <div className="internship-board-copy">
          <h1>
            Find your next <span>internship</span>
          </h1>
          <p>
            Browse opportunities, open offer details, and move through the platform just
            like a real production flow.
          </p>
        </div>

        <div className="internship-board-filters">
          <div className="internship-board-filter-grid">
            <label className="internship-board-field" htmlFor="modality">
              <span>Modalidad</span>
              <select
                id="modality"
                value={modalityFilter}
                onChange={(event) => setModalityFilter(event.target.value)}
              >
                {filters.modalities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="internship-board-field" htmlFor="category">
              <span>Categoria</span>
              <select
                id="category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {filters.categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="button" className="internship-board-search-button">
            <Icon name="search" className="internship-board-search-icon" />
            Filter Opportunities
          </button>
        </div>
      </section>

      <section className="container internship-board-results">
        {errorMessage ? <p>{errorMessage}</p> : null}
        {isLoading ? <p>Loading opportunities...</p> : null}

        <div className="internship-board-grid">
          {filteredOffers.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} />
          ))}
        </div>

        {!isLoading && filteredOffers.length === 0 ? (
          <p>No opportunities match the selected filters yet.</p>
        ) : null}

        <div className="internship-board-more">
          <Link to={ROUTES.home} className="internship-board-outline-button">
            Back Home
          </Link>
        </div>
      </section>
    </main>
  )
}
