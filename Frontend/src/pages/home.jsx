import Header from '../components/Header'
import Footer from '../components/Footer'
import { mockOffers } from '../data/mockOffers'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link } from '../routes/router'
import { useUser } from '../services/userService'

const quickFilters = [
  { icon: 'home_work', label: 'Remoto' },
  { icon: 'schedule', label: 'Tiempo parcial' },
  { icon: 'verified', label: 'Empresas top' },
  { icon: 'payments', label: 'Pagadas' },
]

const categories = [
  { icon: 'campaign', title: 'Marketing' },
  { icon: 'engineering', title: 'Ingenieria' },
  { icon: 'palette', title: 'Diseno' },
  { icon: 'payments', title: 'Ventas' },
  { icon: 'business_center', title: 'Administracion' },
  { icon: 'code', title: 'IT & Software' },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function Home() {
  const { currentUser } = useUser()
  const featuredInternships = mockOffers.slice(0, 3)
  const isCompany = Number(currentUser?.rol) === 2
  const shouldShowCompanyCta = !currentUser || isCompany
  const companyActionTo = currentUser ? ROUTES.postOffer : ROUTES.register
  const secondaryActionTo = currentUser
    ? getDefaultRouteForRole(currentUser.rol)
    : ROUTES.register

  return (
    <div className="homepage-shell">
      <Header />

      <main>
        <section className="hero-section">
          <div className="container hero-content">
            <h1>
              {'Encuentra las practicas'}
              <br className="hero-break" /> {'de tus '}<span>{'sueños'}</span>
            </h1>
            <p>
              {'InternHub conecta talento joven con empresas reales, procesos rapidos y '}
              {'oportunidades pensadas para crecer.'}
            </p>

            <div className="search-card">
              <div className="search-grid">
                <label className="search-field">
                  <Icon name="search" className="search-icon" />
                  <input type="text" placeholder="Puesto, empresa o palabra clave" readOnly />
                </label>

                <label className="search-field">
                  <Icon name="location_on" className="search-icon" />
                  <input type="text" placeholder="Ciudad o codigo postal" readOnly />
                </label>

                <Link to={ROUTES.internships} className="primary-button search-button">
                  Buscar
                </Link>
              </div>
            </div>

            <div className="quick-filters">
              <span className="quick-filters-label">{'Filtros rapidos:'}</span>
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
                <h2>{'Explora por categoria'}</h2>
                <p>{'Descubre oportunidades en el sector que mas te motive'}</p>
              </div>
              <Link to={ROUTES.internships}>{'Ver todas las categorias'}</Link>
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
            <h2 className="featured-title">{'Practicas destacadas'}</h2>

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
                  <p className="internship-company">{internship.company}</p>

                  <div className="internship-meta">
                    <div>
                      <Icon name="location_on" className="meta-icon" />
                      <span>{internship.location}</span>
                    </div>
                    <div>
                      <Icon name="payments" className="meta-icon" />
                      <span>{internship.salary}</span>
                    </div>
                  </div>

                  <div className="internship-footer">
                    <span>{internship.publishedAtLabel}</span>
                    <Link to={ROUTES.internshipDetail(internship.id)}>
                      {'Ver mas'}
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
                  <h2>{'Buscas el mejor talento joven?'}</h2>
                  <p>
                    {'Publica tu oferta hoy y deja que estudiantes, profesores y recruiters '}
                    {'se muevan por una app conectada de punta a punta.'}
                  </p>
                </div>

                <div className="company-cta-actions">
                  <Link to={companyActionTo} className="primary-button">
                    <Icon name="add_circle" className="button-icon" />
                    Publicar una oferta
                  </Link>
                  <Link to={secondaryActionTo} className="secondary-button">
                    {currentUser ? 'Ir a mi cuenta' : 'Iniciar sesion'}
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
