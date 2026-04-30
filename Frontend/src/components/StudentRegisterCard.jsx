import { useState } from 'react'
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
    <section className="student-register-shell">
      <div className="student-register-layout">
        <header className="student-register-brand-block">
          <h1>Regístrate como estudiante</h1>
          <p>Tu portal hacia el mundo profesional.</p>
        </header>

        <article className="student-register-card">
          <div className="student-register-copy">
            <h2>Crea tu perfil de estudiante</h2>
            <p>Completa tus datos para encontrar tu próxima pasantía.</p>
          </div>

          <form className="student-register-form" onSubmit={handleSubmit}>
            <div className="student-register-grid">
              <div className="student-register-field">
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

              <div className="student-register-field">
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

            <div className="student-register-field">
              <label htmlFor="universidad">Universidad</label>
              <div className="student-register-input-wrap">
                <Icon name="account_balance" className="student-register-input-icon" />
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

            <div className="student-register-field">
              <label htmlFor="carrera">Carrera</label>
              <div className="student-register-input-wrap">
                <Icon name="history_edu" className="student-register-input-icon" />
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

            <div className="student-register-field">
              <label htmlFor="correo">Correo electrónico</label>
              <div className="student-register-input-wrap">
                <Icon name="mail" className="student-register-input-icon" />
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

            <div className="student-register-field">
              <label htmlFor="password">Contraseña</label>
              <div className="student-register-input-wrap">
                <Icon name="lock" className="student-register-input-icon" />
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
                  className="student-register-visibility-button"
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

            <button type="submit" className="student-register-submit" disabled={isSubmitting}>
              <span>
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de estudiante'}
              </span>
              <Icon name="arrow_forward" className="student-register-submit-icon" />
            </button>
          </form>

          <footer className="student-register-footer">
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
