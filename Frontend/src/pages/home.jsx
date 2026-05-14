import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { mockOffers } from '../data/mockOffers'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'
import { getOffers } from '../services/offerService'
import { saveOfferSearch } from '../services/offerSearchStorage'
import { useUser } from '../services/userService'

const quickFilters = [
  { icon: 'home_work', label: 'Remoto' },
  { icon: 'schedule', label: 'Tiempo parcial' },
  { icon: 'verified', label: 'Empresas top' },
  { icon: 'payments', label: 'Pagadas' },
]

const categories = [
  { icon: 'campaign', title: 'Marketing' },
  { icon: 'engineering', title: 'Ingeniería' },
  { icon: 'palette', title: 'Diseño' },
  { icon: 'payments', title: 'Ventas' },
  { icon: 'business_center', title: 'Administración' },
  { icon: 'code', title: 'IT & Software' },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
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

function mergeOffers(remoteOffers) {
  const nextOffers = [...remoteOffers]

  mockOffers.forEach((offer) => {
    if (!nextOffers.some((remoteOffer) => remoteOffer.id === offer.id)) {
      nextOffers.push(offer)
    }
  })

  return nextOffers
}

export default function Home() {
  const { currentUser } = useUser()
  const { navigate } = useRouter()
  const [remoteOffers, setRemoteOffers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cityTerm, setCityTerm] = useState('')
  const [isOfferSuggestionsOpen, setIsOfferSuggestionsOpen] = useState(false)
  const [isCitySuggestionsOpen, setIsCitySuggestionsOpen] = useState(false)
  const isCompany = Number(currentUser?.rol) === 2
  const shouldShowCompanyCta = !currentUser || isCompany
  const companyActionTo = currentUser ? ROUTES.postOffer : ROUTES.register
  const secondaryActionTo = currentUser
    ? getDefaultRouteForRole(currentUser.rol)
    : ROUTES.register
  const mergedOffers = useMemo(() => mergeOffers(remoteOffers), [remoteOffers])
  const featuredInternships = mergedOffers.slice(0, 3)

  useEffect(() => {
    let isMounted = true

    async function loadOffers() {
      try {
        const nextOffers = await getOffers()

        if (isMounted) {
          setRemoteOffers(nextOffers.filter((offer) => offer.status !== 'draft'))
        }
      } catch {
        if (isMounted) {
          setRemoteOffers([])
        }
      }
    }

    loadOffers()

    return () => {
      isMounted = false
    }
  }, [])

  const offerSuggestions = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)
    const suggestions = []
    const seenLabels = new Set()

    mergedOffers.forEach((offer) => {
      const label = offer.title?.trim()

      if (!label) {
        return
      }

      const normalizedLabel = normalizeText(label)

      if (seenLabels.has(normalizedLabel)) {
        return
      }

      if (normalizedSearch && !normalizedLabel.includes(normalizedSearch)) {
        return
      }

      seenLabels.add(normalizedLabel)
      suggestions.push({
        label,
        meta: [offer.company || offer.companyName, extractOfferLocation(offer)]
          .filter(Boolean)
          .join(' - '),
      })
    })

    return suggestions.slice(0, 5)
  }, [mergedOffers, searchTerm])

  const citySuggestions = useMemo(() => {
    const normalizedSearch = normalizeText(cityTerm)
    const suggestions = []
    const seenCities = new Set()

    mergedOffers.forEach((offer) => {
      const city = extractOfferCity(offer)
      const normalizedCity = normalizeText(city)

      if (!normalizedCity || seenCities.has(normalizedCity)) {
        return
      }

      if (normalizedSearch && !normalizedCity.includes(normalizedSearch)) {
        return
      }

      seenCities.add(normalizedCity)
      suggestions.push(city)
    })

    return suggestions.slice(0, 5)
  }, [mergedOffers, cityTerm])

  function handleSearch(event) {
    event.preventDefault()
    saveOfferSearch({ term: searchTerm, city: cityTerm })
    navigate(ROUTES.internships)
  }

  function handleSelectOfferSuggestion(value) {
    setSearchTerm(value)
    setIsOfferSuggestionsOpen(false)
  }

  function handleSelectCitySuggestion(value) {
    setCityTerm(value)
    setIsCitySuggestionsOpen(false)
  }

  return (
    <div className="homepage-shell">
      <Header />

      <main>
        <section className="hero-section">
          <div className="container hero-content">
            <h1>
              {'Encuentra las prácticas'}
              <br className="hero-break" /> {'de tus '}<span>{'sueños'}</span>
            </h1>
            <p>
              {'InternHub conecta talento joven con empresas reales, procesos rápidos y '}
              {'oportunidades pensadas para crecer.'}
            </p>

            <form className="search-card" onSubmit={handleSearch}>
              <div className="search-grid">
                <label className="search-field search-field-with-panel">
                  <Icon name="search" className="search-icon" />
                  <input
                    type="text"
                    placeholder="Puesto, empresa o palabra clave"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onFocus={() => setIsOfferSuggestionsOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsOfferSuggestionsOpen(false), 120)
                    }}
                  />

                  {isOfferSuggestionsOpen && offerSuggestions.length ? (
                    <div className="search-suggestion-panel" role="listbox" aria-label="Ofertas sugeridas">
                      {offerSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.label}
                          type="button"
                          className="search-suggestion-item"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            handleSelectOfferSuggestion(suggestion.label)
                          }}
                        >
                          <strong>{suggestion.label}</strong>
                          <span>{suggestion.meta}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>

                <label className="search-field search-field-with-panel">
                  <Icon name="location_on" className="search-icon" />
                  <input
                    type="text"
                    placeholder="Ciudad o código postal"
                    value={cityTerm}
                    onChange={(event) => setCityTerm(event.target.value)}
                    onFocus={() => setIsCitySuggestionsOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsCitySuggestionsOpen(false), 120)
                    }}
                  />

                  {isCitySuggestionsOpen && citySuggestions.length ? (
                    <div className="search-suggestion-panel" role="listbox" aria-label="Ciudades sugeridas">
                      {citySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="search-suggestion-item"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            handleSelectCitySuggestion(suggestion)
                          }}
                        >
                          <strong>{suggestion}</strong>
                          <span>Buscar ofertas en esta ciudad</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>

                <button type="submit" className="primary-button search-button">
                  Buscar
                </button>
              </div>
            </form>

            <div className="quick-filters">
              <span className="quick-filters-label">{'Filtros rápidos:'}</span>
              {quickFilters.map((filter) => (
                <Link key={filter.label} to={ROUTES.internships} className="filter-pill">
                  <Icon name={filter.icon} className="filter-pill-icon" />
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <h2>{'Explora por categoría'}</h2>
                <p>{'Descubre oportunidades en el sector que más te motive'}</p>
              </div>
              <Link to={ROUTES.internships}>{'Ver todas las categorías'}</Link>
            </div>

            <div className="category-grid" id="categorias">
              {categories.map((category) => (
                <Link key={category.title} to={ROUTES.internships} className="category-card">
                  <div className="category-icon-wrap">
                    <Icon name={category.icon} className="category-icon" />
                  </div>
                  <h3>{category.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="featured-section">
          <div className="container">
            <h2 className="featured-title">{'Prácticas destacadas'}</h2>

            <div className="internship-grid">
              {featuredInternships.map((internship) => (
                <article key={internship.id} className="internship-card">
                  <div className="internship-card-top">
                    <div className="internship-logo-wrap">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {internship.icon}
                      </span>
                    </div>
                    <span className="internship-badge success">Nuevo</span>
                  </div>

                  <h3>{internship.title}</h3>
                  <p className="internship-company">{internship.company || internship.companyName}</p>

                  <div className="internship-meta">
                    <div>
                      <Icon name="location_on" className="meta-icon" />
                      <span>{extractOfferLocation(internship)}</span>
                    </div>
                    <div>
                      <Icon name="payments" className="meta-icon" />
                      <span>{internship.salary}</span>
                    </div>
                  </div>

                  <div className="internship-footer">
                    <span>{internship.publishedAtLabel || 'Oferta disponible ahora'}</span>
                    <Link to={ROUTES.internshipDetail(internship.id)}>
                      {'Ver más'}
                      <Icon name="arrow_forward" className="meta-icon small" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="featured-cta">
              <Link to={ROUTES.internships} className="dark-button">
                Ver todas las ofertas
              </Link>
            </div>
          </div>
        </section>

        {shouldShowCompanyCta ? (
          <section className="company-cta-section">
            <div className="container">
              <div className="company-cta-card">
                <div className="company-cta-copy">
                  <h2>{'¿Buscas el mejor talento joven?'}</h2>
                  <p>
                    {'Publica tu oferta hoy y deja que estudiantes, profesores y reclutadores '}
                    {'se muevan por una app conectada de punta a punta.'}
                  </p>
                </div>

                <div className="company-cta-actions">
                  <Link to={companyActionTo} className="primary-button">
                    <Icon name="add_circle" className="button-icon" />
                    Publicar una oferta
                  </Link>
                  <Link to={secondaryActionTo} className="secondary-button">
                    {currentUser ? 'Ir a mi cuenta' : 'Iniciar sesión'}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
