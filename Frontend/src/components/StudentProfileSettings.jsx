import { useEffect, useState } from 'react'
import '../assets/styles/studentProfileSettings.css'
import { updateUserProfile } from '../services/profileService'
import { useUser } from '../services/userService'

const universities = ['Stanford University', 'MIT', 'UC Berkeley', 'Other']

const careerFocusOptions = [
  'Software Engineering',
  'Product Design',
  'Digital Marketing',
  'FinTech',
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function StudentProfileSettings() {
  const { currentUser, refreshUserProfile } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    bio: '',
    universidad: '',
    careerFocus: '',
  })

  useEffect(() => {
    setFormData({
      nombre: currentUser?.nombre || '',
      apellido: currentUser?.apellido || '',
      bio: currentUser?.bio || '',
      universidad: currentUser?.universidad || '',
      careerFocus: currentUser?.careerFocus || currentUser?.carrera || '',
    })
  }, [currentUser])

  const universityOptions = Array.from(
    new Set([formData.universidad, ...universities].filter(Boolean)),
  )
  const focusOptions = Array.from(
    new Set([formData.careerFocus, ...careerFocusOptions].filter(Boolean)),
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
    setFormData({
      nombre: currentUser?.nombre || '',
      apellido: currentUser?.apellido || '',
      bio: currentUser?.bio || '',
      universidad: currentUser?.universidad || '',
      careerFocus: currentUser?.careerFocus || currentUser?.carrera || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setStatusMessage('')
    setIsSaving(true)

    try {
      await updateUserProfile(currentUser?.uid, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        bio: formData.bio,
        universidad: formData.universidad,
        carrera: formData.careerFocus,
        careerFocus: formData.careerFocus,
      })

      await refreshUserProfile(currentUser?.uid)
      setStatusMessage('Profile saved successfully.')
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="student-profile-page">
      <div className="container student-profile-shell">
        <section className="student-profile-header">
          <div className="student-profile-avatar-wrap">
            <div className="student-profile-avatar">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmqg-iWjhwxLiiAImvV2ZUxKMAWlTuyO_Oyt_eHop1qEaE6_Yg2s5fkpEAA4OuHveRVOzW-AamI76eF34Fk5EH2ac-x8N8EklxwnNNdk6713g_n6-uZPuSJ4B85jcOKAlMsojiSALBdh5NDaCUjNnEr2VKfHh3vNl9PbY10BbQj_Mr09ixVYfbPnLldkhez2mCXIGLSSlp3rAGGY-vswUaim0_kCfNqPT9hGk8d88z3-DD5ppK9nng7IU6HV17vVHSmsKV3JJpEWI"
                alt="Profile"
              />
            </div>
            <button type="button" className="student-profile-camera-button">
              <Icon name="photo_camera" className="student-profile-camera-icon" />
            </button>
          </div>

          <h2>Student Profile</h2>
          <p>Update your information and keep your student profile synced with Firebase.</p>
        </section>

        <section className="student-profile-card">
          <div className="student-profile-form-content">
            <form className="student-profile-form" onSubmit={handleSubmit} id="student-profile-form">
              <div className="student-profile-grid">
                <label className="student-profile-field">
                  <span>Name</span>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="e.g. Alex"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="student-profile-field">
                  <span>Surname</span>
                  <input
                    name="apellido"
                    type="text"
                    placeholder="e.g. Johnson"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label className="student-profile-field">
                <span>Bio</span>
                <textarea
                  name="bio"
                  rows="4"
                  placeholder="Tell us about your background, interests, and goals..."
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={300}
                />
                <small>{`${formData.bio.length} / 300 characters`}</small>
              </label>

              <div className="student-profile-grid">
                <label className="student-profile-field">
                  <span>University</span>
                  <div className="student-profile-select-wrap">
                    <select
                      name="universidad"
                      value={formData.universidad}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select your institution
                      </option>
                      {universityOptions.map((university) => (
                        <option key={university} value={university}>
                          {university}
                        </option>
                      ))}
                    </select>
                    <Icon name="expand_more" className="student-profile-select-icon" />
                  </div>
                </label>

                <label className="student-profile-field">
                  <span>Career Focus</span>
                  <div className="student-profile-select-wrap">
                    <select
                      name="careerFocus"
                      value={formData.careerFocus}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Target industry
                      </option>
                      {focusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Icon name="expand_more" className="student-profile-select-icon" />
                  </div>
                </label>
              </div>
            </form>
          </div>

          <div className="student-profile-action-bar">
            <button
              type="button"
              className="student-profile-reset-button"
              onClick={handleReset}
              disabled={isSaving}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              form="student-profile-form"
              className="student-profile-save-button"
              disabled={isSaving}
            >
              <Icon name="save" className="student-profile-save-icon" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {statusMessage ? <p style={{ color: '#166534' }}>{statusMessage}</p> : null}
          {errorMessage ? <p style={{ color: '#b91c1c' }}>{errorMessage}</p> : null}
        </section>
      </div>
    </main>
  )
}
