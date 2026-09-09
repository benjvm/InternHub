import { useState } from 'react'
import logo from '../assets/images/logo_no_bg.png'
import '../assets/styles/login.css'
import { loginUser } from '../services/authService'
import { useUser } from '../services/userService'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'

const footerLinks = [
  { label: 'Inicio', to: ROUTES.home },
  { label: 'Prácticas', to: ROUTES.internships },
  { label: 'Crear cuenta', to: ROUTES.register },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function LoginCard() {
  const { refreshUserProfile } = useUser()
  const { navigate } = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const authUser = await loginUser(formData)
      const profile = await refreshUserProfile(authUser.uid)
      navigate(getDefaultRouteForRole(profile?.rol), { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login-shell">
      <main className="login-main">
        <div className="login-panel">
          <article className="login-card">
            <div className="login-card-body">
              <header className="login-header">
                <div className="login-brand-mark">
                  <img src={logo} alt="InternHub Logo" className="login-brand-image" />
                </div>
                <h1>Bienvenido de nuevo</h1>
                <p>Introduce tus credenciales para acceder a tu panel</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <div className="login-input-wrap">
                    <Icon name="mail" className="login-input-icon" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="login-field-group">
                  <div className="login-field-topline">
                    <label htmlFor="password">Contraseña</label>
                    <Link to={ROUTES.register}>Crear cuenta</Link>
                  </div>

                  <div className="login-input-wrap">
                    <Icon name="lock" className="login-input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tu contraseña"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="login-visibility-button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={showPassword}
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>
                    {errorMessage}
                  </p>
                ) : null}

                <button type="submit" className="login-submit-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>

            <footer className="login-card-footer">
              <p>
                {'¿No tienes una cuenta?'}
                <Link to={ROUTES.register}>Únete a InternHub</Link>
              </p>
            </footer>
          </article>

          <nav className="login-footer-links" aria-label="Enlaces de soporte">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>

      <div className="login-bottom-bar" aria-hidden="true" />
    </section>
  )
}
