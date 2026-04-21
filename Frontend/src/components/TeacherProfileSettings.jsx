import { useEffect, useMemo, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import '../assets/styles/teacherProfileSettings.css'
import { updateUserProfile } from '../services/profileService'
import { useUser } from '../services/userService'

const educationalAreas = [
  'Faculty of Fine Arts',
  'Department of Computer Science',
  'Business & Economics',
  'School of Humanities',
  'Health Sciences',
  'Engineering',
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

function getInitialFormData(user) {
  return {
    nombreCompleto: user?.nombreCompleto || user?.full_name || user?.fullName || '',
    correo: user?.correo || user?.email || '',
    telefono: user?.telefono || user?.phone || '',
    areaEducativa: user?.areaEducativa || user?.edu_area || user?.educationalArea || '',
  }
}

export default function TeacherProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(() => getInitialFormData(currentUser))

  useEffect(() => {
    setFormData(getInitialFormData(currentUser))
  }, [currentUser])

  const areaOptions = useMemo(
    () => Array.from(new Set([formData.areaEducativa, ...educationalAreas].filter(Boolean))),
    [formData.areaEducativa],
  )

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleReset() {
    setStatusMessage('')
    setErrorMessage('')
    setFormData(getInitialFormData(currentUser))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    setIsSaving(true)

    try {
      await updateUserProfile(currentUser?.uid, {
        nombreCompleto: formData.nombreCompleto,
        correo: formData.correo,
        telefono: formData.telefono,
        areaEducativa: formData.areaEducativa,
        full_name: deleteField(),
        fullName: deleteField(),
        email: deleteField(),
        phone: deleteField(),
        edu_area: deleteField(),
        educationalArea: deleteField(),
        authEmail: deleteField(),
      })

      await refreshUserProfile(currentUser?.uid)
      setStatusMessage('Perfil de profesor guardado correctamente.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el perfil de profesor.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="teacher-profile-page">
      <section className="container teacher-profile-hero">
        <div className="teacher-profile-avatar-wrap">
          <div className="teacher-profile-avatar">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDueM9RrrsKIFwnA4Lf_XEnWW-5cE93XCRUPmKhrAeIWWJfleHMXjEDJPBi5-8me_fk3L8hOQajXRv5ljJUTAKiPvzXEioCOqCwqaB8DokHdE96MhNc2E6HI4_6tFBClj8ubzvZOX9ml_Z7A-_kC8TUS-KblOHEH0A8BdiokgzYuk5thESCDVmTaLplf34RuaRaLGmOHKS6NLBJDVR5a0ClE4-JQBVsNZL4ANlGXpyhDrtOLPzLYgkAJk7QzeaIYUVSruG_FE_ZAA4"
              alt="Profile"
            />
          </div>
          <button type="button" className="teacher-profile-edit-photo-button" aria-label="Edit photo">
            <Icon name="edit" className="teacher-profile-edit-photo-icon" />
          </button>
        </div>

        <h1>Teacher Profile</h1>
        <p>
          Manage your academic credentials and contact information to better guide your
          student cohort.
        </p>
      </section>

      <section className="container teacher-profile-shell">
        <article className="teacher-profile-card">
          <form
            className="teacher-profile-form"
            id="teacher-profile-form"
            onSubmit={handleSubmit}
          >
            <label className="teacher-profile-field" htmlFor="nombreCompleto">
              <span>Nombre completo</span>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                placeholder="Dr. Alexander Sterling"
                value={formData.nombreCompleto}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="correo">
              <span>Correo electronico</span>
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="a.sterling@academic-atelier.edu"
                value={formData.correo}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="telefono">
              <span>Telefono</span>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </label>

            <label className="teacher-profile-field" htmlFor="areaEducativa">
              <span>Area educativa</span>
              <div className="teacher-profile-select-wrap">
                <select
                  id="areaEducativa"
                  name="areaEducativa"
                  value={formData.areaEducativa}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Department / Faculty
                  </option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" className="teacher-profile-select-icon" />
              </div>
            </label>
          </form>

          <div className="teacher-profile-action-bar">
            <button
              type="submit"
              form="teacher-profile-form"
              className="teacher-profile-save-button"
              disabled={isSaving}
            >
              <Icon name="save" className="teacher-profile-save-icon" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="teacher-profile-reset-button"
              onClick={handleReset}
              disabled={isSaving}
            >
              Discard
            </button>
          </div>

          {statusMessage ? <p className="teacher-profile-success">{statusMessage}</p> : null}
          {errorMessage ? (
            <p className="teacher-profile-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </article>
      </section>
    </main>
  )
}
