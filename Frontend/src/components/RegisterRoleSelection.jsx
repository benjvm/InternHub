import { useState } from 'react'
import logo from '../assets/images/logo_no_bg.png'
import '../assets/register.css'

const roles = [
  {
    id: 'student',
    icon: 'school',
    title: 'Estudiante',
    description:
      'Encuentra prácticas profesionales, accede a formación exclusiva y despega tu carrera.',
  },
  {
    id: 'company',
    icon: 'business',
    title: 'Empresa',
    description:
      'Publica vacantes, gestiona procesos de selección y encuentra el talento que necesitas.',
  },
  {
    id: 'teacher',
    icon: 'co_present',
    title: 'Profesor',
    description:
      'Supervisa el progreso de tus alumnos, gestiona convenios y orienta su futuro profesional.',
  },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function RegisterRoleSelection({
  defaultRole = 'company',
  onContinue,
  onLoginClick,
}) {
  const [selectedRole, setSelectedRole] = useState(defaultRole)

  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[1]

  return (
    <section className="register-shell">
      <div className="register-glow register-glow-bottom" aria-hidden="true" />
      <div className="register-glow register-glow-top" aria-hidden="true" />
      <div className="register-bottom-line" aria-hidden="true" />

      <div className="register-layout">
        <div className="register-heading">
          <div className="register-brand">
            <img src={logo} alt="InternHub" className="register-brand-logo" />
          </div>

          <div className="register-copy">
            <h2>{'únete a InternHub'}</h2>
            <p>Selecciona tu perfil para comenzar tu experiencia</p>
          </div>
        </div>

        <div className="register-role-grid">
          {roles.map((role) => {
            const isActive = role.id === selectedRole

            return (
              <button
                key={role.id}
                type="button"
                className={`register-role-card ${isActive ? 'is-selected' : ''}`.trim()}
                onClick={() => setSelectedRole(role.id)}
                aria-pressed={isActive}
              >
                <div className="register-role-icon">
                  <Icon name={role.icon} className="register-role-icon-symbol" />
                </div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
              </button>
            )
          })}
        </div>

        <div className="register-actions">
          <button
            type="button"
            className="register-continue-button"
            onClick={() => onContinue?.(activeRole)}
          >
            <span>Continuar</span>
            <Icon name="arrow_forward" />
          </button>

          <div className="register-login-block">
            <p>¿Ya tienes una cuenta?</p>
            <button
              type="button"
              className="register-login-link"
              onClick={() => onLoginClick?.()}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
