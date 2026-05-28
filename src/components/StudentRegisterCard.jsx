import { useState } from 'react'
import logo from '../assets/images/logo_title-removebg.png'
import studentRegisterImage from '../assets/images/student-register.png'
import '../assets/styles/studentRegister.css'
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

export default function StudentRegisterCard() {
  const { refreshUserProfile } = useUser()
  const { navigate } = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    universidad: '',
    carrera: '',
    correo: '',
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
        rol: 1,
        ...formData,
      })

      await refreshUserProfile(registeredUser.uid)
      navigate(ROUTES.studentProfile, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="role-register-shell student-register-shell">
      <div className="role-register-layout">
        <article className="role-register-panel">
          <header className="role-register-header">
            <div className="role-register-brand">
              <img src={logo} alt="InternHub" className="role-register-brand-logo" />
            </div>
            <p className="role-register-kicker">Acceso para estudiantes</p>
            <h1>Regístrate como estudiante</h1>
          </header>

          <form className="role-register-form" onSubmit={handleSubmit}>
            <div className="role-register-grid">
              <div className="role-register-field">
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej. Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="role-register-field">
                <label htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Ej. Pérez"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="role-register-field">
              <label htmlFor="universidad">Universidad</label>
              <div className="role-register-input-wrap">
                <Icon name="account_balance" className="role-register-input-icon" />
                <input
                  id="universidad"
                  type="text"
                  placeholder="Nombre de tu institución"
                  value={formData.universidad}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="role-register-field">
              <label htmlFor="carrera">Carrera</label>
              <div className="role-register-input-wrap">
                <Icon name="history_edu" className="role-register-input-icon" />
                <input
                  id="carrera"
                  type="text"
                  placeholder="Ej. Ingeniería de Sistemas"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="role-register-field">
              <label htmlFor="correo">Correo electrónico</label>
              <div className="role-register-input-wrap">
                <Icon name="mail" className="role-register-input-icon" />
                <input
                  id="correo"
                  type="email"
                  placeholder="estudiante@ejemplo.com"
                  value={formData.correo}
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
              <span>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de estudiante'}</span>
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
          <img src={studentRegisterImage} alt="" className="role-register-visual-image" />
          <div className="role-register-visual-scrim" />
          <div className="role-register-visual-copy">
            <span className="role-register-visual-pill">Perfil estudiante</span>
            <strong>
              Empieza tu camino profesional y descubre las mejores oportunidades para ti.
            </strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
