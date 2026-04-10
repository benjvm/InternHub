const footerColumns = [
  {
    title: 'Candidatos',
    links: ['Buscar Prácticas', 'Crear Alertas', 'Consejos de CV', 'Directorio de Empresas'],
  },
  {
    title: 'Soporte',
    links: ['Centro de Ayuda', 'Contáctanos', 'Acerca de', 'Seguridad'],
  },
  {
    title: 'Legal',
    links: ['Términos y condiciones', 'Política de Privacidad', 'Cookies'],
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
            <a href="#" className="site-brand footer-brand">
              <span className="brand-mark compact">
                <Icon name="rocket_launch" className="brand-mark-icon compact" />
              </span>
              <span className="brand-text footer-brand-text">InternshipPortal</span>
            </a>

            <p>
              Conectando el futuro profesional con las mejores oportunidades laborales
              desde 2024.
            </p>

            <div className="footer-socials">
              <a href="#share" aria-label="Compartir">
                <Icon name="share" />
              </a>
              <a href="#feed" aria-label="RSS">
                <Icon name="rss_feed" />
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#footer-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>{'© 2024 InternshipPortal. Todos los derechos reservados.'}</p>
          <div>
            <span>{'Español (ES)'}</span>
            <span>Accesibilidad</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
