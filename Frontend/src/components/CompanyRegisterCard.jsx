import { useState } from 'react'
import logo from '../assets/images/logo_title-removebg.png'
import companyRegisterImage from '../assets/images/company-register.png'
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
    <section className="role-register-shell company-register-shell">
      <div className="role-register-layout">
        <article className="role-register-panel">
          <header className="role-register-header">
            <div className="role-register-brand">
              <img src={logo} alt="InternHub" className="role-register-brand-logo" />
            </div>
            <p className="role-register-kicker">Acceso para empresas</p>
            <h1>Regístrate como empresa</h1>
            <p className="role-register-description">
              Empieza a contratar talento joven con una pantalla de registro más clara, cuidada y
              profesional.
            </p>
          </header>

          <form className="role-register-form" onSubmit={handleSubmit}>
            <div className="role-register-field">
              <label htmlFor="nombreEmpresa">Nombre de la empresa</label>
              <div className="role-register-input-wrap">
                <Icon name="apartment" className="role-register-input-icon" />
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
            </div>

            <div className="role-register-field">
              <label htmlFor="email">Email corporativo</label>
              <div className="role-register-input-wrap">
                <Icon name="mail" className="role-register-input-icon" />
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
            </div>

            <div className="role-register-field">
              <label htmlFor="password">Contraseña</label>
              <div className="role-register-input-wrap">
                <Icon name="lock" className="role-register-input-icon" />
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
                  className="role-register-visibility-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p role="alert" className="role-register-error">
                {errorMessage}
              </p>
            ) : null}

            <button type="submit" className="role-register-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de empresa'}</span>
              <Icon name="arrow_forward" className="role-register-submit-icon" />
            </button>
          </form>

          <footer className="role-register-footer">
            <p>
              ¿Ya tienes cuenta?
              <Link to={ROUTES.login}>Inicia sesión</Link>
            </p>
          </footer>
        </article>

        <aside className="role-register-visual" aria-hidden="true">
          <img src={companyRegisterImage} alt="" className="role-register-visual-image" />
          <div className="role-register-visual-scrim" />
          <div className="role-register-visual-copy">
            <span className="role-register-visual-pill">Perfil empresa</span>
            <strong>
              Encuentra el talento joven y la frescura que tu equipo necesita para crecer.
            </strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
