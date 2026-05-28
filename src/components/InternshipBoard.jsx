import { useEffect, useMemo, useState } from 'react'
import '../assets/styles/internshipBoard.css'
import { mockOffers } from '../data/mockOffers'
import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import { getOffers } from '../services/offerService'
import { readOfferSearch, saveOfferSearch } from '../services/offerSearchStorage'

const filters = {
  modalities: [
    { value: 'all', label: 'Todas las modalidades' },
    { value: 'remote', label: 'Remoto' },
    { value: 'onsite', label: 'Presencial' },
    { value: 'hybrid', label: 'Híbrido' },
  ],
  categories: [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'engineering', label: 'Ingeniería' },
    { value: 'design', label: 'Diseño' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Producto' },
  ],
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
    case 'hibrido':
    case 'híbrido':
      return 'hybrid'
    default:
      return value || ''
  }
}

function normalizeCategory(category) {
  const value = category?.trim().toLowerCase()

  switch (value) {
    case 'engineering':
    case 'ingenieria':
    case 'ingeniería':
      return 'engineering'
    case 'design':
    case 'diseno':
    case 'diseño':
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

function normalizeText(value) {
  return (
    value
      ?.toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') ?? ''
  )
}

function extractOfferLocation(offer) {
  if (offer?.ubicacion?.ciudad || offer?.ubicacion?.pais) {
    return [offer.ubicacion.ciudad, offer.ubicacion.pais].filter(Boolean).join(', ')
  }

  return offer.location || ''
}

function extractOfferCity(offer) {
  if (offer?.ubicacion?.ciudad) {
    return offer.ubicacion.ciudad
  }

  return offer.location?.split(',')[0]?.trim() ?? ''
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
        <span className="internship-board-tag">{translateCategory(internship.category)}</span>
      </div>

      <h3>{internship.title}</h3>
      <p>{internship.description}</p>

      <div className="internship-board-card-footer">
        <div className="internship-board-meta">
          <div>
            <Icon
              name={normalizeModality(internship.modality) === 'remote' ? 'public' : 'location_on'}
            />
            <span>{extractOfferLocation(internship)}</span>
          </div>
          <div>
            <Icon name="payments" />
            <span>{internship.salary + "€ / mes"}</span>
          </div>
        </div>

        <div className="internship-board-action-row">
          <span className="internship-board-modality">{translateModality(internship.modality)}</span>
          <Link
            to={ROUTES.internshipDetail(internship.id)}
            className="internship-board-link-button"
          >
            Ver detalles
            <Icon name="arrow_forward" className="internship-board-link-icon" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function InternshipBoard() {
  const initialSearch = readOfferSearch()
  const [modalityFilter, setModalityFilter] = useState(filters.modalities[0].value)
  const [categoryFilter, setCategoryFilter] = useState(filters.categories[0].value)
  const [keywordFilter, setKeywordFilter] = useState(initialSearch.term)
  const [cityFilter, setCityFilter] = useState(initialSearch.city)
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

  useEffect(() => {
    saveOfferSearch({ term: keywordFilter, city: cityFilter })
  }, [keywordFilter, cityFilter])

  const mergedOffers = useMemo(() => {
    const nextOffers = [...remoteOffers]

    mockOffers.forEach((offer) => {
      if (!nextOffers.some((remoteOffer) => remoteOffer.id === offer.id)) {
        nextOffers.push(offer)
      }
    })

    return nextOffers
  }, [remoteOffers])

  const filteredOffers = mergedOffers.filter((offer) => {
    const matchesModality =
      modalityFilter === 'all' || normalizeModality(offer.modality) === modalityFilter
    const matchesCategory =
      categoryFilter === 'all' || normalizeCategory(offer.category) === categoryFilter
    const normalizedKeyword = normalizeText(keywordFilter)
    const normalizedCity = normalizeText(cityFilter)
    const matchesKeyword =
      !normalizedKeyword ||
      [
        offer.title,
        offer.description,
        offer.category,
        offer.company,
        offer.companyName,
      ].some((value) => normalizeText(value).includes(normalizedKeyword))
    const normalizedOfferLocation = normalizeText(extractOfferLocation(offer))
    const matchesCity =
      !normalizedCity ||
      normalizeText(extractOfferCity(offer)).includes(normalizedCity) ||
      normalizedOfferLocation.includes(normalizedCity)

    return matchesModality && matchesCategory && matchesKeyword && matchesCity
  })

  function handleFilterSubmit(event) {
    event.preventDefault()
    saveOfferSearch({ term: keywordFilter, city: cityFilter })
  }

  return (
    <main className="internship-board-page">
      <section className="container internship-board-hero">
        <div className="internship-board-copy">
          <h1>
            Encuentra tu próxima <span>práctica</span>
          </h1>
          <p>
            Explora oportunidades, abre el detalle de cada oferta y recorre la plataforma
            como en una experiencia real.
          </p>
        </div>

        <form className="internship-board-filters" onSubmit={handleFilterSubmit}>
          <div className="internship-board-filter-grid">
            <label className="internship-board-field" htmlFor="keyword">
              <span>Oferta</span>
              <input
                id="keyword"
                type="text"
                value={keywordFilter}
                onChange={(event) => setKeywordFilter(event.target.value)}
                placeholder="Título, empresa o palabra clave"
              />
            </label>

            <label className="internship-board-field" htmlFor="city">
              <span>Ciudad</span>
              <input
                id="city"
                type="text"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="Madrid, Barcelona..."
              />
            </label>

            <label className="internship-board-field" htmlFor="modality">
              <span>Modalidad</span>
              <select
                id="modality"
                value={modalityFilter}
                onChange={(event) => setModalityFilter(event.target.value)}
              >
                {filters.modalities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="internship-board-field" htmlFor="category">
              <span>Categoría</span>
              <select
                id="category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {filters.categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="internship-board-search-button">
            <Icon name="search" className="internship-board-search-icon" />
            Buscar oportunidades
          </button>
        </form>
      </section>

      <section className="container internship-board-results">
        {errorMessage ? <p>{errorMessage}</p> : null}
        {isLoading ? <p>Cargando oportunidades...</p> : null}

        <div className="internship-board-grid">
          {filteredOffers.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} />
          ))}
        </div>

        {!isLoading && filteredOffers.length === 0 ? (
          <p>No hay oportunidades que coincidan con los filtros seleccionados.</p>
        ) : null}

        <div className="internship-board-more">
          <Link to={ROUTES.home} className="internship-board-outline-button">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
