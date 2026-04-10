import { useState } from 'react'
import '../assets/styles/teacherRegister.css'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function TeacherRegisterCard() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="teacher-register-shell">
      <div className="teacher-register-layout">
        <header className="teacher-register-header">
          <h1>Registrate como profesor</h1>
        </header>

        <article className="teacher-register-card">
          <div className="teacher-register-copy">
            <h2>Registro de Profesor</h2>
            <p>Únete a la red de mentores de InternHub</p>
          </div>

          <form className="teacher-register-form">
            <div className="teacher-register-field">
              <label htmlFor="teacher-name">Nombre completo</label>
              <div className="teacher-register-input-wrap">
                <Icon name="person" className="teacher-register-input-icon" />
                <input id="teacher-name" type="text" placeholder="Ej. Juan Pérez" />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="teacher-email">Correo electrónico</label>
              <div className="teacher-register-input-wrap">
                <Icon name="mail" className="teacher-register-input-icon" />
                <input
                  id="teacher-email"
                  type="email"
                  placeholder="profesor@ejemplo.com"
                />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="teacher-phone">Teléfono</label>
              <div className="teacher-register-input-wrap">
                <Icon name="call" className="teacher-register-input-icon" />
                <input id="teacher-phone" type="tel" placeholder="+51 987 654 321" />
              </div>
            </div>

            <div className="teacher-register-field">
              <label htmlFor="teacher-password">Contraseña</label>
              <div className="teacher-register-input-wrap">
                <Icon name="lock" className="teacher-register-input-icon" />
                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className="teacher-register-visibility-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </div>

            <button type="submit" className="teacher-register-submit">
              <span>Crear cuenta de profesor</span>
              <Icon name="arrow_forward" className="teacher-register-submit-icon" />
            </button>
          </form>

          <footer className="teacher-register-footer">
            <p>
              ¿Ya tienes cuenta?
              <a href="#login">Inicia sesión</a>
            </p>
          </footer>
        </article>
      </div>
    </section>
  )
}
