import { useState } from 'react'
import logo from '../assets/images/logo_no_bg.png'
import '../assets/styles/register.css'
import { ROUTES } from '../routes/paths'
import { useRouter } from '../routes/router'

const roles = [
  {
    id: 'student',
    icon: 'school',
    title: 'Estudiante',
    description:
      'Encuentra prácticas profesionales, crea tu perfil y postúlate a oportunidades reales.',
  },
  {
    id: 'company',
    icon: 'business',
    title: 'Empresa',
    description:
      'Publica vacantes, gestiona procesos y encuentra talento joven preparado para crecer.',
  },
  {
    id: 'teacher',
    icon: 'co_present',
    title: 'Profesor',
    description:
      'Acompaña el progreso de tus estudiantes y conecta la academia con oportunidades concretas.',
  },
]

const roleDestinationMap = {
  student: ROUTES.registerStudent,
  company: ROUTES.registerCompany,
  teacher: ROUTES.registerTeacher,
}

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
  const { navigate } = useRouter()
  const [selectedRole, setSelectedRole] = useState(defaultRole)

  const activeRole = roles.find((role) => role.id === selectedRole) ?? roles[1]

  function handleContinue() {
    if (onContinue) {
      onContinue(activeRole)
      return
    }

    navigate(roleDestinationMap[activeRole.id] ?? ROUTES.registerCompany)
  }

  function handleLogin() {
    if (onLoginClick) {
      onLoginClick()
      return
    }

    navigate(ROUTES.login)
  }

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
            <h2>{'Únete a InternHub'}</h2>
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
          <button type="button" className="register-continue-button" onClick={handleContinue}>
            <span>Continuar</span>
            <Icon name="arrow_forward" />
          </button>

          <div className="register-login-block">
            <p>¿Ya tienes una cuenta?</p>
            <button type="button" className="register-login-link" onClick={handleLogin}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
