import { useState } from 'react'
import logo from '../assets/images/logo_no_bg.png'
import '../assets/styles/login.css'
import { loginUser } from '../services/authService'
import { useUser } from '../services/userService'
import { getDefaultRouteForRole, ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'

const footerLinks = [
  { label: 'Home', to: ROUTES.home },
  { label: 'Practicas', to: ROUTES.internships },
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
      const firebaseUser = await loginUser(formData)
      const profile = await refreshUserProfile(firebaseUser.uid)
      navigate(getDefaultRouteForRole(profile?.rol), { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo iniciar sesion.')
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
                <h1>Welcome back</h1>
                <p>Enter your credentials to access your dashboard</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field-group">
                  <label htmlFor="email">Email Address</label>
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
                    <label htmlFor="password">Password</label>
                    <Link to={ROUTES.register}>Create account</Link>
                  </div>

                  <div className="login-input-wrap">
                    <Icon name="lock" className="login-input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="login-visibility-button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>

            <footer className="login-card-footer">
              <p>
                {"Don't have an account?"}
                <Link to={ROUTES.register}>Join InternHub</Link>
              </p>
            </footer>
          </article>

          <nav className="login-footer-links" aria-label="Support links">
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
