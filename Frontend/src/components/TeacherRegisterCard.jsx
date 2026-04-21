import { useState } from 'react'
import '../assets/styles/teacherRegister.css'
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

export default function TeacherRegisterCard() {
  const { refreshUserProfile } = useUser()
  const { navigate } = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correo: '',
    telefono: '',
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
        rol: 3,
        ...formData,
      })

      await refreshUserProfile(registeredUser.uid)
      navigate(ROUTES.teacherProfile, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="teacher-register-shell">
      <div className="teacher-register-layout">
        <header className="teacher-register-header">
          <h1>Registrate como profesor</h1>
        </header>

        <article className="teacher-register-card">
          <div className="teacher-register-copy">
            <h2>Registro de profesor</h2>
            <p>Unete a la red de mentores de InternHub</p>
          </div>

          <form className="teacher-register-form" onSubmit={handleSubmit}>
            <div className="teacher-register-field">
              <label htmlFor="nombreCompleto">Nombre completo</label>
              <div className="teacher-register-input-wrap">
                <Icon name="person" className="teacher-register-input-icon" />
                <input
                  id="nombreCompleto"
                  type="text"
                  placeholder="Ej. Juan Perez"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="correo">Correo electronico</label>
              <div className="teacher-register-input-wrap">
                <Icon name="mail" className="teacher-register-input-icon" />
                <input
                  id="correo"
                  type="email"
                  placeholder="profesor@ejemplo.com"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="telefono">Telefono</label>
              <div className="teacher-register-input-wrap">
                <Icon name="call" className="teacher-register-input-icon" />
                <input
                  id="telefono"
                  type="tel"
                  placeholder="+34 600 123 456"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="password">Contrasena</label>
              <div className="teacher-register-input-wrap">
                <Icon name="lock" className="teacher-register-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="teacher-register-visibility-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
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

            <button type="submit" className="teacher-register-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de profesor'}</span>
              <Icon name="arrow_forward" className="teacher-register-submit-icon" />
            </button>
          </form>

          <footer className="teacher-register-footer">
            <p>
              Ya tienes cuenta?
              <Link to={ROUTES.login}>Inicia sesion</Link>
            </p>
          </footer>
        </article>
      </div>
    </section>
  )
}
