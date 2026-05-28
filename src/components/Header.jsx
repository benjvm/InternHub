import { useEffect, useState } from 'react'
import logo from '../assets/images/logo_title-removebg.png'
import { logoutUser } from '../services/authService'
import { useUser } from '../services/userService'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'

const navLinks = [
  { label: 'Inicio', to: ROUTES.home },
  { label: 'Pr\u00e1cticas', to: ROUTES.internships },
]

export default function Header() {
  const { currentUser } = useUser()
  const { navigate, pathname } = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isCompany = Number(currentUser?.rol) === 2
  const isStudent = Number(currentUser?.rol) === 1
  const isTeacher = Number(currentUser?.rol) === 3

  const primaryLinks = [
    ...navLinks,
    ...(isStudent ? [{ label: 'Panel estudiante', to: ROUTES.studentApplications }] : []),
    ...(isCompany ? [{ label: 'Candidatos', to: ROUTES.companyCandidates }] : []),
    ...(isCompany ? [{ label: 'Perfil empresa', to: ROUTES.companyProfile }] : []),
    ...(isCompany ? [{ label: 'Publicar oferta', to: ROUTES.postOffer }] : []),
    ...(isTeacher ? [{ label: 'Seguimiento', to: ROUTES.teacherTracking }] : []),
    ...(isTeacher ? [{ label: 'Perfil', to: ROUTES.teacherSettings }] : []),
  ]

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    function handleResize() {
      if (window.innerWidth > 960) {
        setIsMobileMenuOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileMenuOpen])

  function toggleMobileMenu() {
    setIsMobileMenuOpen((currentValue) => !currentValue)
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      closeMobileMenu()
      await logoutUser()
      navigate(ROUTES.home, { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <div className="site-brand-area">
          <Link to={ROUTES.home} className="site-brand" onClick={closeMobileMenu}>
            <span className="brand-mark">
              <img src={logo} alt="InternHub" className="brand-logo" />
            </span>
          </Link>

          <nav className="site-nav" aria-label="Principal">
            {primaryLinks.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="site-header-actions">
          {currentUser ? (
            <>
              <Link
                to={getDefaultRouteForRole(currentUser.rol)}
                className="ghost-primary-button header-desktop-only"
              >
                {isCompany ? 'Panel empresa' : isTeacher ? 'Panel profesor' : 'Mi perfil'}
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.register}
                className="ghost-primary-button header-desktop-only"
              >
                Crear cuenta
              </Link>
              <Link to={ROUTES.login} className="secondary-button">
                {'Iniciar sesión'}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`.trim()}
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-mobile-menu"
          aria-label={
            isMobileMenuOpen
              ? 'Cerrar men\u00fa principal'
              : 'Abrir men\u00fa principal'
          }
          onClick={toggleMobileMenu}
        >
          <span className="mobile-menu-toggle-lines" aria-hidden="true">
            <span className="mobile-menu-line" />
            <span className="mobile-menu-line" />
            <span className="mobile-menu-line" />
          </span>
        </button>
      </div>

      <div
        className={`site-mobile-menu-shell ${isMobileMenuOpen ? 'is-open' : ''}`.trim()}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          className="site-mobile-menu-backdrop"
          aria-label={'Cerrar menú'}
          onClick={closeMobileMenu}
        />

        <div className="container site-mobile-menu-frame">
          <div
            id="site-mobile-menu"
            className="site-mobile-menu"
            role="dialog"
            aria-label={'Menú principal'}
            aria-modal="true"
          >
            <nav className="site-mobile-nav" aria-label={'Principal móvil'}>
              {primaryLinks.map((link) => (
                <Link key={link.label} to={link.to} onClick={closeMobileMenu}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="site-mobile-menu-divider" />

            <div className="site-mobile-actions">
              {currentUser ? (
                <>
                  <Link
                    to={getDefaultRouteForRole(currentUser.rol)}
                    className="ghost-primary-button"
                    onClick={closeMobileMenu}
                  >
                    {isCompany ? 'Panel empresa' : isTeacher ? 'Panel profesor' : 'Mi perfil'}
                  </Link>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.login}
                    className="secondary-button"
                    onClick={closeMobileMenu}
                  >
                    {'Iniciar sesión'}
                  </Link>
                  <Link
                    to={ROUTES.register}
                    className="ghost-primary-button"
                    onClick={closeMobileMenu}
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
