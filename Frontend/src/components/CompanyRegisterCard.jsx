import { useState } from 'react'
import '../assets/styles/companyRegister.css'
import { registerUser } from '../services/authService'
import { useUser } from '../services/userService'
import { ROUTES } from '../routes/paths'
import { Link, useRouter } from '../routes/router'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function CompanyRegisterCard() {
  const { refreshUserProfile } = useUser()
  const { navigate } = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    email: '',
    password: '',
  })

  function handleChange(event) {
    const { id, value } = event.target

    setFormData((current) => ({
      ...current,
      [id]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const registeredUser = await registerUser({
        rol: 2,
        ...formData,
      })

      await refreshUserProfile(registeredUser.uid)
      navigate(ROUTES.postOffer, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="company-register-shell">
      <div className="company-register-layout">
        <header className="company-register-header">
          <h1>Regístrate como empresa</h1>
          <p>Empieza a contratar el mejor talento joven.</p>
        </header>

        <article className="company-register-card">
          <form className="company-register-form" onSubmit={handleSubmit}>
            <div className="company-register-field">
              <label htmlFor="nombreEmpresa">Nombre de la empresa</label>
              <input
                id="nombreEmpresa"
                name="company_name"
                type="text"
                placeholder="Ej: InternHub S.L."
                value={formData.nombreEmpresa}
                onChange={handleChange}
                required
              />
            </div>

            <div className="company-register-field">
              <label htmlFor="email">Email corporativo</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@empresa.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="company-register-field">
              <label htmlFor="password">Contraseña</label>
              <div className="company-register-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="company-register-visibility-button"
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

            <div className="company-register-submit-row">
              <button type="submit" className="company-register-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de empresa'}
              </button>
            </div>
          </form>

          <footer className="company-register-footer">
            <p>
              ¿Ya tienes cuenta?
              <Link to={ROUTES.login}>Inicia sesión</Link>
            </p>
          </footer>
        </article>
      </div>
    </section>
  )
}
