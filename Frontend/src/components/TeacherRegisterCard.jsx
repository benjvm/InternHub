import { useState } from 'react'
import logo from '../assets/images/logo_title-removebg.png'
import teacherRegisterImage from '../assets/images/professor-register.png'
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
      navigate(ROUTES.teacherTracking, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="role-register-shell teacher-register-shell">
      <div className="role-register-layout">
        <article className="role-register-panel">
          <header className="role-register-header">
            <div className="role-register-brand">
              <img src={logo} alt="InternHub" className="role-register-brand-logo" />
            </div>
            <p className="role-register-kicker">Acceso para profesores</p>
            <h1>Regístrate como profesor</h1>
            <p className="role-register-description">
              Únete a la red de mentores de InternHub y acompaña el desarrollo de nuevos perfiles.
            </p>
          </header>

          <form className="role-register-form" onSubmit={handleSubmit}>
            <div className="role-register-field">
              <label htmlFor="nombreCompleto">Nombre completo</label>
              <div className="role-register-input-wrap">
                <Icon name="person" className="role-register-input-icon" />
                <input
                  id="nombreCompleto"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.nombreCompleto}
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
                  placeholder="profesor@ejemplo.com"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="role-register-field">
              <label htmlFor="telefono">Teléfono</label>
              <div className="role-register-input-wrap">
                <Icon name="call" className="role-register-input-icon" />
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
              <span>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de profesor'}</span>
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
          <img src={teacherRegisterImage} alt="" className="role-register-visual-image" />
          <div className="role-register-visual-scrim" />
          <div className="role-register-visual-copy">
            <span className="role-register-visual-pill">Perfil profesor</span>
            <strong>Empieza hoy y lleva un seguimiento continuo del éxito de tus alumnos.</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
