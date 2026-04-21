import { ROUTES } from '../routes/paths'
import { Link } from '../routes/router'

const footerColumns = [
  {
    title: 'Candidatos',
    links: [
      { label: 'Buscar practicas', to: ROUTES.internships },
      { label: 'Crear cuenta', to: ROUTES.register },
      { label: 'Iniciar sesion', to: ROUTES.login },
    ],
  },
  {
    title: 'Empresas',
    links: [
      { label: 'Perfil empresa', to: ROUTES.companyProfile },
      { label: 'Publicar oferta', to: ROUTES.postOffer },
      { label: 'Registro empresa', to: ROUTES.registerCompany },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Perfil estudiante', to: ROUTES.studentProfile },
      { label: 'Perfil profesor', to: ROUTES.teacherProfile },
      { label: 'Practicas', to: ROUTES.internships },
      { label: 'Home', to: ROUTES.home },
    ],
  },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <Link to={ROUTES.home} className="site-brand footer-brand">
              <span className="brand-mark compact">
                <Icon name="rocket_launch" className="brand-mark-icon compact" />
              </span>
              <span className="brand-text footer-brand-text">InternHub</span>
            </Link>

            <p>
              Connecting students, teachers, and companies through a single internship
              experience.
            </p>

            <div className="footer-socials">
              <Link to={ROUTES.home} aria-label="Home">
                <Icon name="home" />
              </Link>
              <Link to={ROUTES.internships} aria-label="Internships">
                <Icon name="work" />
              </Link>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© 2026 InternHub. All rights reserved.</p>
          <div>
            <span>Spanish (ES)</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
