import { useState } from 'react'
import '../assets/styles/studentRegister.css'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function StudentRegisterCard() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="student-register-shell">
      <div className="student-register-layout">
        <header className="student-register-brand-block">
          <h1>Registrate como estudiante</h1>
          <p>Tu portal hacia el mundo profesional.</p>
        </header>

        <article className="student-register-card">
          <div className="student-register-copy">
            <h2>Crea tu perfil de estudiante</h2>
            <p>Completa tus datos para encontrar tu próxima pasantía.</p>
          </div>

          <form className="student-register-form">
            <div className="student-register-grid">
              <div className="student-register-field">
                <label htmlFor="student-name">Nombre</label>
                <input id="student-name" type="text" placeholder="Ej. Juan" />
              </div>

              <div className="student-register-field">
                <label htmlFor="student-lastname">Apellido</label>
                <input id="student-lastname" type="text" placeholder="Ej. Pérez" />
              </div>
            </div>

            <div className="student-register-field">
              <label htmlFor="student-university">Universidad</label>
              <div className="student-register-input-wrap">
                <Icon name="account_balance" className="student-register-input-icon" />
                <input
                  id="student-university"
                  type="text"
                  placeholder="Nombre de tu institución"
                />
              </div>
            </div>

            <div className="student-register-field">
              <label htmlFor="student-major">Carrera</label>
              <div className="student-register-input-wrap">
                <Icon name="history_edu" className="student-register-input-icon" />
                <input
                  id="student-major"
                  type="text"
                  placeholder="Ej. Ingeniería de Sistemas"
                />
              </div>
            </div>

            <div className="student-register-field">
              <label htmlFor="student-email">Correo electrónico</label>
              <div className="student-register-input-wrap">
                <Icon name="mail" className="student-register-input-icon" />
                <input
                  id="student-email"
                  type="email"
                  placeholder="estudiante@ejemplo.com"
                />
              </div>
            </div>

            <div className="student-register-field">
              <label htmlFor="student-password">Contraseña</label>
              <div className="student-register-input-wrap">
                <Icon name="lock" className="student-register-input-icon" />
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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

            <button type="submit" className="student-register-submit">
              <span>Crear cuenta de estudiante</span>
              <Icon name="arrow_forward" className="student-register-submit-icon" />
            </button>
          </form>

          <footer className="student-register-footer">
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
