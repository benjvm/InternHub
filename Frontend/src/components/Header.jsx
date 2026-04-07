const navLinks = [
  { label: 'Pr\u00E1cticas', href: '#practicas' },
  { label: 'Empresas', href: '#empresas' },
  { label: 'Consejos', href: '#consejos' },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <div className="site-brand-area">
          <a href="#" className="site-brand">
            <span className="brand-mark">
              <Icon name="rocket_launch" className="brand-mark-icon" />
            </span>
            <span className="brand-text">InternshipPortal</span>
          </a>

          <nav className="site-nav" aria-label="Principal">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="site-header-actions">
          <button type="button" className="ghost-primary-button header-desktop-only">
            Para Empresas
          </button>
          <button type="button" className="secondary-button">
            {'Iniciar Sesi\u00F3n'}
          </button>
        </div>
      </div>
    </header>
  )
}
