import { useState } from 'react'
import logo from '../assets/images/logo_title.png'
import { logoutUser } from '../services/authService'
import { useUser } from '../services/userService'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'

const navLinks = [
  { label: 'Inicio', to: ROUTES.home },
  { label: 'Prácticas', to: ROUTES.internships },
]

export default function Header() {
  const { currentUser } = useUser()
  const { navigate } = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isCompany = Number(currentUser?.rol) === 2
  const isStudent = Number(currentUser?.rol) === 1
  const isTeacher = Number(currentUser?.rol) === 3

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
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
          <Link to={ROUTES.home} className="site-brand">
            <span className="brand-mark">
              <img src={logo} alt="InternHub" className="brand-logo" />
            </span>
          </Link>

          <nav className="site-nav" aria-label="Principal">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
            {isStudent ? <Link to={ROUTES.studentApplications}>Panel estudiante</Link> : null}
            {isCompany ? <Link to={ROUTES.companyCandidates}>Candidatos</Link> : null}
            {isCompany ? <Link to={ROUTES.companyProfile}>Perfil empresa</Link> : null}
            {isCompany ? <Link to={ROUTES.postOffer}>Publicar oferta</Link> : null}
            {isStudent ? <Link to={ROUTES.studentProfile}>Mi perfil</Link> : null}
            {isTeacher ? <Link to={ROUTES.teacherTracking}>Seguimiento</Link> : null}
            {isTeacher ? <Link to={ROUTES.teacherSettings}>Configuracion</Link> : null}
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
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
