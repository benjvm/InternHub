import { useState } from 'react'
import '../assets/styles/companyRegister.css'

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function CompanyRegisterCard() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="company-register-shell">
      <div className="company-register-layout">
        <header className="company-register-header">
          <h1>Registrate como compañía</h1>
          <p>Empieza a contratar el mejor talento joven.</p>
        </header>

        <article className="company-register-card">
          <form className="company-register-form">
            <div className="company-register-field">
              <label htmlFor="company-name">Nombre de la empresa</label>
              <input
                id="company-name"
                name="company_name"
                type="text"
                placeholder="Ej: InternHub S.L."
              />
            </div>

            <div className="company-register-field">
              <label htmlFor="company-email">Email corporativo</label>
              <input
                id="company-email"
                name="email"
                type="email"
                placeholder="tu@empresa.com"
              />
            </div>

            <div className="company-register-field">
              <label htmlFor="company-password">Contraseña</label>
              <div className="company-register-password-wrap">
                <input
                  id="company-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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

            <div className="company-register-submit-row">
              <button type="submit" className="company-register-submit">
                Crear cuenta de empresa
              </button>
            </div>
          </form>

          <footer className="company-register-footer">
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
