import Header from '../components/Header'
import Footer from '../components/Footer'

const quickFilters = [
  { icon: 'home_work', label: 'Remoto' },
  { icon: 'schedule', label: 'Tiempo parcial' },
  { icon: 'verified', label: 'Empresas TOP' },
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

const featuredInternships = [
  {
    title: 'Product Designer Intern',
    company: 'Innovate Tech S.A.',
    location: 'Madrid, España (Hibrido)',
    salary: '800€ - 1.000€ / mes',
    publishedAt: 'Publicado hace 2 días',
    badge: 'Nuevo',
    badgeVariant: 'success',
    logo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHUhrgALnEXckBJDJKGKU-cMywlUgSiAPParSG8sB7MeK2SIVsXun304ZrJxQDyt00Dd_zYZM-8ZOtnf-MG65_0mUhAdPHZGOgzVL2kbeYBTS5u4kU0xnLAFWtqTgvSc4Kjc-WpdvdZdj6nhYboLFkZXfhOysa5zk4-giNTmfhIle800ZcdwdlA9S7wEbhTJ89n4bzGjCZ2A3hK478pEAUi65qCzKbb5QOV1AbwHNEkrN-dw4VfoOSgPuwfmU8aBoGHGUd8e6YKKw',
  },
  {
    title: 'Junior Frontend Developer',
    company: 'FinanzGlobal Corp',
    location: 'Barcelona, España (Remoto)',
    salary: '1.200€ / mes',
    publishedAt: 'Publicado hace 5 días',
    logo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAPn2AzmqeBtiSGhJrig8hfSJw62QKEZpa75ilsrm2BU8_RI7pAWJbX4FmIvcWaC773X6CG-vH8S9JHi9VVNyRbfDBj8wDBWcuUjX-dRd2whstmDKxBKkL1kf2xrRzsAN_1-riArbiVO5pJM-HGAc6EE0k7Kl_tYB-W9q22A_arDk3QdeIe6-cJpJWYyYHvNhkRaGDR1TS0hNM7KR-X66S4JEyOHHdj-rXnaIBa1Ox4BpEV8qQdoNl3_X3dzA_xXGbR18z5JjeV5s',
  },
  {
    title: 'Marketing Assistant',
    company: 'Creative Minds Agency',
    location: 'Valencia, España',
    salary: '600€ / mes (Media jornada)',
    publishedAt: 'Publicado ayer',
    badge: 'Destacada',
    badgeVariant: 'primary',
    logo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDO-c7NkkdkHsxbiIsJo4qPWEB03Xkge_uTp4v_L2DFW21a7CFq8-n_H9u8JvuYBZ-Vetamjf8ERNZ7O0xGbOSsIZHIJSHAtuThcD7Xi20q_Q8DVFY8vhsIcWufiycjJWL6XQQ9CWD4c0ZbnAqAJCK2JdUklCbOFNLqERc0np8PPphXgiXBkmgH5F4LqJBVHEdhM_4Cjk3Y-PMUomqSax0r_BH9KQEe83ZJJ_EyOgIXLizIjPinT1JYcPGAMQFF9KUUsU6ydrUGwyE',
  },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function Home() {
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
              {'La plataforma líder para estudiantes y recién graduados. Conectamos '}
              {'talento joven con las mejores empresas.'}
            </p>

            <div className="search-card">
              <div className="search-grid">
                <label className="search-field">
                  <Icon name="search" className="search-icon" />
                  <input type="text" placeholder="Puesto, empresa o palabra clave" />
                </label>

                <label className="search-field">
                  <Icon name="location_on" className="search-icon" />
                  <input type="text" placeholder={'Ciudad o código postal'} />
                </label>

                <button type="button" className="primary-button search-button">
                  Buscar
                </button>
              </div>
            </div>

            <div className="quick-filters">
              <span className="quick-filters-label">{'Filtros rápidos:'}</span>
              {quickFilters.map((filter) => (
                <button key={filter.label} type="button" className="filter-pill">
                  <Icon name={filter.icon} className="filter-pill-icon" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <h2>{'Explora por categoría'}</h2>
                <p>{'Descubre oportunidades en el sector que más te apasione'}</p>
              </div>
              <a href="#categorias">{'Ver todas las categorías'}</a>
            </div>

            <div className="category-grid" id="categorias">
              {categories.map((category) => (
                <article key={category.title} className="category-card">
                  <div className="category-icon-wrap">
                    <Icon name={category.icon} className="category-icon" />
                  </div>
                  <h3>{category.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="featured-section">
          <div className="container">
            <h2 className="featured-title">{'Prácticas destacadas'}</h2>

            <div className="internship-grid">
              {featuredInternships.map((internship) => (
                <article key={internship.title} className="internship-card">
                  <div className="internship-card-top">
                    <div className="internship-logo-wrap">
                      <img src={internship.logo} alt={`Logo de ${internship.company}`} />
                    </div>
                    {internship.badge ? (
                      <span className={`internship-badge ${internship.badgeVariant || ''}`.trim()}>
                        {internship.badge}
                      </span>
                    ) : null}
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
                    <span>{internship.publishedAt}</span>
                    <a href="#detalle">
                      {'Ver más'}
                      <Icon name="arrow_forward" className="meta-icon small" />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="featured-cta">
              <button type="button" className="dark-button">
                Ver todas las ofertas
              </button>
            </div>
          </div>
        </section>

        <section className="company-cta-section">
          <div className="container">
            <div className="company-cta-card">
              <div className="company-cta-copy">
                <h2>{'¿Buscas el mejor talento joven?'}</h2>
                <p>
                  {'Publica tu oferta de prácticas hoy y llega a miles de estudiantes y'}
                  {' recién graduados cualificados.'}
                </p>
              </div>

              <div className="company-cta-actions">
                <button type="button" className="primary-button">
                  <Icon name="add_circle" className="button-icon" />
                  Publicar una oferta
                </button>
                <button type="button" className="secondary-button">
                  {'Más información'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
